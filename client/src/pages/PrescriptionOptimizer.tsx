import React, { useState } from 'react';
import { Upload, FileText, Sparkles, Check, Download, Info, Clipboard, RefreshCw, Eye } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { jsPDF } from 'jspdf';
import QRPrescription from '../components/QRPrescription';

interface MatchedMed {
  id: number;
  brandName: string;
  genericName: string;
  composition: string;
  brandPrice: number;
  genericPrice: number;
  savings: number;
  manufacturer: string;
}

interface Summary {
  totalBrandedPrice: number;
  totalGenericPrice: number;
  totalSavings: number;
  savingsPercent: number;
}

const SAMPLE_PRESCRIPTIONS = [
  {
    title: "Symptom Complex A (Brand Names)",
    text: "Rx\nCrocin 650mg - 1 tab thrice daily\nAugmentin 625 Duo - 1 tab morning & night\nLipitor 10mg - 1 tab before bed\nQty: 10 each",
    description: "Contains popular Indian branded medicines (Crocin, Augmentin, Lipitor)"
  },
  {
    title: "Symptom Complex B (Generic Chemicals)",
    text: "Dr. Sharma's Clinic\nPatient: Self\n- Paracetamol 650mg tab\n- Metformin Hydrochloride 500mg\n- Atorvastatin 10mg\nTake as directed.",
    description: "Doctor-prescribed generic active chemical names (Paracetamol, Metformin, Atorvastatin)"
  },
  {
    title: "Symptom Complex C (Mixed & Asthma)",
    text: "Rx\nAsthalin Inhaler - 2 puffs as needed\nGlycomet 500mg - 1 tab after breakfast\nCrocin - 1 tab SOS\nStay hydrated.",
    description: "Combination of branded drugs and chronic management inhalers"
  }
];

