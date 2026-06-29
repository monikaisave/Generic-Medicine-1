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
  Shield,
  Calculator,
  CloudLightning
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

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

interface CategorySavings {
  name: string;
  percentage: number;
  brandedExample: string;
  genericExample: string;
}

const THERAPEUTIC_CATEGORIES: CategorySavings[] = [
  { name: "Cardiology", percentage: 0.79, brandedExample: "Lipitor 10mg (₹185)", genericExample: "Atorvastatin (₹38)" },
  { name: "Diabetology", percentage: 0.77, brandedExample: "Glycomet 500mg (₹24.30)", genericExample: "Metformin (₹5.50)" },
  { name: "Antibiotics", percentage: 0.76, brandedExample: "Augmentin 625 Duo (₹201.50)", genericExample: "Amoxicillin + Clavulanate (₹48)" },
  { name: "Analgesics", percentage: 0.78, brandedExample: "Crocin 650mg (₹32)", genericExample: "Paracetamol (₹7.20)" },
  { name: "Respiratory", percentage: 0.75, brandedExample: "Asthalin Inhaler (₹165)", genericExample: "Salbutamol (₹42)" }
];

const COMMUNITY_ACTIVITIES_POOL = [
  { name: "Rahul S. (Delhi)", action: "saved ₹1,420 on Atorvastatin alternative", icon: "wallet", color: "#10b981" },
  { name: "Dr. Gupta (Mumbai)", action: "approved 3 generic equivalents", icon: "check", color: "#0d9488" },
  { name: "Kendra #412 (Kolkata)", action: "updated medicine stock levels", icon: "box", color: "#fbbf24" },
  { name: "OCR Parser Engine", action: "processed prescription in 0.65s", icon: "cpu", color: "#6366f1" },
  { name: "Priya M. (Bangalore)", action: "saved 82% (₹840) on Pain Relievers", icon: "heart", color: "#f43f5e" },
  { name: "Janaushadhi Locator", action: "mapped 14 pharmacies in radius", icon: "map", color: "#06b6d4" },
  { name: "Ananya K. (Chennai)", action: "added daily reminder for Paracetamol", icon: "bell", color: "#a855f7" }
];

