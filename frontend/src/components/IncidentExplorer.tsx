import React, { useState, useMemo } from 'react';
import { Incident } from '../types';
import { Search, ShieldAlert, Filter, ChevronRight, AlertTriangle, Layers, Info } from 'lucide-react';

interface IncidentExplorerProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  isLoading: boolean;
}

export const IncidentExplorer: React.FC<IncidentExplorerProps> = ({
  incidents,
  onSelectIncident,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [minScore, setMinScore] = useState<number>(0.50);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Severity filter
      if (selectedSeverity !== 'ALL' && inc.severity !== selectedSeverity) {
        return false;
      }
      // Min anomaly score filter
      if (inc.peak_score < minScore) {
        return false;
      }
      // Search query filter (matches title, service, sample message, reasons)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          inc.id.toLowerCase().includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          inc.primary_service.toLowerCase().includes(q) ||
          inc.sample_message.toLowerCase().includes(q) ||
          inc.reasons.some((r) => r.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [incidents, selectedSeverity, minScore, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-rose-400" />
            <span>Incident Explorer</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated system anomalies detected by Isolation Forest & temporal burst scoring.
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <span>Click any incident card to inspect surrounding context logs</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by incident title, service name, error message, or detection signal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity Chips */}
          <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center">
              <Filter className="h-3 w-3 mr-1" /> Severity:
            </span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Min Score Slider */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <span>Minimum Anomaly Score:</span>
            <input
              type="range"
              min={0.30}
              max={0.95}
              step={0.05}
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              className="w-32 accent-blue-500 cursor-pointer"
            />
            <span className="font-mono text-slate-200 font-bold">{(minScore * 100).toFixed(0)}%</span>
          </div>

          <div className="text-slate-500">
            Showing <strong className="text-slate-300">{filteredIncidents.length}</strong> of{' '}
            <strong className="text-slate-300">{incidents.length}</strong> incidents
          </div>
        </div>
      </div>

      {/* Incidents List */}
      {isLoading ? (
        <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-sm text-slate-400">Analyzing log events and clustering incidents...</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800">
          <Layers className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-300">No Incidents Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {incidents.length === 0
              ? 'No anomalous incidents were identified in the loaded dataset.'
              : 'Try broadening your search query or lowering the anomaly score threshold.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const severityBorder = {
              CRITICAL: 'border-l-4 border-l-purple-500 hover:border-purple-500/50',
              HIGH: 'border-l-4 border-l-rose-500 hover:border-rose-500/50',
              MEDIUM: 'border-l-4 border-l-amber-500 hover:border-amber-500/50',
              LOW: 'border-l-4 border-l-blue-500 hover:border-blue-500/50',
              NORMAL: 'border-l-4 border-l-slate-700',
            }[incident.severity] || 'border-l-4 border-l-slate-700';

            const severityBadge = {
              CRITICAL: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
              HIGH: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
              MEDIUM: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
              LOW: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
              NORMAL: 'bg-slate-800 text-slate-300 border-slate-700',
            }[incident.severity] || 'bg-slate-800 text-slate-300';

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`p-5 rounded-xl bg-[#0f172a] border border-slate-800 ${severityBorder} shadow-sm hover:bg-[#131d33] transition-all cursor-pointer group`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-blue-400 font-semibold border border-slate-800">
                        {incident.id}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${severityBadge}`}>
                        {incident.severity}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Service: <strong className="text-slate-200">[{incident.primary_service}]</strong>
                      </span>
                      <span className="text-xs text-slate-500 font-mono hidden md:inline">
                        • {incident.affected_events_count} affected logs
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {incident.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-start">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Peak Score</div>
                      <div className="font-mono text-sm sm:text-base font-bold text-rose-400">
                        {(incident.peak_score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Sample Message Snippet */}
                <div className="mt-3 p-2.5 rounded bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800/80 truncate">
                  <span className="text-slate-500 mr-2">$</span>
                  {incident.sample_message}
                </div>

                {/* Signals Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-slate-500 mr-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> Signals:
                  </span>
                  {incident.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
