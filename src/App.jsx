import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { initializeData } from './data/sampleData';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Forecasting from './pages/Forecasting';
import Insights from './pages/Insights';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/inventory', label: 'Inventory', icon: '📦' },
  { path: '/sales', label: 'Sales', icon: '💰' },
  { path: '/forecasting', label: 'Forecasting', icon: '🔮' },
  { path: '/insights', label: 'AI Insights', icon: '🧠' },
];

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your cafeteria performance' },
  '/inventory': { title: 'Inventory Management', subtitle: 'Track and manage your stock levels' },
  '/sales': { title: 'Sales Tracking', subtitle: 'Record and analyze sales transactions' },
  '/forecasting': { title: 'Forecasting', subtitle: 'ML-powered predictions for next month' },
  '/insights': { title: 'AI Insights', subtitle: 'Deep analysis and recommendations' },
};

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageInfo = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* Mobile menu button */}
      <button
        className="btn-icon"
        id="mobile-menu-toggle"
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 200,
          display: 'none',
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>CafeIQ</h1>
          <p>Management System</p>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>CafeIQ v1.0</p>
          <p style={{ marginTop: 4, fontSize: '0.7rem' }}>© 2026 College Cafeteria</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="page-header">
          <h2>{pageInfo.title}</h2>
          <p>{pageInfo.subtitle}</p>
        </header>

        <div className="page-body fade-in" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/forecasting" element={<Forecasting />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
