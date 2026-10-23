import React, { useState, useEffect } from 'react';
import { EvaluationResponse, DetailedEvaluationRow } from '../types';
import { getEvaluation } from '../services/api';
import { StatCard } from './StatCard';
import { ThresholdCurveChart } from './Charts';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Check,
  X,
  Target,
  RefreshCw,
} from 'lucide-react';

export const ModelEvaluation: React.FC = () => {
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [threshold, setThreshold] = useState<number>(0.60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const loadEvaluation = async (t: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEvaluation(t);
      setEvaluation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load model evaluation data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluation(threshold);
  }, [threshold]);

  const filteredRows = (evaluation?.detailed_rows || []).filter((row) => {
    if (filterType === 'ALL') return true;
    return row.classification_type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-400">
                <Target className="h-5 w-5" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100">
                Isolation Forest Benchmark & Model Evaluation
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Evaluated against 54 verified microservice logs with documented ground-truth labels.
              Tests detection precision on genuine system anomalies versus ordinary handled client errors (404s, validation rejections).
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 shrink-0">
            <Sliders className="h-4 w-4 text-blue-400" />
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Decision Threshold:</span>
                <span className="font-mono font-bold text-blue-400 ml-2">{(threshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.35}
                max={0.85}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-36 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Production Disclaimer Warning */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 flex items-start space-x-3 text-xs text-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-300 font-semibold">Important Model Evaluation Context:</strong>
          <p className="text-amber-200/90 leading-relaxed">
            {evaluation?.production_disclaimer ||
              'Ground truth evaluation demonstrates detector efficacy on controlled benchmark distributions with verified labels. Real-world production logs feature non-stationary distributions, telemetry jitter, and evolving error signatures; empirical tuning is recommended.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      {evaluation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Precision (PPV)"
            value={(evaluation.metrics.precision * 100).toFixed(1) + '%'}
            subtitle="True Anomalies / Total Flagged"
            icon={<Target className="h-4 w-4 text-sky-400" />}
            badge="ACCURACY"
            variant="blue"
          />

          <StatCard
            title="Recall (Sensitivity)"
            value={(evaluation.metrics.recall * 100).toFixed(1) + '%'}
            subtitle="Detected / Ground Truth Anomalies"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            badge="COVERAGE"
            variant="emerald"
          />

          <StatCard
            title="F1-Score"
            value={(evaluation.metrics.f1_score * 100).toFixed(1) + '%'}
            subtitle="Harmonic Mean of Precision & Recall"
            icon={<Layers className="h-4 w-4 text-purple-400" />}
            badge="BALANCED"
            variant="purple"
          />

          <StatCard
            title="Specificity (TNR)"
            value={(evaluation.metrics.specificity * 100).toFixed(1) + '%'}
            subtitle="Ordinary Logs Correctly Filtered"
            icon={<Check className="h-4 w-4 text-amber-400" />}
            badge="NOISE REJECTION"
            variant="amber"
          />
        </div>
      )}

      {/* Confusion Matrix & Threshold Curve Grid */}
      {evaluation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix Interactive Box */}
          <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Empirical Confusion Matrix</h3>
            <p className="text-xs text-slate-400 mb-4">
              Ground truth labels vs Isolation Forest predictions at threshold {(threshold * 100).toFixed(0)}%
            </p>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              {/* True Positive */}
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="font-bold">True Positive (TP)</span>
                  <Check className="h-4 w-4" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-emerald-200">
                    {evaluation.confusion_matrix.true_positive}
                  </div>
                  <div className="text-[11px] text-emerald-400/80 mt-1">
                    Genuine system anomaly correctly flagged
                  </div>
                </div>
              </div>

              {/* False Positive */}
              <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between text-rose-400">
                  <span className="font-bold">False Positive (FP)</span>
                  <X className="h-4 w-4" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-rose-200">
                    {evaluation.confusion_matrix.false_positive}
                  </div>
                  <div className="text-[11px] text-rose-400/80 mt-1">
                    Normal or handled log falsely flagged
                  </div>
                </div>
              </div>

              {/* False Negative */}
              <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-400">
                  <span className="font-bold">False Negative (FN)</span>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-amber-200">
                    {evaluation.confusion_matrix.false_negative}
                  </div>
                  <div className="text-[11px] text-amber-400/80 mt-1">
                    Anomaly missed below threshold
                  </div>
                </div>
              </div>

              {/* True Negative */}
              <div className="p-4 rounded-lg bg-blue-950/40 border border-blue-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-400">
                  <span className="font-bold">True Negative (TN)</span>
                  <Check className="h-4 w-4" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-blue-200">
                    {evaluation.confusion_matrix.true_negative}
                  </div>
                  <div className="text-[11px] text-blue-400/80 mt-1">
                    Normal log / ordinary error correctly ignored
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span>Total Ground Truth Positives: <strong className="text-slate-200">{evaluation.metrics.ground_truth_positives}</strong></span>
              <span>Total Ground Truth Negatives: <strong className="text-slate-200">{evaluation.metrics.ground_truth_negatives}</strong></span>
            </div>
          </div>

          {/* Threshold Tuning Curve */}
          <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-100">Threshold Optimization Curve</h3>
              <span className="text-[11px] font-mono text-purple-400">F1 vs Precision vs Recall</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Shows how adjusting the score threshold trades off false alarms against missed incidents
            </p>
            <ThresholdCurveChart data={evaluation.threshold_curve} currentThreshold={threshold} />
          </div>
        </div>
      )}

      {/* Labeled Dataset Verification Table */}
      {evaluation && (
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Benchmark Ground Truth Verification Audit</h3>
              <p className="text-xs text-slate-400">
                Itemized log inspection comparing ground-truth classification against model scores
              </p>
            </div>

            {/* Filter classification chips */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 mr-1">Filter:</span>
              {['ALL', 'TP', 'FP', 'TN', 'FN'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded font-semibold font-mono transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-12">#</th>
                  <th className="py-2.5 px-3 w-16">Class</th>
                  <th className="py-2.5 px-3 w-24">Level</th>
                  <th className="py-2.5 px-3 w-28">Service</th>
                  <th className="py-2.5 px-3 w-20 text-right">Score</th>
                  <th className="py-2.5 px-3 font-sans">Ground Truth Reason</th>
                  <th className="py-2.5 px-3">Message Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRows.map((row) => {
                  const classBadge = {
                    TP: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50',
                    FP: 'bg-rose-950/80 text-rose-400 border-rose-500/50',
                    TN: 'bg-blue-950/80 text-blue-400 border-blue-500/50',
                    FN: 'bg-amber-950/80 text-amber-400 border-amber-500/50',
                  }[row.classification_type];

                  return (
                    <tr key={row.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{row.id}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] border ${classBadge}`}>
                          {row.classification_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                          {row.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">[{row.service}]</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                        {(row.anomaly_score * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 font-sans text-xs text-slate-300 max-w-xs truncate">
                        {row.ground_truth_reason}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-md truncate">
                        {row.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
