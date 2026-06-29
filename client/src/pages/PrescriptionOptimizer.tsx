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
  writtenName?: string;
  alternatives?: Array<{
    id: number;
    brandName: string;
    genericName: string;
    composition: string;
    brandPrice: number;
    genericPrice: number;
    savings: number;
    manufacturer: string;
  }>;
}

interface Summary {
  totalBrandedPrice: number;
  totalGenericPrice: number;
  totalSavings: number;
  savingsPercent: number;
}

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
      
      // Clear previous results/status, but DO NOT clear the file and previewUrl!
      setOcrStatus('');
      setOcrProgress(0);
      setExtractedText('');
      setMatchedMeds([]);
      setSummary(null);
      
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
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

  // Read file contents as Base64 helper
  const getBase64 = (fileToEncode: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileToEncode);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Execute client-side OCR scan fallback
  const runClientOcrFallback = async () => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    if (isPdf) {
      setOcrStatus('Local OCR only supports image files. For PDF support, please configure GEMINI_API_KEY in the server .env file.');
      setOcrProgress(0);
      return;
    }

    setOcrStatus('Initializing local OCR engine...');
    setOcrProgress(10);
    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`Extracting text locally: ${Math.round(m.progress * 100)}%`);
              setOcrProgress(Math.round(10 + m.progress * 60));
            }
          }
        }
      );
      const parsedText = result.data.text;
      setExtractedText(parsedText);
      setOcrStatus('Matching extracted text with database...');
      setOcrProgress(80);
      await runPrescriptionMatch(parsedText);
    } catch (ocrErr) {
      console.error(ocrErr);
      setOcrStatus('Failed to scan prescription image locally.');
      setOcrProgress(0);
    }
  };

  // Execute OCR scan on the uploaded image
  const processOCR = async () => {
    if (!file) return;
    setLoading(true);
    setOcrStatus('Uploading and analyzing prescription sheet with Gemini AI...');
    setOcrProgress(20);

    try {
      const base64Data = await getBase64(file);
      setOcrProgress(40);
      
      const response = await fetch('http://localhost:5000/api/optimize-prescription-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        })
      });

      setOcrProgress(70);
      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'GEMINI_API_KEY_MISSING') {
          console.warn('Gemini API key missing on backend. Falling back to local OCR...');
          setOcrStatus('Backend Gemini API key not found. Falling back to local OCR...');
          await runClientOcrFallback();
          return;
        }
        throw new Error(data.message || 'File optimization request failed');
      }

      setExtractedText(data.extractedText || '');
      setMatchedMeds(data.matchedMedicines || []);
      setSummary(data.summary || null);
      setOcrStatus('Prescription successfully analyzed with Gemini AI!');
      setOcrProgress(100);
    } catch (err: any) {
      console.error('AI upload/analysis failed, attempting client-side OCR fallback:', err);
      setOcrStatus('AI upload failed. Falling back to local OCR scanner...');
      await runClientOcrFallback();
    } finally {
      setLoading(false);
    }
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
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`${med.writtenName || med.brandName} (${med.composition})`, 15, y);
      doc.text(`₹${med.brandPrice.toFixed(2)}`, 150, y);
      y += 5.5;
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text('5 Recommended Generic Alternatives:', 18, y);
      y += 4.5;
      
      if (med.alternatives) {
        med.alternatives.forEach((alt, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text(`${idx + 1}. ${alt.brandName} (${alt.genericName}) - Mfr: ${alt.manufacturer}`, 22, y);
          doc.text(`₹${alt.genericPrice.toFixed(2)} (${alt.savings}% off)`, 160, y);
          y += 5;
        });
      }
      
      doc.setTextColor(0, 0, 0);
      y += 4;
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



      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Input Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card 1: Upload */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={20} color="var(--primary)" /> Upload Physical Sheet
            </h3>
            
            <label className="ocr-uploader">
              <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
              <FileText size={42} color="var(--text-muted)" className="pulse-button" style={{ padding: '4px' }} />
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Choose prescription sheet</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Supports PDF documents, PNG, JPG, JPEG captures</p>
              </div>
            </label>

            {previewUrl && (
              <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>File preview</span>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={resetStates}>Reset</button>
                </div>
                {file && (file.type === 'application/pdf' || file.name.endsWith('.pdf')) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#020617', color: 'var(--text-main)' }}>
                    <FileText size={48} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, wordBreak: 'break-all', textAlign: 'center' }}>{file.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</span>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Prescription preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#020617' }} />
                )}
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
              
              {/* Raw Extracted Text Box */}
              <div style={{
                padding: '0.85rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                <h4 style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}>
                  <FileText size={13} color="var(--primary)" /> Extracted Prescription Content (As Written)
                </h4>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.78rem', 
                  color: 'var(--text-main)', 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  lineHeight: '1.4'
                }}>
                  {extractedText}
                </pre>
              </div>

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

              {/* Matched Medicines list with 5 alternatives */}
              <div>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 700 }}>Optimized Generic Substitutes</h4>
                {matchedMeds.length === 0 ? (
                  <div style={{ padding: '1.5rem', background: 'rgba(248, 113, 113, 0.04)', border: '1px solid rgba(248, 113, 113, 0.15)', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ color: '#f87171', fontSize: '0.82rem', lineHeight: '1.4' }}>
                      Scanned prescription didn't match any preloaded brands or active chemicals. Verify names in the Digital Slate and re-submit.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                    {matchedMeds.map(med => {
                      return (
                        <div key={med.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '12px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {med.writtenName || med.brandName}
                                <span style={{ color: 'var(--danger)', fontSize: '0.76rem', marginLeft: '6px', fontWeight: 'normal', textDecoration: 'line-through' }}>₹{med.brandPrice.toFixed(2)}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Composition: {med.composition}</div>
                            </div>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                              {med.manufacturer}
                            </span>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              5 Certified Generic Alternatives
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {med.alternatives && med.alternatives.map((alt: any, altIdx: number) => {
                                return (
                                  <div key={alt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(13, 148, 136, 0.02)', border: '1px dashed rgba(13, 148, 136, 0.12)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.76rem' }}>
                                    <div style={{ minWidth: 0, flex: 1, paddingRight: '10px' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{altIdx + 1}. {alt.brandName}</span>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px', verticalAlign: 'bottom' }}>({alt.genericName})</span>
                                      <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Mfr: {alt.manufacturer}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                      <div style={{ fontWeight: 800, color: '#10b981' }}>₹{alt.genericPrice.toFixed(2)}</div>
                                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Save {alt.savings}%</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
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
