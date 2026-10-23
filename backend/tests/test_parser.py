"""
Unit tests for TraceLens Log Parser
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from parser import parse_log_content, parse_single_line

def test_parse_iso_format():
    line = "2026-10-23 14:00:01.102 [INFO] [web-gateway] GET /products HTTP/1.1 200 - 12ms"
    parsed = parse_single_line(line, 0)
    assert parsed["level"] == "INFO"
    assert parsed["service"] == "web-gateway"
    assert "GET /products" in parsed["message"]
    assert parsed["is_malformed"] is False

def test_parse_bracketed_format():
    line = "[2026-10-23 14:00:25] [CRITICAL] [db-pool] Connection pool exhausted!"
    parsed = parse_single_line(line, 1)
    assert parsed["level"] == "CRITICAL"
    assert parsed["service"] == "db-pool"
    assert "Connection pool exhausted" in parsed["message"]
    assert parsed["is_malformed"] is False

def test_parse_json_format():
    line = '{"timestamp": "2026-10-23T14:00:01Z", "level": "error", "service": "payment-api", "message": "Charge failed"}'
    parsed = parse_single_line(line, 2)
    assert parsed["level"] == "ERROR"
    assert parsed["service"] == "payment-api"
    assert "Charge failed" in parsed["message"]
    assert parsed["is_malformed"] is False

def test_parse_multiline_stacktrace():
    content = """2026-10-23 14:00:25.820 [ERROR] [checkout-service] DBConnectionTimeoutException: Unable to acquire connection
   at com.tracelens.db.HikariPool.getConnection(HikariPool.java:182)
   at com.tracelens.checkout.OrderDao.save(OrderDao.java:94)
2026-10-23 14:00:30.000 [INFO] [checkout-service] Retrying request"""
    
    logs, summary = parse_log_content(content)
    assert len(logs) == 2
    assert "HikariPool.java:182" in logs[0]["message"]
    assert summary["multiline_merged_count"] == 2
    assert summary["level_counts"]["ERROR"] == 1
    assert summary["level_counts"]["INFO"] == 1

def test_parse_malformed_graceful():
    content = "Some random unstructured system notice without any standard timestamp or brackets"
    logs, summary = parse_log_content(content)
    assert len(logs) == 1
    assert logs[0]["is_malformed"] is True
    assert summary["malformed_count"] == 1
