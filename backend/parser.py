"""
TraceLens Log Parser
Handles multiple log formats, multiline traces, malformed lines, and timestamp normalization.
"""

import re
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

COMMON_LEVELS = {"DEBUG", "INFO", "WARN", "WARNING", "ERROR", "CRITICAL", "FATAL", "TRACE"}

# Compiled regex patterns for various log formats
PATTERNS = [
    # 1. ISO format with service brackets: 2026-10-23 14:22:15.123 [INFO] [service] message
    re.compile(
        r'^(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?)\s+'
        r'\[?(?P<level>[A-Z]{4,8})\]?\s+'
        r'(?:\[(?P<service>[a-zA-Z0-9_\-\.]+)\]\s+)?'
        r'(?P<message>.*)$'
    ),
    # 2. Bracketed timestamp: [2026-10-23 14:22:15] [ERROR] [service] message
    re.compile(
        r'^\[(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,6})?)\]\s+'
        r'\[?(?P<level>[A-Z]{4,8})\]?\s+'
        r'(?:\[(?P<service>[a-zA-Z0-9_\-\.]+)\]\s+)?'
        r'(?P<message>.*)$'
    ),
    # 3. Python logging style: 2026-10-23 14:22:15,123 - service - LEVEL - message
    re.compile(
        r'^(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,6})?)\s*-\s*'
        r'(?P<service>[a-zA-Z0-9_\-\.]+)\s*-\s*'
        r'(?P<level>[A-Z]{4,8})\s*-\s*'
        r'(?P<message>.*)$'
    ),
    # 4. Syslog-like: Oct 23 14:22:15 host service[pid]: [LEVEL] message
    re.compile(
        r'^(?P<timestamp>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+'
        r'(?P<host>[a-zA-Z0-9_\-\.]+)\s+'
        r'(?P<service>[a-zA-Z0-9_\-\.]+)(?:\[\d+\])?:\s+'
        r'(?:\[?(?P<level>[A-Z]{4,8})\]?\s+)?'
        r'(?P<message>.*)$'
    ),
    # 5. Fallback timestamp + message: 2026-10-23 14:22:15 message
    re.compile(
        r'^(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?)\s+'
        r'(?P<message>.*)$'
    ),
]

def parse_iso_or_custom_timestamp(ts_str: str) -> Optional[datetime]:
    """Parse various timestamp string representations into a datetime object."""
    if not ts_str:
        return None
    cleaned = ts_str.strip()
    
    # Replace comma with period for milliseconds
    cleaned = cleaned.replace(',', '.')
    
    # Try standard ISO formats
    formats_to_try = [
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%b %d %H:%M:%S",
    ]
    for fmt in formats_to_try:
        try:
            dt = datetime.strptime(cleaned, fmt)
            # If syslog without year, assume current year
            if dt.year == 1900:
                dt = dt.replace(year=datetime.now().year)
            return dt
        except ValueError:
            continue
            
    # Try fromisoformat as fallback
    try:
        # Handle trailing Z
        if cleaned.endswith('Z'):
            cleaned = cleaned[:-1] + '+00:00'
        return datetime.fromisoformat(cleaned)
    except Exception:
        return None

def normalize_level(level_str: Optional[str]) -> str:
    """Normalize log level to standard uppercase strings."""
    if not level_str:
        return "INFO"
    lvl = level_str.strip().upper()
    if lvl in ("WARN", "WARNING"):
        return "WARN"
    if lvl in ("ERROR", "ERR"):
        return "ERROR"
    if lvl in ("CRITICAL", "FATAL"):
        return "CRITICAL"
    if lvl in ("DEBUG", "DBG"):
        return "DEBUG"
    if lvl in ("INFO", "INFORMATION"):
        return "INFO"
    if lvl in ("TRACE",):
        return "TRACE"
    return "INFO"

