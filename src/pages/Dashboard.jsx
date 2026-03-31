import { useState, useMemo, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { getSalesData, getInventoryData } from '../data/sampleData';
import { groupSalesByPeriod, groupByCategory, groupByItem, getMonthlyData, formatCurrency, formatNumber, getMonthName, calculateTotals, getRecentSales, calculateGrowthRate } from '../data/dataUtils';
import { fetchInsights, checkBackendHealth } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } },
    },
    tooltip: {
      backgroundColor: '#1a2035',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: { family: 'Inter', weight: 600 },
      bodyFont: { family: 'Inter' },
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
    y: {
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
  },
};

export default function Dashboard() {
  const sales = useMemo(() => getSalesData(), []);
  const inventory = useMemo(() => getInventoryData(), []);
  const [insights, setInsights] = useState([]);
  const [backendOnline, setBackendOnline] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  // Fetch insights from Python backend
  useEffect(() => {
    async function loadInsights() {
      setLoadingInsights(true);
      try {
        const isOnline = await checkBackendHealth();
        setBackendOnline(isOnline);
        if (isOnline) {
          const result = await fetchInsights(sales, inventory);
          setInsights(result.insights.slice(0, 4));
        }
      } catch (e) {
        console.warn('Backend not available:', e);
        setBackendOnline(false);
      }
      setLoadingInsights(false);
    }
    loadInsights();
  }, [sales, inventory]);

  // KPI calculations
  const recentSales = useMemo(() => getRecentSales(sales, 30), [sales]);
  const previousSales = useMemo(() => getRecentSales(sales, 60).filter(s => !recentSales.includes(s)), [sales, recentSales]);
  const recentTotals = useMemo(() => calculateTotals(recentSales), [recentSales]);
  const previousTotals = useMemo(() => calculateTotals(previousSales), [previousSales]);

  const revenueGrowth = calculateGrowthRate(recentTotals.revenue, previousTotals.revenue);
  const quantityGrowth = calculateGrowthRate(recentTotals.quantity, previousTotals.quantity);
  const profitGrowth = calculateGrowthRate(recentTotals.revenue - recentTotals.cost, previousTotals.revenue - previousTotals.cost);

  // Monthly data for revenue chart
  const monthlyData = useMemo(() => getMonthlyData(sales, 6), [sales]);

  // Top items
  const topItems = useMemo(() => {
    const items = groupByItem(recentSales);
    return [...items].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [recentSales]);

  // Category data
  const categoryData = useMemo(() => groupByCategory(recentSales), [recentSales]);

  // Low stock count
  const lowStockCount = useMemo(() => inventory.filter(i => i.currentStock <= i.reorderLevel).length, [inventory]);

  // Revenue chart
  const revenueChart = {
    labels: monthlyData.map(m => getMonthName(m.date)),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyData.map(m => m.revenue),
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2dd4bf',
        pointBorderColor: '#2dd4bf',
        pointRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Cost',
        data: monthlyData.map(m => m.cost),
        borderColor: '#fb7185',
        backgroundColor: 'rgba(251, 113, 133, 0.05)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fb7185',
        pointBorderColor: '#fb7185',
        pointRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  // Top items bar chart
  const topItemsChart = {
    labels: topItems.map(i => i.name),
    datasets: [{
      label: 'Revenue (₹)',
      data: topItems.map(i => i.revenue),
      backgroundColor: [
        'rgba(45, 212, 191, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(167, 139, 250, 0.7)',
        'rgba(251, 191, 36, 0.7)',
        'rgba(251, 113, 133, 0.7)',
        'rgba(52, 211, 153, 0.7)',
        'rgba(249, 115, 22, 0.7)',
        'rgba(99, 102, 241, 0.7)',
      ],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  // Category doughnut
  const categoryChart = {
    labels: categoryData.map(c => c.category),
    datasets: [{
      data: categoryData.map(c => c.revenue),
      backgroundColor: [
        '#2dd4bf', '#3b82f6', '#a78bfa', '#fbbf24', '#fb7185',
      ],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true },
      },
      tooltip: chartDefaults.plugins.tooltip,
    },
    cutout: '65%',
  };

  return (
    <div className="slide-up">
      {/* Backend Status Banner */}
      {backendOnline === false && (
        <div style={{
          padding: '12px 20px', marginBottom: 20, borderRadius: 'var(--border-radius)',
          background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem',
        }}>
          <span>⚠️</span>
          <span style={{ color: 'var(--accent-amber)' }}>
            Python ML backend is offline. Start it with: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4 }}>cd backend && python app.py</code>
          </span>
        </div>
      )}
      {backendOnline === true && (
        <div style={{
          padding: '12px 20px', marginBottom: 20, borderRadius: 'var(--border-radius)',
          background: 'var(--accent-green-dim)', border: '1px solid var(--accent-green)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem',
        }}>
          <span>🐍</span>
          <span style={{ color: 'var(--accent-green)' }}>
            Python ML backend connected — scikit-learn powered predictions active
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card teal" id="kpi-revenue">
          <div className="kpi-icon teal">💰</div>
          <div className="kpi-info">
            <div className="kpi-label">Revenue (30d)</div>
            <div className="kpi-value">{formatCurrency(recentTotals.revenue)}</div>
            <span className={`kpi-trend ${parseFloat(revenueGrowth) >= 0 ? 'up' : 'down'}`}>
              {parseFloat(revenueGrowth) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(revenueGrowth))}%
            </span>
          </div>
        </div>

        <div className="kpi-card purple" id="kpi-items-sold">
          <div className="kpi-icon purple">📦</div>
          <div className="kpi-info">
            <div className="kpi-label">Items Sold (30d)</div>
            <div className="kpi-value">{formatNumber(recentTotals.quantity)}</div>
            <span className={`kpi-trend ${parseFloat(quantityGrowth) >= 0 ? 'up' : 'down'}`}>
              {parseFloat(quantityGrowth) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(quantityGrowth))}%
            </span>
          </div>
        </div>

        <div className="kpi-card amber" id="kpi-profit">
          <div className="kpi-icon amber">📈</div>
          <div className="kpi-info">
            <div className="kpi-label">Profit (30d)</div>
            <div className="kpi-value">{formatCurrency(recentTotals.revenue - recentTotals.cost)}</div>
            <span className={`kpi-trend ${parseFloat(profitGrowth) >= 0 ? 'up' : 'down'}`}>
              {parseFloat(profitGrowth) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(profitGrowth))}%
            </span>
          </div>
        </div>

        <div className="kpi-card rose" id="kpi-low-stock">
          <div className="kpi-icon rose">⚠️</div>
          <div className="kpi-info">
            <div className="kpi-label">Low Stock Alerts</div>
            <div className="kpi-value">{lowStockCount}</div>
            <span className="kpi-trend down">Needs attention</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue & Cost Trend</div>
              <div className="card-subtitle">Monthly overview over 6 months</div>
            </div>
          </div>
          <div className="chart-container">
            <Line data={revenueChart} options={chartDefaults} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Category Distribution</div>
              <div className="card-subtitle">Revenue share by category</div>
            </div>
          </div>
          <div className="chart-container">
            <Doughnut data={categoryChart} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Top Items + Insights */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Selling Items</div>
              <div className="card-subtitle">By revenue (last 30 days)</div>
            </div>
          </div>
          <div className="chart-container" style={{ height: 320 }}>
            <Bar data={topItemsChart} options={{
              ...chartDefaults,
              indexAxis: 'y',
              plugins: { ...chartDefaults.plugins, legend: { display: false } },
            }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">AI Insights {backendOnline ? '🐍' : ''}</div>
              <div className="card-subtitle">{backendOnline ? 'Powered by scikit-learn' : 'Start Python backend for insights'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loadingInsights ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                {backendOnline === null ? '⏳ Connecting to ML backend...' : 'Loading...'}
              </div>
            ) : insights.length > 0 ? (
              insights.map(insight => (
                <div key={insight.id} className="insight-card" style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '1.3rem' }}>{insight.icon}</span>
                  <div className="insight-content">
                    <div className="insight-title" style={{ fontSize: '0.85rem' }}>{insight.title}</div>
                    <div className="insight-desc" style={{ fontSize: '0.78rem' }}>{insight.description}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🐍</div>
                <h3 style={{ fontSize: '0.95rem' }}>Python Backend Offline</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Run <code>cd backend && python app.py</code> to enable AI insights
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
