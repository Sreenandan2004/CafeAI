// API service layer - communicates with Python Flask ML backend

const API_BASE = 'http://localhost:5000/api';

/**
 * Check if the Python backend is running
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Fetch ML forecasts from the Python backend
 * @param {Array} salesData - Array of sale objects
 * @returns {Object} { revenuePrediction, spendingPrediction, itemDemand, modelAccuracy, monthlyTrend, futureForecasts }
 */
export async function fetchForecast(salesData) {
  const res = await fetch(`${API_BASE}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salesData }),
  });

  if (!res.ok) {
    throw new Error(`Forecast API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch AI insights from the Python backend
 * @param {Array} salesData - Array of sale objects
 * @param {Array} inventoryData - Array of inventory items (optional)
 * @returns {Object} { insights, rankings, heatmap }
 */
export async function fetchInsights(salesData, inventoryData = null) {
  const res = await fetch(`${API_BASE}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salesData, inventoryData }),
  });

  if (!res.ok) {
    throw new Error(`Insights API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch model accuracy metrics from the Python backend
 * @param {Array} salesData
 * @returns {Object} { mae, mape, r2, sampleSize, crossValidationSize, actuals, predictions }
 */
export async function fetchModelAccuracy(salesData) {
  const res = await fetch(`${API_BASE}/model-accuracy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salesData }),
  });

  if (!res.ok) {
    throw new Error(`Model accuracy API error: ${res.status}`);
  }

  return res.json();
}
