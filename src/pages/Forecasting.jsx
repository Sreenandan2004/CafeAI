import { useMemo, useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { getSalesData } from '../data/sampleData';
import { groupSalesByPeriod, formatCurrency, formatNumber, getMonthName } from '../data/dataUtils';
import { fetchForecast, checkBackendHealth } from '../services/api';

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

export default function Forecasting() {
  const sales = useMemo(() => getSalesData(), []);

  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch forecast from Python backend
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const isOnline = await checkBackendHealth();
        setBackendOnline(isOnline);
        if (!isOnline) {
          setError('Python ML backend is offline');
          setLoading(false);
          return;
        }
        const data = await fetchForecast(sales);
        setForecastData(data);
      } catch (e) {
        setError(e.message);
        setBackendOnline(false);
      }
      setLoading(false);
    }
    load();
  }, [sales]);

  // Loading state
  if (loading) {
    return (
      <div className="slide-up" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔮</div>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Loading ML Predictions...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Connecting to Python scikit-learn backend</p>
        <div className="skeleton" style={{ width: 200, height: 4, margin: '20px auto', borderRadius: 2 }} />
      </div>
    );
  }

  // Backend offline state
  if (!backendOnline || !forecastData) {
    return (
      <div className="slide-up" style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🐍</div>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Python ML Backend Required</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 20px' }}>
          The forecasting engine uses scikit-learn running on a Flask backend.
          Start the backend to see predictions.
        </p>
        <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 'var(--border-radius)', display: 'inline-block', textAlign: 'left' }}>
          <code style={{ color: 'var(--accent-teal)', fontSize: '0.9rem' }}>
            cd backend<br/>
            pip install -r requirements.txt<br/>
            python app.py
          </code>
        </div>
        {error && <p style={{ color: 'var(--accent-rose)', marginTop: 16, fontSize: '0.8rem' }}>{error}</p>}
      </div>
    );
  }

  const { revenuePrediction, spendingPrediction, itemDemand, modelAccuracy, monthlyTrend, futureForecasts } = forecastData;

  if (!revenuePrediction || !spendingPrediction) {
    return <div className="empty-state"><div className="empty-icon">📊</div><h3>Not enough data for forecasting</h3><p>Need at least 3 months of sales data</p></div>;
  }

  // Predicted profit
  const predictedProfit = revenuePrediction.predicted - spendingPrediction.predicted;

  // Trend chart: actual + regression line + future months
  const trendChart = (() => {
    if (!monthlyTrend?.months) return null;

    const labels = [
      ...monthlyTrend.months.map(m => getMonthName(m.date)),
      ...futureForecasts.map(f => f.month),
    ];

    const actualData = monthlyTrend.months.map(m => m.revenue);
    const trendData = [...monthlyTrend.trendLine];

    // Future predictions
    const futureData = new Array(monthlyTrend.months.length).fill(null);
    futureForecasts.forEach(f => futureData.push(f.predicted));

    return {
      labels,
      datasets: [
        {
          label: 'Actual Revenue',
          data: [...actualData, ...new Array(futureForecasts.length).fill(null)],
          borderColor: '#2dd4bf',
          backgroundColor: 'rgba(45, 212, 191, 0.1)',
          fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2,
        },
        {
          label: 'Trend Line (sklearn LR)',
          data: trendData.slice(0, labels.length),
          borderColor: '#3b82f6',
          borderDash: [6, 4], pointRadius: 0, borderWidth: 2, fill: false,
        },
        {
          label: 'Forecast',
          data: futureData,
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          fill: true, tension: 0.4, pointRadius: 5, borderWidth: 2,
          pointBackgroundColor: '#fbbf24', pointBorderColor: '#fbbf24', borderDash: [4, 4],
        },
      ],
    };
  })();

  // Cross-validation chart
  const cvChart = (() => {
    if (!modelAccuracy) return null;
    const months = groupSalesByPeriod(sales, 'monthly');
    const labels = months.slice(3).map(m => getMonthName(m.date));
    return {
      labels,
      datasets: [
        {
          label: 'Actual',
          data: modelAccuracy.actuals,
          borderColor: '#2dd4bf', backgroundColor: 'rgba(45, 212, 191, 0.5)',
          borderWidth: 2, borderRadius: 4,
        },
        {
          label: 'Predicted (sklearn)',
          data: modelAccuracy.predictions,
          borderColor: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.5)',
          borderWidth: 2, borderRadius: 4,
        },
      ],
    };
  })();

  return (
    <div className="slide-up">
      {/* Backend status */}
      <div style={{
        padding: '12px 20px', marginBottom: 20, borderRadius: 'var(--border-radius)',
        background: 'var(--accent-green-dim)', border: '1px solid var(--accent-green)',
        display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem',
      }}>
        <span>🐍</span>
        <span style={{ color: 'var(--accent-green)' }}>
          scikit-learn LinearRegression + pandas EMA — Python ML backend connected
        </span>
      </div>

      {/* Prediction KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card teal">
          <div className="kpi-icon teal">💰</div>
          <div className="kpi-info">
            <div className="kpi-label">Predicted Revenue</div>
            <div className="kpi-value">{formatCurrency(revenuePrediction.predicted)}</div>
            <span className={`kpi-trend ${parseFloat(revenuePrediction.changePercent) >= 0 ? 'up' : 'down'}`}>
              {parseFloat(revenuePrediction.changePercent) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(revenuePrediction.changePercent))}% vs last month
            </span>
          </div>
        </div>

        <div className="kpi-card rose">
          <div className="kpi-icon rose">📊</div>
          <div className="kpi-info">
            <div className="kpi-label">Predicted Spending</div>
            <div className="kpi-value">{formatCurrency(spendingPrediction.predicted)}</div>
            <span className={`kpi-trend ${parseFloat(spendingPrediction.changePercent) >= 0 ? 'up' : 'down'}`}>
              {parseFloat(spendingPrediction.changePercent) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(spendingPrediction.changePercent))}% vs last month
            </span>
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-icon amber">📈</div>
          <div className="kpi-info">
            <div className="kpi-label">Predicted Profit</div>
            <div className="kpi-value">{formatCurrency(predictedProfit)}</div>
            <span className={`kpi-trend ${predictedProfit > 0 ? 'up' : 'down'}`}>
              Margin: {((predictedProfit / revenuePrediction.predicted) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple">🎯</div>
          <div className="kpi-info">
            <div className="kpi-label">Model R² Score</div>
            <div className="kpi-value">{revenuePrediction.r2}</div>
            <span className="kpi-trend up">
              MAE: {modelAccuracy ? formatCurrency(modelAccuracy.mae) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Intervals */}
      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card">
          <div className="forecast-metric">
            <div className="metric-label">Revenue Confidence Interval</div>
            <div className="metric-value">{formatCurrency(revenuePrediction.predicted)}</div>
            <div className="metric-change" style={{ color: 'var(--text-secondary)' }}>
              Range: {formatCurrency(revenuePrediction.lower)} — {formatCurrency(revenuePrediction.upper)}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="forecast-metric">
            <div className="metric-label">Spending Confidence Interval</div>
            <div className="metric-value" style={{ background: 'var(--gradient-rose)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatCurrency(spendingPrediction.predicted)}
            </div>
            <div className="metric-change" style={{ color: 'var(--text-secondary)' }}>
              Range: {formatCurrency(spendingPrediction.lower)} — {formatCurrency(spendingPrediction.upper)}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="forecast-metric">
            <div className="metric-label">Model Performance</div>
            <div className="metric-value" style={{ background: 'var(--gradient-purple)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {modelAccuracy ? (100 - parseFloat(modelAccuracy.mape)).toFixed(1) : 'N/A'}%
            </div>
            <div className="metric-change" style={{ color: 'var(--text-secondary)' }}>
              MAPE: {modelAccuracy?.mape}% | Samples: {modelAccuracy?.sampleSize}
            </div>
          </div>
        </div>
      </div>

      {/* Trend + Forecast Chart */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Trend & Forecast 🐍</div>
              <div className="card-subtitle">sklearn LinearRegression with confidence intervals</div>
            </div>
            <span className={`badge ${revenuePrediction.trend === 'increasing' ? 'green' : 'rose'}`}>
              {revenuePrediction.trend === 'increasing' ? '📈 Uptrend' : '📉 Downtrend'}
            </span>
          </div>
          <div className="chart-container" style={{ height: 350 }}>
            {trendChart && <Line data={trendChart} options={chartOptions} />}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Actual vs Predicted (Cross-Validation)</div>
              <div className="card-subtitle">Time-series cross-validation with sklearn</div>
            </div>
          </div>
          <div className="chart-container" style={{ height: 350 }}>
            {cvChart && <Bar data={cvChart} options={{
              ...chartOptions,
              plugins: { ...chartOptions.plugins, legend: { ...chartOptions.plugins.legend, position: 'top' } },
            }} />}
          </div>
        </div>
      </div>

      {/* Item Demand Forecast Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Per-Item Demand Forecast 🐍</div>
            <div className="card-subtitle">sklearn LinearRegression + pandas EMA blended model</div>
          </div>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table" id="forecast-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Last Month</th>
                <th>Predicted</th>
                <th>Change</th>
                <th>Trend</th>
                <th>Confidence</th>
                <th>R²</th>
              </tr>
            </thead>
            <tbody>
              {(itemDemand || []).slice(0, 15).map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td><span className="badge teal">{item.category}</span></td>
                  <td>{formatNumber(item.lastMonth)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{formatNumber(item.predicted)}</td>
                  <td>
                    <span style={{ color: item.changePercent !== 'N/A' && parseFloat(item.changePercent) >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 600 }}>
                      {item.changePercent !== 'N/A' ? `${parseFloat(item.changePercent) >= 0 ? '+' : ''}${item.changePercent}%` : 'N/A'}
                    </span>
                  </td>
                  <td>{item.trend === 'up' ? '📈' : '📉'}</td>
                  <td><span className={`badge ${item.confidence === 'High' ? 'green' : item.confidence === 'Medium' ? 'amber' : 'rose'}`}>{item.confidence}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.r2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Future Forecasts */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">3-Month Revenue Forecast</div>
            <div className="card-subtitle">Extended predictions with confidence intervals</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {(futureForecasts || []).map(forecast => (
            <div key={forecast.month} style={{ textAlign: 'center', padding: 20, background: 'var(--bg-surface)', borderRadius: 'var(--border-radius)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>{forecast.month}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-teal)' }}>{formatCurrency(forecast.predicted)}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {formatCurrency(forecast.lower)} — {formatCurrency(forecast.upper)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
