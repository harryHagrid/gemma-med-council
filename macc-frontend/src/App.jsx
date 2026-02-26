import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, CheckCircle2, Circle, Upload, FileDown, Stethoscope, Activity, Heart, ShieldAlert, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  const [history, setHistory] = useState("");
  const [image, setImage] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");

  const steps = [
    { id: "radiologist", label: "Imaging Analysis", role: "Radiologist", icon: <Activity size={16}/> },
    { id: "cardiologist", label: "Clinical Diagnosis", role: "Cardiologist", icon: <Heart size={16}/> },
    { id: "pharmacist", label: "Safety & Audit", role: "Pharmacist", icon: <ShieldAlert size={16}/> },
    { id: "chairman", label: "Final Consensus", role: "MedCouncil Chairman", icon: <Award size={16}/> }
  ];

  const handleImage = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const startCouncil = async () => {
    if (!history || !image) return alert("Please provide both clinical history and an image scan.");
    setLoading(true);
    setReports([]);
    setCurrentStatus("radiologist"); 
    
    try {
      const response = await fetch("http://localhost:8081/run-council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, image })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        lines.forEach(line => {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.replace("data: ", ""));
            setReports(data.reports);
            
            const lastRole = data.status.toLowerCase();
            if (lastRole.includes("radiologist")) setCurrentStatus("cardiologist");
            else if (lastRole.includes("cardiologist")) setCurrentStatus("pharmacist");
            else if (lastRole.includes("pharmacist")) setCurrentStatus("chairman");
            else if (lastRole.includes("chairman")) setCurrentStatus("done");
          }
        });
      }
    } catch (err) {
      alert("Council connection lost. Check backend logs.", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const input = document.getElementById('report-export-area');
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`MACC_Clinical_Report.pdf`);
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER: M.A.C.C. BRANDING */}
      <header style={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <div style={styles.logoBox}><Stethoscope size={32} color="white"/></div>
          <div>
            <h1 style={styles.title}>M.A.C.C.</h1>
            <p style={styles.subtitle}>Multi-Agent Clinical Council • Powered by <strong>MedGemma 1.5</strong></p>
          </div>
        </div>
        {reports.length > 0 && (
          <button onClick={downloadPDF} style={styles.pdfBtn}><FileDown size={18}/> DOWNLOAD PDF</button>
        )}
      </header>

      <div style={styles.layout}>
        {/* LEFT COLUMN: RESTORED INPUT CARD STYLE */}
        <div style={styles.leftCol}>
          <div style={styles.inputCard}>
            <label style={styles.label}>Patient Case Input</label>
            <textarea 
              value={history} 
              onChange={(e)=>setHistory(e.target.value)} 
              style={styles.textarea} 
              placeholder="Enter clinical history..."
              disabled={loading}
            />
            
            <label style={styles.label}>Clinical Imaging</label>
            <div style={{...styles.uploadBox, borderColor: image ? '#22c55e' : '#334155'}}>
              <input type="file" onChange={handleImage} style={{display:'none'}} id="img-up"/>
              <label htmlFor="img-up" style={{cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                <Upload size={18} color={image ? '#22c55e' : '#94a3b8'}/> 
                <span style={{color: image ? '#22c55e' : '#94a3b8', fontSize: '0.85rem', fontWeight:'600'}}>
                    {image ? "IMAGE ATTACHED" : "UPLOAD SCAN"}
                </span>
              </label>
            </div>

            <button onClick={startCouncil} disabled={loading} style={{
                ...styles.button, 
                backgroundColor: loading ? '#334155' : '#3b82f6'
            }}>
              {loading ? <Loader2 className="animate-spin"/> : <Send size={18}/>}
              <span style={{marginLeft: '10px'}}>{loading ? "COUNCIL ACTIVE" : "CONVENE COUNCIL"}</span>
            </button>
          </div>

          {/* COUNCIL PROGRESS */}
          {(loading || reports.length > 0) && (
            <div style={styles.progressCard} className="fade-in">
              <h4 style={styles.progressTitle}>COUNCIL PROGRESS</h4>
              {steps.map((step, idx) => {
                const isDone = reports.some(r => r.role.toLowerCase().includes(step.id));
                const isCurrent = currentStatus === step.id && loading;
                
                return (
                  <div key={idx} style={styles.stepRow}>
                    <div style={styles.stepIconGroup}>
                      {isDone ? <CheckCircle2 size={20} color="#22c55e" /> : 
                       isCurrent ? <Loader2 size={20} color="#3b82f6" className="animate-spin" /> : 
                       <Circle size={20} color="#475569" />}
                      {idx < steps.length - 1 && <div style={{...styles.stepLine, backgroundColor: isDone ? '#22c55e' : '#475569'}} />}
                    </div>
                    <div style={styles.stepText}>
                      <div style={{...styles.stepLabel, color: isDone ? '#f8fafc' : isCurrent ? '#3b82f6' : '#64748b', display:'flex', alignItems:'center', gap:'8px'}}>
                        {step.icon} {step.label}
                      </div>
                      <div style={styles.stepRole}>{step.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REPORTS */}
        <div id="report-export-area" style={styles.rightCol}>
          {image && <div style={styles.imageHeader}><img src={image} style={styles.previewImg} alt="Patient Scan"/></div>}
          <div style={styles.reportList}>
            {reports.map((r, i) => {
              const isChairman = r.role.includes("Chairman");
              return (
                <div key={i} className="fade-in" style={{
                    ...styles.reportCard, 
                    borderLeft: isChairman ? "6px solid #eab308" : "6px solid #3b82f6", 
                    backgroundColor: isChairman ? '#1e1b0c' : '#1e293b'
                }}>
                  <div style={styles.cardHeader}>
                    <span style={{...styles.roleTag, color: isChairman ? '#eab308' : '#60a5fa'}}>
                        {r.role.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.markdownBody}><ReactMarkdown>{r.content}</ReactMarkdown></div>
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
  header: { maxWidth: '1200px', margin: '0 auto 40px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  logoBox: { backgroundColor: '#3b82f6', padding: '10px', borderRadius: '12px' },
  title: { fontSize: '1.8rem', fontWeight: '900', color: '#3b82f6', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.85rem', margin: 0 },
  layout: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px', maxWidth: '1200px', margin: '0 auto' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' },
  textarea: { width: '100%', height: '110px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: 'white', padding: '15px', marginBottom: '15px', resize: 'none' },
  label: { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', display: 'block' },
  uploadBox: { border: '2px dashed #334155', padding: '15px', borderRadius: '12px', textAlign: 'center', marginBottom: '10px' },
  button: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems:'center', cursor: 'pointer' },
  pdfBtn: { backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight:'bold' },
  progressCard: { backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' },
  progressTitle: { fontSize: '0.7rem', fontWeight: '800', color: '#64748b', letterSpacing: '1.5px', marginBottom: '20px' },
  stepRow: { display: 'flex', gap: '15px', minHeight: '60px' },
  stepIconGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  stepLine: { width: '2px', flexGrow: 1, margin: '4px 0' },
  stepText: { paddingTop: '0' },
  stepLabel: { fontSize: '0.9rem', fontWeight: '600' },
  stepRole: { fontSize: '0.7rem', color: '#64748b' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  imageHeader: { borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155' },
  previewImg: { width: '100%', display: 'block', maxHeight: '400px', objectFit: 'contain', backgroundColor: 'black' },
  reportCard: { padding: '30px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  cardHeader: { marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' },
  roleTag: { fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px' },
  markdownBody: { fontSize: '0.95rem', lineHeight: '1.7', color: '#cbd5e1' }
};