def parse_single_line(line: str, line_num: int) -> Dict[str, Any]:
    """Attempt to parse a single line into structured fields."""
    stripped = line.strip()
    if not stripped:
        return {
            "id": line_num,
            "raw": line,
            "timestamp": "",
            "timestamp_epoch": 0.0,
            "level": "INFO",
            "service": "unknown",
            "message": "",
            "is_malformed": True,
        }

    # Check for JSON line format first
    if stripped.startswith('{') and stripped.endswith('}'):
        try:
            data = json.loads(stripped)
            ts_str = str(data.get("timestamp") or data.get("time") or data.get("date") or "")
            dt = parse_iso_or_custom_timestamp(ts_str) if ts_str else None
            level = normalize_level(str(data.get("level") or data.get("severity") or "INFO"))
            service = str(data.get("service") or data.get("app") or data.get("component") or "app")
            msg = str(data.get("message") or data.get("msg") or stripped)
            
            epoch = dt.timestamp() if dt else 0.0
            return {
                "id": line_num,
                "raw": line,
                "timestamp": dt.isoformat() if dt else ts_str,
                "timestamp_epoch": epoch,
                "level": level,
                "service": service,
                "message": msg,
                "is_malformed": False,
            }
        except Exception:
            pass

    # Try standard regex patterns
    for pattern in PATTERNS:
        match = pattern.match(stripped)
        if match:
            group_dict = match.groupdict()
            ts_str = group_dict.get("timestamp", "")
            dt = parse_iso_or_custom_timestamp(ts_str)
            
            raw_level = group_dict.get("level")
            # If pattern didn't extract level, check message for embedded level
            if not raw_level:
                level_match = re.search(r'\b(DEBUG|INFO|WARN(?:ING)?|ERROR|CRITICAL|FATAL)\b', group_dict.get("message", ""), re.IGNORECASE)
                raw_level = level_match.group(1) if level_match else "INFO"
                
            level = normalize_level(raw_level)
            service = group_dict.get("service") or "app"
            message = group_dict.get("message", "").strip()
            
            epoch = dt.timestamp() if dt else 0.0
            return {
                "id": line_num,
                "raw": line,
                "timestamp": dt.isoformat() if dt else ts_str,
                "timestamp_epoch": epoch,
                "level": level,
                "service": service,
                "message": message,
                "is_malformed": False,
            }

    # Malformed / Unstructured line fallback:
    # Check if message contains error keywords
    level = "INFO"
    if re.search(r'\b(error|exception|fail|fatal|crash)\b', stripped, re.IGNORECASE):
        level = "ERROR"
    elif re.search(r'\b(warn|warning)\b', stripped, re.IGNORECASE):
        level = "WARN"

    return {
        "id": line_num,
        "raw": line,
        "timestamp": "",
        "timestamp_epoch": 0.0,
        "level": level,
        "service": "unstructured",
        "message": stripped,
        "is_malformed": True,
    }

def parse_log_content(content: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Parse full log file text into structured log records.
    Handles multiline stack traces by appending continuation lines to previous record.
    Returns: (parsed_logs, metadata_summary)
    """
    lines = content.splitlines()
    parsed_logs: List[Dict[str, Any]] = []
    
    malformed_count = 0
    multiline_merged_count = 0
    level_counts = {"DEBUG": 0, "INFO": 0, "WARN": 0, "ERROR": 0, "CRITICAL": 0}
    
    last_valid_epoch = 0.0
    
    for i, line in enumerate(lines):
        if not line.strip():
            continue
            
        # Check if line is a continuation line (stack trace, python exception, java trace, whitespace indent)
        is_continuation = bool(
            parsed_logs and (
                line.startswith(('   ', '\t', '  at ', 'Caused by:', 'Traceback (most recent call last):', 'File "')) or
                (not re.match(r'^[\[\d]', line.strip()) and not any(line.strip().startswith(m) for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "{"]))
            )
        )
        
        if is_continuation and parsed_logs:
            # Merge with previous entry
            parsed_logs[-1]["message"] += "\n" + line
            parsed_logs[-1]["raw"] += "\n" + line
            multiline_merged_count += 1
            continue
            
        entry = parse_single_line(line, len(parsed_logs))
        
        # If timestamp is missing but previous exists, interpolate slightly
        if entry["timestamp_epoch"] == 0.0 and last_valid_epoch > 0.0:
            entry["timestamp_epoch"] = last_valid_epoch + 0.1
            entry["timestamp"] = datetime.fromtimestamp(entry["timestamp_epoch"]).isoformat()
        elif entry["timestamp_epoch"] > 0.0:
            last_valid_epoch = entry["timestamp_epoch"]
            
        if entry["is_malformed"]:
            malformed_count += 1
            
        lvl = entry["level"]
        level_counts[lvl] = level_counts.get(lvl, 0) + 1
        parsed_logs.append(entry)

    # Sort parsed logs by timestamp if valid epochs exist
    has_valid_timestamps = any(e["timestamp_epoch"] > 0.0 for e in parsed_logs)
    if has_valid_timestamps:
        parsed_logs.sort(key=lambda x: x["timestamp_epoch"])
        # Re-index ids sequentially
        for idx, entry in enumerate(parsed_logs):
            entry["id"] = idx

    summary = {
        "total_lines": len(lines),
        "total_parsed": len(parsed_logs),
        "malformed_count": malformed_count,
        "multiline_merged_count": multiline_merged_count,
        "level_counts": level_counts,
        "has_timestamps": has_valid_timestamps,
        "time_start": parsed_logs[0]["timestamp"] if parsed_logs and parsed_logs[0]["timestamp"] else None,
        "time_end": parsed_logs[-1]["timestamp"] if parsed_logs and parsed_logs[-1]["timestamp"] else None,
    }
    
    return parsed_logs, summary
