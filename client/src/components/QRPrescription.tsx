import React, { useRef } from 'react';
import { QrCode, Download, Share2, Printer, X } from 'lucide-react';

interface MedicineListItem {
  brandName: string;
  genericName: string;
  brandPrice: number;
  genericPrice: number;
  savings: number;
}

interface QRPrescriptionProps {
  medicines: MedicineListItem[];
  totalBranded: number;
  totalGeneric: number;
  totalSavings: number;
  savingsPercent: number;
  onClose: () => void;
}

const QRPrescription: React.FC<QRPrescriptionProps> = ({
  medicines,
  totalBranded,
  totalGeneric,
  totalSavings,
  savingsPercent,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  // Formulate data string for QR code
  const prescriptionSummaryString = `GENMED prescription optimizer summary:
--------------------
Items:
${medicines.map((m, idx) => `${idx + 1}. ${m.brandName} -> Switch to ${m.genericName}`).join('\n')}
--------------------
Total Branded: INR ${totalBranded}
Total Generic: INR ${totalGeneric}
Estimated Direct Savings: INR ${totalSavings} (${savingsPercent}%)
Scan with PMBJP Kendra pharmacist.`;

  // Encode text for Google QR charts API or qrserver.com
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(prescriptionSummaryString)}`;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
    
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Optimized Generic Prescription Report</title>
            <style>
              body { font-family: 'Arial', sans-serif; padding: 20px; color: #1a202c; }
              .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #0d9488; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
              .table th { background-color: #f7fafc; }
              .summary { font-size: 16px; font-weight: bold; margin-top: 20px; text-align: right; }
              .qr-box { text-align: center; margin-top: 30px; }
              .qr-img { width: 180px; height: 180px; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '520px',
        width: '100%',
        background: '#0f172a',
        border: '1px solid rgba(13, 148, 136, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2dd4bf', margin: 0 }}>
            <QrCode size={22} />
            Generic Prescription Card
          </h3>
          <button className="btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Section */}
        <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="header" style={{ display: 'none' }}>
            <span className="logo">GenMed Hub — Optimized Generic Prescription</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={qrUrl} alt="Prescription QR Code" className="qr-img" style={{ width: '180px', height: '180px' }} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ color: '#2dd4bf', marginBottom: '5px' }}>Scan & Share</h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Show this QR code to any local Pradhan Mantri Jan Aushadhi (PMBJP) store pharmacist to instantly load your optimized generic alternatives.
              </p>
            </div>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '10px', fontSize: '0.95rem' }}>Optimized Medicines List</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {medicines.map((med, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                  <div>
                    <span style={{ color: '#ef4444', textDecoration: 'line-through', marginRight: '6px' }}>{med.brandName}</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>→ {med.genericName}</span>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>₹{med.genericPrice}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem', fontWeight: 700 }}>
              <span style={{ color: '#94a3b8' }}>Total Direct Savings:</span>
              <span style={{ color: '#10b981' }}>₹{totalSavings} ({savingsPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={handlePrint} style={{ gap: '6px' }}>
            <Printer size={16} />
            Print Report
          </button>
          <a href={qrUrl} download="generic_prescription_qr.png" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Download size={16} />
            Save QR Image
          </a>
        </div>
      </div>
    </div>
  );
};

export default QRPrescription;
