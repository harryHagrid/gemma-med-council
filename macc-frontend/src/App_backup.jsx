import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, CheckCircle2, Circle, Activity, Heart, ShieldAlert, Award } from 'lucide-react';

export default function App() {
  const [history, setHistory] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const steps = [
    { label: "Imaging Analysis", role: "Radiologist", icon: <Activity size={16}/> },
    { label: "Clinical Diagnosis", role: "Cardiologist", icon: <Heart size={16}/> },
    { label: "Safety & Audit", role: "Pharmacist", icon: <ShieldAlert size={16}/> },
    { label: "Final Consensus", role: "MedCouncil Chairman", icon: <Award size={16}/> }
  ];

  const startCouncil = async () => {
    if (!history || loading) return;
    setLoading(true);
    setReports([]);
    try {
      const res = await fetch("http://localhost:8081/run-council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history })
      });
      const data = await res.json();
      setReports(data.reports);
    } catch (err) {
      alert("Backend connection failed.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <header style={styles.header}>
        <h1 style={styles.title}>MedGemma <span style={{fontWeight:300}}>Council</span></h1>
      </header>

      <div style={styles.layout}>
        {/* LEFT COLUMN: Input & Progress */}
        <div style={styles.leftCol}>
          <div style={styles.inputCard}>
            <label style={styles.label}>Patient Case Input</label>
            <textarea 
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              style={styles.textarea}
              placeholder="Enter clinical history..."
              disabled={loading}
            />
            <button onClick={startCouncil} disabled={loading} style={{
                ...styles.button,
                backgroundColor: loading ? '#334155' : '#3b82f6'
            }}>
              {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              <span style={{marginLeft: '10px'}}>{loading ? "COUNCIL ACTIVE" : "CONVENE COUNCIL"}</span>
            </button>
          </div>

          {/* Council Progress - Appears below text input */}
          {(loading || reports.length > 0) && (
            <div style={styles.progressCard} className="fade-in">
              <h4 style={styles.progressTitle}>COUNCIL PROGRESS</h4>
              {steps.map((step, idx) => {
                const isDone = reports.length > idx;
                const isCurrent = loading && reports.length === idx;
                return (
                  <div key={idx} style={styles.stepRow}>
                    <div style={styles.stepIconGroup}>
                      {isDone ? <CheckCircle2 size={20} color="#22c55e" /> : 
                       isCurrent ? <Loader2 size={20} color="#3b82f6" className="animate-spin" /> : 
                       <Circle size={20} color="#475569" />}
                      {idx < steps.length - 1 && <div style={{...styles.stepLine, backgroundColor: isDone ? '#22c55e' : '#475569'}} />}
                    </div>
                    <div style={styles.stepText}>
                      <div style={{...styles.stepLabel, color: isDone ? '#f8fafc' : isCurrent ? '#3b82f6' : '#64748b'}}>
                        {step.label}
                      </div>
                      <div style={styles.stepRole}>{step.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Results */}
        <div style={styles.rightCol}>
          {reports.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <Activity size={48} color="#334155" />
              <p>Awaiting clinical data to convene council...</p>
            </div>
          )}
          
          <div style={styles.reportList}>
            {reports.map((r, i) => {
              const isChairman = r.role === "MedCouncil Chairman";
              return (
                <div key={i} className="fade-in" style={{
                    ...styles.reportCard,
                    borderLeft: isChairman ? '6px solid #eab308' : '6px solid #3b82f6',
                    backgroundColor: isChairman ? '#1e1b0c' : '#1e293b'
                }}>
                  <div style={styles.cardHeader}>
                    <span style={{...styles.roleTag, color: isChairman ? '#eab308' : '#60a5fa'}}>
                      {r.role.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.markdownBody}>
                    <ReactMarkdown>{r.content}</ReactMarkdown>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '40px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { maxWidth: '1200px', margin: '0 auto 30px auto' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6' },
  layout: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px', maxWidth: '1200px', margin: '0 auto' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' },
  textarea: { width: '100%', height: '120px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '12px', padding: '15px', resize: 'none', outline: 'none' },
  label: { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', display: 'block' },
  button: { width: '100%', marginTop: '15px', padding: '14px', borderRadius: '12px', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  progressCard: { backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' },
  progressTitle: { fontSize: '0.7rem', fontWeight: '800', color: '#64748b', letterSpacing: '1.5px', marginBottom: '20px' },
  stepRow: { display: 'flex', gap: '15px', minHeight: '60px' },
  stepIconGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  stepLine: { width: '2px', flexGrow: 1, margin: '4px 0' },
  stepText: { paddingTop: '0' },
  stepLabel: { fontSize: '0.9rem', fontWeight: '600' },
  stepRole: { fontSize: '0.7rem', color: '#64748b' },
  reportCard: { padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  cardHeader: { marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' },
  roleTag: { fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px' },
  markdownBody: { fontSize: '0.95rem', lineHeight: '1.7', color: '#cbd5e1' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#475569' }
};