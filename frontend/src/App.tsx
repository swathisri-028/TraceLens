import React, { useState, useEffect } from 'react';
import { AnalysisResponse, SampleItem, Incident } from './types';
import { checkBackendHealth, getSamples, analyzeSample } from './services/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { IncidentExplorer } from './components/IncidentExplorer';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { LogStream } from './components/LogStream';
import { ModelEvaluation } from './components/ModelEvaluation';
import { UploadSection } from './components/UploadSection';
import { AlertCircle, Terminal, Info, ExternalLink } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'logs' | 'evaluation' | 'upload'>('dashboard');
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // 1. Check health
        await checkBackendHealth();
        setIsBackendHealthy(true);

        // 2. Fetch sample catalog
        const sampleCatalog = await getSamples();
        setSamples(sampleCatalog);

        // 3. Load default sample (ecommerce_outage) so app works immediately without upload
        const defaultResult = await analyzeSample('ecommerce_outage', 0.60);
        setAnalysisData(defaultResult);
      } catch (err: any) {
        setIsBackendHealthy(false);
        setStatusMessage(
          'FastAPI backend server is not connected. Start the backend with: uvicorn main:app --reload (port 8000)'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleRefreshSample = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const defaultResult = await analyzeSample('ecommerce_outage', 0.60);
      setAnalysisData(defaultResult);
      setIsBackendHealthy(true);
    } catch (err: any) {
      setStatusMessage('Failed to connect to backend engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = (newResult: AnalysisResponse) => {
    setAnalysisData(newResult);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        anomalyCount={analysisData?.summary.anomaly_count || 0}
        incidentCount={analysisData?.incidents.length || 0}
        currentSource={analysisData?.source || 'No data'}
        isBackendHealthy={isBackendHealthy}
        onRefreshSample={handleRefreshSample}
        isLoading={isLoading}
      />

      {/* Backend connection warning banner if offline */}
      {!isBackendHealthy && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Backend server is currently disconnected. Ensure the Python FastAPI server is running at{' '}
                <code className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-amber-300">
                  http://localhost:8000
                </code>
              </span>
            </div>
            <button
              onClick={handleRefreshSample}
              className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-700/80 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={analysisData}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentExplorer
            incidents={analysisData?.incidents || []}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'logs' && (
          <LogStream
            logs={analysisData?.logs || []}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'evaluation' && <ModelEvaluation />}

        {activeTab === 'upload' && (
          <UploadSection
            samples={samples}
            onAnalysisComplete={handleAnalysisComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </main>

      {/* Surrounding Context Incident Drill-down Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c1220] py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">TraceLens</span>
            <span>• scikit-learn Isolation Forest Anomaly Detection Engine</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>FastAPI + Vite + React 19 + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
