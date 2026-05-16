import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Lock, Edit } from 'lucide-react';

const STATUS_OPTIONS = ['not_started', 'on_track', 'completed'];

const UOM_LABELS = {
  numeric_min: 'Numeric ↑', numeric_max: 'Numeric ↓',
  percent_min: '% ↑', percent_max: '% ↓', timeline: 'Timeline', zero: 'Zero-based',
};

export default function GoalDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [sheet, setSheet] = useState(null);
  const [actuals, setActuals] = useState({});
  const [activeQuarter, setActiveQuarter] = useState('q1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/goals/${id}`).then(res => {
      const s = res.data.goal;
      setSheet(s);
      // Init actuals from existing data
      const init = {};
      s.goals.forEach(g => {
        init[g._id] = {
          q1: { actual: g.q1Actual ?? '', status: g.q1Status || 'not_started' },
          q2: { actual: g.q2Actual ?? '', status: g.q2Status || 'not_started' },
          q3: { actual: g.q3Actual ?? '', status: g.q3Status || 'not_started' },
          q4: { actual: g.q4Actual ?? '', status: g.q4Status || 'not_started' },
        };
      });
      setActuals(init);
    });
  }, [id]);

  const handleSaveActuals = async () => {
    setSaving(true);
    try {
      const goalUpdates = sheet.goals.map(g => ({
        goalId: g._id,
        actual: actuals[g._id]?.[activeQuarter]?.actual,
        status: actuals[g._id]?.[activeQuarter]?.status || 'not_started',
      }));
      await api.patch(`/goals/${id}/actuals`, { quarter: activeQuarter, goalUpdates });
      toast.success(`${activeQuarter.toUpperCase()} actuals saved!`);
      const res = await api.get(`/goals/${id}`);
      setSheet(res.data.goal);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!sheet) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const canEnterActuals = sheet.status === 'locked' && user.role === 'employee';
  const quarters = ['q1', 'q2', 'q3', 'q4'];

  return (
    <div>
      <div className="page-header">
        <Link to="/goals" className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}><ArrowLeft size={14} /> Back</Link>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1>Goal Sheet</h1>
              <span className={`badge badge-${sheet.status}`}>
                {sheet.status === 'locked' && <><Lock size={10} /> </>}{sheet.status}
              </span>
            </div>
            <p>{sheet.cycleId?.name} · {sheet.employeeId?.name}</p>
          </div>
          {['draft', 'returned'].includes(sheet.status) && user.role === 'employee' && (
            <Link to={`/goals/${id}/edit`} className="btn btn-secondary"><Edit size={14} /> Edit</Link>
          )}
        </div>
      </div>

      {/* Manager comments */}
      {sheet.managerComments && (
        <div className={`alert ${sheet.status === 'returned' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 20 }}>
          <strong>Manager note:</strong> {sheet.managerComments}
          {sheet.approvedBy && <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>— {sheet.approvedBy?.name}</span>}
        </div>
      )}

      {/* Quarter selector (for actuals entry) */}
      {sheet.status === 'locked' && (
        <div className="card card-sm" style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>VIEW QUARTER:</span>
            {quarters.map(q => (
              <button key={q} onClick={() => setActiveQuarter(q)}
                className={`btn btn-sm ${activeQuarter === q ? 'btn-primary' : 'btn-secondary'}`}>
                {q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Goals table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Goal</th>
                <th>Thrust Area</th>
                <th>UoM</th>
                <th>Target</th>
                <th>Weight</th>
                {sheet.status === 'locked' && (
                  <>
                    <th>{activeQuarter.toUpperCase()} Actual</th>
                    <th>Score</th>
                    <th>Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sheet.goals.map((g, idx) => (
                <tr key={g._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{g.title}</div>
                    {g.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.description}</div>}
                    {g.isShared && <span className="badge" style={{ background: 'var(--purple-bg)', color: 'var(--purple)', marginTop: 4 }}>Shared</span>}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{g.thrustArea}</td>
                  <td><span className="badge badge-draft">{UOM_LABELS[g.uomType]}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{g.uomType === 'timeline' ? g.target?.slice(0, 10) : g.target}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>{g.weightage}%</td>
                  {sheet.status === 'locked' && (
                    <>
                      <td>
                        {canEnterActuals ? (
                          g.uomType === 'zero' ? (
                            <select value={actuals[g._id]?.[activeQuarter]?.actual ?? ''} onChange={e => setActuals(a => ({ ...a, [g._id]: { ...a[g._id], [activeQuarter]: { ...a[g._id]?.[activeQuarter], actual: e.target.value } } }))} style={{ width: 80 }}>
                              <option value="">—</option>
                              <option value="0">0</option>
                              <option value="1+">1+</option>
                            </select>
                          ) : g.uomType === 'timeline' ? (
                            <input type="date" value={actuals[g._id]?.[activeQuarter]?.actual ?? ''}
                              onChange={e => setActuals(a => ({ ...a, [g._id]: { ...a[g._id], [activeQuarter]: { ...a[g._id]?.[activeQuarter], actual: e.target.value } } }))}
                              style={{ width: 140 }} />
                          ) : (
                            <input type="number" value={actuals[g._id]?.[activeQuarter]?.actual ?? ''}
                              onChange={e => setActuals(a => ({ ...a, [g._id]: { ...a[g._id], [activeQuarter]: { ...a[g._id]?.[activeQuarter], actual: e.target.value } } }))}
                              style={{ width: 100 }} placeholder="Enter actual" />
                          )
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{g[`${activeQuarter}Actual`] ?? '—'}</span>
                        )}
                      </td>
                      <td>
                        {g[`${activeQuarter}Score`] != null ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: g[`${activeQuarter}Score`] >= 80 ? 'var(--green)' : g[`${activeQuarter}Score`] >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
                            {Math.round(g[`${activeQuarter}Score`])}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {canEnterActuals ? (
                          <select value={actuals[g._id]?.[activeQuarter]?.status || 'not_started'}
                            onChange={e => setActuals(a => ({ ...a, [g._id]: { ...a[g._id], [activeQuarter]: { ...a[g._id]?.[activeQuarter], status: e.target.value } } }))}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        ) : (
                          <span className={`badge badge-${g[`${activeQuarter}Status`]}`}>{g[`${activeQuarter}Status`]?.replace('_', ' ')}</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canEnterActuals && (
        <button className="btn btn-primary btn-lg" onClick={handleSaveActuals} disabled={saving}>
          {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Save size={16} />}
          Save {activeQuarter.toUpperCase()} Actuals
        </button>
      )}
    </div>
  );
}
