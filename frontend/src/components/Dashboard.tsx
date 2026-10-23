import React from 'react';
import { AnalysisResponse, Incident } from '../types';
import { StatCard } from './StatCard';
import { ActivityTimeSeriesChart, LogLevelDistributionChart } from './Charts';
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  Percent,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  Info,
  Bug,
} from 'lucide-react';

interface DashboardProps {
  data: AnalysisResponse | null;
  onSelectIncident: (incident: Incident) => void;
  onNavigateTab: (tab: 'dashboard' | 'incidents' | 'logs' | 'evaluation' | 'upload') => void;
  isLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  onSelectIncident,
  onNavigateTab,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-sm text-slate-300 font-medium">Running Isolation Forest Anomaly Detection...</p>
        <p className="text-xs text-slate-500 mt-1">Extracting temporal features, calculating level entropy, and scoring log lines</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800">
        <Layers className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Log Analysis Active</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please upload a log file or load a pre-configured sample dataset from the Ingestion tab.
        </p>
        <button
          onClick={() => onNavigateTab('upload')}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          Go to Log Ingestion
        </button>
      </div>
    );
  }

  const { summary, parser_summary, time_series, incidents } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Dataset Source Overview */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Analyzing:</span>
            <span className="text-sm font-bold text-blue-400 font-mono">{data.source}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/80">
              Isolation Forest Contamination: {(summary.anomaly_rate || 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
            {parser_summary.time_start && parser_summary.time_end && (
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>
                  {parser_summary.time_start.split('T')[1]?.substring(0, 8) || parser_summary.time_start} -{' '}
                  {parser_summary.time_end.split('T')[1]?.substring(0, 8) || parser_summary.time_end}
                </span>
              </span>
            )}
            <span>• Parsed: <strong className="text-slate-200">{parser_summary.total_parsed}</strong> records</span>
            {parser_summary.multiline_merged_count > 0 && (
              <span>• Stacktraces Merged: <strong className="text-slate-200">{parser_summary.multiline_merged_count}</strong></span>
            )}
            {parser_summary.malformed_count > 0 && (
              <span className="text-amber-400">• Fallback Lines: {parser_summary.malformed_count}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={() => onNavigateTab('upload')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
          >
            Change Dataset
          </button>
          <button
            onClick={() => onNavigateTab('incidents')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm flex items-center space-x-1 transition-colors"
          >
            <span>Explore Incidents ({incidents.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Log Entries"
          value={summary.total_entries.toLocaleString()}
          subtitle={`${parser_summary.malformed_count} malformed/fallback`}
          icon={<FileText className="h-4 w-4 text-blue-400" />}
          variant="blue"
        />

        <StatCard
          title="Detected Anomalies"
          value={summary.anomaly_count}
          subtitle={`${summary.anomaly_rate}% of total logs`}
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
          badge={summary.anomaly_count > 0 ? 'ANOMALOUS' : 'NOMINAL'}
          variant="rose"
        />

        <StatCard
          title="Ordinary Errors"
          value={summary.ordinary_error_count}
          subtitle="Handled errors, not system anomalies"
          icon={<Bug className="h-4 w-4 text-amber-400" />}
          badge="HANDLED"
          variant="amber"
        />

        <StatCard
          title="Overall Error Rate"
          value={`${summary.error_rate}%`}
          subtitle={`${summary.total_errors} total ERROR/CRITICAL logs`}
          icon={<Percent className="h-4 w-4 text-purple-400" />}
          variant="purple"
        />

        <StatCard
          title="Formed Incidents"
          value={summary.incidents_count}
          subtitle={`Peak Score: ${(summary.highest_score * 100).toFixed(0)}%`}
          icon={<Layers className="h-4 w-4 text-emerald-400" />}
          badge={`${incidents.filter(i => i.severity === 'CRITICAL').length} Critical`}
          variant="emerald"
        />
      </div>

      {/* Differentiation Notice */}
      <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/60 flex items-start space-x-3 text-xs text-blue-300">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-blue-200">Real Anomaly Detection vs Ordinary Errors:</strong> Ordinary errors (like an isolated 404 Not Found or single user validation failure) are expected operational noise and scored below threshold. True anomalies are multi-feature outliers (cascading database pool exhaustion, error rate spikes, repetitive crash storms, or volume surges) flagged with actionable root-cause explainability.
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time-series Activity Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Log Activity & Error Throughput Over Time</h3>
              <p className="text-xs text-slate-400">Total events vs error volume across time windows</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {time_series.length} Windows
            </span>
          </div>
          <ActivityTimeSeriesChart data={time_series} />
        </div>

        {/* Severity / Level Breakdown Chart (1 col) */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Log Severity Breakdown</h3>
              <p className="text-xs text-slate-400">Distribution of extracted log levels</p>
            </div>
          </div>
          <LogLevelDistributionChart levelCounts={parser_summary.level_counts} />
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Recent Incident Detections</h3>
            <p className="text-xs text-slate-400">Clustered anomalous windows with root cause signatures</p>
          </div>
          <button
            onClick={() => onNavigateTab('incidents')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
          >
            <span>View All ({incidents.length})</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
            <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-80" />
            No anomalous incidents detected in this dataset. All windows conform to baseline parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3 font-sans">Title / Root Cause Signature</th>
                  <th className="py-2.5 px-3 text-right">Anomaly Score</th>
                  <th className="py-2.5 px-3 text-right">Logs</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidents.slice(0, 5).map((inc) => {
                  const severityBadge = {
                    CRITICAL: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
                    HIGH: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
                    MEDIUM: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
                    LOW: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
                    NORMAL: 'bg-slate-800 text-slate-300 border-slate-700',
                  }[inc.severity] || 'bg-slate-800 text-slate-300';

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => onSelectIncident(inc)}
                      className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-blue-400 font-bold">{inc.id}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityBadge}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">[{inc.primary_service}]</td>
                      <td className="py-3 px-3 font-sans max-w-md truncate text-slate-200 group-hover:text-blue-300">
                        {inc.title}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400">
                        {(inc.peak_score * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">{inc.affected_events_count}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncident(inc);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans border border-slate-700 transition-colors"
                        >
                          Inspect Context
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
