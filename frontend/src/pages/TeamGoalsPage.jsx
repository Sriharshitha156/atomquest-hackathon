import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, MessageSquare, Filter } from 'lucide-react';

export default function TeamGoalsPage() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [approving, setApproving] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [returnReason, setReturnReason] = useState('');

  const fetchSheets = () => {
    api.get('/goals/team').then(res => setSheets(res.data.goals || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetchSheets(); }, []);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await api.patch(`/goals/${id}/approve`);
      toast.success('Goal sheet approved and locked!');
      fetchSheets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setApproving(null);
    }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) { toast.error('Please enter a reason'); return; }
    try {
      await api.patch(`/goals/${returnModal}/return`, { reason: returnReason });
      toast.success('Returned for revision');
      setReturnModal(null); setReturnReason('');
      fetchSheets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
  };

  const filtered = filter === 'all' ? sheets : sheets.filter(s => s.status === filter);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const counts = { all: sheets.length, submitted: 0, draft: 0, locked: 0, returned: 0 };
  sheets.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });

  return (
    <div>
      <div className="page-header">
        <h1>Team Goals</h1>
        <p>Review and approve your team's goal sheets</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2" style={{ marginBottom: 20 }}>
        {['all', 'submitted', 'draft', 'returned', 'locked'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] > 0 && <span style={{ marginLeft: 4, background: filter === f ? 'rgba(255,255,255,0.2)' : 'var(--border)', padding: '0 5px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{counts[f]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state"><p>No goal sheets found for this filter.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Goals</th>
                <th>Total Weight</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sheet => {
                const totalW = sheet.goals.reduce((s, g) => s + g.weightage, 0);
                return (
                  <tr key={sheet._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{sheet.employeeId?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sheet.employeeId?.employeeId}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{sheet.employeeId?.department}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{sheet.goals.length}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: totalW === 100 ? 'var(--green)' : 'var(--red)' }}>{totalW}%</span>
                    </td>
                    <td><span className={`badge badge-${sheet.status}`}>{sheet.status}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/goals/${sheet._id}`} className="btn btn-secondary btn-sm"><Eye size={12} /></Link>
                        {sheet.status === 'locked' && (
                          <Link to={`/checkin/${sheet._id}`} className="btn btn-secondary btn-sm"><MessageSquare size={12} /> Check-in</Link>
                        )}
                        {sheet.status === 'submitted' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(sheet._id)} disabled={approving === sheet._id}>
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setReturnModal(sheet._id)}>
                              <XCircle size={12} /> Return
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Return modal */}
      {returnModal && (
        <div className="modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Return for Revision</h3>
            <div className="form-group">
              <label>Reason for returning *</label>
              <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Explain what needs to be changed…" rows={4} />
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn btn-secondary" onClick={() => setReturnModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReturn}>Return to Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
