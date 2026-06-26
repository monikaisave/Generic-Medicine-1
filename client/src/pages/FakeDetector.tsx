import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Award, FileText, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface FakeReport {
  batchNumber: string;
  riskScore: number;
  riskLevel: string;
  factors: string[];
  recommendations: string[];
  safetyCert: string;
}

function FakeDetector() {
  const [batchNum, setBatchNum] = useState('');
  const [mfr, setMfr] = useState('');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<FakeReport | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNum) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/fake-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: batchNum,
          manufacturer: mfr,
          brandName: brand
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === 'High Risk') return '#ef4444';
    if (level === 'Medium Risk') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Fake Medicine Verification Portal</h2>
        <p className="page-description">
          Enter retail medicine batch details, packaging manufacturer names, and barcode numbers to run cross-validation checks on regulatory compliance patterns and print a verified certificate.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Verification inputs card */}
        <div className="card">
          <h3 className="card-title" style={{ color: '#2dd4bf' }}><ShieldCheck size={20} /> Batch Verification Form</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch Number (Printed on strip/carton) *</label>
              <input
                type="text"
                className="search-input"
                style={{ height: '40px', padding: '10px' }}
                value={batchNum}
                onChange={e => setBatchNum(e.target.value)}
                placeholder="e.g. B24001, B-M2314"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manufacturer Name (Optional)</label>
              <input
                type="text"
                className="search-input"
                style={{ height: '40px', padding: '10px' }}
                value={mfr}
                onChange={e => setMfr(e.target.value)}
                placeholder="e.g. Cipla, Lupin, Mankind"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Brand Name (Optional)</label>
              <input
                type="text"
                className="search-input"
                style={{ height: '40px', padding: '10px' }}
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Dolo 650"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '5px' }}>
              {loading ? 'Analyzing batch compliance...' : 'Analyze Batch Safety'}
            </button>
          </form>
        </div>

        {/* Audit results report card */}
        <div className="card">
          <h3 className="card-title" style={{ color: '#cbd5e1' }}><Award size={20} /> Verification Report</h3>

          {!report ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '260px', color: 'var(--text-muted)', textAlign: 'center' }}>
              <HelpCircle size={44} color="var(--border-color)" style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '0.9rem' }}>No batch details scanned yet.</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Submit the form on the left to run safety checks.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Risk Level Badge */}
              <div style={{
                padding: '12px 16px',
                background: `${getRiskColor(report.riskLevel)}15`,
                border: `1px solid ${getRiskColor(report.riskLevel)}40`,
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VERIFICATION STATUS:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getRiskColor(report.riskLevel) }}>
                    {report.riskLevel}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FRAUD RISK INDEX:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getRiskColor(report.riskLevel) }}>
                    {report.riskScore}%
                  </div>
                </div>
              </div>

              {/* Verified Certificate indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <CheckCircle size={16} color="#10b981" />
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Certificate: <strong>{report.safetyCert}</strong>
                </span>
              </div>

              {/* Factors */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Compliance Factor Logs:</h4>
                <ul style={{ paddingLeft: '15px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {report.factors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>

              {/* Safety Steps */}
              <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#f8fafc', marginBottom: '6px' }}>Recommended Safety Steps:</h4>
                <ul style={{ paddingLeft: '15px', fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {report.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Safety Guidelines */}
      <div className="card">
        <h3 className="card-title" style={{ color: '#2dd4bf' }}><FileText size={20} /> Visual Packaging Inspection Checklist</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
          Follow these guidelines to confirm authenticity when purchasing retail medicines:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', marginBottom: '4px' }}>1. Holographic Seals</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Most premium brand drug strips feature color-shifting security holograms. Inspect closely to verify there are no peeling edges.
            </p>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', marginBottom: '4px' }}>2. Text Typography</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Check for spelling errors, blurred text, or inconsistent fonts. Legitimate manufacturers run rigorous visual QC printing.
            </p>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', marginBottom: '4px' }}>3. Expiry and Batch Code</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Confirm that the batch code, manufacture date, and expiry date printed on the foil strip match the outer cardboard container.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FakeDetector;
