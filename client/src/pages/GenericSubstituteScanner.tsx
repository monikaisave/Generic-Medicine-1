import React, { useState, useEffect } from 'react';
import { Scan, Search, ArrowRight, ShieldCheck, Sparkles, MapPin, CheckCircle, Percent, AlertCircle } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';

interface Medicine {
  id: number;
  brandName: string;
  genericName: string;
  composition: string;
  brandPrice: number;
  genericPrice: number;
  savings: number;
  manufacturer: string;
  category: string;
  dosage: string;
  availability: string;
  schedule: string;
  sideEffects: string[];
  contraindications: string[];
  barcode: string;
  details?: string;
}


interface GenericSubstituteScannerProps {
  setActiveTab: (tab: string) => void;
  setSelectedMedicineId?: (id: number) => void;
}

const GenericSubstituteScanner: React.FC<GenericSubstituteScannerProps> = ({ setActiveTab, setSelectedMedicineId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [quantity, setQuantity] = useState(30); // Monthly pill intake
  const [loading, setLoading] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Popular mock barcode scans in the 520+ database
  const popularScans = [
    { label: 'Crocin 650mg', code: '8901234567890' },
    { label: 'Augmentin 625 Duo', code: '8909876543210' },
    { label: 'Glycomet 500mg', code: '8901112223334' },
    { label: 'Lipitor 10mg', code: '8904445556667' },
    { label: 'Asthalin Inhaler', code: '8907778889990' },
  ];

  // Handle autocomplete search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/medicines?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Failed to search medicines', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Simulate scanning action
  const handleBarcodeScan = async (code: string) => {
    setIsScanning(true);
    setLoading(true);
    
    // Simulate scan sound and laser pass
    setTimeout(async () => {
      setScanFlash(true);
      setIsScanning(false);
      
      try {
        const res = await fetch(`http://localhost:5000/api/medicines?query=${code}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setSelectedMed(data[0]);
          setSearchQuery('');
          setSearchResults([]);
        } else {
          alert('Barcode not recognized. Try another one.');
        }
      } catch (err) {
        console.error('Scan API error', err);
      } finally {
        setLoading(false);
        setTimeout(() => setScanFlash(false), 400);
      }
    }, 1500);
  };

  const handleSelectMed = (med: Medicine) => {
    setSelectedMed(med);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Calculations
  const brandPriceUnit = selectedMed ? selectedMed.brandPrice / 10 : 0; // assumes strip of 10
  const genericPriceUnit = selectedMed ? selectedMed.genericPrice / 10 : 0;
  const unitSavings = brandPriceUnit - genericPriceUnit;
  
  const monthlySavings = unitSavings * quantity;
  const annualSavings = monthlySavings * 12;
  const pctSaved = selectedMed ? Math.round(((selectedMed.brandPrice - selectedMed.genericPrice) / selectedMed.brandPrice) * 100) : 0;

  return (
    <div className="fade-in-section">
      <div className="page-header">
        <h2 className="page-title">Generic Substitute Scanner</h2>
        <p className="page-description">
          Align package barcode or search names to instantly compare costs, check availability, and calculate direct pocket savings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Scanner & Search Interface */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Interactive Mock Scanner Card */}
          <div className="card" style={{ padding: '2rem', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
            <h3 className="card-title" style={{ color: '#2dd4bf' }}>
              <Scan size={20} />
              Interactive Barcode Scanner
            </h3>
            
            <div style={{
              height: '240px',
              background: '#090d16',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: scanFlash ? '3px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'border 0.25s ease',
              boxShadow: scanFlash ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none'
            }}>
              
              {/* Scan flash overlay */}
              {scanFlash && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  zIndex: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: '1.2rem',
                  letterSpacing: '0.1em'
                }}>
                  SCAN SUCCESSFUL!
                </div>
              )}

              {isScanning ? (
                <>
                  {/* Glowing Laser Scan Line */}
                  <div style={{
                    width: '100%',
                    height: '3px',
                    backgroundColor: '#ef4444',
                    position: 'absolute',
                    top: 0,
                    boxShadow: '0 0 12px #ef4444',
                    zIndex: 2,
                    animation: 'laserAnim 1.5s linear infinite'
                  }} />
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ fontWeight: 600, color: '#ef4444', letterSpacing: '0.05em', animation: 'blinkText 1s infinite' }}>ALIGNING MEDICINE BARCODE...</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Keep packaging steady</p>
                  </div>
                </>
              ) : loading ? (
                <div style={{ textAlign: 'center', color: '#2dd4bf' }}>
                  <p>Fetching drug match...</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Scan size={36} color="#2dd4bf" className="pulse-button" style={{ opacity: 0.8, marginBottom: '10px' }} />
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Webcam Scanner Available</p>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '4px 0 12px 0', maxWidth: '240px', lineHeight: '1.4' }}>
                    Scan real barcodes on medicine strips using your device camera, or use presets below:
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setShowCameraScanner(true)}
                  >
                    <Scan size={13} />
                    Start Camera Scanner
                  </button>
                </div>
              )}

              {/* Viewfinder brackets */}
              <div style={{
                position: 'absolute',
                width: '200px',
                height: '100px',
                border: '2px solid rgba(45, 212, 191, 0.3)',
                borderRadius: '8px',
                pointerEvents: 'none'
              }} />
            </div>

            {/* Simulated Barcodes Grid */}
            <div style={{ marginTop: '1.5rem' }}>
              <span className="sidebar-section-title" style={{ margin: '0 0 8px 0', display: 'block' }}>SIMULATE BARCODE SCANNING</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {popularScans.map(scan => (
                  <button
                    key={scan.code}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                    onClick={() => handleBarcodeScan(scan.code)}
                    disabled={isScanning || loading}
                  >
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{scan.label}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>Code: {scan.code.slice(-4)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Fallback Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', color: '#cbd5e1' }}>
              <Search size={18} /> Or Search Medicine Manually
            </h3>
            
            <div className="search-wrapper" style={{ margin: '8px 0 0 0' }}>
              <input
                type="text"
                className="search-input"
                style={{ padding: '0.8rem 1rem 0.8rem 2.8rem' }}
                placeholder="Search branded medicine..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults.length > 0) {
                    handleSelectMed(searchResults[0]);
                  }
                }}
              />
              <Search size={16} className="search-icon-inside" />
              
              {/* Autocomplete dropdown */}
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%', left: 0, right: 0,
                  background: '#0e1628',
                  border: '1px solid rgba(45, 212, 191, 0.3)',
                  borderRadius: '8px',
                  zIndex: 20,
                  marginTop: '4px',
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {searchResults.map(med => (
                    <div
                      key={med.id}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onClick={() => handleSelectMed(med)}
                      className="nav-item-hover-override"
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{med.brandName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '8px' }}>({med.category})</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Save {med.savings}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Scan Results Dashboard */}
        <div style={{ minHeight: '400px' }}>
          {selectedMed ? (
            <div className="card fade-in-section" style={{
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(10, 15, 30, 0.85))',
              border: '1px solid rgba(13, 148, 136, 0.25)',
              padding: '2rem'
            }}>
              
              {/* Header Title with brand and category */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#2dd4bf', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                    {selectedMed.category} | {selectedMed.schedule}
                  </div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {selectedMed.brandName}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '2px' }}>
                    by {selectedMed.manufacturer}
                  </p>
                </div>
                
                {/* Savings Badge */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '30px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#34d399',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  <Percent size={14} />
                  {pctSaved}% SAVED
                </div>
              </div>

              {/* Side by Side Cost Comparisons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                
                {/* Brand Card */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '10px',
                  padding: '1rem',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branded Medicine</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
                    ₹{selectedMed.brandPrice.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    Per strip of 10 tablets
                  </div>
                </div>

                {/* Generic Card */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '10px',
                  padding: '1rem',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generic Equivalent</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                    ₹{selectedMed.genericPrice.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    Per strip of 10 tablets
                  </div>
                </div>
              </div>

              {/* Active Composition info */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>CHEMICAL COMPOSITION</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>{selectedMed.composition}</span>
              </div>

              {/* Complete details panel */}
              <div style={{ 
                padding: '1.25rem', 
                background: 'rgba(0,0,0,0.18)', 
                borderRadius: '10px', 
                border: '1px solid var(--border-color)', 
                marginBottom: '1.5rem', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1.25rem' 
              }}>
                <div>
                  <h5 style={{ color: '#f8fafc', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    Dosage & Description
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <p><strong>Dosage Form:</strong> {selectedMed.dosage || 'Tablet'}</p>
                    <p><strong>Schedule:</strong> {selectedMed.schedule || 'OTC'}</p>
                    <p style={{ marginTop: '4px', lineHeight: '1.4' }}>{selectedMed.details}</p>
                  </div>
                </div>
                <div>
                  <h5 style={{ color: '#f8fafc', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    Side Effects & Warnings
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <p><strong>Side Effects:</strong> {selectedMed.sideEffects && selectedMed.sideEffects.length > 0 ? selectedMed.sideEffects.join(', ') : 'Mild nausea, headaches'}</p>
                    <p style={{ marginTop: '4px' }}><strong>Contraindications:</strong> {selectedMed.contraindications && selectedMed.contraindications.length > 0 ? selectedMed.contraindications.join(', ') : 'None reported'}</p>
                  </div>
                </div>
              </div>

              {/* Monthly consumption calculator slider */}
              <div style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Monthly Prescription Volume</span>
                  <span style={{ fontSize: '0.95rem', color: '#6366f1', fontWeight: 700 }}>{quantity} pills/units</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  className="range-slider"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>5 Units (Minimum)</span>
                  <span>120 Units (High Dosage)</span>
                </div>
              </div>

              {/* Financial Savings Metrics Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Savings</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2dd4bf', marginTop: '4px' }}>
                    ₹{monthlySavings.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Annualized Cash Savings</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    ₹{annualSavings.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Availability, Schedule and Stock Warnings */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedMed.availability === 'Available' ? (
                    <>
                      <CheckCircle size={16} color="#34d399" />
                      <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>Stock Available Nearby</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} color="#fbbf24" />
                      <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>Low Stock / Restocking</span>
                    </>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => {
                    if (setSelectedMedicineId) {
                      setSelectedMedicineId(selectedMed.id);
                    }
                    setActiveTab('nearby-shops');
                  }}
                >
                  <MapPin size={14} /> Find Nearest Store
                </button>
              </div>

              {/* Aesthetic premium generic box render */}
              <div style={{ position: 'relative', marginTop: '1.5rem', borderRadius: '12px', overflow: 'hidden', height: '100px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <img
                  src="/generic_medicine_box.png"
                  alt="Generic Medicine Box Illustration"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to right, rgba(15,23,42,0.9), transparent)',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#2dd4bf', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>JANAUSHADHI SCHEME</span>
                  <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>Buy Chemically Identical Generics Legal & Safe</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="card" style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <Scan size={48} color="#94a3b8" style={{ marginBottom: '15px', opacity: 0.5 }} />
              <h4 style={{ color: '#cbd5e1', marginBottom: '8px' }}>Waiting for Medicine Scan</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '300px' }}>
                Align the barcode packaging in the viewfinder simulator on the left, or search for the branded drug name.
              </p>
            </div>
          )}
        </div>
      </div>

      {showCameraScanner && (
        <BarcodeScanner
          onScanSuccess={(code) => {
            setShowCameraScanner(false);
            handleBarcodeScan(code);
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      <style>{`
        @keyframes laserAnim {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes blinkText {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .nav-item-hover-override:hover {
          background: rgba(45, 212, 191, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default GenericSubstituteScanner;
