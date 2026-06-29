import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BarChart3, 
  FileText, 
  MapPin, 
  BookOpen, 
  TrendingUp, 
  Sun, 
  Moon,
  Activity,
  Heart,
  Wallet,
  Calculator,
  ShieldCheck,
  Scan,
  Bell,
  LayoutDashboard,
  CloudLightning
} from 'lucide-react';
import RecommendationSystem from './pages/RecommendationSystem';
import PriceAnalysisDashboard from './pages/PriceAnalysisDashboard';
import PrescriptionOptimizer from './pages/PrescriptionOptimizer';
import SchemeAwareness from './pages/SchemeAwareness';
import MarketIntelligence from './pages/MarketIntelligence';
import NearbyShops from './pages/NearbyShops';
import SafetyAnalyzer from './pages/SafetyAnalyzer';
import HealthWallet from './pages/HealthWallet';
import GenericSubstituteScanner from './pages/GenericSubstituteScanner';
import MedicineReminder from './pages/MedicineReminder';
import OverviewDashboard from './pages/OverviewDashboard';
import Chatbot from './components/Chatbot';
import './styles/theme.css';
import { useTranslation } from './i18n/translations';

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [theme, setTheme] = useState<string>('light');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [latency, setLatency] = useState<number>(0);
  const [selectedMedicineId, setSelectedMedicineId] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Real-time clock tick
  useEffect(() => {
    const tick = () => {
      const date = new Date();
      setCurrentTime(
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' • ' +
        date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ping server to simulate latency status
  useEffect(() => {
    const ping = async () => {
      const start = Date.now();
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          setLatency(Date.now() - start);
        }
      } catch (err) {
        setLatency(-1); // offline
      }
    };
    ping();
    const interval = setInterval(ping, 8000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic spotlight card highlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeTab]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Nav Items Definitions
  const coreItems = [
    { id: 'recommendation', label: t('alternativeFinder'), icon: Search },
    { id: 'substitute-scanner', label: t('genericSubstituteScanner'), icon: Scan },
    { id: 'prescription', label: t('prescriptionOptimizer'), icon: FileText },
    { id: 'nearby-shops', label: t('shopsHospitals'), icon: MapPin },
  ];

  const intelligenceItems = [
    { id: 'dashboard', label: t('priceDashboard'), icon: BarChart3 },
    { id: 'market', label: t('marketIntelligence'), icon: TrendingUp },
    { id: 'safety', label: t('safetyAnalyzer'), icon: Heart }
  ];

  const utilityItems = [
    { id: 'wallet', label: t('healthWallet'), icon: Wallet },
    { id: 'reminders', label: t('medicineReminder'), icon: Bell },
    { id: 'scheme', label: t('govSchemes'), icon: BookOpen }
  ];

  const allNavItems = [
    { id: 'overview', label: 'Console Overview', icon: LayoutDashboard },
    ...coreItems, 
    ...intelligenceItems, 
    ...utilityItems
  ];

  const renderNavItem = (item: { id: string; label: string; icon: any }) => {
    const Icon = item.icon;
    return (
      <li 
        key={item.id}
        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
        onClick={() => setActiveTab(item.id)}
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </li>
    );
  };

  return (
    <div className="app-container">
      {/* Background Ambient Glows */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <Activity size={28} color="#2dd4bf" />
          <h1 className="logo-text">GenMed Hub™</h1>
        </div>
        
        <nav className="nav-links">
          <div className="sidebar-section-title">Overview</div>
          {renderNavItem({ id: 'overview', label: 'Console Overview', icon: LayoutDashboard })}
          
          <div className="sidebar-section-title">Core Services</div>
          {coreItems.map(renderNavItem)}
          
          <div className="sidebar-section-title">Intelligence & Safety</div>
          {intelligenceItems.map(renderNavItem)}
          
          <div className="sidebar-section-title">Account & Benefits</div>
          {utilityItems.map(renderNavItem)}
        </nav>

        <div className="theme-toggle-container">
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="top-navbar-left">
            <span className="breadcrumbs">
              GenMed Console / {allNavItems.find(i => i.id === activeTab)?.label}
            </span>
            <div className="system-status">
              {latency >= 0 ? (
                <span className="status-badge">
                  <span className="status-dot"></span>
                  Server Live
                </span>
              ) : (
                <span className="status-badge" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.08)' }}>
                  <span className="status-dot" style={{ backgroundColor: '#f87171' }}></span>
                  Server Offline
                </span>
              )}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {latency >= 0 ? `Latency: ${latency}ms • DB: Local JSON` : 'Check local server status'}
              </span>
            </div>
          </div>
          
          <div className="top-navbar-right">
            <span className="live-clock">{currentTime}</span>
            <div className="user-profile">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Monika User</span>
              <div className="user-avatar">MU</div>
            </div>
          </div>
        </header>

        <div className="fade-in-section">
          {activeTab === 'overview' && <OverviewDashboard setActiveTab={setActiveTab} setSelectedMedicineId={setSelectedMedicineId} />}
          {activeTab === 'recommendation' && <RecommendationSystem />}
          {activeTab === 'substitute-scanner' && <GenericSubstituteScanner setActiveTab={setActiveTab} setSelectedMedicineId={setSelectedMedicineId} />}
          {activeTab === 'dashboard' && <PriceAnalysisDashboard />}
          {activeTab === 'prescription' && <PrescriptionOptimizer />}
          {activeTab === 'nearby-shops' && <NearbyShops selectedMedicineId={selectedMedicineId} setSelectedMedicineId={setSelectedMedicineId} />}
          {activeTab === 'scheme' && <SchemeAwareness />}
          {activeTab === 'market' && <MarketIntelligence />}
          {activeTab === 'safety' && <SafetyAnalyzer />}
          {activeTab === 'wallet' && <HealthWallet />}
          {activeTab === 'reminders' && <MedicineReminder setActiveTab={setActiveTab} setSelectedMedicineId={setSelectedMedicineId} />}
        </div>
      </main>

      {/* Floating global chatbot assistant widget */}
      <Chatbot />
    </div>
  );
}

export default App;
