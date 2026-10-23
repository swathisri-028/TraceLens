"""
TraceLens Model Evaluation Module
Calculates Precision, Recall, F1-Score, Confusion Matrix, and threshold sweeps
against ground-truth labeled benchmark datasets.
"""

from typing import Dict, Any, List, Optional
from parser import parse_log_content
from detector import AnomalyDetector
from sample_data import get_benchmark_log_text_and_labels

def evaluate_model(threshold: float = 0.60) -> Dict[str, Any]:
    """
    Run evaluation against the labeled benchmark dataset.
    Returns precision, recall, F1, confusion matrix, threshold tuning curve,
    and individual verification rows.
    """
    raw_logs, ground_truth_labels = get_benchmark_log_text_and_labels()
    gt_map = {item["id"]: item for item in ground_truth_labels}

    # Parse logs
    parsed_logs, _ = parse_log_content(raw_logs)

    # Run detection
    detector = AnomalyDetector(contamination=0.25, anomaly_threshold=threshold)
    results = detector.analyze(parsed_logs, custom_threshold=threshold)
    detected_logs = results["logs"]

    # Match predictions with ground truth
    tp = 0
    fp = 0
    tn = 0
    fn = 0
    detailed_rows: List[Dict[str, Any]] = []

    for entry in detected_logs:
        entry_id = entry["id"]
        gt_info = gt_map.get(entry_id, {"ground_truth": False, "ground_truth_reason": "Unknown"})
        actual_anomaly = gt_info["ground_truth"]
        predicted_anomaly = entry["is_anomaly"]
        score = entry["anomaly_score"]

        classification_type = ""
        if actual_anomaly and predicted_anomaly:
            tp += 1
            classification_type = "TP"
        elif not actual_anomaly and predicted_anomaly:
            fp += 1
            classification_type = "FP"
        elif not actual_anomaly and not predicted_anomaly:
            tn += 1
            classification_type = "TN"
        else: # actual_anomaly and not predicted_anomaly
            fn += 1
            classification_type = "FN"

        detailed_rows.append({
            "id": entry_id,
            "timestamp": entry.get("timestamp"),
            "level": entry["level"],
            "service": entry.get("service"),
            "message": entry["message"],
            "anomaly_score": score,
            "actual_anomaly": actual_anomaly,
            "predicted_anomaly": predicted_anomaly,
            "classification_type": classification_type,
            "ground_truth_reason": gt_info["ground_truth_reason"],
            "detection_reasons": entry.get("detection_reasons", []),
        })

    total = len(detailed_rows)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    accuracy = (tp + tn) / max(1, total)
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    # Compute threshold curve (from 0.35 to 0.85 in 0.05 steps)
    threshold_curve = []
    test_thresholds = [0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]
    for t in test_thresholds:
        c_tp, c_fp, c_tn, c_fn = 0, 0, 0, 0
        for row in detailed_rows:
            actual = row["actual_anomaly"]
            pred = row["anomaly_score"] >= t
            if actual and pred:
                c_tp += 1
            elif not actual and pred:
                c_fp += 1
            elif not actual and not pred:
                c_tn += 1
            else:
                c_fn += 1
        prec = c_tp / (c_tp + c_fp) if (c_tp + c_fp) > 0 else 0.0
        rec = c_tp / (c_tp + c_fn) if (c_tp + c_fn) > 0 else 0.0
        f1_val = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        threshold_curve.append({
            "threshold": t,
            "precision": round(prec, 3),
            "recall": round(rec, 3),
            "f1": round(f1_val, 3),
            "tp": c_tp,
            "fp": c_fp,
            "tn": c_tn,
            "fn": c_fn,
        })

    return {
        "dataset_name": "TraceLens Verified Benchmark Dataset v1.0",
        "dataset_description": "Curated benchmark containing 54 microservice logs with mixed normal traffic, ordinary handled single errors (404s, client validation failures), and 2 multi-service cascading anomaly incidents.",
        "threshold_evaluated": threshold,
        "metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "accuracy": round(accuracy, 4),
            "specificity": round(specificity, 4),
            "total_samples": total,
            "ground_truth_positives": tp + fn,
            "ground_truth_negatives": tn + fp,
        },
        "confusion_matrix": {
            "true_positive": tp,
            "false_positive": fp,
            "true_negative": tn,
            "false_negative": fn,
        },
        "threshold_curve": threshold_curve,
        "detailed_rows": detailed_rows,
        "production_disclaimer": "Ground truth evaluation demonstrates detector efficacy on controlled benchmark distributions with verified labels. Real-world production logs feature non-stationary distributions, telemetry jitter, and evolving error signatures; empirical tuning is recommended.",
    }
