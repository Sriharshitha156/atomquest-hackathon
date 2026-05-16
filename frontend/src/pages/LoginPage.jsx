import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO_CREDS = [
  { role: 'Employee', email: 'employee@atomquest.com', password: 'Employee@123', color: 'var(--accent)' },
  { role: 'Manager', email: 'manager@atomquest.com', password: 'Manager@123', color: 'var(--purple)' },
  { role: 'Admin', email: 'admin@atomquest.com', password: 'Admin@123', color: 'var(--green)' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (cred) => { setEmail(cred.email); setPassword(cred.password); };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16,
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.05) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
          }}>⚛</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>AtomQuest</h1>
          <p style={{ fontSize: '0.875rem' }}>Goal Setting & Tracking Portal</p>
        </div>

        {/* Demo credentials */}
        <div className="card card-sm" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Login Demo</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {DEMO_CREDS.map(c => (
              <button key={c.role} onClick={() => quickLogin(c)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', color: c.color, borderColor: `${c.color}44` }}>
                {c.role}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          AtomQuest Hackathon 1.0 · Goal Portal
        </p>
      </div>
    </div>
  );
}
