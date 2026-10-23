"""
Unit tests for TraceLens Model Evaluation
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from evaluation import evaluate_model

def test_benchmark_evaluation():
    results = evaluate_model(threshold=0.60)
    assert "metrics" in results
    metrics = results["metrics"]
    assert metrics["precision"] > 0.0
    assert metrics["recall"] > 0.0
    assert metrics["f1_score"] > 0.0
    assert metrics["total_samples"] > 30

    cm = results["confusion_matrix"]
    assert "true_positive" in cm
    assert "false_positive" in cm
    assert "true_negative" in cm
    assert "false_negative" in cm
    assert cm["true_positive"] > 0
    assert cm["true_negative"] > 0

    assert len(results["threshold_curve"]) > 5
    assert len(results["detailed_rows"]) == metrics["total_samples"]
