import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { RefreshCw } from 'lucide-react';

const ACTION_COLORS = {
  created: 'var(--accent)', updated: 'var(--yellow)', approved: 'var(--green)',
  submitted: 'var(--purple)', returned: 'var(--red)', unlocked: 'var(--yellow)',
  actuals_updated: 'var(--accent)', checkin: 'var(--green)',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    const q = filterAction ? `?action=${filterAction}` : '';
    api.get(`/audit${q}`).then(res => setLogs(res.data.logs || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [filterAction]);

  const actions = ['created', 'updated', 'submitted', 'approved', 'returned', 'unlocked', 'actuals_updated', 'checkin'];

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div><h1>Audit Log</h1><p>All changes made to goal sheets — who did what and when</p></div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLogs}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="flex gap-2" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterAction('')} className={`btn btn-sm ${filterAction === '' ? 'btn-primary' : 'btn-secondary'}`}>All</button>
        {actions.map(a => (
          <button key={a} onClick={() => setFilterAction(a)} className={`btn btn-sm ${filterAction === a ? 'btn-primary' : 'btn-secondary'}`}>
            {a.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Entity</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${ACTION_COLORS[log.action] || 'var(--text-muted)'}22`, color: ACTION_COLORS[log.action] || 'var(--text-muted)' }}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.performedBy?.name || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.performedBy?.role}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {log.entityId?.toString().slice(-8)}
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{log.note || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>No audit entries found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
