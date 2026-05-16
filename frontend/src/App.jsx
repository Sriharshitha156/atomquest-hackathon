import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/shared/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import GoalFormPage from './pages/GoalFormPage';
import GoalDetailPage from './pages/GoalDetailPage';
import TeamGoalsPage from './pages/TeamGoalsPage';
import CheckinPage from './pages/CheckinPage';
import ReportsPage from './pages/ReportsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCyclesPage from './pages/AdminCyclesPage';
import AuditPage from './pages/AuditPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/new" element={<GoalFormPage />} />
        <Route path="goals/:id" element={<GoalDetailPage />} />
        <Route path="goals/:id/edit" element={<GoalFormPage />} />
        <Route path="team" element={<ProtectedRoute roles={['manager','admin']}><TeamGoalsPage /></ProtectedRoute>} />
        <Route path="checkin/:id" element={<ProtectedRoute roles={['manager','admin']}><CheckinPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['manager','admin']}><ReportsPage /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="admin/cycles" element={<ProtectedRoute roles={['admin']}><AdminCyclesPage /></ProtectedRoute>} />
        <Route path="admin/audit" element={<ProtectedRoute roles={['admin']}><AuditPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#111827', color: '#e8edf5', border: '1px solid #1e2d45' },
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
