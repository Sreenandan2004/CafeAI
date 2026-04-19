import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { initializeData } from './data/sampleData';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Forecasting from './pages/Forecasting';
import Insights from './pages/Insights';
import CustomerOrder from './pages/CustomerOrder';
import KitchenDisplay from './pages/KitchenDisplay';

const NAV_BY_ROLE = {
  admin: [
    { path: '/',            label: 'Dashboard',    icon: '📊' },
    { path: '/inventory',   label: 'Inventory',    icon: '📦' },
    { path: '/sales',       label: 'Sales',        icon: '💰' },
    { path: '/forecasting', label: 'Forecasting',  icon: '🔮' },
    { path: '/insights',    label: 'AI Insights',  icon: '🧠' },
    { path: '/kitchen',     label: 'Kitchen',      icon: '👨‍🍳' },
    { path: '/order',       label: 'Menu',         icon: '🛒' },
  ],
  kitchen: [
    { path: '/kitchen', label: 'Kitchen Queue', icon: '👨‍🍳' },
    { path: '/order',   label: 'View Menu',     icon: '🛒' },
  ],
  customer: [
    { path: '/order', label: 'Order Food', icon: '🛒' },
  ],
};

const PAGE_TITLES = {
  '/':            { title: 'Dashboard',       subtitle: 'Overview of your cafeteria performance' },
  '/inventory':   { title: 'Inventory',       subtitle: 'Track and manage your stock levels' },
  '/sales':       { title: 'Sales Tracking',  subtitle: 'Record and analyze sales transactions' },
  '/forecasting': { title: 'Forecasting',     subtitle: 'ML-powered predictions for next month' },
  '/insights':    { title: 'AI Insights',     subtitle: 'Deep analysis and recommendations' },
  '/kitchen':     { title: 'Kitchen Display', subtitle: 'Manage and update live orders' },
  '/order':       { title: 'Order Food',      subtitle: 'Browse our menu and place your order' },
};

const ROLE_BADGES = {
  admin:    { label: 'Admin',         color: '#667eea' },
  kitchen:  { label: 'Kitchen Staff', color: '#f59e0b' },
  customer: { label: 'Student',       color: '#10b981' },
};

export default function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Single source of truth for orders — never resets on navigation
  const [placedOrders, setPlacedOrders] = useState([]);
  const processedOrderIds = useRef(new Set());

  useEffect(() => { initializeData(); }, []);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (!user) return <Login />;

  const navItems  = NAV_BY_ROLE[user.role] || [];
  const badge     = ROLE_BADGES[user.role]  || ROLE_BADGES.customer;
  const pageInfo  = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  // Prevent duplicate orders using a ref-based ID set
  const handleOrderPlaced = (order) => {
    const id = order.orderNumber;
    if (processedOrderIds.current.has(id)) return;
    processedOrderIds.current.add(id);
    setPlacedOrders(prev => [...prev, order]);
  };

  return (
    <div className="app-layout">
      {/* Mobile toggle */}
      <button
        className="btn-icon"
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 200, display: 'none' }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >☰</button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>CafeIQ</h1>
          <p>Management System</p>
        </div>

        {/* User badge */}
        <div style={{
          margin: '0 12px 16px', padding: '12px',
          background: `${badge.color}18`,
          border: `1px solid ${badge.color}40`,
          borderRadius: '10px'
        }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: badge.color }}>
            👤 {user.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
            {badge.label}
          </p>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', marginTop: 'auto' }}>
          <button onClick={logout} style={{
            width: '100%', padding: '10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', color: '#ef4444',
            cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
          }}>
            🚪 Logout
          </button>
        </div>

        <div className="sidebar-footer">
          <p>CafeIQ v2.0</p>
          <p style={{ marginTop: 4, fontSize: '0.7rem' }}>© 2026 College Cafeteria</p>
        </div>
      </aside>

      {/* Main — NO key prop here, prevents glitch */}
      <main className="main-content">
        <header className="page-header">
          <h2>{pageInfo.title}</h2>
          <p>{pageInfo.subtitle}</p>
        </header>

        <div className="page-body">
          <Routes>
            {user.role === 'admin' && (
              <>
                <Route path="/"            element={<Dashboard />} />
                <Route path="/inventory"   element={<Inventory />} />
                <Route path="/sales"       element={<Sales />} />
                <Route path="/forecasting" element={<Forecasting />} />
                <Route path="/insights"    element={<Insights />} />
                <Route path="/kitchen"     element={<KitchenDisplay newOrders={placedOrders} />} />
                <Route path="/order"       element={<CustomerOrder onOrderPlaced={handleOrderPlaced} />} />
              </>
            )}
            {user.role === 'kitchen' && (
              <>
                <Route path="/kitchen" element={<KitchenDisplay newOrders={placedOrders} />} />
                <Route path="/order"   element={<CustomerOrder onOrderPlaced={handleOrderPlaced} />} />
                <Route path="*"        element={<KitchenDisplay newOrders={placedOrders} />} />
              </>
            )}
            {user.role === 'customer' && (
              <>
                <Route path="/order" element={<CustomerOrder onOrderPlaced={handleOrderPlaced} />} />
                <Route path="*"      element={<CustomerOrder onOrderPlaced={handleOrderPlaced} />} />
              </>
            )}
          </Routes>
        </div>
      </main>
    </div>
  );
}