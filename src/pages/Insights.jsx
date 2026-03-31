import { useMemo, useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { getSalesData, getInventoryData } from '../data/sampleData';
import { groupByItem, groupByCategory, getRecentSales, formatCurrency, formatNumber, calculateGrowthRate } from '../data/dataUtils';
import { fetchInsights, checkBackendHealth } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

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

const INSIGHT_COLORS = {
  success: { bg: 'var(--accent-green-dim)', border: 'var(--accent-green)' },
  warning: { bg: 'var(--accent-amber-dim)', border: 'var(--accent-amber)' },
  danger: { bg: 'var(--accent-rose-dim)', border: 'var(--accent-rose)' },
  info: { bg: 'var(--accent-blue-dim)', border: 'var(--accent-blue)' },
};

export default function Insights() {
  const sales = useMemo(() => getSalesData(), []);
  const inventory = useMemo(() => getInventoryData(), []);
  const [activeTab, setActiveTab] = useState('overview');

  // Backend state
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(null);
  const [insightsData, setInsightsData] = useState(null);

  // Fetch insights from Python backend
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const isOnline = await checkBackendHealth();
        setBackendOnline(isOnline);
        if (isOnline) {
          const data = await fetchInsights(sales, inventory);
          setInsightsData(data);
        }
      } catch (e) {
        console.warn('Backend error:', e);
        setBackendOnline(false);
      }
      setLoading(false);
    }
    load();
  }, [sales, inventory]);

  // Local data for charts (no ML needed)
  const recentSales = useMemo(() => getRecentSales(sales, 30), [sales]);
  const previousSales = useMemo(() => getRecentSales(sales, 60).filter(s => !recentSales.includes(s)), [sales, recentSales]);

  const growthData = useMemo(() => {
    const recent = groupByItem(recentSales);
    const previous = groupByItem(previousSales);
    return recent.map(r => {
      const prev = previous.find(p => p.id === r.id);
      return {
        ...r,
        growth: prev ? parseFloat(calculateGrowthRate(r.quantity, prev.quantity)) : 0,
        prevQuantity: prev ? prev.quantity : 0,
      };
    }).sort((a, b) => b.growth - a.growth);
  }, [recentSales, previousSales]);

  const categoryData = useMemo(() => groupByCategory(recentSales), [recentSales]);

  // Charts from backend data or local fallback
  const insights = insightsData?.insights || [];
  const rankings = insightsData?.rankings || null;
  const heatmapData = insightsData?.heatmap || null;

  const categoryChart = {
    labels: categoryData.map(c => c.category),
    datasets: [
      { label: 'Revenue', data: categoryData.map(c => c.revenue), backgroundColor: 'rgba(45, 212, 191, 0.7)', borderRadius: 6 },
      { label: 'Cost', data: categoryData.map(c => c.cost), backgroundColor: 'rgba(251, 113, 133, 0.7)', borderRadius: 6 },
    ],
  };

  const topChart = rankings ? {
    labels: rankings.byRevenue.top.map(i => i.itemName || i.name),
    datasets: [{
      label: 'Revenue (₹)',
      data: rankings.byRevenue.top.map(i => i.revenue),
      backgroundColor: ['rgba(45,212,191,0.7)', 'rgba(59,130,246,0.7)', 'rgba(167,139,250,0.7)', 'rgba(251,191,36,0.7)', 'rgba(251,113,133,0.7)'],
      borderRadius: 6,
    }],
  } : null;

  const marginChart = {
    labels: categoryData.map(c => c.category),
    datasets: [{
      data: categoryData.map(c => parseFloat(c.margin)),
      backgroundColor: ['#2dd4bf', '#3b82f6', '#a78bfa', '#fbbf24', '#fb7185'],
      borderWidth: 0, hoverOffset: 8,
    }],
  };

  function getHeatmapColor(normalized) {
    if (normalized > 0.8) return 'rgba(45, 212, 191, 0.9)';
    if (normalized > 0.6) return 'rgba(45, 212, 191, 0.65)';
    if (normalized > 0.4) return 'rgba(45, 212, 191, 0.45)';
    if (normalized > 0.2) return 'rgba(45, 212, 191, 0.25)';
    return 'rgba(45, 212, 191, 0.1)';
  }

  // Backend offline banner
  const OfflineBanner = () => (
    <div style={{
      padding: '12px 20px', marginBottom: 20, borderRadius: 'var(--border-radius)',
      background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)',
      display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem',
    }}>
      <span>⚠️</span>
      <span style={{ color: 'var(--accent-amber)' }}>
        Python ML backend offline. Run: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4 }}>cd backend && python app.py</code>
      </span>
    </div>
  );

  return (
    <div className="slide-up">
      {/* Backend status */}
      {backendOnline === false && <OfflineBanner />}
      {backendOnline === true && (
        <div style={{
          padding: '12px 20px', marginBottom: 20, borderRadius: 'var(--border-radius)',
          background: 'var(--accent-green-dim)', border: '1px solid var(--accent-green)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem',
        }}>
          <span>🐍</span>
          <span style={{ color: 'var(--accent-green)' }}>
            AI Insights powered by Python pandas + scikit-learn
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 28 }}>
        {[
          { key: 'overview', label: '🧠 AI Recommendations' },
          { key: 'performance', label: '📊 Item Performance' },
          { key: 'heatmap', label: '🗓️ Sales Heatmap' },
          { key: 'categories', label: '🏷️ Category Analysis' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔮</div>
              <p>Loading AI insights from Python backend...</p>
              <div className="skeleton" style={{ width: 200, height: 4, margin: '16px auto', borderRadius: 2 }} />
            </div>
          ) : insights.length > 0 ? (
            <div className="insights-grid">
              {insights.map(insight => {
                const colors = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.info;
                return (
                  <div key={insight.id} className="insight-card" style={{ borderLeft: `3px solid ${colors.border}` }}>
                    <div className="insight-icon" style={{ background: colors.bg }}>{insight.icon}</div>
                    <div className="insight-content">
                      <div className="insight-title">{insight.title}</div>
                      <div className="insight-desc">{insight.description}</div>
                      {insight.items && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {insight.items.slice(0, 4).map((item, i) => (
                            <span key={i} className="badge purple" style={{ fontSize: '0.7rem' }}>{item}</span>
                          ))}
                        </div>
                      )}
                      <span className="insight-tag" style={{ background: colors.bg, color: colors.border }}>{insight.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🐍</div>
              <h3>Start the Python Backend</h3>
              <p style={{ maxWidth: 400, margin: '8px auto' }}>Run <code>cd backend && python app.py</code> to generate AI insights with scikit-learn.</p>
            </div>
          )}
        </>
      )}

      {/* === PERFORMANCE TAB === */}
      {activeTab === 'performance' && (
        <>
          <div className="charts-grid">
            {topChart && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Top 5 Items by Revenue 🐍</div>
                    <div className="card-subtitle">Ranked by Python backend</div>
                  </div>
                </div>
                <div className="chart-container">
                  <Bar data={topChart} options={{ ...chartOptions, indexAxis: 'y', plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Profit Margins by Category</div>
                  <div className="card-subtitle">Which categories earn the most</div>
                </div>
              </div>
              <div className="chart-container">
                <Doughnut data={marginChart} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter' }, usePointStyle: true, padding: 16 } }, tooltip: chartOptions.plugins.tooltip },
                  cutout: '65%',
                }} />
              </div>
            </div>
          </div>

          {/* Growth Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Item Growth Analysis</div>
                <div className="card-subtitle">30-day vs previous 30-day comparison</div>
              </div>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table" id="growth-table">
                <thead>
                  <tr>
                    <th>Rank</th><th>Item</th><th>Category</th><th>Current (30d)</th><th>Previous (30d)</th><th>Growth</th><th>Revenue</th><th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {growthData.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td><span className="badge teal">{item.category}</span></td>
                      <td>{formatNumber(item.quantity)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatNumber(item.prevQuantity)}</td>
                      <td>
                        <span style={{ color: item.growth >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 700 }}>
                          {item.growth >= 0 ? '↑' : '↓'} {Math.abs(item.growth).toFixed(1)}%
                        </span>
                      </td>
                      <td>{formatCurrency(item.revenue)}</td>
                      <td><span className={`badge ${parseFloat(item.margin) > 55 ? 'green' : 'amber'}`}>{item.margin}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* === HEATMAP TAB === */}
      {activeTab === 'heatmap' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Sales Heatmap by Category & Day 🐍</div>
              <div className="card-subtitle">Generated by Python pandas — darker = more sales</div>
            </div>
          </div>
          {!heatmapData ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🐍</div>
              <h3>Backend Required for Heatmap</h3>
              <p>Run <code>cd backend && python app.py</code></p>
            </div>
          ) : (
            <div style={{ padding: '16px 0' }}>
              <div className="heatmap-grid">
                <div className="heatmap-label"></div>
                {heatmapData.days.map(day => (
                  <div key={day} className="heatmap-label" style={{ justifyContent: 'center', fontWeight: 600 }}>{day}</div>
                ))}
                {heatmapData.categories.map(cat => (
                  <div key={cat} style={{ display: 'contents' }}>
                    <div className="heatmap-label">{cat}</div>
                    {heatmapData.days.map(day => {
                      const cell = heatmapData.heatmap[cat][day];
                      return (
                        <div
                          key={`${cat}-${day}`}
                          className="heatmap-cell"
                          style={{ background: getHeatmapColor(cell.normalized), color: cell.normalized > 0.5 ? '#0a0e1a' : '#94a3b8' }}
                          title={`${cat} on ${day}: ${cell.value} items`}
                        >
                          {cell.value > 0 ? formatNumber(cell.value) : '-'}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Less</span>
                {[0.1, 0.25, 0.45, 0.65, 0.9].map(n => (
                  <div key={n} style={{ width: 24, height: 24, borderRadius: 4, background: getHeatmapColor(n) }} />
                ))}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>More</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === CATEGORY TAB === */}
      {activeTab === 'categories' && (
        <>
          <div className="charts-grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Revenue vs Cost by Category</div>
                  <div className="card-subtitle">Last 30 days performance</div>
                </div>
              </div>
              <div className="chart-container" style={{ height: 350 }}>
                <Bar data={categoryChart} options={chartOptions} />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Category Summary</div>
                  <div className="card-subtitle">Key metrics per category</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryData.sort((a, b) => b.revenue - a.revenue).map(cat => (
                  <div key={cat.category} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 18px', background: 'var(--bg-surface)',
                    borderRadius: 'var(--border-radius)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{cat.category}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {cat.itemCount} items • {formatNumber(cat.quantity)} sold
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{formatCurrency(cat.revenue)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)' }}>
                        Profit: {formatCurrency(cat.profit)} ({cat.margin}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Best & Worst Items per Category</div>
                <div className="card-subtitle">Items ranked by revenue within their category</div>
              </div>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th>Best Item</th><th>Best Revenue</th><th>Worst Item</th><th>Worst Revenue</th></tr>
                </thead>
                <tbody>
                  {categoryData.map(cat => {
                    const catItems = groupByItem(recentSales.filter(s => s.category === cat.category));
                    const sorted = [...catItems].sort((a, b) => b.revenue - a.revenue);
                    const best = sorted[0];
                    const worst = sorted[sorted.length - 1];
                    return (
                      <tr key={cat.category}>
                        <td><span className="badge teal">{cat.category}</span></td>
                        <td style={{ fontWeight: 600 }}>{best?.name || '-'}</td>
                        <td style={{ color: 'var(--accent-green)' }}>{best ? formatCurrency(best.revenue) : '-'}</td>
                        <td style={{ fontWeight: 600 }}>{worst?.name || '-'}</td>
                        <td style={{ color: 'var(--accent-rose)' }}>{worst ? formatCurrency(worst.revenue) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
