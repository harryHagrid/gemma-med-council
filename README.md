# M.A.C.C. (Multi-Agent Clinical Council)

**M.A.C.C.** is an edge-native orchestration framework designed to simulate a specialist medical board. Built using **MedGemma 1.5** and **LangGraph**, it convenes a "Digital Council" of AI specialists to deliberate on complex clinical cases, providing a structured, multi-perspective consensus in real-time.

---

## Project Vision
In clinical practice, life-altering decisions are made by specialist boards. M.A.C.C. democratizes this process for rural and under-resourced clinics by providing a decentralized, private, and deterministic "Specialist Council."

* **Multidisciplinary Deliberation:** Simulates a peer-review workflow between Radiologists, Cardiologists, and Pharmacists.
* **Data Sovereignty:** Designed for local deployment to ensure patient data never leaves the hospital's secure network.
* **Agentic Orchestration:** Moves beyond linear prompting into a stateful graph where specialists build upon each other's findings.

---

## Repository Structure


GEMMA-MED-COUNCIL
├── agents-backend/           # LangGraph Orchestration Layer
│   ├── agents_main.py        # Main FastAPI server & Agentic Logic
│   └── agents_backup.py      # Stable backup of the agent logic
├── macc-frontend/            # React + Vite Dashboard
│   ├── src/                  # App components & UI Logic
│   └── ...                   # React configuration files
├── notebooks/                # Model Inference & Experiments
│   ├── medgemma_inference.ipynb # Colab-ready MedGemma 1.5 Bridge
│   └── medgemma_practice.ipynb  # Initial experiments
├── test_images/              # Sample X-Rays/Scans for demo
├── requirements.txt          # Backend dependencies
├── LICENSE                   # MIT License
└── README.md

## Technical Architecture & Deployment

The system utilizes a Stateful Agentic Graph to manage clinical transitions.

Note on Inference: While the core orchestration is designed for on-premise deployment to maintain data sovereignty, this prototype utilizes a Colab-based inference bridge (via Ngrok) to ensure high-performance response times and model reliability during the evaluation period.

Imaging Analysis (Radiologist): Extracts anatomical findings from uploaded scans.

Clinical Diagnosis (Cardiologist): Synthesizes imaging results with patient history.

Safety & Audit (Pharmacist): Audits the proposed plan for contraindications and safety.

Final Consensus (Chairman): Reviews the deliberation and issues a final executive report.

# Getting Started
1. Model Inference (Backend Bridge)
Open notebooks/medgemma_inference.ipynb in Google Colab.

Run the cells to start the Ngrok tunnel.

Copy the generated URL into agents-backend/agents_main.py as the COLAB_URL.

2. Run the Agents Backend
Bash
# From the root directory
pip install -r requirements.txt
cd agents-backend
python agents_main.py
3. Run the M.A.C.C. Dashboard
Bash
cd macc-frontend
npm install
npm run dev

## Roadmap

# Phase 2: Multi-Turn Debate: Implementing a recursive loop where agents can "challenge" each other's findings based on a certainty score.

# Phase 3: Chairman Consensus Scoring: Adding a quantitative fidelity score to measure council agreement.

# Phase 4: Deterministic Fine-Tuning: Moving the SLM from probabilistic generation to strictly deterministic intent extraction.

# Author
Abhishek Pattanaik 
Creator & End-to-End Developer