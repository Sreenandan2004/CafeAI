"""
ML Forecasting Engine using scikit-learn
Handles revenue/spending prediction, item demand forecasting, and model accuracy.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit


class ForecastingEngine:
    """Scikit-learn based forecasting engine for cafeteria data."""

    def __init__(self, sales_data):
        """
        Args:
            sales_data: list of dicts with keys:
                date, itemId, itemName, category, quantity,
                costPerUnit, pricePerUnit, totalRevenue, totalCost
        """
        self.df = pd.DataFrame(sales_data)
        self.df['date'] = pd.to_datetime(self.df['date'])
        self.df['month'] = self.df['date'].dt.to_period('M')

    def _get_monthly_aggregates(self):
        """Aggregate sales data by month."""
        monthly = self.df.groupby('month').agg(
            revenue=('totalRevenue', 'sum'),
            cost=('totalCost', 'sum'),
            quantity=('quantity', 'sum')
        ).reset_index()
        monthly['month_idx'] = range(len(monthly))
        monthly['month_str'] = monthly['month'].astype(str)
        return monthly

    def predict_next_month_revenue(self):
        """Predict next month's revenue using Linear Regression."""
        monthly = self._get_monthly_aggregates()
        if len(monthly) < 3:
            return None

        X = monthly['month_idx'].values.reshape(-1, 1)
        y = monthly['revenue'].values

        model = LinearRegression()
        model.fit(X, y)

        next_idx = np.array([[len(monthly)]])
        predicted = float(model.predict(next_idx)[0])

        # R² score
        y_pred = model.predict(X)
        r2 = float(r2_score(y, y_pred))

        # Confidence interval from residuals
        residuals = y - y_pred
        residual_std = float(np.std(residuals))

        last_month_revenue = float(y[-1])
        change_pct = ((predicted - last_month_revenue) / last_month_revenue * 100)

        return {
            'predicted': max(0, round(predicted)),
            'lower': max(0, round(predicted - 1.96 * residual_std)),
            'upper': round(predicted + 1.96 * residual_std),
            'lastMonth': round(last_month_revenue),
            'changePercent': round(change_pct, 1),
            'r2': round(r2, 3),
            'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing',
            'slope': round(float(model.coef_[0]), 2),
            'intercept': round(float(model.intercept_), 2),
        }

    def predict_next_month_spending(self):
        """Predict next month's spending/cost using Linear Regression."""
        monthly = self._get_monthly_aggregates()
        if len(monthly) < 3:
            return None

        X = monthly['month_idx'].values.reshape(-1, 1)
        y = monthly['cost'].values

        model = LinearRegression()
        model.fit(X, y)

        next_idx = np.array([[len(monthly)]])
        predicted = float(model.predict(next_idx)[0])

        y_pred = model.predict(X)
        r2 = float(r2_score(y, y_pred))

        residuals = y - y_pred
        residual_std = float(np.std(residuals))

        last_month_cost = float(y[-1])
        change_pct = ((predicted - last_month_cost) / last_month_cost * 100)

        return {
            'predicted': max(0, round(predicted)),
            'lower': max(0, round(predicted - 1.96 * residual_std)),
            'upper': round(predicted + 1.96 * residual_std),
            'lastMonth': round(last_month_cost),
            'changePercent': round(change_pct, 1),
            'r2': round(r2, 3),
            'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing',
        }

    def predict_item_demand(self):
        """Predict next month's quantity for each item using Linear Regression + EMA blend."""
        monthly = self._get_monthly_aggregates()
        if len(monthly) < 3:
            return []

        # Get per-item monthly quantities
        item_monthly = self.df.groupby(['month', 'itemId', 'itemName', 'category']).agg(
            quantity=('quantity', 'sum')
        ).reset_index()

        all_items = self.df[['itemId', 'itemName', 'category']].drop_duplicates()
        predictions = []

        for _, item in all_items.iterrows():
            item_data = item_monthly[item_monthly['itemId'] == item['itemId']].sort_values('month')

            if len(item_data) < 3:
                continue

            X = np.arange(len(item_data)).reshape(-1, 1)
            y = item_data['quantity'].values.astype(float)

            try:
                # Linear Regression prediction
                model = LinearRegression()
                model.fit(X, y)
                lr_predicted = float(model.predict(np.array([[len(item_data)]]))[0])

                y_pred = model.predict(X)
                r2 = float(r2_score(y, y_pred))

                # EMA prediction using pandas
                ema_series = pd.Series(y).ewm(alpha=0.4, adjust=False).mean()
                ema_predicted = float(ema_series.iloc[-1])

                # Blended: 70% regression, 30% EMA
                blended = lr_predicted * 0.7 + ema_predicted * 0.3

                last_month_qty = float(y[-1])
                change_pct = ((blended - last_month_qty) / last_month_qty * 100) if last_month_qty > 0 else 0

                predictions.append({
                    'id': int(item['itemId']),
                    'name': item['itemName'],
                    'category': item['category'],
                    'predicted': max(0, round(blended)),
                    'regressionPredicted': max(0, round(lr_predicted)),
                    'emaPredicted': max(0, round(ema_predicted)),
                    'lastMonth': round(last_month_qty),
                    'changePercent': round(change_pct, 1),
                    'r2': round(r2, 3),
                    'trend': 'up' if model.coef_[0] > 0 else 'down',
                    'confidence': 'High' if r2 > 0.7 else ('Medium' if r2 > 0.4 else 'Low'),
                })
            except Exception:
                continue

        return sorted(predictions, key=lambda x: x['predicted'], reverse=True)

    def calculate_model_accuracy(self):
        """Calculate prediction accuracy using time-series cross-validation."""
        monthly = self._get_monthly_aggregates()
        if len(monthly) < 4:
            return None

        X = monthly['month_idx'].values.reshape(-1, 1)
        y = monthly['revenue'].values

        # Time-series cross-validation (leave-last-out)
        actuals = []
        predictions_list = []

        for i in range(3, len(monthly)):
            X_train = X[:i]
            y_train = y[:i]

            model = LinearRegression()
            model.fit(X_train, y_train)

            predicted = float(model.predict(np.array([[i]]))[0])
            actual = float(y[i])

            actuals.append(actual)
            predictions_list.append(predicted)

        actuals_arr = np.array(actuals)
        preds_arr = np.array(predictions_list)

        mae = float(mean_absolute_error(actuals_arr, preds_arr))
        errors = np.abs(actuals_arr - preds_arr)
        mape = float(np.mean(errors / actuals_arr) * 100)

        # Full model R²
        full_model = LinearRegression()
        full_model.fit(X, y)
        r2 = float(r2_score(y, full_model.predict(X)))

        return {
            'mae': round(mae),
            'mape': round(mape, 1),
            'r2': round(r2, 3),
            'sampleSize': len(monthly),
            'crossValidationSize': len(actuals),
            'actuals': [round(a) for a in actuals],
            'predictions': [round(p) for p in predictions_list],
        }

    def get_monthly_trend(self):
        """Get monthly trend data with regression line."""
        monthly = self._get_monthly_aggregates()
        if len(monthly) < 2:
            return {'months': [], 'trendLine': []}

        X = monthly['month_idx'].values.reshape(-1, 1)
        y = monthly['revenue'].values

        model = LinearRegression()
        model.fit(X, y)

        y_pred = model.predict(X)
        r2 = float(r2_score(y, y_pred))

        # Trend line (including next month)
        extended_X = np.append(X, [[len(monthly)]], axis=0)
        trend_line = [round(float(v)) for v in model.predict(extended_X)]

        months = []
        for _, row in monthly.iterrows():
            months.append({
                'date': row['month_str'],
                'revenue': round(float(row['revenue'])),
                'cost': round(float(row['cost'])),
                'quantity': round(float(row['quantity'])),
            })

        return {
            'months': months,
            'trendLine': trend_line,
            'slope': round(float(model.coef_[0]), 2),
            'r2': round(r2, 3),
        }

    def forecast_next_n_months(self, n=3):
        """Forecast revenue for the next N months."""
        monthly = self._get_monthly_aggregates()
        if len(monthly) < 3:
            return []

        X = monthly['month_idx'].values.reshape(-1, 1)
        y = monthly['revenue'].values

        model = LinearRegression()
        model.fit(X, y)

        residuals = y - model.predict(X)
        residual_std = float(np.std(residuals))

        # Get last month date to calculate future month names
        last_period = monthly['month'].iloc[-1]
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        forecasts = []
        for i in range(1, n + 1):
            future_period = last_period + i
            idx = len(monthly) - 1 + i
            predicted = float(model.predict(np.array([[idx]]))[0])

            forecasts.append({
                'month': f"{month_names[future_period.month - 1]} {future_period.year}",
                'predicted': max(0, round(predicted)),
                'lower': max(0, round(predicted - 1.96 * residual_std)),
                'upper': round(predicted + 1.96 * residual_std),
            })

        return forecasts

    def get_weekly_pattern(self):
        """Detect weekly sales patterns."""
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

        daily = self.df.groupby('date').agg(revenue=('totalRevenue', 'sum')).reset_index()
        daily['dow'] = daily['date'].dt.dayofweek  # 0=Mon, 6=Sun

        result = []
        for i, day in enumerate(day_names):
            day_data = daily[daily['dow'] == i]
            avg_rev = float(day_data['revenue'].mean()) if len(day_data) > 0 else 0
            result.append({
                'day': day,
                'avgRevenue': round(avg_rev),
                'sampleSize': len(day_data),
            })

        return result
