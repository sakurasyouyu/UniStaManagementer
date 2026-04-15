import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CheckSquare, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { signOut } from './utils/storage';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Tasks from './pages/Tasks';
import CalendarView from './pages/CalendarView';
import Login from './pages/Login';

const Sidebar = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <LayoutDashboard size={28} />
        UniSta
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/timetable" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CalendarDays size={20} />
          Timetable
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={20} />
          Tasks & Assignments
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CalendarIcon size={20} />
          Yearly Schedule
        </NavLink>
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        {user && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
        )}
        <button className="nav-item" style={{ width: '100%', border: 'none', background: 'transparent' }} onClick={handleSignOut}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

const AppShell = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<CalendarView />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
