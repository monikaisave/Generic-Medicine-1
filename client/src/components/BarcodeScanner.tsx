import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Sparkles, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  // Simulated barcodes of popular drugs in our 500+ database for quick testing
  const mockBarcodes = [
    { label: "Crocin 650mg", code: "8901234567890" },
    { label: "Augmentin 625 Duo", code: "8909876543210" },
    { label: "Glycomet 500mg", code: "8901112223334" },
    { label: "Lipitor 10mg", code: "8904445556667" },
    { label: "Asthalin Inhaler", code: "8907778889990" },
  ];

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    // We must initialize the Html5Qrcode instance inside useEffect so the DOM node "reader" exists
    try {
      html5QrCode = new Html5Qrcode("reader");
      qrCodeRef.current = html5QrCode;

      const startScanning = async () => {
        if (!html5QrCode) return;
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (width, height) => {
                // Return responsive box dimensions
                const minSide = Math.min(width, height);
                const size = Math.floor(minSide * 0.7);
                return { width: size, height: Math.floor(size * 0.6) };
              }
            },
            (decodedText) => {
              // Successfully decoded code!
              stopScanner().then(() => {
                onScanSuccess(decodedText);
              });
            },
            (err) => {
              // Ignore spammy scanner warnings
            }
          );
        } catch (err: any) {
          console.warn("Webcam access failed or denied. Falling back to simulator.", err);
          setHasCamera(false);
          setErrorMessage(err?.message || "Webcam access error");
        }
      };

      // Slight timeout to let DOM render "reader" div
      const timer = setTimeout(startScanning, 300);
      return () => {
        clearTimeout(timer);
      };

    } catch (e: any) {
      console.error("Html5Qrcode init error", e);
      setHasCamera(false);
    }

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      }
    }
  };

  const handleSimulatedScan = (code: string) => {
    stopScanner().then(() => {
      onScanSuccess(code);
    });
  };

  const handleManualClose = () => {
    stopScanner().then(() => {
      onClose();
    });
  };

  return (
    <div className="barcode-scanner-modal" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(9, 13, 22, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      padding: '20px'
    }}>
      <div className="card animate-fade-in" style={{
        maxWidth: '500px',
        width: '100%',
        background: '#0a0f1d',
        border: '1px solid rgba(13, 148, 136, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2dd4bf', fontSize: '1.15rem', fontWeight: 800 }}>
            <Camera size={20} className="pulse-button" style={{ borderRadius: '50%', padding: '2px' }} />
            Barcode Scan Chamber
          </h3>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }} onClick={handleManualClose}>
            Exit Scanner
          </button>
        </div>

        {/* Video Scanner Element */}
        <div style={{ 
          position: 'relative', 
          overflow: 'hidden', 
          borderRadius: '12px', 
          minHeight: '260px', 
          background: '#020617', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {hasCamera ? (
            <div id="reader" style={{ width: '100%', height: '100%', minHeight: '260px' }}></div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <CameraOff size={40} color="#f87171" style={{ marginBottom: '10px' }} />
              <h5 style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>Camera Offline</h5>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4', maxWidth: '300px' }}>
                Webcam is denied or not supported. Using simulation fallback mode.
              </p>
            </div>
          )}

          {/* Scanning Line overlay */}
          {hasCamera && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: '140px',
              border: '2px dashed rgba(45, 212, 191, 0.4)',
              borderRadius: '8px',
              pointerEvents: 'none',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '95%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #2dd4bf, transparent)',
                boxShadow: '0 0 10px #2dd4bf',
                position: 'absolute',
                animation: 'scannerBarAnim 2.5s infinite ease-in-out'
              }} />
            </div>
          )}
        </div>

        {/* Quick Test Simulator Grid */}
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <Sparkles size={15} color="#eab308" />
            Quick-Scan Simulator
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '10px' }}>
            No physical medicine strip nearby? Click a preset below to mock the barcode reading:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {mockBarcodes.map(bar => (
              <button
                key={bar.code}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  padding: '10px',
                  justifyContent: 'space-between',
                  display: 'flex',
                  borderRadius: '10px',
                  borderColor: 'rgba(13, 148, 136, 0.15)'
                }}
                onClick={() => handleSimulatedScan(bar.code)}
              >
                <span style={{ fontWeight: 600 }}>{bar.label}</span>
                <span style={{ fontSize: '0.7rem', color: '#2dd4bf', background: 'rgba(45, 212, 191, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                  {bar.code.slice(-4)}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes scannerBarAnim {
          0% { transform: translateY(-60px); }
          50% { transform: translateY(60px); }
          100% { transform: translateY(-60px); }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
