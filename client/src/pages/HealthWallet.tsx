import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Shield, Calendar, User, UserPlus, TrendingUp } from 'lucide-react';

interface PrescriptionRecord {
  id: string;
  profileName: string;
  doctorName: string;
  date: string;
  brandTotal: number;
  genericTotal: number;
  savings: number;
  drugs: string[];
}

interface Profile {
  name: string;
  relation: string;
  age: number;
}

function HealthWallet() {
  const [profiles, setProfiles] = useState<Profile[]>([
    { name: 'Self', relation: 'Primary', age: 28 },
    { name: 'Father', relation: 'Parent', age: 62 },
    { name: 'Mother', relation: 'Parent', age: 58 }
  ]);
  const [activeProfile, setActiveProfile] = useState<string>('Self');
  const [records, setRecords] = useState<PrescriptionRecord[]>([]);

  // Add prescription record state
  const [doctorName, setDoctorName] = useState('');
  const [brandCost, setBrandCost] = useState('');
  const [genericCost, setGenericCost] = useState('');
  const [drugList, setDrugList] = useState('');
  
  // Profile creation states
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRelation, setNewProfileRelation] = useState('Parent');
  const [newProfileAge, setNewProfileAge] = useState('');
  const [showAddProfile, setShowAddProfile] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedRecords = localStorage.getItem('genmed_health_records');
    const savedProfiles = localStorage.getItem('genmed_health_profiles');
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedProfiles) setProfiles(JSON.parse(savedProfiles));
  }, []);

  const saveToStorage = (updatedRecords: PrescriptionRecord[], updatedProfiles?: Profile[]) => {
    localStorage.setItem('genmed_health_records', JSON.stringify(updatedRecords));
    setRecords(updatedRecords);

    if (updatedProfiles) {
      localStorage.setItem('genmed_health_profiles', JSON.stringify(updatedProfiles));
      setProfiles(updatedProfiles);
    }
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !brandCost || !genericCost) return;

    const bPrice = parseFloat(brandCost);
    const gPrice = parseFloat(genericCost);
    const savingsAmount = bPrice - gPrice;

    const newRecord: PrescriptionRecord = {
      id: Date.now().toString(),
      profileName: activeProfile,
      doctorName,
      date: new Date().toISOString().split('T')[0],
      brandTotal: bPrice,
      genericTotal: gPrice,
      savings: savingsAmount,
      drugs: drugList ? drugList.split(',').map(d => d.trim()) : []
    };

    const updated = [newRecord, ...records];
    saveToStorage(updated);
    
    // Reset inputs
    setDoctorName('');
    setBrandCost('');
    setGenericCost('');
    setDrugList('');
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    saveToStorage(updated);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName || !newProfileAge) return;

    const newProf: Profile = {
      name: newProfileName,
      relation: newProfileRelation,
      age: parseInt(newProfileAge)
    };

    const updated = [...profiles, newProf];
    saveToStorage(records, updated);
    
    // Reset
    setNewProfileName('');
    setNewProfileAge('');
    setShowAddProfile(false);
  };

  // Filter records for active profile
  const profileRecords = records.filter(r => r.profileName === activeProfile);
  
  // Calculate aggregate metrics
  const totalSaved = profileRecords.reduce((acc, curr) => acc + curr.savings, 0);
  const totalBrandCost = profileRecords.reduce((acc, curr) => acc + curr.brandTotal, 0);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Personal Health Wallet</h2>
        <p className="page-description">
          Securely manage your prescription histories, medical files, family profiles, and analyze accumulated generic medicine savings over time.
        </p>
      </div>

      {/* Profiles bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'center' }}>
        {profiles.map(prof => (
          <button
            key={prof.name}
            onClick={() => setActiveProfile(prof.name)}
            className={`btn ${activeProfile === prof.name ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <User size={14} />
            {prof.name} ({prof.relation})
          </button>
        ))}
        
        <button
          onClick={() => setShowAddProfile(!showAddProfile)}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: 'var(--primary)', color: '#2dd4bf', padding: '0.5rem 1rem' }}
        >
          <UserPlus size={14} />
          Add Profile
        </button>
      </div>

      {/* Add Profile Form overlay */}
      {showAddProfile && (
        <div className="card" style={{ marginBottom: '25px', border: '1px solid rgba(13, 148, 136, 0.3)' }}>
          <h4 style={{ color: '#2dd4bf', marginBottom: '15px' }}>Add Family Profile</h4>
          <form onSubmit={handleAddProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name</label>
              <input type="text" className="search-input" style={{ height: '40px', padding: '10px' }} value={newProfileName} onChange={e => setNewProfileName(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Relation</label>
              <select className="search-input" style={{ height: '40px', padding: '5px 10px' }} value={newProfileRelation} onChange={e => setNewProfileRelation(e.target.value)}>
                <option value="Self">Self</option>
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Age</label>
              <input type="number" className="search-input" style={{ height: '40px', padding: '10px' }} value={newProfileAge} onChange={e => setNewProfileAge(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>Save Profile</button>
          </form>
        </div>
      )}

      {/* Profile aggregated metrics */}
      <div className="stat-container">
        <div className="stat-card">
          <span className="stat-label">Total Saved to Date</span>
          <span className="stat-value">₹{totalSaved.toFixed(0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Branded Alternative Cost</span>
          <span className="stat-value" style={{ color: '#ef4444' }}>₹{totalBrandCost.toFixed(0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Prescription Count</span>
          <span className="stat-value" style={{ color: 'var(--primary)' }}>{profileRecords.length}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Log Prescription Form */}
        <div className="card">
          <h3 className="card-title" style={{ color: '#2dd4bf' }}><Plus size={20} /> Log Prescription</h3>
          <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Doctor / Clinic Name</label>
              <input type="text" className="search-input" style={{ height: '40px', padding: '10px' }} value={doctorName} onChange={e => setDoctorName(e.target.value)} required placeholder="Dr. Sharma, Med Clinic" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Branded Cost (₹)</label>
                <input type="number" className="search-input" style={{ height: '40px', padding: '10px' }} value={brandCost} onChange={e => setBrandCost(e.target.value)} required placeholder="1200" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generic Cost (₹)</label>
                <input type="number" className="search-input" style={{ height: '40px', padding: '10px' }} value={genericCost} onChange={e => setGenericCost(e.target.value)} required placeholder="320" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prescribed Medicines (Comma separated)</label>
              <input type="text" className="search-input" style={{ height: '40px', padding: '10px' }} value={drugList} onChange={e => setDrugList(e.target.value)} placeholder="Crocin, Glycomet, Augmentin" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '5px' }}>
              Add to Wallet
            </button>
          </form>
        </div>

        {/* Prescription timeline history logs */}
        <div className="card">
          <h3 className="card-title" style={{ color: '#f8fafc' }}><Wallet size={20} /> Prescription History Logs</h3>
          
          {profileRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No prescription logs recorded for {activeProfile} yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {profileRecords.map(rec => (
                <div key={rec.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', color: '#cbd5e1' }}>{rec.doctorName}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {rec.date}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteRecord(rec.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <strong>Medicines:</strong> {rec.drugs.length > 0 ? rec.drugs.join(', ') : 'Not specified'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed rgba(16, 185, 129, 0.2)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Estimated Direct Savings:</span>
                    <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>Saved ₹{rec.savings.toFixed(0)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HealthWallet;