const getSparklinePath = (data: any[], width: number, height: number) => {
  if (data.length < 2) return null;
  const values = data.map(d => d.savings);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.savings - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
    const cpY1 = points[i - 1].y;
    const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
    const cpY2 = points[i].y;
    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
  }
  
  const linePath = path;
  const fillPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return { linePath, fillPath, lastPoint: points[points.length - 1] };
};

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
  const [calcCost, setCalcCost] = useState(1800); // Slider baseline expense in INR
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('light');
  
  // Real-time states
  const [activities, setActivities] = useState<any[]>([]);
  const [savingsHistory, setSavingsHistory] = useState<any[]>([]);

  // MutationObserver to track theme transitions
  useEffect(() => {
    const themeAttr = document.documentElement.getAttribute('data-theme');
    if (themeAttr) setCurrentTheme(themeAttr);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          if (newTheme) setCurrentTheme(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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

  // Real-time Community Activities & Savings Sparkline simulation
  useEffect(() => {
    // Populate initial sparkline data
    const now = new Date();
    const initialData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getTime() - (12 - i) * 60000 * 2);
      return {
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        savings: Math.round(38400 + i * 145 + Math.random() * 95)
      };
    });
    setSavingsHistory(initialData);

    // Populate initial activities
    const initialActivities = COMMUNITY_ACTIVITIES_POOL.slice(0, 4).map((act, idx) => ({
      ...act,
      id: idx,
      time: `${idx * 2 + 1}m ago`
    }));
    setActivities(initialActivities);

    // Dynamic ticker & graph update interval
    const updateInterval = setInterval(() => {
      // 1. Update cumulative savings chart
      setSavingsHistory(prev => {
        const lastValue = prev[prev.length - 1].savings;
        const newValue = lastValue + 60 + Math.round(Math.random() * 110);
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return [...prev.slice(1), { time: nextTime, savings: newValue }];
      });

      // 2. Prepend a new random activity
      const randomActivity = COMMUNITY_ACTIVITIES_POOL[Math.floor(Math.random() * COMMUNITY_ACTIVITIES_POOL.length)];
      const newAct = {
        ...randomActivity,
        id: Date.now(),
        time: "Just now"
      };

      setActivities(prev => {
        const updatedPrev = prev.map(item => {
          if (item.time === "Just now") return { ...item, time: "1m ago" };
          if (item.time === "1m ago") return { ...item, time: "3m ago" };
          if (item.time === "3m ago") return { ...item, time: "5m ago" };
          return item;
        });
        return [newAct, ...updatedPrev.slice(0, 3)];
      });
    }, 4000);

    return () => clearInterval(updateInterval);
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingIcon = () => {
    const hr = new Date().getHours();
    if (hr < 12) return '🌅';
    if (hr < 17) return '☀️';
    return '🌙';
  };

  // Math for instant calculator
  const activeCategory = THERAPEUTIC_CATEGORIES[selectedCategoryIdx];
  const savingsPct = activeCategory.percentage;
  const estimatedGenericCost = calcCost * (1 - savingsPct);
  const potentialSavings = calcCost - estimatedGenericCost;
  const annualSavings = potentialSavings * 12;

  const getSavingsEquivalent = (annualSavingsVal: number) => {
    if (annualSavingsVal < 4000) {
      return {
        text: "Equivalent to 3 months of milk refills 🥛 or 1 doctor checkup 🩺",
        badge: "Essential Cover"
      };
    } else if (annualSavingsVal < 9000) {
      return {
        text: "Equivalent to a full wellness body checkup 🩺 or 6 months of gym membership 🏋️",
        badge: "Wellness Care"
      };
    } else if (annualSavingsVal < 18000) {
      return {
        text: "Equivalent to 1 year of high-speed broadband 🌐 or 4 specialist consultations 👨‍⚕️",
        badge: "Utility & Care"
      };
    } else if (annualSavingsVal < 30000) {
      return {
        text: "Equivalent to a premium annual family health insurance cover 🛡️ or a sleek tablet 📱",
        badge: "Family Insurance"
      };
    } else {
      return {
        text: "Equivalent to a weekend wellness retreat getaway ✈️ or a complete home health setup 🏡",
        badge: "Premium Wellness"
      };
    }
  };

  const currentEquiv = getSavingsEquivalent(annualSavings);

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'wallet': return <Wallet size={15} />;
      case 'check': return <Shield size={15} />;
      case 'box': return <Layers size={15} />;
      case 'cpu': return <Activity size={15} />;
      case 'heart': return <Heart size={15} />;
      case 'map': return <MapPin size={15} />;
      case 'bell': return <Bell size={15} />;
      default: return <Sparkles size={15} />;
    }
  };

  const quickLaunchers = [
    {
      id: 'recommendation',
      title: 'Alternative Finder',
      desc: 'Discover chemically identical generic substitutes, matching composition dosage instantly.',
      icon: SearchIconOverlay,
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

  function SearchIconOverlay() {
    return <Scan size={18} />;
  }

  return (
    <div className="fade-in-section">
      
      {/* Dynamic Time Greeting Banner */}
      <div 
        className="hero-glass-banner"
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          height: '210px',
          marginBottom: '2rem',
          boxShadow: currentTheme === 'light' ? '0 10px 30px rgba(13, 148, 136, 0.05)' : '0 15px 40px rgba(0, 0, 0, 0.45)',
          transition: 'all 0.3s ease'
        }}
      >
        <img
          src="/medicine_hero_banner.png"
          alt="Executive Health Dashboard banner"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            filter: currentTheme === 'light' ? 'brightness(0.95) contrast(0.9)' : 'brightness(0.35) contrast(1.15)',
            opacity: currentTheme === 'light' ? 0.35 : 0.8,
            transition: 'all 0.3s ease'
          }}
        />
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: currentTheme === 'light' 
            ? 'linear-gradient(to right, rgba(240, 244, 248, 0.95) 45%, rgba(240, 244, 248, 0.7) 80%, rgba(240, 244, 248, 0.1) 100%)'
            : 'linear-gradient(to right, rgba(9, 15, 32, 0.95) 45%, rgba(9, 15, 32, 0.3) 80%, rgba(9, 15, 32, 0.05) 100%)',
          padding: '1.75rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={15} color={currentTheme === 'light' ? '#0d9488' : '#2dd4bf'} className="pulse-button" style={{ borderRadius: '50%' }} />
            <span 
              className="hero-banner-subtitle"
              style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                color: currentTheme === 'light' ? '#0d9488' : '#2dd4bf', 
                letterSpacing: '0.12em', 
                textTransform: 'uppercase' 
              }}
            >
              GenMed Hub Corporate Portal
            </span>
          </div>
          <h2 
            className="hero-banner-title"
            style={{ 
              fontSize: '2.1rem', 
              fontWeight: 900, 
              color: currentTheme === 'light' ? 'var(--text-main)' : '#ffffff', 
              margin: 0, 
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>{getGreeting()}, Monika</span>
            <span style={{ fontSize: '1.85rem' }}>{getGreetingIcon()}</span>
          </h2>
          
          {/* Quote interval container */}
          <div style={{ 
            height: '42px', 
            marginTop: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            borderLeft: `3px solid ${currentTheme === 'light' ? '#0d9488' : '#2dd4bf'}`,
            paddingLeft: '12px'
          }}>
            <Heart size={14} color="#f43f5e" className="pulse-button" />
            <p 
              className="hero-banner-subtitle"
              style={{ 
                color: currentTheme === 'light' ? 'var(--text-muted)' : '#cbd5e1', 
                fontSize: '0.86rem', 
                lineHeight: '1.45', 
                margin: 0,
                maxWidth: '720px',
                fontStyle: 'italic',
                transition: 'opacity 0.5s ease'
              }}
            >
              {HEALTH_QUOTES[activeQuoteIdx]}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="stat-container" style={{ marginBottom: '2rem' }}>
        
        {/* Wallet Cash Savings */}
        <div className="stat-card stat-card-savings list-item-hover">
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Total Pocket Savings</span>
            <div className="stat-icon-wrapper" style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', color: '#10b981' }}>
              <Wallet size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#10b981' }}>₹{stats.totalSavedWallet.toFixed(0)}</span>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Logged wallet transactions
          </div>
        </div>

        {/* Active Reminders */}
        <div className="stat-card stat-card-schedules list-item-hover">
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Family Schedules</span>
            <div className="stat-icon-wrapper" style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', color: '#6366f1' }}>
              <Bell size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#6366f1' }}>{stats.activeRemindersCount}</span>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Active patients reminders
          </div>
        </div>

        {/* Catalog Medicines */}
        <div className="stat-card stat-card-formulations list-item-hover">
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">Verified Formulations</span>
            <div className="stat-icon-wrapper" style={{ padding: '6px', background: 'rgba(13, 148, 136, 0.08)', borderRadius: '8px', color: '#0d9488' }}>
              <Layers size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#0d9488' }}>{stats.totalMedicines}+</span>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Registered generic equivalents
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="stat-card stat-card-engine list-item-hover">
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="stat-label">NLP Engine Status</span>
            <div className="stat-icon-wrapper" style={{ padding: '6px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', color: '#eab308' }}>
              <Activity size={18} />
            </div>
          </div>
          <span className="stat-value" style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Online
            <span className="live-pulse-dot" style={{ display: 'inline-block' }}></span>
          </span>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Scanner matches active
          </div>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.75rem', alignItems: 'start', marginBottom: '2rem' }}>
        
        {/* Left Column: Launcher & Savings Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Section 1: Launcher */}
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
              <Activity size={18} color="#0d9488" /> Primary Healthcare Consoles
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
                      minHeight: '170px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      transition: 'all 0.25s ease'
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
                        <Icon />
                      </div>
                      <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                        {launch.title}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.4' }}>
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

          {/* Section 2: Real-time Interactive Savings Calculator */}
          <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Calculator size={18} color="#0d9488" />
                Generic Savings Calculator
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                Interactive Simulator
              </span>
            </div>

            <div className="calculator-container">
              {/* Category Selector */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                  Select Therapeutic Category
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {THERAPEUTIC_CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.name}
                      className={`cat-btn ${idx === selectedCategoryIdx ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryIdx(idx)}
                    >
                      {cat.name} ({(cat.percentage * 100).toFixed(0)}% Off)
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider for Medicine Budget */}
              <div style={{ margin: '0.5rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Monthly Medicine Budget (Branded)
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ₹{calcCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={calcCost}
                  onChange={(e) => setCalcCost(Number(e.target.value))}
                  className="range-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>₹200</span>
                  <span>₹5,000</span>
                  <span>₹10,000</span>
                </div>
              </div>

              {/* Comparative Progress Bars */}
              <div style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  Cost Comparison Breakdown
                </span>

                {/* Branded Bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>Prescribed Branded Brand</span>
                    <span style={{ color: '#ef4444' }}>₹{calcCost.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, #ef4444, #f87171)', borderRadius: '4px' }}></div>
                  </div>
                </div>

                {/* Generic Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Generic Equivalent <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '0 4px', borderRadius: '3px' }}>Save {(savingsPct * 100).toFixed(0)}%</span>
                    </span>
                    <span style={{ color: '#10b981' }}>₹{estimatedGenericCost.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(1 - savingsPct) * 100}%`, height: '100%', background: 'linear-gradient(to right, #0d9488, #10b981)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>
              </div>

              {/* Annual Savings equivalent */}
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', 
                  border: '1px solid rgba(13, 148, 136, 0.15)',
                  borderRadius: '10px', 
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Yearly Savings</span>
                  <h4 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', margin: '2px 0 0 0' }}>
                    ₹{annualSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/year
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                    {currentEquiv.text}
                  </p>
                </div>
                <div style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {currentEquiv.badge}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Info size={13} color="#0d9488" />
                <span>Example substitution: {activeCategory.brandedExample} ➔ {activeCategory.genericExample}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Gauge, Carousel, Real-time Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Gauge card */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 800, alignSelf: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', width: '100%', textAlign: 'left', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} color="#0d9488" />
              National Savings Index
            </h4>

            {/* SVG Radial Dial */}
            <div style={{ position: 'relative', width: '145px', height: '145px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
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
                <span style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0d9488', lineHeight: '1' }}>78%</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>Avg. Savings</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1.1rem', lineHeight: '1.4', margin: '1rem 0 0 0' }}>
              Based on official NPPA ceiling price metrics across major therapeutic classes.
            </p>
          </div>

          {/* Real-time Community Hub & Trend Chart */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--text-main)', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <CloudLightning size={16} color="#0d9488" />
                Live Savings Hub
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="live-pulse-dot"></span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Realtime Feed</span>
              </div>
            </div>

            {/* Simulated Live Cumulative Savings Chart */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Community Cumulative Savings (INR)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0d9488' }}>
                  ₹{(savingsHistory.length > 0 ? savingsHistory[savingsHistory.length - 1].savings : 0).toLocaleString()}
                </span>
              </div>
              <div style={{ height: '70px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 4px 4px 4px', overflow: 'hidden' }}>
                {(() => {
                  const spark = getSparklinePath(savingsHistory, 330, 58);
                  return (
                    <svg width="100%" height="58" viewBox="0 0 330 58" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="svgSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {spark && (
                        <>
                          <path d={spark.fillPath} fill="url(#svgSavingsGrad)" />
                          <path d={spark.linePath} fill="none" stroke="#0d9488" strokeWidth={2} className="sparkline-glow" />
                          <circle cx={spark.lastPoint.x} cy={spark.lastPoint.y} r={3.5} fill="#0d9488" />
                          <circle cx={spark.lastPoint.x} cy={spark.lastPoint.y} r={7} fill="none" stroke="#0d9488" strokeWidth={1.5} opacity={0.6}>
                            <animate attributeName="r" values="3.5;9;3.5" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                          </circle>
                        </>
                      )}
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Live Ticker Feed */}
            <div className="activity-ticker-container">
              {activities.map(act => (
                <div key={act.id} className="activity-item">
                  <div style={{ 
                    padding: '5px', 
                    background: currentTheme === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)', 
                    color: act.color, 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getActivityIcon(act.icon)}
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)' }}>{act.name}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{act.time}</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '1px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparative Carousel Ticker Card */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
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
                <span style={{ fontSize: '0.7rem', color: '#0d9488', background: 'rgba(13,148,136,0.08)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  {COMPARATIVE_MEDICINES[carouselIdx].category}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>
                  Save {COMPARATIVE_MEDICINES[carouselIdx].savings}%
                </span>
              </div>

              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{COMPARATIVE_MEDICINES[carouselIdx].brand}</span>
                <span style={{ color: '#f87171' }}>₹{COMPARATIVE_MEDICINES[carouselIdx].brandPrice.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Chemical: <strong style={{ color: '#0d9488' }}>{COMPARATIVE_MEDICINES[carouselIdx].generic}</strong>
                </span>
                <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700 }}>
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
                    background: idx === carouselIdx ? '#0d9488' : 'var(--border-color)',
                    transition: 'background 0.3s'
                  }} 
                />
              ))}
            </div>
          </div>

          {/* Upcoming Schedule / Alerts Ticker */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, paddingLeft: '22px' }}>
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
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(13, 148, 136, 0.03) 100%)',
        border: '1px solid rgba(45, 212, 191, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#0d9488" />
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>Official Data Sourcing & Verification</h4>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
          This portal integrates healthcare datasets and pricing models sourced from official Indian regulatory registries and clinical references. You can verify and access the raw datasets directly:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
          <a href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0d9488', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            PMBJP Product & Price List (janaushadhi.gov.in) ↗
          </a>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <a href="http://www.nppaindia.nic.in" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0d9488', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            NPPA Price Registry (nppaindia.nic.in) ↗
          </a>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <a href="https://www.1mg.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0d9488', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            Tata 1mg Clinical Info (1mg.com) ↗
          </a>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <a href="https://medlineplus.gov" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0d9488', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            MedlinePlus Medicine Info (medlineplus.gov) ↗
          </a>
        </div>
      </div>

    </div>
  );
};

export default OverviewDashboard;
