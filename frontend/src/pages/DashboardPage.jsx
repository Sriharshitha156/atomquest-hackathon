import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Target, CheckCircle, Clock, AlertCircle, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = { draft: '#6b7fa3', submitted: '#f59e0b', returned: '#ef4444', locked: '#10b981', approved: '#10b981' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/cycles/active').catch(() => null),
      api.get('/goals/my').catch(() => ({ data: { goals: [] } })),
      (user.role !== 'employee') ? api.get('/goals/team') : Promise.resolve(null),
    ]).then(([cycleRes, goalsRes, teamRes]) => {
      setCycle(cycleRes?.data);
      setGoals(goalsRes.data.goals || []);
      if (teamRes) {
        const sheets = teamRes.data.goals || [];
        const stats = { total: sheets.length, submitted: 0, locked: 0, draft: 0, returned: 0 };
        sheets.forEach(s => { if (stats[s.status] !== undefined) stats[s.status]++; });
        setTeamStats(stats);
      }
    }).finally(() => setLoading(false));
  }, [user.role]);

  const activeGoal = goals[0];
  const phase = cycle?.phase || 'closed';

  const phaseLabel = {
    goal_setting: '🟢 Goal Setting Open',
    q1: '📊 Q1 Check-in Open',
    q2: '📊 Q2 Check-in Open',
    q3: '📊 Q3 Check-in Open',
    q4: '📊 Annual Review Open',
    closed: '🔒 No Active Phase',
  }[phase];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const goalCount = activeGoal?.goals?.length || 0;
  const lockedGoals = activeGoal?.goals?.filter(g => activeGoal.status === 'locked') || [];
  const completedQ1 = activeGoal?.goals?.filter(g => g.q1Status === 'completed').length || 0;

  const weightageData = activeGoal?.goals?.map(g => ({ name: g.title.slice(0, 20), value: g.weightage })) || [];
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Welcome, {user.name.split(' ')[0]} 👋</h1>
          <p>{cycle?.cycle?.name || 'No active cycle'} · <span style={{ color: phase === 'closed' ? 'var(--text-dim)' : 'var(--green)' }}>{phaseLabel}</span></p>
        </div>
        {phase === 'goal_setting' && (
          <Link to={activeGoal ? `/goals/${activeGoal._id}/edit` : '/goals/new'} className="btn btn-primary">
            <Plus size={16} /> {activeGoal ? 'Edit Goals' : 'Create Goals'}
          </Link>
        )}
      </div>

      {/* Status banner for employee */}
      {user.role === 'employee' && activeGoal && (
        <div className={`alert alert-${activeGoal.status === 'locked' ? 'success' : activeGoal.status === 'returned' ? 'error' : activeGoal.status === 'submitted' ? 'warning' : 'info'}`} style={{ marginBottom: 24 }}>
          {activeGoal.status === 'locked' && '✅ Your goals are approved and locked.'}
          {activeGoal.status === 'submitted' && '⏳ Your goals are submitted and awaiting manager approval.'}
          {activeGoal.status === 'returned' && `❗ Your goals were returned: "${activeGoal.managerComments}"`}
          {activeGoal.status === 'draft' && '📝 You have a draft goal sheet. Submit it for approval.'}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <Target size={20} color="var(--accent)" />
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{goalCount}</div>
          <div className="stat-label">Goals Defined</div>
        </div>
        <div className="card stat-card">
          <CheckCircle size={20} color="var(--green)" />
          <div className="stat-value" style={{ color: 'var(--green)' }}>{completedQ1}</div>
          <div className="stat-label">Q1 Completed</div>
        </div>
        <div className="card stat-card">
          <Clock size={20} color="var(--yellow)" />
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>
            {activeGoal?.goals?.filter(g => g.q1Status === 'on_track').length || 0}
          </div>
          <div className="stat-label">On Track Q1</div>
        </div>
        <div className="card stat-card">
          <TrendingUp size={20} color="var(--purple)" />
          <div className="stat-value" style={{ color: 'var(--purple)' }}>
            {activeGoal?.goals?.length > 0
              ? Math.round(activeGoal.goals.reduce((s, g) => s + (g.q1Score || 0), 0) / activeGoal.goals.filter(g => g.q1Score != null).length || 0)
              : '—'}%
          </div>
          <div className="stat-label">Avg Q1 Score</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Goals list */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h3>My Goals</h3>
            <Link to="/goals" className="btn btn-secondary btn-sm">View All <ArrowRight size={12} /></Link>
          </div>
          {!activeGoal || activeGoal.goals.length === 0 ? (
            <div className="empty-state">
              <Target size={32} />
              <p>No goals yet. {phase === 'goal_setting' && <Link to="/goals/new">Create your goals →</Link>}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeGoal.goals.map((g, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-card-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{g.title}</span>
                    <span className={`badge badge-${g.q1Status}`}>{g.q1Status?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className={`progress-fill ${g.q1Score > 80 ? 'green' : g.q1Score > 50 ? 'yellow' : ''}`}
                        style={{ width: `${Math.min(g.q1Score || 0, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 36 }}>
                      {g.q1Score != null ? `${Math.round(g.q1Score)}%` : '—'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{g.weightage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weightage pie OR team stats */}
        <div>
          {weightageData.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Weightage Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={weightageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {weightageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, 'Weightage']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {weightageData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {teamStats && (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Team Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(teamStats).filter(([k]) => k !== 'total').map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className={`badge badge-${status}`}>{status}</span>
                    <div className="flex items-center gap-3" style={{ flex: 1, marginLeft: 12 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${teamStats.total ? (count / teamStats.total) * 100 : 0}%` }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', minWidth: 20 }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
