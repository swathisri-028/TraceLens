"""
TraceLens Explainable Anomaly Detection Engine
Uses scikit-learn Isolation Forest combined with statistical feature extraction
to detect genuine anomalies and provide human-readable root cause explanations.
"""

import math
import re
from collections import Counter
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def clean_template(msg: str) -> str:
    """Normalize message to extract invariant template by removing numbers, hex, IPs, UUIDs."""
    # Replace UUIDs
    t = re.sub(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '<UUID>', msg)
    # Replace IP addresses
    t = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '<IP>', t)
    # Replace Hex hashes (>= 6 chars)
    t = re.sub(r'\b0x[0-9a-fA-F]+\b|\b[0-9a-fA-F]{8,}\b', '<HEX>', t)
    # Replace numbers
    t = re.sub(r'\b\d+\b', '<NUM>', t)
    # Trim whitespace
    return re.sub(r'\s+', ' ', t).strip()

def calculate_entropy(counts: List[int]) -> float:
    """Compute Shannon entropy for a list of counts."""
    total = sum(counts)
    if total <= 0:
        return 0.0
    entropy = 0.0
    for c in counts:
        if c > 0:
            p = c / total
            entropy -= p * math.log2(p)
    return entropy

class AnomalyDetector:
    def __init__(self, contamination: float = 0.08, anomaly_threshold: float = 0.60):
        self.contamination = contamination
        self.anomaly_threshold = anomaly_threshold
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()

    def analyze(self, logs: List[Dict[str, Any]], custom_threshold: Optional[float] = None) -> Dict[str, Any]:
        """
        Run end-to-end anomaly detection on parsed logs.
        Returns:
            - logs_with_scores: list of log records annotated with anomaly scores and reasons
            - incidents: aggregated incidents with root cause analysis
            - time_series: aggregated time series data for dashboard charts
            - summary: detection summary metrics
        """
        threshold = custom_threshold if custom_threshold is not None else self.anomaly_threshold
        if not logs:
            return {
                "logs": [],
                "incidents": [],
                "time_series": [],
                "summary": {
                    "total_entries": 0,
                    "anomaly_count": 0,
                    "ordinary_error_count": 0,
                    "error_rate": 0.0,
                    "highest_score": 0.0,
                    "incidents_count": 0,
                }
            }

        total_entries = len(logs)
        
        # 1. Compute global baselines & template frequencies
        template_counts = Counter()
        for entry in logs:
            tmpl = clean_template(entry["message"])
            entry["template"] = tmpl
            template_counts[tmpl] += 1

        # 2. Window Aggregation (e.g., 30s or adaptive windows)
        min_epoch = min(e["timestamp_epoch"] for e in logs if e.get("timestamp_epoch", 0) > 0) or 1.0
        max_epoch = max(e["timestamp_epoch"] for e in logs if e.get("timestamp_epoch", 0) > 0) or 1.0
        
        time_span = max_epoch - min_epoch
        # Determine appropriate window size: 10s to 60s
        if time_span > 7200: # > 2h
            window_size = 300 # 5 min
        elif time_span > 1800: # > 30m
            window_size = 60 # 1 min
        elif time_span > 300: # > 5m
            window_size = 30 # 30s
        else:
            window_size = 10 # 10s

        # Group logs into windows
        windows_dict: Dict[int, List[Dict[str, Any]]] = {}
        for entry in logs:
            epoch = entry.get("timestamp_epoch", 0.0)
            if epoch <= 0.0:
                # If no epoch, use index-based grouping
                win_id = entry["id"] // 25
            else:
                win_id = int((epoch - min_epoch) // window_size)
            if win_id not in windows_dict:
                windows_dict[win_id] = []
            windows_dict[win_id].append(entry)

        # Baseline window metrics
        window_stats = []
        for win_id, w_logs in sorted(windows_dict.items()):
            w_total = len(w_logs)
            w_errors = sum(1 for e in w_logs if e["level"] in ("ERROR", "CRITICAL"))
            w_warns = sum(1 for e in w_logs if e["level"] == "WARN")
            w_templates = len(set(e["template"] for e in w_logs))
            
            # Shannon entropy of levels
            lvl_counts = [
                sum(1 for e in w_logs if e["level"] == "DEBUG"),
                sum(1 for e in w_logs if e["level"] == "INFO"),
                w_warns,
                w_errors,
            ]
            entropy = calculate_entropy(lvl_counts)
            
            err_ratio = w_errors / max(1, w_total)
            uniq_ratio = w_templates / max(1, w_total)
            
            # Window timestamp representation
            win_start_epoch = min_epoch + (win_id * window_size) if min_epoch > 1.0 else float(win_id)
            win_iso = datetime.fromtimestamp(win_start_epoch).isoformat() if min_epoch > 1.0 else f"W-{win_id}"

            window_stats.append({
                "win_id": win_id,
                "timestamp": win_iso,
                "timestamp_epoch": win_start_epoch,
                "total": w_total,
                "errors": w_errors,
                "warns": w_warns,
                "error_ratio": err_ratio,
                "unique_ratio": uniq_ratio,
                "entropy": entropy,
                "logs": w_logs,
            })

        # Calculate dataset-wide averages for statistical z-scores
        mean_vol = np.mean([w["total"] for w in window_stats]) if window_stats else 1.0
        std_vol = np.std([w["total"] for w in window_stats]) or 1.0
        mean_err_ratio = np.mean([w["error_ratio"] for w in window_stats]) if window_stats else 0.0
        std_err_ratio = np.std([w["error_ratio"] for w in window_stats]) or 0.1

        # 3. Build Feature Matrix for Isolation Forest
        # Features per window:
        # [total_events, error_count, error_ratio, unique_message_ratio, level_entropy, z_vol, z_err]
        X = []
        for w in window_stats:
            z_vol = (w["total"] - mean_vol) / std_vol
            z_err = (w["error_ratio"] - mean_err_ratio) / std_err_ratio
            features = [
                float(w["total"]),
                float(w["errors"]),
                float(w["error_ratio"]),
                float(w["unique_ratio"]),
                float(w["entropy"]),
                float(z_vol),
                float(z_err),
            ]
            X.append(features)

        X = np.array(X)
        if len(X) >= 3:
            # Fit Isolation Forest
            try:
                X_scaled = self.scaler.fit_transform(X)
                self.model.fit(X_scaled)
                # decision_function: lower means more anomalous
                decision_scores = self.model.decision_function(X_scaled)
                # Calibrate to 0.0 - 1.0 score where higher is more anomalous
                min_dec = np.min(decision_scores)
                max_dec = np.max(decision_scores)
                spread = max_dec - min_dec if max_dec > min_dec else 1.0
                win_anomaly_scores = [float(np.clip(1.0 - ((s - min_dec) / spread), 0.0, 1.0)) for s in decision_scores]
            except Exception:
                # Fallback to statistical scoring if model fitting encounters single-class data
                win_anomaly_scores = [
                    min(1.0, max(0.0, (w["error_ratio"] * 0.6) + (max(0.0, (w["total"] - mean_vol) / (std_vol * 3)) * 0.4)))
                    for w in window_stats
                ]
        else:
            # Small dataset statistical scoring
            win_anomaly_scores = [
                min(1.0, max(0.0, (w["error_ratio"] * 0.7) + (0.3 if w["total"] > 5 else 0.0)))
                for w in window_stats
            ]

        # 4. Score individual logs and generate explainability reasons
        logs_with_scores: List[Dict[str, Any]] = []
        total_errors = 0
        ordinary_errors = 0
        flagged_anomalies = 0

        # Map each log to its window score and compute log-level specific score
        for w_idx, w in enumerate(window_stats):
            win_score = win_anomaly_scores[w_idx]
            w_total = w["total"]
            w_err_ratio = w["error_ratio"]
            
            for entry in w["logs"]:
                tmpl = entry["template"]
                tmpl_freq = template_counts[tmpl]
                rarity = 1.0 - (tmpl_freq / total_entries)
                lvl = entry["level"]

                # Determine base score based on window + message rarity + severity
                reasons: List[str] = []
                score_factors: List[float] = [win_score * 0.5]

                # Ordinary Error vs True Anomaly Differentiation
                is_error = lvl in ("ERROR", "CRITICAL")
                if is_error:
                    total_errors += 1

                # Check error frequency spike
                if w_err_ratio > 0.4 and w["errors"] >= 3:
                    score_factors.append(0.85)
                    reasons.append(f"Error Burst: {w['errors']} errors in time window ({w_err_ratio * 100:.1f}% error density)")
                elif is_error and w_err_ratio <= 0.25 and w["errors"] <= 2:
                    # Isolated error in healthy window - capped score
                    reasons.append("Isolated error event within normal window baseline")
                    score_factors.append(0.35)
                
                # Check log volume surge
                if w["total"] > (mean_vol + 2.0 * std_vol) and w["total"] >= 5:
                    score_factors.append(0.75)
                    reasons.append(f"Throughput Surge: {w['total']} events in window ({((w['total']/max(1, mean_vol))-1)*100:.0f}% above normal)")

                # Check repeated message storm (low unique ratio with high volume)
                if w["unique_ratio"] < 0.25 and w_total >= 5:
                    score_factors.append(0.80)
                    reasons.append(f"Repetitive Message Storm: Identical message pattern repeated rapidly ({w_total - len(set(e['template'] for e in w['logs']))} duplicates)")

                # Check rare critical template (only when dataset is large enough or level is CRITICAL or window is troubled)
                if rarity > 0.98 and total_entries >= 100 and (is_error or lvl == "CRITICAL"):
                    score_factors.append(0.82)
                    reasons.append(f"Rare Exception Signature: Pattern occurs in <{max(0.1, (1-rarity)*100):.1f}% of entire log history")
                elif lvl == "CRITICAL":
                    score_factors.append(0.85)
                    reasons.append("Critical severity level explicitly triggered by runtime/kernel")

                # Isolation forest outlier indicator
                if win_score >= 0.70:
                    score_factors.append(win_score)
                    reasons.append(f"Multi-feature Outlier: Isolation Forest detected anomalous feature subspace (score: {win_score:.2f})")

                # Combine factors
                combined_score = float(np.max(score_factors)) if score_factors else 0.1
                combined_score = round(min(1.0, max(0.05, combined_score)), 3)

                is_anomaly = combined_score >= threshold
                
                if is_anomaly:
                    flagged_anomalies += 1
                    # Assign severity
                    if combined_score >= 0.82 or lvl == "CRITICAL":
                        severity = "CRITICAL"
                    elif combined_score >= 0.70:
                        severity = "HIGH"
                    elif combined_score >= 0.60:
                        severity = "MEDIUM"
                    else:
                        severity = "LOW"
                else:
                    if is_error:
                        ordinary_errors += 1
                        severity = "LOW"
                        if not reasons:
                            reasons.append("Isolated standard error without cascading system anomaly")
                    else:
                        severity = "NORMAL"
                        if not reasons:
                            reasons.append("Nominal operational telemetry within baseline parameters")

                annotated_entry = {
                    **entry,
                    "anomaly_score": combined_score,
                    "is_anomaly": is_anomaly,
                    "severity": severity,
                    "detection_reasons": reasons,
                    "window_id": w["win_id"],
                }
                logs_with_scores.append(annotated_entry)

        # 5. Form Incidents from contiguous or clustered anomalous windows
        incidents: List[Dict[str, Any]] = []
        anomalous_entries = [e for e in logs_with_scores if e["is_anomaly"]]

        if anomalous_entries:
            # Group anomalies that occur within 60 seconds or consecutive indices
            cluster: List[Dict[str, Any]] = []
            
            for entry in anomalous_entries:
                if not cluster:
                    cluster.append(entry)
                else:
                    prev = cluster[-1]
                    epoch_diff = abs(entry["timestamp_epoch"] - prev["timestamp_epoch"]) if entry["timestamp_epoch"] > 0 else 0
                    id_diff = abs(entry["id"] - prev["id"])
                    
                    if (epoch_diff > 0 and epoch_diff <= 90) or (epoch_diff == 0 and id_diff <= 15):
                        cluster.append(entry)
                    else:
                        # Finalize previous cluster into an incident
                        incidents.append(self._create_incident(cluster, len(incidents) + 1, logs_with_scores))
                        cluster = [entry]
            
            if cluster:
                incidents.append(self._create_incident(cluster, len(incidents) + 1, logs_with_scores))

        # Sort incidents by peak anomaly score descending
        incidents.sort(key=lambda x: x["peak_score"], reverse=True)

        # 6. Format Time Series for Dashboard Charts
        time_series_data = []
        for w_idx, w in enumerate(window_stats):
            w_score = win_anomaly_scores[w_idx]
            w_anomalies = sum(1 for e in w["logs"] if e["id"] in [a["id"] for a in anomalous_entries])
            time_series_data.append({
                "timestamp": w["timestamp"],
                "total_events": w["total"],
                "errors": w["errors"],
                "warns": w["warns"],
                "anomaly_score": round(w_score, 3),
                "is_anomalous_window": w_score >= threshold,
                "anomalies_detected": w_anomalies,
            })

        summary = {
            "total_entries": total_entries,
            "anomaly_count": flagged_anomalies,
            "ordinary_error_count": ordinary_errors,
            "total_errors": total_errors,
            "error_rate": round((total_errors / max(1, total_entries)) * 100, 2),
            "anomaly_rate": round((flagged_anomalies / max(1, total_entries)) * 100, 2),
            "highest_score": max([e["anomaly_score"] for e in logs_with_scores], default=0.0),
            "incidents_count": len(incidents),
            "threshold_used": threshold,
        }

        return {
            "logs": logs_with_scores,
            "incidents": incidents,
            "time_series": time_series_data,
            "summary": summary,
        }

    def _create_incident(self, cluster: List[Dict[str, Any]], inc_num: int, all_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate a cluster of anomalous events into a structured Incident object."""
        peak_score = max(e["anomaly_score"] for e in cluster)
        severities = [e["severity"] for e in cluster]
        if "CRITICAL" in severities:
            highest_sev = "CRITICAL"
        elif "HIGH" in severities:
            highest_sev = "HIGH"
        elif "MEDIUM" in severities:
            highest_sev = "MEDIUM"
        else:
            highest_sev = "LOW"

        # Find most frequent template in cluster as root cause indicator
        templates = Counter(e["template"] for e in cluster)
        top_template, top_count = templates.most_common(1)[0]
        
        # Primary service affected
        services = Counter(e.get("service", "app") for e in cluster)
        primary_service = services.most_common(1)[0][0]

        # Consolidate detection reasons
        all_reasons = []
        for e in cluster:
            for r in e.get("detection_reasons", []):
                if r not in all_reasons:
                    all_reasons.append(r)

        # Context: surrounding logs before and after cluster
        first_id = cluster[0]["id"]
        last_id = cluster[-1]["id"]
        context_start = max(0, first_id - 5)
        context_end = min(len(all_logs), last_id + 6)
        surrounding_context = all_logs[context_start:context_end]

        return {
            "id": f"INC-{inc_num:03d}",
            "title": f"Incident in [{primary_service}]: {top_template[:65]}...",
            "severity": highest_sev,
            "peak_score": round(peak_score, 3),
            "start_time": cluster[0].get("timestamp") or "N/A",
            "end_time": cluster[-1].get("timestamp") or "N/A",
            "affected_events_count": len(cluster),
            "primary_service": primary_service,
            "root_cause_template": top_template,
            "reasons": all_reasons[:4],
            "sample_message": cluster[0]["message"],
            "cluster_log_ids": [e["id"] for e in cluster],
            "surrounding_context": [
                {
                    "id": c["id"],
                    "timestamp": c.get("timestamp"),
                    "level": c["level"],
                    "service": c.get("service"),
                    "message": c["message"],
                    "is_anomaly": c.get("is_anomaly", False),
                    "anomaly_score": c.get("anomaly_score", 0.0),
                }
                for c in surrounding_context
            ]
        }
