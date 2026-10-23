import { AnalysisResponse, EvaluationResponse, SampleItem } from '../types';

const API_BASE = '/api';

export async function checkBackendHealth(): Promise<{ status: string; scikit_learn_version: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    throw new Error('Backend server is unreachable. Ensure the FastAPI backend is running on port 8000.');
  }
}

export async function getSamples(): Promise<SampleItem[]> {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error('Failed to load sample dataset catalog');
  return await res.json();
}

export async function getSampleRaw(sampleId: string): Promise<{ id: string; name: string; raw: string }> {
  const res = await fetch(`${API_BASE}/samples/${sampleId}/raw`);
  if (!res.ok) throw new Error('Failed to fetch raw sample content');
  return await res.json();
}

export async function analyzeSample(sampleId: string, threshold = 0.60): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/samples/${sampleId}/analyze?threshold=${threshold}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to analyze sample' }));
    throw new Error(err.detail || 'Analysis request failed');
  }
  return await res.json();
}

export async function analyzeText(rawText: string, datasetName = 'Pasted Logs', threshold = 0.60): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText, dataset_name: datasetName, threshold }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to analyze text' }));
    throw new Error(err.detail || 'Analysis request failed');
  }
  return await res.json();
}

export async function uploadAndAnalyzeFile(file: File, threshold = 0.60): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('threshold', threshold.toString());

  const res = await fetch(`${API_BASE}/analyze/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload and analysis failed' }));
    throw new Error(err.detail || 'File upload failed');
  }
  return await res.json();
}

export async function getEvaluation(threshold = 0.60): Promise<EvaluationResponse> {
  const res = await fetch(`${API_BASE}/evaluation?threshold=${threshold}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to load model evaluation' }));
    throw new Error(err.detail || 'Model evaluation failed');
  }
  return await res.json();
}
