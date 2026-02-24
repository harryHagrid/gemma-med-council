import requests
import uvicorn
import json
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# --- CONFIGURATION ---
COLAB_URL = "https://stereotyped-unbedizened-theodore.ngrok-free.dev/inference" 

class CouncilState(TypedDict):
    history: str
    image: str 
    reports: List[dict]

# --- AGENT NODES (With Console Logging) ---

def radiologist_node(state: CouncilState):
    print("\n[COUNCIL] Radiologist is reviewing imaging...", flush=True)
    prompt = f"Patient History: {state['history']}. Analyze the provided chest X-ray. Focus on anatomical findings."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "Radiologist", "image": state['image']}, timeout=500).json()
    print("✅ Radiologist analysis completed.", flush=True)
    return {"reports": state['reports'] + [{"role": "Radiologist", "content": res['response']}]}

def cardiologist_node(state: CouncilState):
    print("\n[COUNCIL] Cardiologist evaluating...", flush=True)
    rad_findings = state['reports'][-1]['content']
    prompt = f"Based on Radiologist: [{rad_findings}] and History: [{state['history']}], provide diagnosis. Do not repeat imaging description."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "Cardiologist", "image": state['image']}, timeout=500).json()
    print("✅ Cardiologist evaluation completed.", flush=True)
    return {"reports": state['reports'] + [{"role": "Cardiologist", "content": res['response']}]}

def pharmacist_node(state: CouncilState):
    print("\n[COUNCIL] Pharmacist auditing...", flush=True)
    cardio_plan = state['reports'][-1]['content']
    prompt = f"Review: [{cardio_plan}]. Suggest meds and list 3 safety warnings for history: {state['history']}."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "Pharmacist", "image": state['image']}, timeout=500).json()
    print("✅ Pharmacist safety audit completed.", flush=True)
    return {"reports": state['reports'] + [{"role": "Pharmacist", "content": res['response']}]}

def chairman_node(state: CouncilState):
    print("\n[COUNCIL] MedCouncil Chairman finalizing...", flush=True)
    summary_context = "\n".join([f"{r['role']}: {r['content']}" for r in state['reports']])
    prompt = f"Review reports:\n{summary_context}\nAct as MedCouncil Chairman. Provide executive summary and Final Go/No-Go."
    res = requests.post(COLAB_URL, json={"prompt": prompt, "agent_role": "MedCouncil Chairman", "image": state['image']}, timeout=500).json()
    print("✅ MedCouncil Chairman has reached a verdict.", flush=True)
    return {"reports": state['reports'] + [{"role": "MedCouncil Chairman", "content": res['response']}]}

# --- GRAPH CONSTRUCTION ---
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

# --- SERVER ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class PatientQuery(BaseModel):
    history: str
    image: str 

@app.post("/run-council")
async def run_council_endpoint(query: PatientQuery):
    async def event_generator():
        initial_state = {"history": query.history, "image": query.image, "reports": []}
        print(f"\n CONVENING COUNCIL for Case: {query.history[:30]}...", flush=True)
        
        for output in council_graph.stream(initial_state):
            for key, value in output.items():
                data = {"reports": value["reports"], "status": key}
                yield f"data: {json.dumps(data)}\n\n"
        print("\n ALL AGENTS FINISHED. Streaming complete.", flush=True)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)