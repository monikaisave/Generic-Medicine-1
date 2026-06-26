import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Bell, 
  MapPin, 
  Layers, 
  Scan, 
  FileText, 
  Activity, 
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Heart,
  Info,
  Shield
} from 'lucide-react';


interface OverviewDashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedMedicineId?: (id: number | null) => void;
}

interface Stats {
  totalMedicines: number;
  avgSavings: number;
  totalSavedWallet: number;
  activeRemindersCount: number;
}

const HEALTH_QUOTES = [
  "Generic medicines contain the exact same active pharmaceutical ingredients (API) as branded equivalents.",
  "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) provides quality generic medicines at 50% to 90% savings.",
  "Always consult your doctor to ensure generic drug compositions exactly match your prescribed brands.",
  "Drug schedules H and H1 are safety barriers. Always carry a signed prescription when buying those chemist formulas.",
  "Check pill counts regularly. Set custom dosage refill warnings to never miss a day of recovery."
];

const COMPARATIVE_MEDICINES = [
  { brand: "Crocin 650mg", generic: "Paracetamol", brandPrice: 32.0, genericPrice: 7.20, savings: 77.5, category: "Analgesics" },
  { brand: "Augmentin 625 Duo", generic: "Amoxicillin + Clavulanate", brandPrice: 201.50, genericPrice: 48.00, savings: 76.2, category: "Antibiotics" },
  { brand: "Glycomet 500mg", generic: "Metformin", brandPrice: 24.30, genericPrice: 5.50, savings: 77.3, category: "Antidiabetic" },
  { brand: "Lipitor 10mg", brandPrice: 185.00, generic: "Atorvastatin", genericPrice: 38.00, savings: 79.4, category: "Cardiology" },
  { brand: "Asthalin Inhaler", brandPrice: 165.00, generic: "Salbutamol", genericPrice: 42.00, savings: 74.5, category: "Respiratory" }
];

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ setActiveTab, setSelectedMedicineId }) => {
  const [stats, setStats] = useState<Stats>({
    totalMedicines: 520,
    avgSavings: 78,
    totalSavedWallet: 0,
    activeRemindersCount: 0
  });
  
  const [upcomingDose, setUpcomingDose] = useState<any>(null);
  const [radialOffset, setRadialOffset] = useState(251.2);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);
  const [calcCost, setCalcCost] = useState(1500); // Slider baseline expense in INR
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    // 1. Load LocalStorage Data
    const loadLocalStorageData = () => {
      let walletTotal = 0;
      try {
        const walletSaved = localStorage.getItem('genmed_wallet_purchases');
        if (walletSaved) {
          const purchases = JSON.parse(walletSaved);
          walletTotal = purchases.reduce((sum: number, p: any) => sum + (p.savings || 0), 0);
        }
      } catch (err) {
        console.error(err);
      }

      let remindersCount = 0;
      let nextDose: any = null;
      try {
        const remindersSaved = localStorage.getItem('genmed_reminders');
        if (remindersSaved) {
          const reminders = JSON.parse(remindersSaved);
          remindersCount = reminders.length;
          
          if (reminders.length > 0) {
            const lowStockMed = reminders.find((r: any) => r.currentStock <= r.threshold);
            if (lowStockMed) {
              nextDose = {
                name: lowStockMed.medicineName.split('(')[0],
                type: 'Low Stock Alert',
                desc: `${lowStockMed.currentStock} pills remaining. Refill soon!`,
                isAlert: true
              };
            } else {
              const r = reminders[0];
              nextDose = {
                name: r.medicineName.split('(')[0],
                type: `Scheduled Dose: ${r.times[0]}`,
                desc: `Patient: ${r.familyMember} | Dose: ${r.dosage}`,
                isAlert: false
              };
            }
          }
        }
      } catch (err) {
        console.error(err);
      }

      setStats(prev => ({
        ...prev,
        totalSavedWallet: walletTotal,
        activeRemindersCount: remindersCount
      }));
      setUpcomingDose(nextDose);
    };

    loadLocalStorageData();

    // 2. Trigger SVG gauge animation
    const timer = setTimeout(() => {
      const offset = 251.2 * (1 - 0.78);
      setRadialOffset(offset);
    }, 300);

    // 3. Quotes Interval Ticker
    const quotesInterval = setInterval(() => {
      setActiveQuoteIdx(prev => (prev + 1) % HEALTH_QUOTES.length);
    }, 5000);

    // 4. Comparison Carousel Auto Ticker
    const carouselInterval = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % COMPARATIVE_MEDICINES.length);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(quotesInterval);
      clearInterval(carouselInterval);
    };
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Math for instant calculator
  const estimatedGenericCost = calcCost * 0.22;
  const potentialSavings = calcCost - estimatedGenericCost;

  const quickLaunchers = [
    {
      id: 'substitute-scanner',
      title: 'Substitute Scanner',
      desc: 'Scan package barcodes instantly to discover chemically identical alternatives and save up to 80%.',
      icon: Scan,
      color: '#2dd4bf',
      bgGlow: 'rgba(45, 212, 191, 0.08)'
    },
    {
      id: 'prescription',
      title: 'Prescription Optimizer',
      desc: 'Upload doctor prescription copies, run browser OCR extraction, and download savings spreadsheets.',
      icon: FileText,
      color: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.08)'
    },
    {
      id: 'nearby-shops',
      title: 'Janaushadhi Locator',
      desc: 'Track coordinates to find nearby PMBJP Kendras and generic pharmacies sorted by geographic proximity.',
      icon: MapPin,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.08)'
    },
    {
      id: 'reminders',
      title: 'Dosage Scheduler',
      desc: 'Configure family medicine reminders, monitor remaining pill stocks, and trigger inventory alerts.',
      icon: Bell,
      color: '#fbbf24',
      bgGlow: 'rgba(251, 191, 36, 0.08)'
    }
  ];

  return (
    <div className="fade-in-section">
      
      {/* Dynamic Time Greeting Banner */}
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '200px',
        marginBottom: '2rem',
        border: '1px solid rgba(45, 212, 191, 0.15)',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <img
          src="/medicine_hero_banner.png"
          alt="Executive Health Dashboard banner"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35) contrast(1.15)' }}
        />
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to right, rgba(9, 15, 32, 0.95) 45%, rgba(9, 15, 32, 0.1))',
          padding: '1.75rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={15} color="#2dd4bf" className="pulse-button" style={{ borderRadius: '50%' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2dd4bf', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              GenMed Hub Corporate Portal
            </span>
          </div>
          <h2 style={{ fontSize: '1.95rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            {getGreeting()}, Monika
          </h2>
          
          {/* Quote interval container */}
          <div style={{ 
            height: '42px', 
            marginTop: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            borderLeft: '2px solid #2dd4bf',
            paddingLeft: '10px'
          }}>
            <Heart size={14} color="#f43f5e" className="pulse-button" />
            <p style={{ 
              color: '#cbd5e1', 
              fontSize: '0.84rem', 
              lineHeight: '1.4', 
              margin: 0,
              maxWidth: '680px',
              fontStyle: 'italic',
              transition: 'opacity 0.5s ease'
            }}>
              {HEALTH_QUOTES[activeQuoteIdx]}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="stat-container" style={{ marginBottom: '2rem' }}>
        
        {/* Wallet Cash Savings */}
        <div className="stat-card list-item-hover" style={{ borderLeft: '4px solid #34d399', background: 'rgba(52, 211, 153, 0.02)' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Total Pocket Savings</span>
            <div style={{ padding: '6px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '8px', color: '#34d399' }}>
              <Wallet size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#34d399' }}>₹{stats.totalSavedWallet.toFixed(0)}</span>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            Logged wallet transactions
          </div>
        </div>

        {/* Active Reminders */}
        <div className="stat-card list-item-hover" style={{ borderLeft: '4px solid #6366f1', background: 'rgba(99, 102, 241, 0.02)' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Family Schedules</span>
            <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', color: '#6366f1' }}>
              <Bell size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#6366f1' }}>{stats.activeRemindersCount}</span>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            Active patients reminders
          </div>
        </div>

        {/* Catalog Medicines */}
        <div className="stat-card list-item-hover" style={{ borderLeft: '4px solid #2dd4bf', background: 'rgba(45, 212, 191, 0.02)' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Verified Formulations</span>
            <div style={{ padding: '6px', background: 'rgba(45, 212, 191, 0.08)', borderRadius: '8px', color: '#2dd4bf' }}>
              <Layers size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#2dd4bf' }}>{stats.totalMedicines}+</span>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            Registered generic equivalents
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="stat-card list-item-hover" style={{ borderLeft: '4px solid #eab308', background: 'rgba(234, 179, 8, 0.02)' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">NLP Engine Status</span>
            <div style={{ padding: '6px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', color: '#eab308' }}>
              <Activity size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#eab308' }}>Online</span>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            Scanner matches active
          </div>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '1.75rem', alignItems: 'start', marginBottom: '2rem' }}>
        
        {/* Left Hand: Launcher & Slider Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Launcher */}
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <Activity size={18} color="#2dd4bf" /> Primary Healthcare Consoles
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {quickLaunchers.map(launch => {
                const Icon = launch.icon;
                return (
                  <div 
                    key={launch.id} 
                    className="card list-item-hover"
                    style={{
                      padding: '1.35rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '175px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)'
                    }}
                    onClick={() => setActiveTab(launch.id)}
                  >
                    <div>
                      <div style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '8px', 
                        background: launch.bgGlow, 
                        color: launch.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.85rem',
                        border: `1px solid rgba(${launch.color === '#2dd4bf' ? '45,212,191' : launch.color === '#6366f1' ? '99,102,241' : launch.color === '#10b981' ? '16,185,129' : '251,191,36'}, 0.15)`
                      }}>
                        <Icon size={18} />
                      </div>
                      <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                        {launch.title}
                      </h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.35' }}>
                        {launch.desc}
                      </p>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: launch.color, 
                      fontSize: '0.78rem', 
                      fontWeight: 700, 
                      marginTop: '1rem',
                      alignSelf: 'flex-start'
                    }}>
                      Deploy Screen <ArrowUpRight size={13} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Interactive Slider Savings Calculator Widget */}
          <div className="card" style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.04) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(45, 212, 191, 0.25)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, margin: 0 }}>
                <TrendingUp size={18} color="#2dd4bf" />
                Instant Cost Optimization Estimator
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#2dd4bf', background: 'rgba(45,212,191,0.08)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                PUBLIC WELFARE TOOL
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
              {/* Slider side */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  <span>Current Branded Expense / Month</span>
                  <strong style={{ color: 'var(--text-main)' }}>₹{calcCost}</strong>
                </div>
                <input 
                  type="range" 
                  min="200" 
                  max="10000" 
                  step="100"
                  value={calcCost} 
                  onChange={(e) => setCalcCost(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>₹200</span>
                  <span>₹5,000</span>
                  <span>₹10,000</span>
                </div>
              </div>

              {/* Outputs side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(248, 113, 113, 0.03)', border: '1px solid rgba(248, 113, 113, 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Generic Cost:</span>
                  <strong style={{ fontSize: '0.88rem', color: '#f87171' }}>₹{estimatedGenericCost.toFixed(0)}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Savings (Monthly):</span>
                  <strong style={{ fontSize: '1rem', color: '#34d399' }}>₹{potentialSavings.toFixed(0)}</strong>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255,255,255,0.01)', 
              padding: '8px 12px', 
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.02)'
            }}>
              <Info size={14} color="#2dd4bf" />
              <span>By switching your branded prescriptions to generic chemical formulations, you can retain roughly <strong>₹{(potentialSavings * 12).toFixed(0)} every year</strong>.</span>
            </div>
          </div>

        </div>

        {/* Right Hand: Visual Index Gauge & Comparative Carousel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Gauge card */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 800, alignSelf: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', width: '100%', textAlign: 'left', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} color="#2dd4bf" />
              National Savings Index
            </h4>

            {/* SVG Radial Dial */}
            <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
              <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" stroke="var(--border-color)" strokeWidth="8" fill="none" />
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="url(#overviewGradient)" 
                  strokeWidth="8" fill="none" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={radialOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
                <defs>
                  <linearGradient id="overviewGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 900, color: '#2dd4bf', lineHeight: '1' }}>78%</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>Avg. Savings</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1.25rem', lineHeight: '1.4' }}>
              Based on official NPPA ceiling price metrics across major therapeutic classes.
            </p>
          </div>

          {/* Comparative Carousel Ticker Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingDown size={16} color="#f87171" />
              Live Price Difference Carousel
            </h4>

            {/* Rotating Item Box */}
            <div className="animate-fade-in" style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-color)',
              padding: '12px 14px',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#2dd4bf', background: 'rgba(45,212,191,0.08)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  {COMPARATIVE_MEDICINES[carouselIdx].category}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#34d399', fontWeight: 700 }}>
                  Save {COMPARATIVE_MEDICINES[carouselIdx].savings}%
                </span>
              </div>

              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{COMPARATIVE_MEDICINES[carouselIdx].brand}</span>
                <span style={{ color: '#f87171' }}>₹{COMPARATIVE_MEDICINES[carouselIdx].brandPrice.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Chemical: <strong style={{ color: '#2dd4bf' }}>{COMPARATIVE_MEDICINES[carouselIdx].generic}</strong>
                </span>
                <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700 }}>
                  ₹{COMPARATIVE_MEDICINES[carouselIdx].genericPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
              {COMPARATIVE_MEDICINES.map((_, idx) => (
                <div 
                  key={idx} 
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: idx === carouselIdx ? '#2dd4bf' : 'var(--border-color)',
                    transition: 'background 0.3s'
                  }} 
                />
              ))}
            </div>
          </div>

          {/* Upcoming Schedule / Alerts Ticker */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={16} color="#6366f1" /> Daily Schedules & Alerts
            </h4>

            {upcomingDose ? (
              <div style={{ 
                background: upcomingDose.isAlert ? 'rgba(239, 68, 68, 0.04)' : 'rgba(99, 102, 241, 0.03)', 
                border: upcomingDose.isAlert ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(99, 102, 241, 0.1)',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer'
              }} onClick={() => setActiveTab('reminders')}>
                <div style={{ display: 'flex', justifyItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {upcomingDose.isAlert ? (
                    <ShieldAlert size={14} color="#ef4444" style={{ marginTop: '2px' }} />
                  ) : (
                    <Activity size={14} color="#6366f1" style={{ marginTop: '2px' }} />
                  )}
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: upcomingDose.isAlert ? '#ef4444' : '#6366f1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {upcomingDose.type}
                    </span>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', margin: '1px 0 0 0' }}>
                      {upcomingDose.name}
                    </h5>
                  </div>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, paddingLeft: '22px' }}>
                  {upcomingDose.desc}
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.78rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                No active dosage schedules set today. Click to add.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Official Datasets & Price Reference Attribution */}
      <div className="card" style={{ 
        marginTop: '2rem', 
        padding: '1.25rem', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(13, 148, 136, 0.03) 100%)',
        border: '1px solid rgba(45, 212, 191, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#2dd4bf" />
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>Official Data Sourcing & Verification</h4>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
          This portal integrates healthcare datasets and pricing models sourced from official Indian regulatory registries and clinical references. You can verify and access the raw datasets directly:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
          <a href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            PMBJP Product & Price List (janaushadhi.gov.in) ↗
          </a>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <a href="http://www.nppaindia.nic.in" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            NPPA Price Registry (nppaindia.nic.in) ↗
          </a>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <a href="https://www.1mg.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            Tata 1mg Clinical Info (1mg.com) ↗
          </a>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <a href="https://medlineplus.gov" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            MedlinePlus Medicine Info (medlineplus.gov) ↗
          </a>
        </div>
      </div>

    </div>
  );
};

export default OverviewDashboard;
