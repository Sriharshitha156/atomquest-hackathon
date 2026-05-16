import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Eye, Edit, Send, Target, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function GoalsPage() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchGoals = () => {
    api.get('/goals/my').then(res => setSheets(res.data.goals || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (id) => {
    setSubmitting(id);
    try {
      await api.patch(`/goals/${id}/submit`);
      toast.success('Goals submitted for approval!');
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(null);
    }
  };

  const totalWeight = (goals) => goals.reduce((s, g) => s + g.weightage, 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>My Goals</h1>
          <p>Manage your goal sheets across cycles</p>
        </div>
        <Link to="/goals/new" className="btn btn-primary">
          <Plus size={16} /> New Goal Sheet
        </Link>
      </div>

      {sheets.length === 0 ? (
        <div className="card empty-state">
          <Target size={48} />
          <h3 style={{ marginTop: 12 }}>No goal sheets yet</h3>
          <p>Create your first goal sheet to get started</p>
          <Link to="/goals/new" className="btn btn-primary" style={{ marginTop: 16 }}>
            <Plus size={16} /> Create Goal Sheet
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sheets.map(sheet => (
            <div key={sheet._id} className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <div>
                  <div className="flex items-center gap-3">
                    <h3>{sheet.cycleId?.name || 'Unknown Cycle'}</h3>
                    <span className={`badge badge-${sheet.status}`}>
                      {sheet.status === 'locked' ? <><Lock size={10} /> Locked</> : sheet.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    {sheet.goals.length} goals · Total weight: {' '}
                    <span style={{ color: totalWeight(sheet.goals) === 100 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                      {totalWeight(sheet.goals)}%
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/goals/${sheet._id}`} className="btn btn-secondary btn-sm"><Eye size={14} /> View</Link>
                  {['draft', 'returned'].includes(sheet.status) && (
                    <>
                      <Link to={`/goals/${sheet._id}/edit`} className="btn btn-secondary btn-sm"><Edit size={14} /> Edit</Link>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(sheet._id)} disabled={submitting === sheet._id || totalWeight(sheet.goals) !== 100}>
                        <Send size={14} /> Submit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {sheet.managerComments && (
                <div className={`alert ${sheet.status === 'returned' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 12 }}>
                  <strong>Manager note:</strong> {sheet.managerComments}
                </div>
              )}

              {/* Goals summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sheet.goals.map((g, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-card-2)', borderRadius: 8 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.thrustArea} · {g.uomType.replace('_', ' ')}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{g.weightage}%</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>weight</div>
                    </div>
                    <span className={`badge badge-${g.q1Status}`} style={{ flexShrink: 0 }}>{g.q1Status?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
