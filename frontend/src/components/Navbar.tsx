import React from 'react';
import { Activity, ShieldAlert, ListFilter, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'incidents' | 'logs' | 'evaluation' | 'upload';
  setActiveTab: (tab: 'dashboard' | 'incidents' | 'logs' | 'evaluation' | 'upload') => void;
  anomalyCount: number;
  incidentCount: number;
  currentSource: string;
  isBackendHealthy: boolean;
  onRefreshSample: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  anomalyCount,
  incidentCount,
  currentSource,
  isBackendHealthy,
  onRefreshSample,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c1220]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">TraceLens</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
                  Isolation Forest ML
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Intelligent Log Anomaly & Incident Detection</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'incidents'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Incidents</span>
              {incidentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {incidentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'logs'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ListFilter className="h-4 w-4" />
              <span>Log Stream</span>
              {anomalyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {anomalyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'evaluation'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Model Evaluation</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Ingestion</span>
            </button>
          </nav>

          {/* Right Status & Active Dataset */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-400">Source:</span>
              <span className="font-mono text-blue-400 truncate max-w-[150px]" title={currentSource}>
                {currentSource}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              {isBackendHealthy ? (
                <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/60">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Engine Ready</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-900/60">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Backend Offline</span>
                </div>
              )}

              <button
                onClick={onRefreshSample}
                disabled={isLoading}
                title="Reload default sample data"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
