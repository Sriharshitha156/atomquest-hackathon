import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, MessageSquare } from 'lucide-react';

const QUARTERS = ['q1', 'q2', 'q3', 'q4'];

export default function CheckinPage() {
  const { id } = useParams();
  const [sheet, setSheet] = useState(null);
  const [activeQ, setActiveQ] = useState('q1');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/goals/${id}`).then(res => setSheet(res.data.goal));
  }, [id]);

  const handleCheckin = async () => {
    if (!comment.trim()) { toast.error('Please enter a check-in comment'); return; }
    setSaving(true);
    try {
      await api.patch(`/goals/${id}/checkin`, { quarter: activeQ, comment });
      toast.success(`${activeQ.toUpperCase()} check-in saved!`);
      const res = await api.get(`/goals/${id}`);
      setSheet(res.data.goal);
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (!sheet) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const emp = sheet.employeeId;

  return (
    <div>
      <Link to="/team" className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <h1>Quarterly Check-in</h1>
        <p>{emp?.name} · {sheet.cycleId?.name}</p>
      </div>

      {/* Quarter tabs */}
      <div className="flex gap-2" style={{ marginBottom: 24 }}>
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setActiveQ(q)}
            className={`btn btn-sm ${activeQ === q ? 'btn-primary' : 'btn-secondary'}`}
            style={{ position: 'relative' }}>
            {q.toUpperCase()}
            {sheet[`${q}CheckinDone`] && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', border: '1px solid var(--bg)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Achievement table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Planned vs. Achievement — {activeQ.toUpperCase()}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Goal</th>
                <th>UoM</th>
                <th>Target</th>
                <th>Actual</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sheet.goals.map((g, i) => (
                <tr key={g._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{g.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.thrustArea} · Wt: {g.weightage}%</div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.uomType.replace('_', ' ')}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{g.target}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{g[`${activeQ}Actual`] ?? '—'}</td>
                  <td>
                    {g[`${activeQ}Score`] != null ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: g[`${activeQ}Score`] >= 80 ? 'var(--green)' : g[`${activeQ}Score`] >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
                        {Math.round(g[`${activeQ}Score`])}%
                      </span>
                    ) : '—'}
                  </td>
                  <td><span className={`badge badge-${g[`${activeQ}Status`]}`}>{g[`${activeQ}Status`]?.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment */}
      <div className="card">
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <MessageSquare size={18} color="var(--accent)" />
          <h3>Check-in Comment</h3>
          {sheet[`${activeQ}CheckinDone`] && <span className="badge badge-approved">✓ Done</span>}
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Discussion notes for {activeQ.toUpperCase()} *</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Document the discussion, observations, and any corrective actions agreed upon…"
            rows={5} />
        </div>
        <button className="btn btn-primary" onClick={handleCheckin} disabled={saving || !comment.trim()}>
          {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Save size={16} />}
          Save Check-in
        </button>
      </div>
    </div>
  );
}