function PrescriptionOptimizer() {
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [matchedMeds, setMatchedMeds] = useState<MatchedMed[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      resetStates();
    }
  };

  const resetStates = () => {
    setOcrStatus('');
    setOcrProgress(0);
    setExtractedText('');
    setMatchedMeds([]);
    setSummary(null);
    setFile(null);
    setPreviewUrl(null);
  };

  // Run matching request directly on the current text in the state
  const runPrescriptionMatch = async (textToMatch: string) => {
    if (!textToMatch.trim()) return;
    setLoading(true);
    setOcrStatus('Analyzing prescription with NLP matcher...');
    setOcrProgress(50);
    try {
      const matchResponse = await fetch('http://localhost:5000/api/parse-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textToMatch })
      });

      if (!matchResponse.ok) throw new Error('Matching request failed');
      const matchData = await matchResponse.json();

      setMatchedMeds(matchData.matchedMedicines);
      setSummary(matchData.summary);
      setOcrStatus('Prescription successfully analyzed!');
      setOcrProgress(100);
    } catch (err) {
      console.error(err);
      setOcrStatus('Error matching medicines. Please check if server is running.');
      setOcrProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // Execute OCR scan on the uploaded image
  const processOCR = async () => {
    if (!previewUrl) return;
    setLoading(true);
    setOcrStatus('Initializing OCR engine...');
    setOcrProgress(10);

    try {
      const result = await Tesseract.recognize(
        previewUrl,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`Extracting text from prescription image: ${Math.round(m.progress * 100)}%`);
              setOcrProgress(Math.round(10 + m.progress * 70));
            }
          }
        }
      );

      const parsedText = result.data.text;
      setExtractedText(parsedText);
      
      // Match the parsed text
      await runPrescriptionMatch(parsedText);
    } catch (err) {
      console.error(err);
      setOcrStatus('Error scanning prescription image.');
      setOcrProgress(0);
      setLoading(false);
    }
  };

  // Load a sample preset prescription and optimize instantly
  const loadPresetSample = async (sampleText: string) => {
    resetStates();
    setExtractedText(sampleText);
    await runPrescriptionMatch(sampleText);
  };

  const downloadPrescriptionReport = () => {
    if (!summary || matchedMeds.length === 0) return;
    const doc = new jsPDF();
    
    // Header banner
    doc.setFillColor(10, 15, 30);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(45, 212, 191); // Teal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('GENMED HUB SAVINGS REPORT', 15, 24);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('Smart Prescription Cost Optimization Portal', 15, 32);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 48);
    doc.line(15, 52, 195, 52);
    
    // Summary Banner Box
    doc.setFillColor(240, 253, 250);
    doc.rect(15, 58, 180, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text('ESTIMATED GENERIC SUBSTITUTE SAVINGS', 20, 66);
    doc.setFontSize(16);
    doc.text(`Save ₹${summary.totalSavings.toFixed(2)} (${summary.savingsPercent}%)`, 20, 76);
    
    // Details Grid Header
    doc.setTextColor(0,0,0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Prescribed Drug (Brand/Molecule)', 15, 95);
    doc.text('Generic Jan Aushadhi Alternative', 85, 95);
    doc.text('Brand Price', 150, 95);
    doc.text('Generic Price', 175, 95);
    doc.line(15, 97, 195, 97);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 105;
    
    matchedMeds.forEach(med => {
      doc.text(med.brandName, 15, y);
      doc.text(med.genericName, 85, y);
      doc.text(`₹${med.brandPrice.toFixed(2)}`, 150, y);
      doc.text(`₹${med.genericPrice.toFixed(2)}`, 175, y);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Composition: ${med.composition} (Save ${med.savings}%)`, 15, y + 5);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      y += 15;
    });
    
    doc.line(15, y, 195, y);
    y += 10;
    
    // Totals Box
    doc.setFont('helvetica', 'bold');
    doc.text('Total Branded Cost Baseline:', 110, y);
    doc.text(`₹${summary.totalBrandedPrice.toFixed(2)}`, 175, y);
    y += 8;
    doc.text('Total Generic Cost Alternative:', 110, y);
    doc.setTextColor(13, 148, 136);
    doc.text(`₹${summary.totalGenericPrice.toFixed(2)}`, 175, y);
    y += 8;
    doc.setTextColor(16, 185, 129);
    doc.text('Total Net Monthly Savings:', 110, y);
    doc.text(`₹${summary.totalSavings.toFixed(2)}`, 175, y);
    
    // Notes
    y += 20;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Disclaimer: Prescription analyzer matches parameters based on available databases. Consult physician before switching.', 15, y);
    
    doc.save('prescription_savings_report.pdf');
  };

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <h2 className="page-title">Prescription Cost Optimizer</h2>
        <p className="page-description">
          Upload a prescription photo or directly enter your prescription drugs below. Our NLP matching system will instantly find Jan Aushadhi alternatives and compile your savings index.
        </p>
      </div>

      {/* Preset Test Section */}
      <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, var(--bg-card) 100%)', border: '1px solid rgba(45, 212, 191, 0.15)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2dd4bf', marginBottom: '8px', fontWeight: 800 }}>
          <Sparkles size={18} className="pulse-button" />
          One-Click Demo: Try Sample Prescriptions
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          <strong>What is this?</strong> If you do not have a prescription photo on hand, you can click any of these pre-compiled medical sheets. It simulates the OCR text extraction process and instantly identifies the generic equivalents from the database!
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {SAMPLE_PRESCRIPTIONS.map((sample, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              onClick={() => loadPresetSample(sample.text)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '12px',
                borderRadius: '10px',
                height: 'auto',
                borderColor: 'var(--border-color)',
                background: 'var(--bg-card)'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clipboard size={14} color="var(--primary)" />
                {sample.title}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {sample.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Input Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card 1: Upload */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={20} color="var(--primary)" /> Upload Physical Sheet
            </h3>
            
            <label className="ocr-uploader">
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              <FileText size={42} color="var(--text-muted)" className="pulse-button" style={{ padding: '4px' }} />
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Choose prescription image</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Supports PNG, JPG, JPEG camera captures</p>
              </div>
            </label>

            {previewUrl && (
              <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>File preview</span>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={resetStates}>Reset</button>
                </div>
                <img src={previewUrl} alt="Prescription preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#020617' }} />
              </div>
            )}

            {previewUrl && !summary && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.5rem' }} 
                onClick={processOCR}
                disabled={loading}
              >
                <Sparkles size={18} />
                {loading ? 'Processing OCR...' : 'Run Scanner & Optimize'}
              </button>
            )}

            {ocrStatus && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{ocrStatus}</span>
                  <span style={{ fontWeight: 'bold' }}>{ocrProgress}%</span>
                </div>
                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: `${ocrProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Interactive Text Slate */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="var(--primary)" /> Digital Prescription Slate
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Type or paste medicine names directly (one per line) or modify extracted OCR results:
            </p>
            <textarea 
              value={extractedText} 
              onChange={(e) => setExtractedText(e.target.value)} 
              placeholder="Example:&#10;Crocin 650mg&#10;Atorvastatin 10mg&#10;Metformin"
              rows={6}
              className="search-input"
              style={{ 
                width: '100%', 
                padding: '0.85rem', 
                background: 'var(--bg-input)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                color: 'var(--text-main)', 
                fontFamily: 'monospace', 
                fontSize: '0.88rem', 
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
            <button 
              className="btn btn-secondary" 
              style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
              onClick={() => runPrescriptionMatch(extractedText)}
              disabled={loading || !extractedText.trim()}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Analyze & Optimize Slate
            </button>
          </div>

        </div>

        {/* Results Column */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--secondary)" /> Optimized Savings Results
          </h3>

          {!summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
              <Info size={44} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
              <h5 style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 700 }}>No active optimization summary</h5>
              <p style={{ fontSize: '0.78rem', marginTop: '0.25rem', maxWidth: '280px' }}>
                Upload an image or paste drug names in the Digital Slate and press Analyze.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Savings metrics banner */}
              <div style={{ 
                padding: '1.1rem', 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(45, 212, 191, 0.05) 100%)', 
                borderRadius: '12px', 
                border: '1px solid rgba(16, 185, 129, 0.25)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Savings Margin</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.15rem' }}>{summary.savingsPercent}% Saved</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Savings</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2dd4bf', marginTop: '0.15rem' }}>₹{summary.totalSavings.toFixed(0)}</div>
                </div>
              </div>

              {/* Matched Medicines list */}
              <div>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 700 }}>Matched Medicines Registry</h4>
                {matchedMeds.length === 0 ? (
                  <div style={{ padding: '1.5rem', background: 'rgba(248, 113, 113, 0.04)', border: '1px solid rgba(248, 113, 113, 0.15)', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ color: '#f87171', fontSize: '0.82rem', lineHeight: '1.4' }}>
                      Scanned prescription didn't match any preloaded brands or active chemicals. Verify names in the Digital Slate and re-submit.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                    {matchedMeds.map(med => {
                      const savingAmt = med.brandPrice - med.genericPrice;
                      return (
                        <div key={med.id} className="list-item-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {med.brandName}
                              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginLeft: '6px', fontWeight: 'normal' }}>₹{med.brandPrice}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Comp: {med.composition}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Eye size={12} /> Equivalent: {med.genericName} <strong style={{ color: '#2dd4bf' }}>₹{med.genericPrice}</strong>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>-{med.savings}%</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Save ₹{savingAmt.toFixed(0)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PDF Download & QR Share Buttons */}
              {matchedMeds.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                  <button className="btn btn-primary" onClick={downloadPrescriptionReport} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Download size={18} />
                    Download Optimization Report
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowQRModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#2dd4bf" />
                    Share QR Savings Summary
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {showQRModal && summary && (
        <QRPrescription
          medicines={matchedMeds}
          totalBranded={summary.totalBrandedPrice}
          totalGeneric={summary.totalGenericPrice}
          totalSavings={summary.totalSavings}
          savingsPercent={summary.savingsPercent}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}

export default PrescriptionOptimizer;
