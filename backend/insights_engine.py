"""
AI Insights Engine
Generates actionable intelligence from sales and inventory data using pandas.
"""

import numpy as np
import pandas as pd


class InsightsEngine:
    """Generates AI-powered insights and recommendations from sales data."""

    def __init__(self, sales_data, inventory_data=None):
        self.df = pd.DataFrame(sales_data)
        self.df['date'] = pd.to_datetime(self.df['date'])
        self.inventory = pd.DataFrame(inventory_data) if inventory_data else None

    def _get_recent_and_previous(self, days=30):
        """Split into recent and previous period for comparison."""
        latest = self.df['date'].max()
        cutoff = latest - pd.Timedelta(days=days)
        prev_cutoff = cutoff - pd.Timedelta(days=days)

        recent = self.df[self.df['date'] > cutoff]
        previous = self.df[(self.df['date'] > prev_cutoff) & (self.df['date'] <= cutoff)]
        return recent, previous

    def _group_by_item(self, df):
        """Aggregate by item."""
        grouped = df.groupby(['itemId', 'itemName', 'category']).agg(
            revenue=('totalRevenue', 'sum'),
            cost=('totalCost', 'sum'),
            quantity=('quantity', 'sum'),
            daysActive=('date', 'nunique'),
        ).reset_index()
        grouped['profit'] = grouped['revenue'] - grouped['cost']
        grouped['margin'] = (grouped['profit'] / grouped['revenue'] * 100).round(1)
        grouped['avgDailyQty'] = (grouped['quantity'] / grouped['daysActive']).round(1)
        return grouped

    def _group_by_category(self, df):
        """Aggregate by category."""
        grouped = df.groupby('category').agg(
            revenue=('totalRevenue', 'sum'),
            cost=('totalCost', 'sum'),
            quantity=('quantity', 'sum'),
            itemCount=('itemId', 'nunique'),
        ).reset_index()
        grouped['profit'] = grouped['revenue'] - grouped['cost']
        grouped['margin'] = (grouped['profit'] / grouped['revenue'] * 100).round(1)
        return grouped

    def generate_insights(self):
        """Generate comprehensive AI insights."""
        insights = []
        recent, previous = self._get_recent_and_previous()

        recent_items = self._group_by_item(recent)
        previous_items = self._group_by_item(previous)

        # --- TOP PERFORMERS ---
        top_by_revenue = recent_items.nlargest(5, 'revenue')
        if len(top_by_revenue) > 0:
            top_names = top_by_revenue['itemName'].tolist()
            top_rev = int(top_by_revenue.iloc[0]['revenue'])
            insights.append({
                'id': 'top-revenue',
                'type': 'success',
                'icon': '🏆',
                'title': 'Top Revenue Generators',
                'description': f"{top_names[0]} leads with ₹{top_rev:,} in the last 30 days, followed by {top_names[1]} and {top_names[2]}.",
                'items': top_names,
                'priority': 'high',
                'category': 'performance',
            })

        # --- BOTTOM PERFORMERS ---
        bottom_by_revenue = recent_items.nsmallest(5, 'revenue')
        if len(bottom_by_revenue) > 0:
            bottom_names = bottom_by_revenue['itemName'].tolist()
            bottom_rev = int(bottom_by_revenue.iloc[0]['revenue'])
            insights.append({
                'id': 'bottom-revenue',
                'type': 'warning',
                'icon': '📉',
                'title': 'Lowest Revenue Items',
                'description': f"{bottom_names[0]} generated only ₹{bottom_rev:,}. Consider revising pricing or replacing with higher-demand items.",
                'items': bottom_names,
                'priority': 'medium',
                'category': 'performance',
            })

        # --- GROWTH TRENDS ---
        if len(previous_items) > 0:
            merged = recent_items.merge(
                previous_items[['itemId', 'quantity']],
                on='itemId', suffixes=('', '_prev'), how='left'
            )
            merged['quantity_prev'] = merged['quantity_prev'].fillna(0)
            merged['growth'] = np.where(
                merged['quantity_prev'] > 0,
                ((merged['quantity'] - merged['quantity_prev']) / merged['quantity_prev'] * 100),
                0
            )

            fastest_growing = merged.nlargest(3, 'growth')
            if len(fastest_growing) > 0 and float(fastest_growing.iloc[0]['growth']) > 5:
                grow_items = [f"{r['itemName']} (+{r['growth']:.1f}%)" for _, r in fastest_growing.iterrows()]
                insights.append({
                    'id': 'fast-growing',
                    'type': 'success',
                    'icon': '🚀',
                    'title': 'Fastest Growing Items',
                    'description': f"{fastest_growing.iloc[0]['itemName']} grew by {fastest_growing.iloc[0]['growth']:.1f}% vs last month.",
                    'items': grow_items,
                    'priority': 'high',
                    'category': 'trends',
                })

            fastest_declining = merged.nsmallest(3, 'growth')
            if len(fastest_declining) > 0 and float(fastest_declining.iloc[0]['growth']) < -5:
                decline_items = [f"{r['itemName']} ({r['growth']:.1f}%)" for _, r in fastest_declining.iterrows()]
                insights.append({
                    'id': 'declining-items',
                    'type': 'danger',
                    'icon': '⚠️',
                    'title': 'Declining Items - Action Needed',
                    'description': f"{fastest_declining.iloc[0]['itemName']} dropped by {abs(fastest_declining.iloc[0]['growth']):.1f}%. Consider running a promotion.",
                    'items': decline_items,
                    'priority': 'high',
                    'category': 'trends',
                })

        # --- CATEGORY ANALYSIS ---
        cat_data = self._group_by_category(recent)
        if len(cat_data) > 0:
            top_cat = cat_data.loc[cat_data['revenue'].idxmax()]
            best_margin_cat = cat_data.loc[cat_data['margin'].idxmax()]
            insights.append({
                'id': 'category-leader',
                'type': 'info',
                'icon': '📊',
                'title': 'Category Performance',
                'description': f"{top_cat['category']} is the highest revenue category at ₹{int(top_cat['revenue']):,}. {best_margin_cat['category']} has the best profit margin at {best_margin_cat['margin']}%.",
                'priority': 'medium',
                'category': 'analysis',
            })

        # --- PROFIT MARGINS ---
        high_margin = recent_items.nlargest(3, 'margin')
        if len(high_margin) > 0:
            margin_items = [f"{r['itemName']} ({r['margin']}%)" for _, r in high_margin.iterrows()]
            insights.append({
                'id': 'profit-margins',
                'type': 'info',
                'icon': '💰',
                'title': 'Profit Margin Analysis',
                'description': f"{high_margin.iloc[0]['itemName']} has the highest margin at {high_margin.iloc[0]['margin']}%. Consider promoting high-margin items to boost profits.",
                'items': margin_items,
                'priority': 'medium',
                'category': 'analysis',
            })

        # --- INVENTORY ALERTS ---
        if self.inventory is not None and len(self.inventory) > 0:
            low_stock = self.inventory[self.inventory['currentStock'] <= self.inventory['reorderLevel']]
            if len(low_stock) > 0:
                low_names = low_stock['name'].tolist()
                low_items = [f"{r['name']} ({r['currentStock']}/{r['reorderLevel']})" for _, r in low_stock.iterrows()]
                insights.append({
                    'id': 'low-stock',
                    'type': 'danger',
                    'icon': '🔴',
                    'title': f'{len(low_stock)} Items Need Restocking',
                    'description': f"{', '.join(low_names[:3])}{'  and ' + str(len(low_names) - 3) + ' more' if len(low_names) > 3 else ''} are below reorder level.",
                    'items': low_items[:6],
                    'priority': 'critical',
                    'category': 'inventory',
                })

            overstocked = self.inventory[self.inventory['currentStock'] > self.inventory['maxStock'] * 0.9]
            if len(overstocked) > 0:
                insights.append({
                    'id': 'overstock',
                    'type': 'warning',
                    'icon': '📦',
                    'title': 'Overstocked Items',
                    'description': f"{', '.join(overstocked['name'].tolist()[:3])} are near max capacity. Consider running promotions.",
                    'items': overstocked['name'].tolist()[:6],
                    'priority': 'low',
                    'category': 'inventory',
                })

        # --- DAY OF WEEK PATTERNS ---
        daily = recent.groupby('date').agg(revenue=('totalRevenue', 'sum')).reset_index()
        daily['dow'] = daily['date'].dt.day_name()
        day_avgs = daily.groupby('dow')['revenue'].mean()
        if len(day_avgs) > 0:
            best_day = day_avgs.idxmax()
            worst_day = day_avgs.idxmin()
            insights.append({
                'id': 'best-day',
                'type': 'info',
                'icon': '📅',
                'title': 'Best & Worst Sales Days',
                'description': f"{best_day} averages ₹{int(day_avgs[best_day]):,} (best), while {worst_day} averages ₹{int(day_avgs[worst_day]):,} (lowest). Consider special offers on {worst_day}.",
                'priority': 'low',
                'category': 'patterns',
            })

        # --- COMBO RECOMMENDATION ---
        top_items = recent_items.nlargest(6, 'quantity')
        beverages = top_items[top_items['category'] == 'Beverages']
        meals = top_items[top_items['category'] == 'Meals']
        snacks = top_items[top_items['category'] == 'Snacks']

        if len(beverages) > 0 and (len(meals) > 0 or len(snacks) > 0):
            pairing = meals.iloc[0] if len(meals) > 0 else snacks.iloc[0]
            insights.append({
                'id': 'combo-suggestion',
                'type': 'success',
                'icon': '🎯',
                'title': 'Recommended New Combo',
                'description': f"Pair {beverages.iloc[0]['itemName']} + {pairing['itemName']} as a combo meal. Both are top sellers.",
                'priority': 'medium',
                'category': 'recommendations',
            })

        # --- DAILY REVENUE BENCHMARK ---
        avg_daily = float(daily['revenue'].mean()) if len(daily) > 0 else 0
        insights.append({
            'id': 'avg-order',
            'type': 'info',
            'icon': '📈',
            'title': 'Daily Revenue Benchmark',
            'description': f"Average daily revenue is ₹{int(avg_daily):,}. Target a 10% increase by promoting high-margin items during peak hours.",
            'priority': 'medium',
            'category': 'recommendations',
        })

        return insights

    def get_item_rankings(self, n=5):
        """Get top N and bottom N items by various metrics."""
        items = self._group_by_item(self.df)

        def to_list(df):
            return df.to_dict('records')

        return {
            'byRevenue': {
                'top': to_list(items.nlargest(n, 'revenue')),
                'bottom': to_list(items.nsmallest(n, 'revenue')),
            },
            'byQuantity': {
                'top': to_list(items.nlargest(n, 'quantity')),
                'bottom': to_list(items.nsmallest(n, 'quantity')),
            },
            'byMargin': {
                'top': to_list(items.nlargest(n, 'margin')),
                'bottom': to_list(items.nsmallest(n, 'margin')),
            },
        }

    def get_sales_heatmap(self):
        """Generate a sales heatmap by category and day-of-week."""
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        day_map = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'}

        self.df['dow'] = self.df['date'].dt.dayofweek.map(day_map)
        categories = self.df['category'].unique().tolist()

        heatmap = {}
        max_val = 0

        for cat in categories:
            heatmap[cat] = {}
            cat_data = self.df[self.df['category'] == cat]
            for day in days:
                qty = int(cat_data[cat_data['dow'] == day]['quantity'].sum())
                heatmap[cat][day] = qty
                if qty > max_val:
                    max_val = qty

        # Normalize
        normalized = {}
        for cat in categories:
            normalized[cat] = {}
            for day in days:
                val = heatmap[cat][day]
                normalized[cat][day] = {
                    'value': val,
                    'normalized': round(val / max_val, 3) if max_val > 0 else 0,
                }

        return {
            'heatmap': normalized,
            'days': days,
            'categories': categories,
            'maxVal': max_val,
        }
