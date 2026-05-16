import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Zap, Edit } from 'lucide-react';

const EMPTY_CYCLE = {
  name: '', year: new Date().getFullYear(),
  goalSettingOpen: '', goalSettingClose: '',
  q1Open: '', q1Close: '', q2Open: '', q2Close: '',
  q3Open: '', q3Close: '', q4Open: '', q4Close: '',
};

const DateField = ({ label, value, onChange }) => (
  <div className="form-group">
    <label>{label}</label>
    <input type="date" value={value || ''} onChange={e => onChange(e.target.value)} />
  </div>
);

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_CYCLE);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCycles = () => api.get('/cycles').then(res => setCycles(res.data.cycles || []));
  useEffect(() => { fetchCycles(); }, []);

  const openCreate = () => { setForm(EMPTY_CYCLE); setEditId(null); setModal(true); };
  const openEdit = (c) => {
    const fmt = d => d ? d.slice(0, 10) : '';
    setForm({ name: c.name, year: c.year, goalSettingOpen: fmt(c.goalSettingOpen), goalSettingClose: fmt(c.goalSettingClose), q1Open: fmt(c.q1Open), q1Close: fmt(c.q1Close), q2Open: fmt(c.q2Open), q2Close: fmt(c.q2Close), q3Open: fmt(c.q3Open), q3Close: fmt(c.q3Close), q4Open: fmt(c.q4Open), q4Close: fmt(c.q4Close) });
    setEditId(c._id); setModal(true);
  };

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.name || !form.goalSettingOpen) { toast.error('Name and Goal Setting Open date are required'); return; }
    setSaving(true);
    try {
      if (editId) { await api.patch(`/cycles/${editId}`, form); toast.success('Cycle updated'); }
      else { await api.post('/cycles', form); toast.success('Cycle created'); }
      setModal(false); fetchCycles();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const activate = async (id) => {
    try { await api.patch(`/cycles/${id}/activate`); toast.success('Cycle activated'); fetchCycles(); }
    catch (err) { toast.error('Failed'); }
  };

  const PHASE_LABELS = { goal_setting: 'Goal Setting Open', q1: 'Q1 Check-in', q2: 'Q2 Check-in', q3: 'Q3 Check-in', q4: 'Annual Review', closed: 'Closed' };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div><h1>Cycle Management</h1><p>Configure performance cycles and check-in windows</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Cycle</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cycles.map(c => {
          const phase = c.isActive ? (
            (() => {
              const now = new Date();
              if (now >= new Date(c.goalSettingOpen) && (!c.goalSettingClose || now <= new Date(c.goalSettingClose))) return 'goal_setting';
              if (c.q1Open && now >= new Date(c.q1Open) && (!c.q1Close || now <= new Date(c.q1Close))) return 'q1';
              if (c.q2Open && now >= new Date(c.q2Open) && (!c.q2Close || now <= new Date(c.q2Close))) return 'q2';
              if (c.q3Open && now >= new Date(c.q3Open) && (!c.q3Close || now <= new Date(c.q3Close))) return 'q3';
              if (c.q4Open && now >= new Date(c.q4Open) && (!c.q4Close || now <= new Date(c.q4Close))) return 'q4';
              return 'closed';
            })()
          ) : 'closed';

          return (
            <div key={c._id} className={`card ${c.isActive ? 'glow-blue' : ''}`}>
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-3">
                  <h3>{c.name}</h3>
                  {c.isActive && <span className="badge badge-approved">Active</span>}
                  {c.isActive && <span className="badge badge-draft">{PHASE_LABELS[phase]}</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><Edit size={12} /> Edit</button>
                  {!c.isActive && <button className="btn btn-primary btn-sm" onClick={() => activate(c._id)}><Zap size={12} /> Activate</button>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {[
                  ['Goal Setting', c.goalSettingOpen, c.goalSettingClose],
                  ['Q1 Check-in', c.q1Open, c.q1Close],
                  ['Q2 Check-in', c.q2Open, c.q2Close],
                  ['Q3 Check-in', c.q3Open, c.q3Close],
                  ['Annual Review', c.q4Open, c.q4Close],
                ].map(([label, open, close]) => (
                  <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-card-2)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{open ? new Date(open).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}</div>
                    {close && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>→ {new Date(close).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h3 style={{ marginBottom: 20 }}>{editId ? 'Edit Cycle' : 'Create Cycle'}</h3>
            <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label>Cycle Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="FY 2025-26" />
              </div>
              <div className="form-group">
                <label>Year *</label>
                <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 10, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase 1 — Goal Setting</h4>
              <div className="grid-2" style={{ gap: 12 }}>
                <DateField label="Opens *" value={form.goalSettingOpen} onChange={set('goalSettingOpen')} />
                <DateField label="Closes" value={form.goalSettingClose} onChange={set('goalSettingClose')} />
              </div>
            </div>

            {[['Q1 Check-in (July)', 'q1'], ['Q2 Check-in (October)', 'q2'], ['Q3 Check-in (January)', 'q3'], ['Annual Review (March–April)', 'q4']].map(([label, q]) => (
              <div key={q} style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 10, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</h4>
                <div className="grid-2" style={{ gap: 12 }}>
                  <DateField label="Opens" value={form[`${q}Open`]} onChange={set(`${q}Open`)} />
                  <DateField label="Closes" value={form[`${q}Close`]} onChange={set(`${q}Close`)} />
                </div>
              </div>
            ))}

            <div className="flex gap-3 mt-4">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
                {editId ? 'Save Changes' : 'Create Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
