import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search, Play, Trash2, Terminal, CloudLightning, CheckCircle, Server, Clock, Database, RefreshCw, X, ShieldAlert, BadgeCheck, FileText, Info } from 'lucide-react';

interface SourceStatus {
  name?: string;
  status: 'online' | 'offline';
  latency: number;
  registrySize: number;
}

interface StatusData {
  sources: {
    pmbjp: SourceStatus;
    cdsco: SourceStatus;
    oneMg: SourceStatus;
    drugbank: SourceStatus;
    dailymed: SourceStatus;
    drugsetu: SourceStatus;
  };
  localDatabase: {
    totalRecords: number;
    syncedRecords: number;
    unsyncedRecords: number;
  };
}

interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface SyncProgress {
  isSyncing: boolean;
  current: number;
  total: number;
  status: 'idle' | 'running' | 'completed';
}

function DataSourcesConsole() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ isSyncing: false, current: 0, total: 0, status: 'idle' });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [crawlBrand, setCrawlBrand] = useState('');
  const [crawlGeneric, setCrawlGeneric] = useState('');
  const [isCrawlingSingle, setIsCrawlingSingle] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
  // JSON Inspector / Visual Inspector Modal State
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cdsco' | 'dailymed' | 'drugbank' | 'drugsetu' | 'raw'>('overview');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const logIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    
    // Poll status & logs
    const statusInterval = setInterval(fetchStatus, 8000);
    logIntervalRef.current = setInterval(fetchLogs, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(logIntervalRef.current);
    };
  }, []);

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/data-importer/status');
      if (!res.ok) throw new Error('Status fetch failed');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching source status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/data-importer/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
      
      // Also poll bulk sync progress
      const progressRes = await fetch('http://localhost:5000/api/data-importer/bulk-sync/progress');
      if (progressRes.ok) {
        const progress = await progressRes.json();
        setSyncProgress(progress);
        
        // If syncing finished, reload status
        if (syncProgress.isSyncing && !progress.isSyncing) {
          fetchStatus();
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleSingleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlBrand.trim() || !crawlGeneric.trim()) return;

    setIsCrawlingSingle(true);
    setSyncMessage('Crawling starting...');
    try {
      const res = await fetch('http://localhost:5000/api/data-importer/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: crawlBrand.trim(),
          genericName: crawlGeneric.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setSyncMessage(`Successfully crawled and updated database entry for "${crawlBrand}"!`);
        setSelectedRecord(data.medicine);
        setInspectorOpen(true);
        setActiveTab('overview');
        setCrawlBrand('');
        setCrawlGeneric('');
        fetchStatus();
      } else {
        setSyncMessage(`Crawl failed: ${data.error}`);
      }
    } catch (err: any) {
      setSyncMessage(`Network Error: ${err.message}`);
    } finally {
      setIsCrawlingSingle(false);
    }
  };

  const handleBulkSync = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/data-importer/bulk-sync', {
        method: 'POST'
      });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error('Error starting bulk sync:', err);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('http://localhost:5000/api/data-importer/clear-logs', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  const getLogStyle = (type: string) => {
    switch (type) {
      case 'success': return { color: '#4ade80' }; // green
      case 'warning': return { color: '#facc15' }; // yellow
      case 'error': return { color: '#f87171', fontWeight: 'bold' }; // red
      default: return { color: '#cbd5e1' }; // off-white
    }
  };

  // Helper to format log messages with styled category tags
  const formatLogText = (text: string) => {
    // Check for pattern like: "cdsco: Verifying..." or "[cdsco] Verifying..."
    const match = text.match(/^\[?(cdsco|drugbank|dailymed|drugsetu|system|pmbjp|1mg|medlineplus)\]?\s*:(.*)/i) || text.match(/^\[?(cdsco|drugbank|dailymed|drugsetu|system|pmbjp|1mg|medlineplus)\]?\s+(.*)/i);
    
    if (match) {
      const category = match[1].toUpperCase();
      const content = match[2];
      
      let badgeColor = 'var(--primary)';
      if (category === 'CDSCO') badgeColor = '#f59e0b'; // amber/orange
      else if (category === 'DRUGBANK') badgeColor = '#8b5cf6'; // purple
      else if (category === 'DAILYMED') badgeColor = '#ec4899'; // pink
      else if (category === 'DRUGSETU') badgeColor = '#06b6d4'; // cyan
      else if (category === 'SYSTEM') badgeColor = '#10b981'; // emerald
      else if (category === 'PMBJP') badgeColor = '#3b82f6'; // blue
      else if (category === '1MG') badgeColor = '#6366f1'; // indigo
      
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ 
            background: badgeColor, 
            color: '#fff', 
            padding: '1px 6px', 
            borderRadius: '4px', 
            marginRight: '6px', 
            fontSize: '0.65rem', 
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            {category}
          </span>
          <span>{content}</span>
        </span>
      );
    }
    return text;
  };

  return (
    <div className="fade-in-section">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2 className="page-title">Data Import & Scraper Console</h2>
        <p className="page-description font-sans">
          Automated crawling and ingestion hub connecting GenMed Hub with live government medicine registries, commercial indices, and patient safety platforms.
        </p>
      </div>

      {/* Connection Latency Grid */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Server size={18} color="var(--primary)" /> Integrated Medicine Databases
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Source Cards */}
        {[
          { key: 'pmbjp', name: 'PMBJP (Janaushadhi)', url: 'https://janaushadhi.gov.in', desc: 'Govt. Generic Drug Basket & Alternatives' },
          { key: 'cdsco', name: 'CDSCO India', url: 'https://cdsco.gov.in', desc: 'National Approved Drug Authority & Licenses' },
          { key: 'oneMg', name: 'Tata 1mg', url: 'https://www.1mg.com', desc: 'Commercial Brand Prices & Alternatives' },
          { key: 'drugbank', name: 'DrugBank Global', url: 'https://www.drugbank.com', desc: 'Global Drug Targets & Molecular Data' },
          { key: 'dailymed', name: 'DailyMed (FDA)', url: 'https://dailymed.nlm.nih.gov', desc: 'NIH FDA SPL Labels & NDC Directory' },
          { key: 'drugsetu', name: 'DrugSetu API', url: 'https://rxnav.nlm.nih.gov', desc: 'Structured Salt, Strength & Category API' }
        ].map(src => {
          const detail = status?.sources[src.key as keyof typeof status.sources];
          const isOnline = detail?.status === 'online';
          
          return (
            <div key={src.key} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `3px solid ${isOnline ? 'var(--success)' : 'var(--danger)'}`, position: 'relative', overflow: 'hidden' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{src.name}</h4>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: isOnline ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: isOnline ? 'var(--success)' : 'var(--danger)' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--danger)' }}></span>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>{src.desc}</p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem', fontSize: '0.78rem' }}>
                <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }} className="hover-underline">Visit Portal ↗</a>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                  <Clock size={11} /> {isOnline && detail.latency >= 0 ? `${detail.latency}ms` : '--'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Control Center & Terminal Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Sync Controls Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CloudLightning size={18} color="var(--primary)" /> Crawler Controller
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Deploy crawler bots to scrape 1mg prices and match them with government PMBJP price caps, CDSCO compliance licenses, and DailyMed identifiers.
            </p>
          </div>

          {/* Database stats */}
          {status && (
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{status.localDatabase.totalRecords}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Registry</div>
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2dd4bf' }}>{status.localDatabase.syncedRecords}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Synced Real-data</div>
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-muted)' }}>{status.localDatabase.unsyncedRecords}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Mock Baselines</div>
              </div>
            </div>
          )}

          {/* Crawl single formulation */}
          <form onSubmit={handleSingleCrawl} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Crawl & Import Single Molecule</h4>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Branded Name (e.g. Crocin)" 
                value={crawlBrand}
                onChange={e => setCrawlBrand(e.target.value)}
                className="font-sans"
                style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.82rem' }} 
              />
              <input 
                type="text" 
                placeholder="Generic Active (e.g. Paracetamol)" 
                value={crawlGeneric}
                onChange={e => setCrawlGeneric(e.target.value)}
                className="font-sans"
                style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.82rem' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                disabled={isCrawlingSingle || syncProgress.isSyncing}
                style={{ flex: 1, padding: '9px 15px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isCrawlingSingle ? <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} /> : <Search size={14} />}
                {isCrawlingSingle ? 'Crawling & Consolidating...' : 'Sync Formulation'}
              </button>
              
              {selectedRecord && (
                <button 
                  type="button" 
                  onClick={() => setInspectorOpen(true)}
                  style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.82rem', cursor: 'pointer' }}
                  title="Inspect Last Crawled Entry"
                >
                  Inspect
                </button>
              )}
            </div>

            {syncMessage && (
              <div style={{ fontSize: '0.78rem', color: syncMessage.includes('Successfully') ? 'var(--success)' : 'var(--danger)', padding: '6px 10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                {syncMessage}
              </div>
            )}
          </form>

          {/* Bulk Synchronizer */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Bulk Catalog Synchronizer</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
              Enrich the local database with real drug properties, FDA DailyMed NDCs, CDSCO manufacturer lists, and ceiling price benchmarks automatically.
            </p>

            {syncProgress.isSyncing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  <span>Synchronizing Database...</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                
                {/* Progress bar container */}
                <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleBulkSync}
                disabled={isCrawlingSingle}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Database size={14} /> Initialize Bulk Data Sync
              </button>
            )}
          </div>

        </div>

        {/* Live Terminal Console Card */}
        <div className="card" style={{ flexGrow: 2, display: 'flex', flexDirection: 'column', height: '480px', padding: '1.25rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Terminal size={16} color="var(--primary)" /> Crawler Process Terminal
            </h3>
            <button 
              onClick={handleClearLogs}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
            >
              <Trash2 size={13} /> Clear Terminal
            </button>
          </div>

          {/* Terminal Screen */}
          <div style={{ flexGrow: 1, background: '#070a11', border: '1px solid #141b2b', borderRadius: '10px', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px', fontFamily: '"Fira Code", Courier, monospace', fontSize: '0.75rem', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8)' }}>
            {logs.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '40%' }}>
                <span>[TERMINAL IDLE] - Crawl tasks will output here.</span>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ display: 'flex', gap: '6px', alignContent: 'flex-start', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>$</span>
                  <span style={getLogStyle(log.type)}>{formatLogText(log.text)}</span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>

      {/* Interactive Ingested Record Preview Modal */}
      {inspectorOpen && selectedRecord && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(5, 7, 12, 0.85)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000, 
          padding: '1.5rem' 
        }}>
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '750px', 
            maxHeight: '85vh', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '1.5rem', 
            gap: '1.25rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)', 
            border: '1px solid rgba(45, 212, 191, 0.2)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setInspectorOpen(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={15} />
            </button>

            {/* Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                <BadgeCheck color="#2dd4bf" size={20} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Consolidated Ingested Record Preview</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Review of crawled metadata, salt properties, NDCs, and regulatory indicators resolved for <strong>{selectedRecord.brandName}</strong>.
              </p>
            </div>

            {/* Custom Tab Bar */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'cdsco', label: 'CDSCO (India)' },
                { id: 'dailymed', label: 'DailyMed (FDA)' },
                { id: 'drugbank', label: 'DrugBank' },
                { id: 'drugsetu', label: 'DrugSetu API' },
                { id: 'raw', label: 'Raw JSON' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    transition: 'var(--transition)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Brand Name</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{selectedRecord.brandName}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Composition</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{selectedRecord.composition}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Branded Price</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--danger)', marginTop: '2px' }}>₹{selectedRecord.brandPrice.toFixed(2)}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Generic Price</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>₹{selectedRecord.genericPrice.toFixed(2)}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Calculated Savings</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2dd4bf', marginTop: '2px' }}>{selectedRecord.savings}%</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Manufacturer Details</div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{selectedRecord.manufacturer}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Clinical Details Summary</div>
                    <div style={{ lineHeight: '1.5', color: '#cbd5e1' }}>{selectedRecord.details}</div>
                  </div>
                </div>
              )}

              {activeTab === 'cdsco' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={16} color="#f59e0b" />
                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>CDSCO Approval Registry verified by the Central Drugs Standard Control Organisation.</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Approval Status</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>{selectedRecord.cdscoApproved ? 'APPROVED' : 'PENDING'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>First Approval Year</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{selectedRecord.cdscoApprovalYear}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Therapeutic Category</div>
                      <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '2px', fontWeight: 600 }}>{selectedRecord.cdscoCategory}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Regulatory Schedule</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--warning)', marginTop: '2px', fontWeight: 600 }}>{selectedRecord.cdscoSchedule}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Approved Manufacturers List (India)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedRecord.cdscoApprovedManufacturers?.map((mfr: string, idx: number) => (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem' }}>{mfr}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Regulatory Form compliance status</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>{selectedRecord.cdscoRegulatoryStatus}</div>
                  </div>
                </div>
              )}

              {activeTab === 'dailymed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(236, 72, 153, 0.04)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: '8px', padding: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={16} color="#ec4899" />
                    <span style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 600 }}>FDA SPL (Structured Product Labeling) metadata retrieved from NIH DailyMed REST API.</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>FDA SPL SETID</div>
                      <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{selectedRecord.dailyMedSplId}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>FDA NDC Code</div>
                      <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{selectedRecord.dailyMedNdc}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SPL Product Label Title</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '2px', fontWeight: 600 }}>{selectedRecord.dailyMedTitle}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Data Sync Channel</div>
                      <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '2px', fontWeight: 600 }}>{selectedRecord.dailyMedSource}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DailyMed Publisher / Registrant</div>
                      <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '2px', fontWeight: 600 }}>{selectedRecord.dailyMedManufacturer}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'drugbank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', padding: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={16} color="#8b5cf6" />
                    <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600 }}>DrugBank Global Database details resolved for composition relationships and active targets.</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DrugBank Accession ID</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px', fontFamily: 'monospace' }}>{selectedRecord.drugBankId}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Molecular Weight</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>{selectedRecord.drugBankMolecularWeight}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Chemical Formula</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff', marginTop: '2px', fontFamily: 'monospace' }}>{selectedRecord.drugBankChemicalFormula}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Therapeutic Classification & Relationships</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedRecord.drugBankRelationships?.map((rel: string, idx: number) => (
                        <span key={idx} style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#a78bfa', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600 }}>{rel}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Drug Receptor Receptors & Target Enzymes</div>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
                      {selectedRecord.drugBankTargets?.map((tgt: string, idx: number) => (
                        <li key={idx} style={{ color: '#fff' }}>{tgt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'drugsetu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '8px', padding: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Info size={16} color="#06b6d4" />
                    <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 600 }}>DrugSetu API Schema compliance check (Brand-Composition-Strength alignment).</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DrugSetu Alignment Check</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>{selectedRecord.drugSetuVerified ? 'VERIFIED ALIGNED' : 'UNALIGNED'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Schema Mapping Version</div>
                      <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '2px', fontWeight: 600 }}>{selectedRecord.drugSetuApiSchemaVersion}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mapped Active Salt</div>
                      <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '2px', fontWeight: 600 }}>{selectedRecord.drugSetuCompositionSalt}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Strength Specification</div>
                      <div style={{ fontSize: '0.9rem', color: '#2dd4bf', marginTop: '2px', fontWeight: 800 }}>{selectedRecord.drugSetuStrength}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last Verification Date</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>{selectedRecord.drugSetuLastVerificationDate}</div>
                  </div>
                </div>
              )}

              {activeTab === 'raw' && (
                <div style={{ background: '#05070a', border: '1px solid #141b2b', borderRadius: '8px', padding: '1rem', overflow: 'auto', maxHeight: '45vh', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.85)' }}>
                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#38bdf8', lineHeight: 1.4 }}>
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setInspectorOpen(false)}
                style={{ padding: '8px 18px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataSourcesConsole;
