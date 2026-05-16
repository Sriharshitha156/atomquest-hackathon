import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Target, Users, BarChart3, Settings,
  LogOut, ChevronDown, ShieldCheck, ClipboardList, Bell, Database
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
    {({ isActive }) => (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        borderRadius: 8, margin: '2px 8px', cursor: 'pointer', transition: 'all 0.15s',
        background: isActive ? 'var(--accent-glow)' : 'transparent',
        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
        border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
        fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
      }}>
        <Icon size={16} />
        {label}
      </div>
    )}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = { employee: 'var(--accent)', manager: 'var(--purple)', admin: 'var(--green)' }[user?.role] || 'var(--text-muted)';

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)'
            }}>⚛</div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>AtomQuest</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Goal Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/goals" icon={Target} label="My Goals" />

          {(user?.role === 'manager' || user?.role === 'admin') && (
            <>
              <div style={{ padding: '12px 20px 4px', fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Manager</div>
              <NavItem to="/team" icon={Users} label="Team Goals" />
              <NavItem to="/reports" icon={BarChart3} label="Reports" />
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div style={{ padding: '12px 20px 4px', fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</div>
              <NavItem to="/admin/users" icon={Users} label="Users" />
              <NavItem to="/admin/cycles" icon={Settings} label="Cycles" />
              <NavItem to="/admin/audit" icon={Database} label="Audit Log" />
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}55)`,
              border: `1px solid ${roleColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.875rem', fontWeight: 700, color: roleColor,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: roleColor, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
