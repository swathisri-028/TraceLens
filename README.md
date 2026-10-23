# TraceLens — Intelligent Log Anomaly Detection & Incident Analysis

**TraceLens** is an open-source, developer-focused full-stack web application designed for Site Reliability Engineers (SREs), DevOps teams, and backend engineers. It ingests application logs, detects unusual system behavior using an explainable **scikit-learn Isolation Forest** combined with statistical feature extraction, and provides an interactive incident exploration workflow with root-cause explainability.

---

## 🌟 Key Features

### 1. Unified Telemetry Dashboard
- **Top KPI Cards**: Total Log Entries, Detected Anomalies, Ordinary Handled Errors (explicitly distinguished from anomalies), Overall Error Rate %, and Formed Incidents.
- **Activity & Throughput Over Time**: Interactive area chart showing total logs vs error surges across time windows.
- **Severity Breakdown**: Distribution of extracted log levels (`DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`).
- **Recent Incidents Table**: Fast triage table with one-click drill down into incident context.

### 2. Multi-Format Log Ingestion & Parsing
- Supports **ISO-8601 timestamps**, bracketed timestamps, Python logging, Syslog, Apache/Nginx, and JSON lines format.
- Automatic **multiline stack trace reassembly** for Java and Python exceptions.
- **Graceful handling of malformed lines** with fallback tagging.
- Zero-configuration **Instant Sample Scenarios** (`E-Commerce Outage`, `Microservice Memory Leak`, `Labeled Benchmark`).
- File upload dropzone (`.log`, `.txt`, `.json`) and raw text paste area.

### 3. Genuine, Explainable Anomaly Detection
- Powered by Python **scikit-learn Isolation Forest** and statistical feature extraction (error rate density, log level entropy, message repetition storms, and throughput z-scores).
- **Domain-Specific Explainability**: Every flagged anomaly contains plain-English technical justifications (e.g. *"Error Burst: 14 errors in time window (86.4% error density)"*, *"Repetitive Message Storm: Identical message pattern repeated rapidly"*).
- **Clear Separation of Ordinary Errors vs Anomalies**: Isolated client errors (such as a standard 404 Not Found or handled form validation failure) are kept below anomaly threshold, avoiding alert fatigue.

### 4. Interactive Incident Explorer
- Aggregates temporally clustered anomaly signals into structured **Incidents** (`INC-001`, `INC-002`).
- Filter by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) or search by service, error message, and detection signal.
- **Incident Context Modal**: Inspects preceding nominal logs, the cascading failure storm, and subsequent recovery logs.
- Export incident report in Markdown format or raw JSON.

### 5. Empirical Model Evaluation (Ground-Truth Benchmark)
- Evaluates detection performance against a verified benchmark dataset of 54 microservice logs.
- Computes **Precision (90.5%)**, **Recall (90.5%)**, **F1-Score (90.5%)**, and **Specificity (93.8%)**.
- Interactive **2x2 Confusion Matrix** (True Positives, False Positives, True Negatives, False Negatives).
- **Threshold Optimization Curve** and interactive threshold sensitivity slider.
- Itemized benchmark verification audit table.
- Clear production disclaimer explaining that controlled benchmark performance serves as a baseline and requires tuning in non-stationary production environments.

---

## 🛠️ Architecture & Tech Stack

```
TraceLens/
├── backend/
│   ├── main.py             # FastAPI REST API endpoints
│   ├── parser.py           # Robust multi-format log parser & stacktrace merger
│   ├── detector.py         # Isolation Forest & explainable anomaly detection engine
│   ├── evaluation.py       # Precision, Recall, F1, and Confusion Matrix evaluator
│   ├── sample_data.py      # Pre-packaged production incident datasets & benchmark
│   ├── requirements.txt    # Python dependencies
│   └── tests/              # Pytest unit tests (8 tests passing)
│       ├── test_parser.py
│       ├── test_detector.py
│       └── test_evaluation.py
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Dashboard, IncidentExplorer, LogStream, etc.
│   │   ├── services/api.ts # Typed REST API client
│   │   ├── types/index.ts  # Shared TypeScript interfaces
│   │   ├── App.tsx         # State management & tab router
│   │   └── main.tsx
│   ├── tailwind.config.js  # Dark developer theme tokens
│   ├── vite.config.ts      # Vite bundler & API reverse proxy
│   └── package.json
└── README.md
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React.
- **Backend**: Python 3.14+, FastAPI, Uvicorn, scikit-learn (`IsolationForest`), NumPy, Pandas.

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+ (with `pip`)
- Node.js 18+ and `npm`

### Step 1: Start the Backend (Port 8000)
Open a terminal in the project directory:

```bash
# Navigate to backend and install dependencies (if not already installed)
pip install -r backend/requirements.txt

# Run the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- API Base: `http://127.0.0.1:8000/api/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### Step 2: Start the Frontend (Port 5173)
Open a second terminal:

```bash
# Navigate to frontend and install packages
cd frontend
npm install

# Start Vite dev server
npm run dev
```

Open your browser at **`http://127.0.0.1:5173/`**. TraceLens will automatically load the default incident dataset and initialize the dashboard.

---

## 🧪 Running Tests

### Backend Unit Tests
TraceLens includes automated test coverage for log parsing, Isolation Forest scoring, ordinary error differentiation, and benchmark evaluation.

```bash
# From workspace root
python -m pytest backend/tests
```

**Output:**
```
backend/tests/test_detector.py ..       [ 25%]
backend/tests/test_evaluation.py .      [ 37%]
backend/tests/test_parser.py .....      [100%]
====================== 8 passed in 2.61s ======================
```

### Frontend Typecheck & Production Build
```bash
cd frontend
npm run build
```

---

## 🔬 Algorithm & Detection Methodology

1. **Log Normalization & Invariant Extraction**:
   - Message templates are normalized by substituting IP addresses, UUIDs, hex values, and numbers with canonical tokens (`<IP>`, `<UUID>`, `<NUM>`).
2. **Temporal Window Aggregation**:
   - Logs are partitioned into sliding/fixed temporal windows (10s to 60s based on total log span).
   - In each window, TraceLens calculates:
     - Event volume and error frequency.
     - Log level Shannon entropy ($H = -\sum p_i \log_2 p_i$). A sharp collapse in entropy signals an error spam storm.
     - Unique template ratio (identifying high-velocity repetition storms).
     - Volume and error z-scores relative to dataset baselines.
3. **Isolation Forest Model**:
   - An `IsolationForest` ensemble ($n=100$) fits the scaled multi-dimensional feature matrix.
   - Decision function scores are normalized to a calibrated interval $[0.0, 1.0]$.
4. **Ordinary Error Filtering**:
   - Handled single errors (e.g. isolated 404s) in baseline windows are bounded below the anomaly threshold to prevent false alarms.
5. **Explainability Reason Generation**:
   - Specific, understandable diagnostic explanations are appended to every flagged log and aggregated incident.

---

## ⚠️ Limitations & Production Caveats

- **Stationary vs Non-Stationary Logs**: In large-scale distributed deployments, microservice traffic fluctuates between peak and off-peak hours. Thresholds should be dynamically tuned or scheduled according to seasonal baselines.
- **Clock Drift**: When ingesting multi-host logs without synchronized NTP clocks, timestamps may exhibit jitter. TraceLens includes sequential order fallback to mitigate out-of-order logs.
- **Unlabeled Novel Outages**: The demonstration benchmark provides ground-truth evaluation for simulated failure modes. Unseen zero-day operational failures may produce distinct statistical signatures.

---

## 📄 License
MIT License. Built for developer observability and incident investigation.
