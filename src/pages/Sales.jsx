import { useState, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { getSalesData, getMenuItems, addSale } from '../data/sampleData';
import { groupSalesByPeriod, groupByCategory, filterByDateRange, formatCurrency, formatNumber, getMonthName, calculateTotals } from '../data/dataUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
    tooltip: { backgroundColor: '#1a2035', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, cornerRadius: 8, padding: 12 },
  },
  scales: {
    x: { ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

export default function Sales() {
  const [sales, setSales] = useState(() => getSalesData());
  const menuItems = useMemo(() => getMenuItems(), []);
  const [viewPeriod, setViewPeriod] = useState('monthly');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSale, setNewSale] = useState({ itemId: '', quantity: '' });

  // Aggregated data
  const periodData = useMemo(() => groupSalesByPeriod(sales, viewPeriod), [sales, viewPeriod]);
  const categoryData = useMemo(() => groupByCategory(sales), [sales]);
  const totals = useMemo(() => calculateTotals(sales), [sales]);

  // Recent 15 days of daily data for table
  const recentDays = useMemo(() => {
    const daily = groupSalesByPeriod(sales, 'daily');
    return daily.slice(-15).reverse();
  }, [sales]);

  // Charts
  const revenueChart = {
    labels: periodData.slice(-12).map(d => viewPeriod === 'monthly' ? getMonthName(d.date) : d.date),
    datasets: [
      {
        label: 'Revenue',
        data: periodData.slice(-12).map(d => d.revenue),
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'Cost',
        data: periodData.slice(-12).map(d => d.cost),
        borderColor: '#fb7185',
        backgroundColor: 'rgba(251, 113, 133, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const categoryChart = {
    labels: categoryData.map(c => c.category),
    datasets: [{
      label: 'Revenue',
      data: categoryData.map(c => c.revenue),
      backgroundColor: ['rgba(45,212,191,0.7)', 'rgba(59,130,246,0.7)', 'rgba(167,139,250,0.7)', 'rgba(251,191,36,0.7)', 'rgba(251,113,133,0.7)'],
      borderRadius: 6,
    }],
  };

  function handleAddSale() {
    if (!newSale.itemId || !newSale.quantity) return;
    const item = menuItems.find(i => i.id === parseInt(newSale.itemId));
    if (!item) return;

    const sale = {
      date: new Date().toISOString().split('T')[0],
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      quantity: parseInt(newSale.quantity),
      costPerUnit: item.cost,
      pricePerUnit: item.price,
      totalRevenue: parseInt(newSale.quantity) * item.price,
      totalCost: parseInt(newSale.quantity) * item.cost,
    };

    addSale(sale);
    setSales([...sales, { ...sale, id: sales.length + 1 }]);
    setNewSale({ itemId: '', quantity: '' });
    setShowAddModal(false);
  }

  return (
    <div className="slide-up">
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card teal">
          <div className="kpi-icon teal">💰</div>
          <div className="kpi-info">
            <div className="kpi-label">Total Revenue</div>
            <div className="kpi-value">{formatCurrency(totals.revenue)}</div>
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple">📊</div>
          <div className="kpi-info">
            <div className="kpi-label">Total Cost</div>
            <div className="kpi-value">{formatCurrency(totals.cost)}</div>
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon amber">📈</div>
          <div className="kpi-info">
            <div className="kpi-label">Total Profit</div>
            <div className="kpi-value">{formatCurrency(totals.revenue - totals.cost)}</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green">🛒</div>
          <div className="kpi-info">
            <div className="kpi-label">Items Sold</div>
            <div className="kpi-value">{formatNumber(totals.quantity)}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="filter-bar">
        <div className="tabs">
          {['daily', 'weekly', 'monthly'].map(period => (
            <button
              key={period}
              className={`tab ${viewPeriod === period ? 'active' : ''}`}
              onClick={() => setViewPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="add-sale-btn" style={{ marginLeft: 'auto' }}>
          ➕ Record Sale
        </button>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue vs Cost</div>
              <div className="card-subtitle">{viewPeriod.charAt(0).toUpperCase() + viewPeriod.slice(1)} breakdown</div>
            </div>
          </div>
          <div className="chart-container">
            <Line data={revenueChart} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue by Category</div>
              <div className="card-subtitle">All time performance</div>
            </div>
          </div>
          <div className="chart-container">
            <Bar data={categoryChart} options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } }}} />
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Daily Sales</div>
            <div className="card-subtitle">Last 15 days summary</div>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table" id="sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Revenue</th>
                <th>Total Cost</th>
                <th>Profit</th>
                <th>Items Sold</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {recentDays.map(day => {
                const profit = day.revenue - day.cost;
                const margin = ((profit / day.revenue) * 100).toFixed(1);
                return (
                  <tr key={day.date}>
                    <td style={{ fontWeight: 600 }}>{day.date}</td>
                    <td style={{ color: 'var(--accent-teal)' }}>{formatCurrency(day.revenue)}</td>
                    <td style={{ color: 'var(--accent-rose)' }}>{formatCurrency(day.cost)}</td>
                    <td style={{ color: profit >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 600 }}>
                      {formatCurrency(profit)}
                    </td>
                    <td>{formatNumber(day.quantity)}</td>
                    <td><span className={`badge ${parseFloat(margin) > 50 ? 'green' : 'amber'}`}>{margin}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record New Sale</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Menu Item</label>
              <select
                className="form-select"
                value={newSale.itemId}
                onChange={e => setNewSale({...newSale, itemId: e.target.value})}
              >
                <option value="">Select an item...</option>
                {menuItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {formatCurrency(item.price)} ({item.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={newSale.quantity}
                onChange={e => setNewSale({...newSale, quantity: e.target.value})}
                placeholder="Enter quantity"
              />
            </div>

            {newSale.itemId && newSale.quantity && (
              <div style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 'var(--border-radius)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Item:</span>
                  <span style={{ fontWeight: 600 }}>{menuItems.find(i => i.id === parseInt(newSale.itemId))?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Revenue:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>
                    {formatCurrency(parseInt(newSale.quantity) * (menuItems.find(i => i.id === parseInt(newSale.itemId))?.price || 0))}
                  </span>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddSale} id="confirm-sale-btn">Record Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
