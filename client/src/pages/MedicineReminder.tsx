import React, { useState, useEffect } from 'react';
import { Bell, Clock, Plus, Trash2, Check, X, Search } from 'lucide-react';

interface Reminder {
  id: string;
  medicineName: string;
  medicineId?: number;
  dosage: string; // e.g. "1 Tablet"
  times: string[]; // e.g. ["Morning", "Night"]
  familyMember: string; // e.g. "Self", "Father", "Mother", "Spouse"
  currentStock?: number;
  threshold?: number;
  logs: Record<string, 'taken' | 'skipped'>; // date_time -> status
  customAlarmTime?: string; // e.g. "08:30"
}

interface Medicine {
  id: number;
  brandName: string;
  genericName: string;
  composition: string;
}

interface MedicineReminderProps {
  setActiveTab: (tab: string) => void;
  setSelectedMedicineId?: (id: number) => void;
}

const MedicineReminder: React.FC<MedicineReminderProps> = ({ setActiveTab, setSelectedMedicineId }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form States
  const [medSearch, setMedSearch] = useState('');
  const [medResults, setMedResults] = useState<Medicine[]>([]);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [customMedName, setCustomMedName] = useState('');
  
  const [dosage, setDosage] = useState('1 Tablet');
  const [times, setTimes] = useState<string[]>(['Morning']);
  const [familyMember, setFamilyMember] = useState('Self');
  const [customAlarmTime, setCustomAlarmTime] = useState('');
  const [activeAlarm, setActiveAlarm] = useState<{ reminder: Reminder; time: string } | null>(null);

  // Synthesize custom double/triple beep alarm sound via browser AudioContext
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playBeep = (startTime: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play three rapid high-pitched notes
      playBeep(ctx.currentTime, 880, 0.12);
      playBeep(ctx.currentTime + 0.15, 880, 0.12);
      playBeep(ctx.currentTime + 0.3, 1100, 0.25);
    } catch (e) {
      console.error('AudioContext failed:', e);
    }
  };

  const triggerAlarm = (rem: Reminder, timeStr: string) => {
    setActiveAlarm({ reminder: rem, time: timeStr });
    playChime();
  };

  // Clock checker to match scheduled timeslots or custom time
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      const slotTimes: Record<string, string> = {
        'Morning': '08:00',
        'Afternoon': '13:00',
        'Evening': '18:30',
        'Night': '21:30'
      };

      reminders.forEach(rem => {
        const matchesTime = rem.times.some(slot => slotTimes[slot] === timeStr) || (rem.customAlarmTime === timeStr);
        if (matchesTime) {
          const todayStr = new Date().toISOString().split('T')[0];
          const triggeredTodayKey = `triggered_${rem.id}_${todayStr}_${timeStr}`;
          if (!sessionStorage.getItem(triggeredTodayKey)) {
            sessionStorage.setItem(triggeredTodayKey, 'true');
            triggerAlarm(rem, timeStr);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [reminders]);

  // Load reminders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('genmed_reminders');
    if (saved) {
      setReminders(JSON.parse(saved));
    } else {
      // Default seed reminders for demonstration
      const seeds: Reminder[] = [
        {
          id: 'seed-1',
          medicineName: 'Lipitor 10mg (Atorvastatin)',
          medicineId: 4,
          dosage: '1 Tablet',
          times: ['Night'],
          familyMember: 'Father',
          logs: {}
        },
        {
          id: 'seed-2',
          medicineName: 'Crocin 650mg (Paracetamol)',
          medicineId: 1,
          dosage: '1 Tablet',
          times: ['Morning', 'Evening'],
          familyMember: 'Self',
          logs: {}
        }
      ];
      setReminders(seeds);
      localStorage.setItem('genmed_reminders', JSON.stringify(seeds));
    }
  }, []);

  // Save reminders to localStorage helper
  const saveToStorage = (updated: Reminder[]) => {
    setReminders(updated);
    localStorage.setItem('genmed_reminders', JSON.stringify(updated));
  };

  // Medicine Search
  useEffect(() => {
    if (medSearch.trim().length < 2) {
      setMedResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/medicines?query=${encodeURIComponent(medSearch)}`);
        const data = await res.json();
        setMedResults(data.slice(0, 5));
      } catch (err) {
        console.error('Reminder search failed', err);
      }
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [medSearch]);

  // Handle Add Reminder
  const [sessionTriggered, setSessionTriggered] = useState<Record<string, boolean>>({});

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMedName = selectedMed 
      ? `${selectedMed.brandName} (${selectedMed.genericName})`
      : customMedName.trim() || medSearch.trim();

    if (!finalMedName) {
      alert('Please specify a medicine name.');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      medicineName: finalMedName,
      medicineId: selectedMed?.id,
      dosage,
      times,
      familyMember,
      customAlarmTime: customAlarmTime || undefined,
      logs: {}
    };

    const updated = [newReminder, ...reminders];
    saveToStorage(updated);
    
    // Reset Form
    setShowAddModal(false);
    setMedSearch('');
    setSelectedMed(null);
    setCustomMedName('');
    setDosage('1 Tablet');
    setTimes(['Morning']);
    setFamilyMember('Self');
    setCustomAlarmTime('');
  };

  // Delete Reminder
  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    saveToStorage(updated);
  };

  // Log dose taken
  const handleLogDose = (id: string, time: string, status: 'taken' | 'skipped') => {
    const today = new Date().toISOString().split('T')[0];
    const logKey = `${today}_${time}`;

    const updated = reminders.map(r => {
      if (r.id === id) {
        const logs = { ...r.logs, [logKey]: status };
        return { ...r, logs };
      }
      return r;
    });

    saveToStorage(updated);
  };

  // Filtering
  const filteredReminders = reminders.filter(r => {
    if (activeFilter === 'All') return true;
    return r.familyMember.toLowerCase() === activeFilter.toLowerCase();
  });

  const today = new Date().toISOString().split('T')[0];
  const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
  
  // Patient tags colors
  const patientColors: Record<string, string> = {
    self: '#2dd4bf', // teal
    father: '#6366f1', // indigo
    mother: '#ec4899', // pink
    spouse: '#eab308' // amber
  };

  return (
    <div className="fade-in-section">
      <div className="page-header">
        <h2 className="page-title">Medicine Reminder &amp; Refill Tracker</h2>
        <p className="page-description">
          Monitor your family's dosage schedules, track pill inventories, and receive dynamic warnings before stocks run dry.
        </p>
      </div>

      {/* Visual Banner Header */}
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '140px',
        marginBottom: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <img
          src="/refill_tracker_header.png"
          alt="Refill Tracker Dashboard illustration"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
        />
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to right, rgba(6, 9, 19, 0.95), transparent)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            Never Miss a Dose
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '480px', marginTop: '4px' }}>
            Set schedules, log your medicine consumption, check pill counts, and find generic pharmacies near you when stock gets low.
          </p>
        </div>
      </div>

      {/* Main Grid: Daily Timeline & Schedules */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Daily Timeline & Schedules */}
        <div>
          
          {/* Filters and Add Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Self', 'Father', 'Mother', 'Spouse'].map(filter => (
                <button
                  key={filter}
                  className={`btn ${activeFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Reminder
            </button>
          </div>

          {/* Daily Timeline */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 className="card-title" style={{ color: '#2dd4bf' }}>
              <Clock size={20} /> Today's Dosage Timeline
            </h3>

            {filteredReminders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                No active dosage schedules set for this filter. Click "Add Reminder" to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                {timeSlots.map(slot => {
                  // Filter reminders active for this specific time slot
                  const slotReminders = filteredReminders.filter(r => r.times.includes(slot));
                  
                  if (slotReminders.length === 0) return null;

                  return (
                    <div key={slot} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>{slot}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {slot === 'Morning' && '08:00 AM'}
                          {slot === 'Afternoon' && '01:00 PM'}
                          {slot === 'Evening' && '06:30 PM'}
                          {slot === 'Night' && '09:30 PM'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {slotReminders.map(rem => {
                          const logKey = `${today}_${slot}`;
                          const status = rem.logs[logKey];
                          const tagColor = patientColors[rem.familyMember.toLowerCase()] || '#64748b';

                          return (
                            <div
                              key={rem.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: status === 'taken' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255,255,255,0.02)',
                                border: status === 'taken' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)',
                                borderRadius: '10px',
                                opacity: status === 'skipped' ? 0.5 : 1,
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                <div style={{
                                  background: tagColor,
                                  color: '#090d16',
                                  fontWeight: 800,
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '20px',
                                  marginTop: '3px'
                                }}>
                                  {rem.familyMember}
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                                    {rem.medicineName}
                                  </h4>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Dosage: {rem.dosage}
                                  </p>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 8px', fontSize: '0.75rem', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}
                                  onClick={() => triggerAlarm(rem, slot)}
                                  title="Trigger test alert instantly"
                                >
                                  Test Alarm
                                </button>
                                {status ? (
                                  <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: status === 'taken' ? '#34d399' : '#f87171',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    {status === 'taken' ? <Check size={14} /> : <X size={14} />}
                                    {status.toUpperCase()}
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}
                                      onClick={() => handleLogDose(rem.id, slot, 'taken')}
                                    >
                                      Take
                                    </button>
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                                      onClick={() => handleLogDose(rem.id, slot, 'skipped')}
                                    >
                                      Skip
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => handleDeleteReminder(rem.id)}
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Reminder Modal Overlay */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(6, 9, 19, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '500px',
            width: '100%',
            background: '#0e1628',
            border: '1px solid rgba(13, 148, 136, 0.3)',
            borderRadius: '14px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} /> Add Dosage Reminder
              </h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                onClick={() => setShowAddModal(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddReminder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Medicine Autocomplete input */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Search Medicine in Database</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="search-input"
                    style={{ height: '38px', padding: '8px 12px 8px 32px' }}
                    placeholder="Search brand (e.g. Crocin)..."
                    value={medSearch}
                    onChange={e => {
                      setMedSearch(e.target.value);
                      if (selectedMed) setSelectedMed(null);
                    }}
                  />
                  <Search size={14} className="search-icon-inside" style={{ left: '10px' }} />
                </div>

                {selectedMed && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '0.82rem',
                    background: 'rgba(45, 212, 191, 0.08)',
                    border: '1px solid rgba(45, 212, 191, 0.25)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    color: '#2dd4bf'
                  }}>
                    Linked to: <strong>{selectedMed.brandName}</strong> ({selectedMed.genericName})
                  </div>
                )}

                {medResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%', left: 0, right: 0,
                    background: '#0e1628',
                    border: '1px solid rgba(45, 212, 191, 0.3)',
                    borderRadius: '6px',
                    zIndex: 20,
                    marginTop: '2px'
                  }}>
                    {medResults.map(m => (
                      <div
                        key={m.id}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}
                        onClick={() => {
                          setSelectedMed(m);
                          setMedSearch(m.brandName);
                          setMedResults([]);
                        }}
                      >
                        {m.brandName} ({m.genericName})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!selectedMed && medSearch.trim().length > 0 && (
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Custom Label Name (Optional)</label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ height: '38px', padding: '8px 12px' }}
                    placeholder="Enter custom medicine label..."
                    value={customMedName}
                    onChange={e => setCustomMedName(e.target.value)}
                  />
                </div>
              )}

              {/* Family member filters */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Family Member Schedule</label>
                <select
                  className="search-input"
                  style={{ height: '38px', padding: '8px' }}
                  value={familyMember}
                  onChange={e => setFamilyMember(e.target.value)}
                >
                  <option value="Self">Self (Default)</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                </select>
              </div>

              {/* Dosage selection */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Dosage Size</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ height: '38px', padding: '8px 12px' }}
                  value={dosage}
                  onChange={e => setDosage(e.target.value)}
                />
              </div>

              {/* Schedule time slots checkboxes */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Dosage Timings</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Morning', 'Afternoon', 'Evening', 'Night'].map(slot => (
                    <label key={slot} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#f8fafc', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={times.includes(slot)}
                        onChange={() => {
                          if (times.includes(slot)) {
                            setTimes(times.filter(t => t !== slot));
                          } else {
                            setTimes([...times, slot]);
                          }
                        }}
                      />
                      {slot}
                    </label>
                  ))}
                </div>
              </div>



              {/* Custom Alarm Time Input */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Custom Alarm Time (Optional, e.g. 14:30)</label>
                <input
                  type="time"
                  className="search-input"
                  style={{ height: '38px', padding: '8px 12px' }}
                  value={customAlarmTime}
                  onChange={e => setCustomAlarmTime(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                Add to Daily Tracker
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Active Alarm Modal Popup */}
      {activeAlarm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(6, 9, 19, 0.9)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card animate-pulse-border" style={{
            maxWidth: '450px',
            width: '100%',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #090d16 100%)',
            border: '2px solid #ef4444',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.45)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              border: '2px solid #ef4444'
            }}>
              <Bell size={32} color="#ef4444" style={{ animation: 'bounce 1s infinite' }} />
            </div>

            <h3 style={{ color: '#ef4444', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              MEDICATION ALARM
            </h3>
            
            <p style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, lineHeight: '1.5' }}>
              It's time for <strong style={{ color: '#2dd4bf' }}>{activeAlarm.reminder.familyMember}</strong> to take:
            </p>
            
            <h4 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, margin: '1rem 0' }}>
              {activeAlarm.reminder.medicineName}
            </h4>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Dosage: <strong style={{ color: '#34d399' }}>{activeAlarm.reminder.dosage}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={() => {
                  handleLogDose(activeAlarm.reminder.id, activeAlarm.time, 'taken');
                  setActiveAlarm(null);
                }}
              >
                Mark Taken
              </button>
              <button
                className="btn btn-secondary"
                style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
                onClick={() => {
                  handleLogDose(activeAlarm.reminder.id, activeAlarm.time, 'skipped');
                  setActiveAlarm(null);
                }}
              >
                Skip Dose
              </button>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '10px', background: 'rgba(255,255,255,0.02)' }}
              onClick={() => setActiveAlarm(null)}
            >
              Dismiss Alarm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineReminder;
