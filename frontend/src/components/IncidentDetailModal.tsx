import React, { useState } from 'react';
import { Incident } from '../types';
import { X, Copy, Check, ShieldAlert, Cpu, Clock, Terminal, AlertTriangle, FileCode } from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({ incident, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'raw_json'>('timeline');

  if (!incident) return null;

  const handleCopyReport = () => {
    const reportText = `### TraceLens Incident Report: ${incident.id}
- **Title**: ${incident.title}
- **Severity**: ${incident.severity} (Peak Score: ${incident.peak_score})
- **Service**: ${incident.primary_service}
- **Time Window**: ${incident.start_time} -> ${incident.end_time}
- **Affected Events**: ${incident.affected_events_count}
- **Root Cause Signature**: \`${incident.root_cause_template}\`
- **Detection Reasons**:
${incident.reasons.map(r => `  - ${r}`).join('\n')}

**Sample Message**:
\`\`\`
${incident.sample_message}
\`\`\`
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityBadgeClass = {
    CRITICAL: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
    HIGH: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
    MEDIUM: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
    LOW: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
    NORMAL: 'bg-slate-800 text-slate-300 border-slate-700',
  }[incident.severity] || 'bg-slate-800 text-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold border border-slate-700">
                {incident.id}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${severityBadgeClass}`}>
                {incident.severity} SEVERITY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Anomaly Score: <strong className="text-rose-400">{incident.peak_score.toFixed(2)}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-100">{incident.title}</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReport}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 text-xs border border-slate-700"
              title="Copy incident report markdown"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Report'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <span>Target Service</span>
            </div>
            <span className="font-mono font-medium text-slate-200">{incident.primary_service}</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Time Window</span>
            </div>
            <span className="font-mono text-[11px] text-slate-300 truncate block" title={`${incident.start_time} - ${incident.end_time}`}>
              {incident.start_time.split('T')[1]?.substring(0, 8) || incident.start_time}
            </span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>Affected Entries</span>
            </div>
            <span className="font-mono font-medium text-slate-200">{incident.affected_events_count} logs</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-purple-400" />
              <span>Peak Anomaly Score</span>
            </div>
            <span className="font-mono font-bold text-rose-400">{(incident.peak_score * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Explainability Detection Reasons */}
        <div className="px-6 py-3 bg-[#0c1322] border-b border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Explainable Detection Signals (Isolation Forest & Statistical Burst)
          </h4>
          <div className="flex flex-wrap gap-2">
            {incident.reasons.map((reason, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded bg-slate-800/90 text-slate-200 border border-slate-700/80 flex items-center space-x-1.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                <span>{reason}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Tab Controls: Timeline vs Raw JSON */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 space-x-4 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Surrounding Context Timeline ({incident.surrounding_context.length} logs)</span>
          </button>
          <button
            onClick={() => setActiveTab('raw_json')}
            className={`pb-2 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'raw_json'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Raw Incident JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
          {activeTab === 'timeline' ? (
            <div className="space-y-2">
              <p className="text-slate-400 text-xs font-sans mb-3">
                Showing the chronological sequence of logs immediately preceding, during, and following this incident. Anomalous events are highlighted:
              </p>
              <div className="space-y-1.5">
                {incident.surrounding_context.map((entry) => {
                  const isIncidentMember = incident.cluster_log_ids.includes(entry.id);
                  const isAnomaly = entry.is_anomaly;

                  let rowStyle = 'bg-slate-900/60 border-slate-800/80 text-slate-300';
                  if (isIncidentMember) {
                    rowStyle = 'bg-rose-950/30 border-rose-500/40 text-rose-200';
                  } else if (isAnomaly) {
                    rowStyle = 'bg-purple-950/20 border-purple-500/30 text-purple-200';
                  }

                  return (
                    <div
                      key={entry.id}
                      className={`p-2.5 rounded border transition-colors ${rowStyle}`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500 font-mono">#{entry.id}</span>
                          <span className="text-slate-300">{entry.timestamp || 'N/A'}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                              entry.level === 'CRITICAL' || entry.level === 'ERROR'
                                ? 'bg-rose-500/20 text-rose-400'
                                : entry.level === 'WARN'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {entry.level}
                          </span>
                          <span className="text-blue-400">[{entry.service}]</span>
                        </div>

                        {entry.anomaly_score > 0 && (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-500 text-[10px]">Anomaly Score:</span>
                            <span
                              className={`font-bold ${
                                entry.anomaly_score >= 0.70 ? 'text-rose-400' : 'text-slate-400'
                              }`}
                            >
                              {(entry.anomaly_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap break-all text-xs text-slate-200 pl-1 border-l-2 border-slate-700">
                        {entry.message}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <pre className="p-4 rounded-lg bg-slate-950 text-slate-300 text-xs overflow-x-auto border border-slate-800">
              {JSON.stringify(incident, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Click outside or Esc to dismiss</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
