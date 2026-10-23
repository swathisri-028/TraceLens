"""
Unit tests for TraceLens Anomaly Detector
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from parser import parse_log_content
from detector import AnomalyDetector, clean_template
from sample_data import SAMPLE_ECOMMERCE_OUTAGE

def test_clean_template():
    msg = "User login failed for 192.168.1.50 with error code 403 and id 123e4567-e89b-12d3-a456-426614174000"
    cleaned = clean_template(msg)
    assert "<IP>" in cleaned
    assert "<NUM>" in cleaned
    assert "<UUID>" in cleaned

def test_anomaly_detection_ecommerce():
    logs, _ = parse_log_content(SAMPLE_ECOMMERCE_OUTAGE)
    detector = AnomalyDetector(anomaly_threshold=0.60)
    results = detector.analyze(logs)

    # Summary checks
    summary = results["summary"]
    assert summary["total_entries"] > 0
    assert summary["anomaly_count"] > 0
    assert summary["highest_score"] >= 0.70

    # Incident formation checks
    incidents = results["incidents"]
    assert len(incidents) >= 1
    top_incident = incidents[0]
    assert top_incident["severity"] in ("CRITICAL", "HIGH")
    assert "reasons" in top_incident
    assert len(top_incident["reasons"]) > 0

    # Check distinction between ordinary error and cascading anomaly
    # The static 404 in line 8 is an ordinary error, should not trigger critical anomaly
    ordinary_404 = next((l for l in results["logs"] if "404" in l["message"]), None)
    if ordinary_404:
        assert ordinary_404["anomaly_score"] < 0.60
        assert ordinary_404["is_anomaly"] is False
