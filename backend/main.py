"""
TraceLens FastAPI Backend
Provides REST endpoints for log ingestion, Isolation Forest anomaly detection,
incident exploration, and ground-truth model evaluation.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sklearn
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from parser import parse_log_content
from detector import AnomalyDetector
from sample_data import get_sample_catalog, SAMPLE_ECOMMERCE_OUTAGE
from evaluation import evaluate_model

app = FastAPI(
    title="TraceLens API",
    description="Intelligent Log Anomaly Detection & Incident Analysis API",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeTextRequest(BaseModel):
    raw_text: str
    threshold: Optional[float] = 0.60
    dataset_name: Optional[str] = "Uploaded Log"

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TraceLens Backend",
        "python_version": sys.version,
        "scikit_learn_version": sklearn.__version__,
    }

@app.get("/api/samples")
def list_samples():
    """Return available sample datasets for instant zero-config exploration."""
    catalog = get_sample_catalog()
    # Don't send huge raw string in summary catalog, just metadata
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "description": s["description"],
            "type": s["type"],
            "line_count": s["line_count"],
        }
        for s in catalog
    ]

@app.get("/api/samples/{sample_id}/raw")
def get_sample_raw(sample_id: str):
    catalog = {s["id"]: s for s in get_sample_catalog()}
    if sample_id not in catalog:
        raise HTTPException(status_code=404, detail="Sample dataset not found")
    return {"id": sample_id, "name": catalog[sample_id]["name"], "raw": catalog[sample_id]["raw"]}

@app.post("/api/analyze/text")
def analyze_text(request: AnalyzeTextRequest):
    """Analyze raw log text supplied in JSON body."""
    if not request.raw_text.strip():
        raise HTTPException(status_code=400, detail="Log content cannot be empty.")
    
    parsed_logs, parser_summary = parse_log_content(request.raw_text)
    if not parsed_logs:
        raise HTTPException(status_code=400, detail="Could not parse any log lines from the provided text.")
        
    detector = AnomalyDetector(anomaly_threshold=request.threshold or 0.60)
    analysis_results = detector.analyze(parsed_logs, custom_threshold=request.threshold)
    
    return {
        "source": request.dataset_name or "Raw Text",
        "parser_summary": parser_summary,
        "summary": analysis_results["summary"],
        "time_series": analysis_results["time_series"],
        "incidents": analysis_results["incidents"],
        "logs": analysis_results["logs"],
    }

@app.post("/api/analyze/upload")
async def analyze_file(
    file: UploadFile = File(...),
    threshold: float = Form(0.60),
):
    """Accept .log or .txt file upload, parse, and run anomaly detection."""
    filename = file.filename or "uploaded.log"
    if not (filename.endswith('.log') or filename.endswith('.txt') or filename.endswith('.json')):
        raise HTTPException(status_code=400, detail="Please upload a .log, .txt, or .json file.")
    
    try:
        content_bytes = await file.read()
        # Decode UTF-8 with fallback
        try:
            content_str = content_bytes.decode('utf-8')
        except UnicodeDecodeError:
            content_str = content_bytes.decode('latin-1', errors='replace')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
        
    if not content_str.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    parsed_logs, parser_summary = parse_log_content(content_str)
    if not parsed_logs:
        raise HTTPException(status_code=400, detail="Unable to extract valid log lines from the uploaded file.")

    detector = AnomalyDetector(anomaly_threshold=threshold)
    analysis_results = detector.analyze(parsed_logs, custom_threshold=threshold)

    return {
        "source": filename,
        "parser_summary": parser_summary,
        "summary": analysis_results["summary"],
        "time_series": analysis_results["time_series"],
        "incidents": analysis_results["incidents"],
        "logs": analysis_results["logs"],
    }

@app.post("/api/samples/{sample_id}/analyze")
def analyze_sample(sample_id: str, threshold: float = Query(0.60)):
    """Run analysis directly on one of the pre-loaded sample datasets."""
    catalog = {s["id"]: s for s in get_sample_catalog()}
    if sample_id not in catalog:
        raise HTTPException(status_code=404, detail="Sample dataset not found.")

    sample = catalog[sample_id]
    parsed_logs, parser_summary = parse_log_content(sample["raw"])
    
    detector = AnomalyDetector(anomaly_threshold=threshold)
    analysis_results = detector.analyze(parsed_logs, custom_threshold=threshold)

    return {
        "source": sample["name"],
        "sample_id": sample_id,
        "parser_summary": parser_summary,
        "summary": analysis_results["summary"],
        "time_series": analysis_results["time_series"],
        "incidents": analysis_results["incidents"],
        "logs": analysis_results["logs"],
    }

@app.get("/api/evaluation")
def get_evaluation(threshold: float = Query(0.60)):
    """Run model evaluation against the ground truth benchmark dataset."""
    return evaluate_model(threshold=threshold)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
