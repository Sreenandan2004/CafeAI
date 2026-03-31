"""
Flask API server for CafeIQ ML backend.
Provides endpoints for forecasting and AI insights using scikit-learn.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from ml_models import ForecastingEngine
from insights_engine import InsightsEngine

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'engine': 'scikit-learn'})


@app.route('/api/forecast', methods=['POST'])
def forecast():
    """
    Generate forecasts from sales data.
    Expects JSON body: { salesData: [...] }
    Returns: revenue prediction, spending prediction, item demand, monthly trend, future forecasts
    """
    data = request.get_json()
    sales_data = data.get('salesData', [])

    if not sales_data:
        return jsonify({'error': 'No sales data provided'}), 400

    engine = ForecastingEngine(sales_data)

    result = {
        'revenuePrediction': engine.predict_next_month_revenue(),
        'spendingPrediction': engine.predict_next_month_spending(),
        'itemDemand': engine.predict_item_demand(),
        'modelAccuracy': engine.calculate_model_accuracy(),
        'monthlyTrend': engine.get_monthly_trend(),
        'futureForecasts': engine.forecast_next_n_months(3),
        'weeklyPattern': engine.get_weekly_pattern(),
    }

    return jsonify(result)


@app.route('/api/insights', methods=['POST'])
def insights():
    """
    Generate AI insights from sales and inventory data.
    Expects JSON body: { salesData: [...], inventoryData: [...] }
    Returns: insights, rankings, heatmap
    """
    data = request.get_json()
    sales_data = data.get('salesData', [])
    inventory_data = data.get('inventoryData', None)

    if not sales_data:
        return jsonify({'error': 'No sales data provided'}), 400

    engine = InsightsEngine(sales_data, inventory_data)

    result = {
        'insights': engine.generate_insights(),
        'rankings': engine.get_item_rankings(),
        'heatmap': engine.get_sales_heatmap(),
    }

    return jsonify(result)


@app.route('/api/model-accuracy', methods=['POST'])
def model_accuracy():
    """
    Get model accuracy metrics.
    Expects JSON body: { salesData: [...] }
    """
    data = request.get_json()
    sales_data = data.get('salesData', [])

    if not sales_data:
        return jsonify({'error': 'No sales data provided'}), 400

    engine = ForecastingEngine(sales_data)
    accuracy = engine.calculate_model_accuracy()

    return jsonify(accuracy or {'error': 'Insufficient data'})


if __name__ == '__main__':
    print("🚀 CafeIQ ML Backend starting...")
    print("📊 Using scikit-learn for predictions")
    print("🌐 CORS enabled for http://localhost:5173")
    app.run(debug=True, port=5000)
