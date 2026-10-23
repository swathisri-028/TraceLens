import React, { useState, useMemo } from 'react';
import { LogEntry, LogLevel } from '../types';
import { Search, Filter, Download, AlertTriangle, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface LogStreamProps {
  logs: LogEntry[];
  isLoading: boolean;
}

export const LogStream: React.FC<LogStreamProps> = ({ logs, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (onlyAnomalies && !log.is_anomaly) return false;
      if (onlyErrors && !['ERROR', 'CRITICAL'].includes(log.level)) return false;
      if (selectedLevel !== 'ALL' && log.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.message.toLowerCase().includes(q) ||
          log.service.toLowerCase().includes(q) ||
          log.raw.toLowerCase().includes(q) ||
          log.id.toString().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, onlyAnomalies, onlyErrors, selectedLevel, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const exportAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tracelens_logs_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportAsCSV = () => {
    const headers = ['id', 'timestamp', 'level', 'service', 'anomaly_score', 'is_anomaly', 'message'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp || ''}"`,
      `"${l.level}"`,
      `"${l.service}"`,
      l.anomaly_score,
      l.is_anomaly,
      `"${l.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `tracelens_logs_export.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter log stream by message, exception name, service..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => {
                setOnlyAnomalies(!onlyAnomalies);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
                onlyAnomalies
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-purple-400" />
              <span>Only Anomalies</span>
            </button>

            <button
              onClick={() => {
                setOnlyErrors(!onlyErrors);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
                onlyErrors
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span>Only Errors</span>
            </button>

            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-xs font-mono text-slate-300 border border-slate-800 focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        {/* Counter and Export buttons */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div>
            Showing <strong className="text-slate-200">{filteredLogs.length}</strong> of{' '}
            <strong className="text-slate-200">{logs.length}</strong> logs
            {filteredLogs.filter((l) => l.is_anomaly).length > 0 && (
              <span className="ml-2 text-purple-400 font-mono">
                ({filteredLogs.filter((l) => l.is_anomaly).length} flagged anomalies)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportAsCSV}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1 transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>CSV</span>
            </button>
            <button
              onClick={exportAsJSON}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1 transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-14">#</th>
                <th className="py-2.5 px-3 w-32">Timestamp</th>
                <th className="py-2.5 px-3 w-24">Level</th>
                <th className="py-2.5 px-3 w-28">Service</th>
                <th className="py-2.5 px-3 w-24 text-right">Score</th>
                <th className="py-2.5 px-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isAnomaly = log.is_anomaly;

                const levelBadge = {
                  CRITICAL: 'bg-purple-950/80 text-purple-400 border-purple-500/40',
                  ERROR: 'bg-rose-950/80 text-rose-400 border-rose-500/40',
                  WARN: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
                  INFO: 'bg-slate-900 text-sky-400 border-slate-800',
                  DEBUG: 'bg-slate-900 text-slate-400 border-slate-800',
                  TRACE: 'bg-slate-900 text-slate-500 border-slate-800',
                }[log.level] || 'bg-slate-900 text-slate-400';

                let rowBg = 'hover:bg-slate-850/60';
                if (isAnomaly) {
                  rowBg = 'bg-rose-950/20 hover:bg-rose-950/30';
                }

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className={`cursor-pointer transition-colors ${rowBg}`}
                    >
                      <td className="py-2.5 px-3 text-slate-500 select-none">
                        <div className="flex items-center space-x-1">
                          {log.message.includes('\n') || log.detection_reasons.length > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-slate-500" />
                            )
                          ) : (
                            <span className="w-3 inline-block" />
                          )}
                          <span>{log.id}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {log.timestamp ? log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp : '-'}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${levelBadge}`}>
                          {log.level}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[120px]">
                        [{log.service}]
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${
                            isAnomaly
                              ? 'bg-rose-500/20 text-rose-300 font-mono border border-rose-500/40'
                              : 'text-slate-500'
                          }`}
                        >
                          {(log.anomaly_score * 100).toFixed(0)}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-200 break-all">
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-xl block font-mono">
                            {log.message.split('\n')[0]}
                          </span>
                          {isAnomaly && (
                            <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
                              ANOMALY
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80 border-b border-slate-800">
                        <td colSpan={6} className="p-4 space-y-3 font-mono text-xs">
                          {/* Explainability reasons if any */}
                          {log.detection_reasons && log.detection_reasons.length > 0 && (
                            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-slate-400 text-[11px] font-sans font-bold uppercase tracking-wider block mb-1">
                                Detection Explainability Signals:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {log.detection_reasons.map((r, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 text-[11px] border border-slate-700"
                                  >
                                    • {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Full raw content / multiline trace */}
                          <div>
                            <span className="text-slate-500 text-[11px] block mb-1">Full Log Content:</span>
                            <pre className="p-3 rounded bg-black/60 text-slate-300 overflow-x-auto whitespace-pre-wrap break-all border border-slate-850">
                              {log.raw || log.message}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong>
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
