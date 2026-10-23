export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'TRACE';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';

export interface LogEntry {
  id: number;
  timestamp: string;
  timestamp_epoch: number;
  level: LogLevel;
  service: string;
  message: string;
  raw: string;
  is_malformed: boolean;
  anomaly_score: number;
  is_anomaly: boolean;
  severity: Severity;
  detection_reasons: string[];
  window_id: number;
  template?: string;
}

export interface IncidentContextEntry {
  id: number;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  is_anomaly: boolean;
  anomaly_score: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  peak_score: number;
  start_time: string;
  end_time: string;
  affected_events_count: number;
  primary_service: string;
  root_cause_template: string;
  reasons: string[];
  sample_message: string;
  cluster_log_ids: number[];
  surrounding_context: IncidentContextEntry[];
}

export interface TimeSeriesPoint {
  timestamp: string;
  total_events: number;
  errors: number;
  warns: number;
  anomaly_score: number;
  is_anomalous_window: boolean;
  anomalies_detected: number;
}

export interface AnalysisSummary {
  total_entries: number;
  anomaly_count: number;
  ordinary_error_count: number;
  total_errors: number;
  error_rate: number;
  anomaly_rate: number;
  highest_score: number;
  incidents_count: number;
  threshold_used: number;
}

export interface ParserSummary {
  total_lines: number;
  total_parsed: number;
  malformed_count: number;
  multiline_merged_count: number;
  level_counts: Record<string, number>;
  has_timestamps: boolean;
  time_start: string | null;
  time_end: string | null;
}

export interface AnalysisResponse {
  source: string;
  sample_id?: string;
  parser_summary: ParserSummary;
  summary: AnalysisSummary;
  time_series: TimeSeriesPoint[];
  incidents: Incident[];
  logs: LogEntry[];
}

export interface SampleItem {
  id: string;
  name: string;
  description: string;
  type: string;
  line_count: number;
}

export interface EvaluationMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  accuracy: number;
  specificity: number;
  total_samples: number;
  ground_truth_positives: number;
  ground_truth_negatives: number;
}

export interface ConfusionMatrix {
  true_positive: number;
  false_positive: number;
  true_negative: number;
  false_negative: number;
}

export interface ThresholdPoint {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface DetailedEvaluationRow {
  id: number;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  anomaly_score: number;
  actual_anomaly: boolean;
  predicted_anomaly: boolean;
  classification_type: 'TP' | 'FP' | 'TN' | 'FN';
  ground_truth_reason: string;
  detection_reasons: string[];
}

export interface EvaluationResponse {
  dataset_name: string;
  dataset_description: string;
  threshold_evaluated: number;
  metrics: EvaluationMetrics;
  confusion_matrix: ConfusionMatrix;
  threshold_curve: ThresholdPoint[];
  detailed_rows: DetailedEvaluationRow[];
  production_disclaimer: string;
}
