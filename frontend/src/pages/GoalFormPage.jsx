import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const THRUST_AREAS = ['Delivery Excellence', 'Quality', 'Customer Success', 'Learning & Development', 'Reliability', 'Innovation', 'Cost Optimisation', 'People & Culture', 'Compliance & Governance'];
const UOM_TYPES = [
  { value: 'numeric_min', label: 'Numeric ↑ (Higher is better)', eg: 'Sales Revenue, Sprint Velocity' },
  { value: 'numeric_max', label: 'Numeric ↓ (Lower is better)', eg: 'TAT, Bug Count, Cost' },
  { value: 'percent_min', label: '% ↑ (Higher is better)', eg: 'CSAT Score, Completion Rate' },
  { value: 'percent_max', label: '% ↓ (Lower is better)', eg: 'Error Rate, Attrition %' },
  { value: 'timeline', label: 'Timeline (Date-based)', eg: 'Project delivery by date' },
  { value: 'zero', label: 'Zero-based (0 = Success)', eg: 'Safety Incidents, Critical Bugs' },
];

const emptyGoal = () => ({
  _localId: Math.random().toString(36).slice(2),
  title: '', description: '', thrustArea: '', uomType: 'numeric_min', target: '', weightage: 10,
});

export default function GoalFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([emptyGoal()]);
  const [cycle, setCycle] = useState(null);
  const [existingSheet, setExistingSheet] = useState(null);
  const [saving, setSaving] = useState(false);

  const totalWeight = goals.reduce((s, g) => s + Number(g.weightage || 0), 0);
  const isValid = totalWeight === 100 && goals.every(g => g.title && g.thrustArea && g.uomType && g.target && Number(g.weightage) >= 10) && goals.length <= 8;

  useEffect(() => {
    api.get('/cycles/active').then(res => setCycle(res.data.cycle)).catch(() => {});
    if (id) {
      api.get(`/goals/${id}`).then(res => {
        const sheet = res.data.goal;
        setExistingSheet(sheet);
        setGoals(sheet.goals.map(g => ({ ...g, _localId: Math.random().toString(36).slice(2) })));
      });
    }
  }, [id]);

  const addGoal = () => {
    if (goals.length >= 8) { toast.error('Maximum 8 goals allowed'); return; }
    setGoals([...goals, emptyGoal()]);
  };

  const removeGoal = (lid) => {
    if (goals.length === 1) { toast.error('At least 1 goal required'); return; }
    setGoals(goals.filter(g => g._localId !== lid));
  };

  const updateGoal = (lid, field, value) => {
    setGoals(goals.map(g => g._localId === lid ? { ...g, [field]: value } : g));
  };

  const handleSave = async (submit = false) => {
    if (!cycle) { toast.error('No active cycle found'); return; }
    setSaving(true);
    try {
      const payload = { cycleId: cycle._id, goals: goals.map(({ _localId, ...g }) => ({ ...g, weightage: Number(g.weightage) })) };
      let sheetId = existingSheet?._id;
      const res = await (sheetId ? api.put(`/goals/${sheetId}`, payload) : api.post('/goals', payload));
      sheetId = res.data.goal._id;
      if (submit) {
        await api.patch(`/goals/${sheetId}/submit`);
        toast.success('Goals submitted for manager approval!');
      } else {
        toast.success('Draft saved!');
      }
      navigate('/goals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const weightLeft = 100 - totalWeight;

  return (
    <div>
      <div className="page-header">
        <h1>{existingSheet ? 'Edit Goal Sheet' : 'Create Goal Sheet'}</h1>
        <p>{cycle?.name || 'Loading cycle…'} · {goals.length}/8 goals defined</p>
      </div>

      {/* Weightage indicator */}
      <div className="card card-sm" style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Weightage</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: totalWeight === 100 ? 'var(--green)' : totalWeight > 100 ? 'var(--red)' : 'var(--yellow)', fontSize: '1.1rem' }}>
            {totalWeight}%
          </span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${totalWeight === 100 ? 'green' : totalWeight > 100 ? '' : 'yellow'}`}
            style={{ width: `${Math.min(totalWeight, 100)}%`, background: totalWeight > 100 ? 'var(--red)' : undefined }} />
        </div>
        {totalWeight !== 100 && (
          <p style={{ fontSize: '0.75rem', marginTop: 6 }}>
            {totalWeight < 100 ? `${weightLeft}% remaining to allocate` : `${totalWeight - 100}% over limit — reduce weightage`}
          </p>
        )}
      </div>

      {/* Goals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {goals.map((g, idx) => (
          <div key={g._localId} className="card" style={{ borderLeft: `3px solid ${g.isShared ? 'var(--purple)' : 'var(--border)'}` }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)' }}>
                  {idx + 1}
                </div>
                <h4>{g.title || `Goal ${idx + 1}`}</h4>
                {g.isShared && <span className="badge" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>Shared</span>}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeGoal(g._localId)} disabled={g.isShared}>
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div className="form-group">
                <label>Goal Title *</label>
                <input value={g.title} onChange={e => updateGoal(g._localId, 'title', e.target.value)}
                  placeholder="e.g. Increase Sprint Velocity" disabled={g.isShared} />
              </div>
              <div className="form-group">
                <label>Thrust Area *</label>
                <select value={g.thrustArea} onChange={e => updateGoal(g._localId, 'thrustArea', e.target.value)} disabled={g.isShared}>
                  <option value="">Select thrust area…</option>
                  {THRUST_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Description</label>
              <textarea value={g.description} onChange={e => updateGoal(g._localId, 'description', e.target.value)}
                placeholder="What does success look like?" rows={2} disabled={g.isShared} />
            </div>

            <div className="grid-3" style={{ gap: 12 }}>
              <div className="form-group">
                <label>Unit of Measurement *</label>
                <select value={g.uomType} onChange={e => updateGoal(g._localId, 'uomType', e.target.value)} disabled={g.isShared}>
                  {UOM_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {UOM_TYPES.find(u => u.value === g.uomType)?.eg}
                </span>
              </div>
              <div className="form-group">
                <label>Target *</label>
                {g.uomType === 'timeline'
                  ? <input type="date" value={g.target} onChange={e => updateGoal(g._localId, 'target', e.target.value)} disabled={g.isShared} />
                  : <input type={g.uomType === 'zero' ? 'text' : 'number'} value={g.target}
                      onChange={e => updateGoal(g._localId, 'target', e.target.value)}
                      placeholder={g.uomType === 'zero' ? '0' : 'Target value'}
                      readOnly={g.uomType === 'zero'} defaultValue={g.uomType === 'zero' ? '0' : ''}
                      disabled={g.isShared} />}
              </div>
              <div className="form-group">
                <label>Weightage (min 10%) *</label>
                <input type="number" min={10} max={100} value={g.weightage}
                  onChange={e => updateGoal(g._localId, 'weightage', Number(e.target.value))}
                  placeholder="10–100" />
                {Number(g.weightage) < 10 && <span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>Minimum 10%</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add goal */}
      {goals.length < 8 && (
        <button className="btn btn-secondary" onClick={addGoal} style={{ width: '100%', justifyContent: 'center', marginBottom: 24, padding: 14, borderStyle: 'dashed' }}>
          <Plus size={16} /> Add Goal ({goals.length}/8)
        </button>
      )}

      {/* Validation summary */}
      {!isValid && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />
          {totalWeight !== 100 && `Total weightage must be exactly 100% (currently ${totalWeight}%). `}
          {goals.some(g => Number(g.weightage) < 10) && 'Each goal must have at least 10% weightage. '}
          {goals.some(g => !g.title || !g.thrustArea || !g.target) && 'All fields are required. '}
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn btn-secondary" onClick={() => navigate('/goals')}>Cancel</button>
        <button className="btn btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
          Save Draft
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => handleSave(true)} disabled={!isValid || saving}>
          <CheckCircle size={16} /> Save & Submit for Approval
        </button>
      </div>
    </div>
  );
}
