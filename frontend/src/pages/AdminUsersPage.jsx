import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, UserCheck, UserX } from 'lucide-react';

const EMPTY_USER = { name: '', email: '', password: '', role: 'employee', department: '', employeeId: '', managerId: '' };
const ROLES = ['employee', 'manager', 'admin'];
const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations', 'Product', 'Design'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY_USER);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    Promise.all([api.get('/users'), api.get('/users/managers')]).then(([u, m]) => {
      setUsers(u.data.users || []);
      setManagers(m.data.managers || []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setForm(EMPTY_USER); setEditId(null); setModal('create'); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department, employeeId: u.employeeId || '', managerId: u.managerId?._id || '' });
    setEditId(u._id);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!editId && !form.password) || !form.role || !form.department) {
      toast.error('Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, managerId: form.managerId || null };
      if (editId && !payload.password) delete payload.password;
      if (editId) {
        await api.patch(`/users/${editId}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users', payload);
        toast.success('User created');
      }
      setModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const roleColor = { employee: 'var(--accent)', manager: 'var(--purple)', admin: 'var(--green)' };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>User Management</h1>
          <p>{users.length} users · {users.filter(u => u.isActive).length} active</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add User</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or department…" style={{ maxWidth: 360 }} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Department</th>
              <th>Manager</th>
              <th>Emp ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </td>
                <td>
                  <span className="badge" style={{ background: `${roleColor[u.role]}22`, color: roleColor[u.role] }}>{u.role}</span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.department}</td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{u.managerId?.name || '—'}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.employeeId || '—'}</td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-returned'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}><Edit size={12} /></button>
                    <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(u)}>
                      {u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>{modal === 'create' ? 'Create User' : 'Edit User'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
                </div>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP001" />
                </div>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
              </div>
              <div className="form-group">
                <label>{modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label>Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Manager (L1)</label>
                <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
                  <option value="">No manager</option>
                  {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.department})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : null}
                {modal === 'create' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
