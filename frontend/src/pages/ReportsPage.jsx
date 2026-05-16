import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Download, BarChart3, Users, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [cycleId, setCycleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('achievement');

  useEffect(() => {
    api.get('/cycles').then(res => {
      setCycles(res.data.cycles || []);
      const active = res.data.cycles.find(c => c.isActive);
      if (active) setCycleId(active._id);
    });
  }, []);

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    Promise.all([
      api.get(`/reports/achievement?cycleId=${cycleId}`),
      api.get(`/reports/completion?cycleId=${cycleId}`),
    ]).then(([a, c]) => {
      setRows(a.data.rows || []);
      setCompletion(c.data.rows || []);
    }).finally(() => setLoading(false));
  }, [cycleId]);

  const exportCSV = async () => {
    const res = await api.get(`/reports/achievement?cycleId=${cycleId}&format=csv`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'achievement_report.csv'; a.click();
  };

  // Chart data: avg score per department
  const deptMap = {};
  rows.forEach(r => {
    if (!deptMap[r.department]) deptMap[r.department] = { total: 0, count: 0 };
    if (r.q1Score) { deptMap[r.department].total += Number(r.q1Score); deptMap[r.department].count++; }
  });
  const chartData = Object.entries(deptMap).map(([dept, v]) => ({ dept, avg: v.count ? Math.round(v.total / v.count) : 0 }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Achievement tracking and completion dashboard</p>
        </div>
        <div className="flex gap-3 items-center">
          <select value={cycleId} onChange={e => setCycleId(e.target.value)} style={{ width: 180 }}>
            {cycles.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: 20 }}>
        {['achievement', 'completion', 'analytics'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div> : (
        <>
          {tab === 'achievement' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Dept</th>
                    <th>Goal</th>
                    <th>Thrust Area</th>
                    <th>Target</th>
                    <th>Q1 Actual</th>
                    <th>Q1 Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{r.employee}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.department}</td>
                      <td>{r.goalTitle}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.thrustArea}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.target}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.q1Actual || '—'}</td>
                      <td>
                        {r.q1Score ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: r.q1Score >= 80 ? 'var(--green)' : r.q1Score >= 50 ? 'var(--yellow)' : 'var(--red)' }}>
                            {Math.round(r.q1Score)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td><span className={`badge badge-${r.q1Status}`}>{r.q1Status?.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'completion' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Sheet Status</th>
                    <th>Q1 ✓</th>
                    <th>Q2 ✓</th>
                    <th>Q3 ✓</th>
                    <th>Q4 ✓</th>
                  </tr>
                </thead>
                <tbody>
                  {completion.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{r.employee}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.department}</td>
                      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      {['q1Done', 'q2Done', 'q3Done', 'q4Done'].map(q => (
                        <td key={q} style={{ textAlign: 'center', fontSize: '1rem' }}>{r[q] ? '✅' : '⬜'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'analytics' && (
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Q1 Average Score by Department</h3>
                {chartData.length === 0 ? <p>No data yet — actuals need to be entered first.</p> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="dept" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={v => [`${v}%`, 'Avg Score']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                      <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid-3">
                <div className="card stat-card">
                  <BarChart3 size={20} color="var(--accent)" />
                  <div className="stat-value" style={{ color: 'var(--accent)' }}>{rows.length}</div>
                  <div className="stat-label">Total Goal Entries</div>
                </div>
                <div className="card stat-card">
                  <Users size={20} color="var(--purple)" />
                  <div className="stat-value" style={{ color: 'var(--purple)' }}>{[...new Set(rows.map(r => r.employee))].length}</div>
                  <div className="stat-label">Employees with Goals</div>
                </div>
                <div className="card stat-card">
                  <CheckSquare size={20} color="var(--green)" />
                  <div className="stat-value" style={{ color: 'var(--green)' }}>
                    {completion.filter(r => r.q1Done).length}/{completion.length}
                  </div>
                  <div className="stat-label">Q1 Check-ins Done</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
