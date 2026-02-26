# This file is backup for reference. 
# The main logic has been moved to agents_backend/agents_main.py for better organization and maintainability.

import requests
import uvicorn
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- 1. CONFIGURATION ---
# Replace with the latest Ngrok URL from your Colab cell
COLAB_URL = "https://stereotyped-unbedizened-theodore.ngrok-free.dev/inference" 

# --- 2. STATE DEFINITION ---
class CouncilState(TypedDict):
    history: str
    reports: List[dict]

# --- 3. AGENT NODES ---

def radiologist_node(state: CouncilState):
    print("\n[COUNCIL] Radiologist is reviewing imaging...", flush=True)
    prompt = f"Patient History: {state['history']}. Analyze the provided chest X-ray. Focus on anatomical findings like heart size and lung clarity."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "Radiologist"}, timeout=120).json()
    return {"reports": state['reports'] + [{"role": "Radiologist", "content": res['response']}]}

def cardiologist_node(state: CouncilState):
    print("\n[COUNCIL] Cardiologist is evaluating clinical data...", flush=True)
    rad_findings = state['reports'][-1]['content']
    prompt = f"Based on the Radiologist's findings: [{rad_findings}] and History: [{state['history']}], provide a specific diagnosis and clinical action plan. Do not repeat the imaging description."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "Cardiologist"}, timeout=120).json()
    return {"reports": state['reports'] + [{"role": "Cardiologist", "content": res['response']}]}

def pharmacist_node(state: CouncilState):
    print("\n[COUNCIL] Pharmacist is auditing for safety...", flush=True)
    cardio_plan = state['reports'][-1]['content']
    prompt = f"Review this plan: [{cardio_plan}]. Suggest medication classes and list 3 critical safety warnings based on this history: {state['history']}. Do not provide a new diagnosis."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "Pharmacist"}, timeout=120).json()
    return {"reports": state['reports'] + [{"role": "Pharmacist", "content": res['response']}]}

def chairman_node(state: CouncilState):
    print("\n[COUNCIL] MedCouncil Chairman is finalizing consensus...", flush=True)
    # Combine all previous reports for the Chairman to review
    summary_context = "\n".join([f"{r['role']}: {r['content']}" for r in state['reports']])
    prompt = f"Review the following specialist reports:\n{summary_context}\n\nAct as the MedCouncil Chairman. Provide a high-level executive summary, highlight any conflicting views, and give the final medical 'Go/No-Go' for the proposed treatment."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "MedCouncil Chairman"}, timeout=120).json()
    return {"reports": state['reports'] + [{"role": "MedCouncil Chairman", "content": res['response']}]}

# --- 4. GRAPH CONSTRUCTION ---
builder = StateGraph(CouncilState)

builder.add_node("radiologist", radiologist_node)
builder.add_node("cardiologist", cardiologist_node)
builder.add_node("pharmacist", pharmacist_node)
builder.add_node("chairman", chairman_node)

builder.set_entry_point("radiologist")
builder.add_edge("radiologist", "cardiologist")
builder.add_edge("cardiologist", "pharmacist")
builder.add_edge("pharmacist", "chairman")
builder.add_edge("chairman", END)

council_graph = builder.compile()

# --- 5. FASTAPI SERVER ---
app = FastAPI()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientQuery(BaseModel):
    history: str

@app.post("/run-council")
def run_council_endpoint(query: PatientQuery):
    print(f"🚀 New Request: {query.history[:40]}...", flush=True)
    initial_state = {"history": query.history, "reports": []}
    try:
        final_state = council_graph.invoke(initial_state)
        return final_state
    except Exception as e:
        print(f"🔥 Error: {e}", flush=True)
        return {"reports": [{"role": "System", "content": f"Critical error in council logic: {str(e)}"}]}

if __name__ == "__main__":
    print("M.A.C.C. Orchestrator active on http://localhost:8081", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8081)