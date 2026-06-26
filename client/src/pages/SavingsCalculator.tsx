import React, { useState } from 'react';
import { DollarSign, ShieldCheck, Scale, Calculator, ArrowRight } from 'lucide-react';

interface MedicineListItem {
  id: string;
  name: string;
  brandPrice: number;
  genericPrice: number;
  quantityPerMonth: number;
}

function SavingsCalculator() {
  const [list, setList] = useState<MedicineListItem[]>([
    { id: '1', name: 'Crocin 650mg', brandPrice: 35, genericPrice: 12, quantityPerMonth: 2 },
    { id: '2', name: 'Augmentin 625 DUO', brandPrice: 200, genericPrice: 60, quantityPerMonth: 1 }
  ]);

  const [name, setName] = useState('');
  const [brandPrice, setBrandPrice] = useState('');
  const [genericPrice, setGenericPrice] = useState('');
  const [qty, setQty] = useState('1');

  const addMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brandPrice || !genericPrice) return;

    const newMed: MedicineListItem = {
      id: Date.now().toString(),
      name,
      brandPrice: parseFloat(brandPrice),
      genericPrice: parseFloat(genericPrice),
      quantityPerMonth: parseInt(qty)
    };

    setList(prev => [...prev, newMed]);
    setName('');
    setBrandPrice('');
    setGenericPrice('');
    setQty('1');
  };

  const removeMed = (id: string) => {
    setList(prev => prev.filter(m => m.id !== id));
  };

  // Calculations
  const totalBrandedMonthly = list.reduce((acc, curr) => acc + (curr.brandPrice * curr.quantityPerMonth), 0);
  const totalGenericMonthly = list.reduce((acc, curr) => acc + (curr.genericPrice * curr.quantityPerMonth), 0);
  const monthlySavings = totalBrandedMonthly - totalGenericMonthly;
  const annualSavings = monthlySavings * 12;
  const savingsPercent = totalBrandedMonthly > 0 ? Math.round((monthlySavings / totalBrandedMonthly) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Generic Medicine Savings Calculator</h2>
        <p className="page-description">
          Add your monthly prescription list below to calculate how much money you can save per month and per year by switching to equivalent generic drugs.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="stat-container">
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="stat-label">Branded Monthly Cost</span>
          <span className="stat-value" style={{ color: '#ef4444' }}>₹{totalBrandedMonthly.toFixed(2)}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="stat-label">Generic Equivalent Cost</span>
          <span className="stat-value" style={{ color: '#10b981' }}>₹{totalGenericMonthly.toFixed(2)}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #2dd4bf' }}>
          <span className="stat-label">Annual Cost Savings</span>
          <span className="stat-value" style={{ color: '#2dd4bf' }}>₹{annualSavings.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Form and list */}
        <div className="card">
          <h3 className="card-title" style={{ color: '#2dd4bf' }}><Calculator size={20} /> Add Prescribed Medicine</h3>
          
          <form onSubmit={addMed} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Medicine Name</label>
              <input type="text" className="search-input" style={{ height: '40px', padding: '10px' }} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Lipitor 10mg" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Brand Price (₹)</label>
                <input type="number" className="search-input" style={{ height: '40px', padding: '10px' }} value={brandPrice} onChange={e => setBrandPrice(e.target.value)} required placeholder="180" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generic Price (₹)</label>
                <input type="number" className="search-input" style={{ height: '40px', padding: '10px' }} value={genericPrice} onChange={e => setGenericPrice(e.target.value)} required placeholder="45" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty / Month</label>
                <input type="number" className="search-input" style={{ height: '40px', padding: '10px' }} value={qty} onChange={e => setQty(e.target.value)} required min="1" />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '5px' }}>
              Add to Comparison List
            </button>
          </form>
        </div>

        {/* Calculation details list */}
        <div className="card">
          <h3 className="card-title" style={{ color: '#cbd5e1' }}><Scale size={20} /> Comparison breakdown</h3>
          
          {list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No items in calculation list. Add them above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {list.map(med => {
                  const savings = (med.brandPrice - med.genericPrice) * med.quantityPerMonth;
                  return (
                    <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {med.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>x{med.quantityPerMonth}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Brand: ₹{med.brandPrice} | Generic: ₹{med.genericPrice}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>Save ₹{savings}</span>
                        <button onClick={() => removeMed(med.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem' }}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Box summary card */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monthly Savings Percentage:</span>
                  <strong style={{ color: '#10b981' }}>{savingsPercent}% Savings</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Net Monthly Savings:</span>
                  <strong style={{ color: '#2dd4bf' }}>₹{monthlySavings.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700 }}>
                  <span style={{ color: '#f8fafc' }}>Projected 5-Year Savings:</span>
                  <span style={{ color: '#2dd4bf' }}>₹{(annualSavings * 5).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavingsCalculator;
