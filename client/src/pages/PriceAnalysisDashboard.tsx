import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PiggyBank, ArrowDownWideNarrow, Layers, HelpCircle, Activity } from 'lucide-react';

interface OverpricedMedicine {
  id: number;
  brandName: string;
  genericName: string;
  composition: string;
  brandPrice: number;
  genericPrice: number;
  savings: number;
  difference: number;
  ratio: number;
  manufacturer: string;
  category: string;
}

interface Stats {
  totalMedicinesAnalyzed: number;
  averageSavingsPercentage: number;
  potentialTotalSavings: number;
  brandedCostBaseline: number;
  genericCostBaseline: number;
}

interface CategoryData {
  name: string;
  brandedAvg: number;
  genericAvg: number;
  savings: number;
}

interface RegionalData {
  zone: string;
  averagePremium: number;
  genericAverage: number;
}

interface MarketShareData {
  name: string;
  value: number;
}

function PriceAnalysisDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [overpriced, setOverpriced] = useState<OverpricedMedicine[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [regions, setRegions] = useState<RegionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Primary colors matching theme.css
  const COLORS = ['#0d9488', '#2dd4bf', '#6366f1', '#fbbf24', '#3b82f6'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setStats(data.statistics);
      setOverpriced(data.overpriced);
      setCategories(data.categoryAnalysis);
      setRegions(data.regionalPricing);
    } catch (err) {
      console.error(err);
      setError('Could not load analytics. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const marketShare: MarketShareData[] = [
    { name: 'Janaushadhi (PMBJP)', value: 42 },
    { name: 'Cipla Generics', value: 21 },
    { name: 'Alkem (Generic)', value: 15 },
    { name: 'Abbott Generics', value: 12 },
    { name: 'Others', value: 10 }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="fade-in-section">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2 className="page-title">Price Intelligence Dashboard</h2>
        <p className="page-description">Real-time market analytics tracking pharmaceutical markup indices, average cost disparities, and generic substitution margins.</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(248,113,113,0.08)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.15)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="stat-container">
          <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Total Analyzed</span>
              <div style={{ padding: '6px', background: 'var(--primary-glow)', borderRadius: '8px', color: 'var(--primary)' }}>
                <Layers size={18} />
              </div>
            </div>
            <span className="stat-value">{stats.totalMedicinesAnalyzed}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Medicines mapping registry active</span>
            </div>
          </div>
          
          <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Avg. Price Savings</span>
              <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', color: 'var(--success)' }}>
                <ArrowDownWideNarrow size={18} />
              </div>
            </div>
            <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.averageSavingsPercentage}%</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
              <span>Average generic discount index</span>
            </div>
          </div>
          
          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Savings Potential</span>
              <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', color: 'var(--accent)' }}>
                <PiggyBank size={18} />
              </div>
            </div>
            <span className="stat-value" style={{ color: 'var(--accent)' }}>₹{stats.potentialTotalSavings.toFixed(0)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Average savings per 10-pack basket</span>
            </div>
          </div>
          
          <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Branded Premium</span>
              <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', color: 'var(--warning)' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>
              {parseFloat((stats.brandedCostBaseline / stats.genericCostBaseline).toFixed(1))}x
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Brand vs generic average multiplier</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Category Pricing Bar Chart */}
        <div className="card" style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)' }}>
          <h3 className="card-title">
            <Activity size={18} color="var(--primary)" />
            Average Pricing by Medical Category
          </h3>
          <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
            <ResponsiveContainer>
              <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="brandedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="genericColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} unit="₹" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', boxShadow: 'var(--shadow-md)' }} 
                  labelStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
                <Bar dataKey="brandedAvg" name="Branded Average" fill="url(#brandedColor)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="genericAvg" name="Generic Average" fill="url(#genericColor)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Share Pie Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)' }}>
          <h3 className="card-title">
            <TrendingUp size={18} color="var(--accent)" />
            Generic Medicine Adoption Share
          </h3>
          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', height: 300, marginTop: '1rem' }}>
            <div style={{ width: '50%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={marketShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {marketShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              {marketShare.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                  </div>
                  <strong style={{ color: 'var(--text-main)', paddingLeft: '8px' }}>{entry.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Overpriced Branded Drugs */}
      <div className="card" style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)' }}>
        <h3 className="card-title">
          <HelpCircle size={18} color="var(--warning)" />
          Top 5 Overpriced Branded Medicines (High Margins)
        </h3>
        
        <div style={{ margin: '1rem 0 1.5rem 0', padding: '10px 15px', background: 'rgba(251, 191, 36, 0.04)', borderRadius: '8px', border: '1px dashed rgba(251, 191, 36, 0.15)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ⚠️ <strong>Analyst Note:</strong> The markup percentages indicate the premium charged for branding relative to chemically identical generic equivalents.
        </div>

        <div className="table-container">
          <table className="med-table">
            <thead>
              <tr>
                <th>Branded Drug</th>
                <th>Generic Equivalent</th>
                <th>Branded Price</th>
                <th>Generic Price</th>
                <th>Premium Markup</th>
                <th>Potential Savings</th>
              </tr>
            </thead>
            <tbody>
              {overpriced.map(med => (
                <tr key={med.id}>
                  <td>
                    <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{med.brandName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{med.manufacturer}</div>
                  </td>
                  <td>
                    <div style={{ color: '#2dd4bf', fontWeight: '700' }}>{med.genericName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Composition: {med.composition}</div>
                  </td>
                  <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>₹{med.brandPrice.toFixed(2)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{med.genericPrice.toFixed(2)}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: 'bold' }}>
                    +{Math.round((med.brandPrice - med.genericPrice) / med.genericPrice * 100)}%
                  </td>
                  <td>
                    <span className="savings-tag">Save {med.savings}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PriceAnalysisDashboard;
