import React, { useState, useRef } from 'react';
import { SampleItem, AnalysisResponse } from '../types';
import { uploadAndAnalyzeFile, analyzeText, analyzeSample } from '../services/api';
import {
  Upload,
  FileText,
  Play,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Database,
  Flame,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface UploadSectionProps {
  samples: SampleItem[];
  onAnalysisComplete: (result: AnalysisResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  samples,
  onAnalysisComplete,
  isLoading,
  setIsLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [threshold, setThreshold] = useState<number>(0.60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await uploadAndAnalyzeFile(selectedFile, threshold);
      onAnalysisComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      setErrorMessage('Please enter log text to analyze.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await analyzeText(pastedText, 'Pasted Logs', threshold);
      onAnalysisComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error analyzing pasted logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleClick = async (sampleId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await analyzeSample(sampleId, threshold);
      onAnalysisComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading sample.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <Upload className="h-6 w-6 text-blue-400" />
          <span>Log Ingestion & Anomaly Detection</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload application logs, paste raw text, or select a pre-configured sample incident scenario.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Instant Sample Data Launchers (No Upload Required) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Play className="h-4 w-4 text-emerald-400" />
              <span>Instant Sample Incident Scenarios (Zero-Config)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Test detection algorithms immediately without needing to upload your own files.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
            Ready to Run
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {samples.map((s) => {
            const icon =
              s.id === 'ecommerce_outage' ? (
                <Database className="h-5 w-5 text-rose-400" />
              ) : s.id === 'memory_leak' ? (
                <Flame className="h-5 w-5 text-amber-400" />
              ) : (
                <Layers className="h-5 w-5 text-blue-400" />
              );

            return (
              <div
                key={s.id}
                onClick={() => handleSampleClick(s.id)}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-[#131d33] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/80">{icon}</div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                      {s.line_count} logs
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{s.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-blue-400 font-medium">
                  <span>Load & Detect</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detection Sensitivity Configuration Slider */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Sliders className="h-4 w-4 text-blue-400" />
          <span>
            Anomaly Detection Sensitivity Threshold: <strong className="text-blue-300 font-mono">{(threshold * 100).toFixed(0)}%</strong>
          </span>
          <span className="text-slate-500 hidden md:inline">(Higher = stricter, fewer false positives)</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[11px]">0.30</span>
          <input
            type="range"
            min={0.30}
            max={0.90}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-40 accent-blue-500 cursor-pointer"
          />
          <span className="text-[11px]">0.90</span>
        </div>
      </div>

      {/* 2. File Upload Drag & Drop Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2 mb-1">
              <FileText className="h-4 w-4 text-blue-400" />
              <span>Upload Log File (.log, .txt, .json)</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Select or drop your application logs. Multi-line stacktraces and malformed lines are handled automatically.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-950/20'
                  : 'border-slate-850 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".log,.txt,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop log file'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Supports ISO-8601, Nginx, Apache, Syslog, Spring, Winston, Python logs'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              {selectedFile ? 'Ready to analyze' : 'No file selected'}
            </span>
            <button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              <span>{isLoading ? 'Processing...' : 'Upload & Run Anomaly Detection'}</span>
            </button>
          </div>
        </div>

        {/* 3. Paste Raw Logs Textarea */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2 mb-1">
              <FileText className="h-4 w-4 text-purple-400" />
              <span>Paste Raw Log Text</span>
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Directly paste logs from terminal, Docker, or Kubernetes pods for quick diagnostic analysis.
            </p>

            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste log lines here...&#10;2026-10-23 14:00:01 [INFO] [auth-api] User logged in&#10;2026-10-23 14:00:02 [ERROR] [db-pool] Connection pool exhausted"
              rows={7}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              {pastedText.split('\n').filter((l) => l.trim()).length} lines detected
            </span>
            <button
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim() || isLoading}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? 'Processing...' : 'Analyze Pasted Content'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Parser Capabilities Diagnostic Box */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
        <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
          <span>Parser Reliability & Error Handling Guarantees:</span>
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 list-disc list-inside text-slate-400">
          <li>Extracts ISO-8601 timestamps, epoch floats, and syslog dates</li>
          <li>Merges multiline Java & Python stack traces into single causal records</li>
          <li>Normalizes log levels: DEBUG, INFO, WARN, ERROR, CRITICAL</li>
          <li>Gracefully fallbacks on malformed lines without crash or data loss</li>
        </ul>
      </div>
    </div>
  );
};
