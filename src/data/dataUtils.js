// Data utility functions for aggregation and analysis
import { getSalesData } from './sampleData';

// Group sales by a specific time period
export function groupSalesByPeriod(sales, period = 'daily') {
  const groups = {};

  sales.forEach(sale => {
    let key;
    const date = new Date(sale.date);

    switch (period) {
      case 'daily':
        key = sale.date;
        break;
      case 'weekly': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = sale.date;
    }

    if (!groups[key]) {
      groups[key] = { date: key, revenue: 0, cost: 0, quantity: 0, items: {} };
    }

    groups[key].revenue += sale.totalRevenue;
    groups[key].cost += sale.totalCost;
    groups[key].quantity += sale.quantity;

    if (!groups[key].items[sale.itemId]) {
      groups[key].items[sale.itemId] = { name: sale.itemName, category: sale.category, quantity: 0, revenue: 0 };
    }
    groups[key].items[sale.itemId].quantity += sale.quantity;
    groups[key].items[sale.itemId].revenue += sale.totalRevenue;
  });

  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}

// Group sales by category
export function groupByCategory(sales) {
  const categories = {};

  sales.forEach(sale => {
    if (!categories[sale.category]) {
      categories[sale.category] = { category: sale.category, revenue: 0, cost: 0, quantity: 0, itemCount: new Set() };
    }
    categories[sale.category].revenue += sale.totalRevenue;
    categories[sale.category].cost += sale.totalCost;
    categories[sale.category].quantity += sale.quantity;
    categories[sale.category].itemCount.add(sale.itemId);
  });

  return Object.values(categories).map(c => ({
    ...c,
    itemCount: c.itemCount.size,
    profit: c.revenue - c.cost,
    margin: ((c.revenue - c.cost) / c.revenue * 100).toFixed(1),
  }));
}

// Group sales by item
export function groupByItem(sales) {
  const items = {};

  sales.forEach(sale => {
    if (!items[sale.itemId]) {
      items[sale.itemId] = {
        id: sale.itemId,
        name: sale.itemName,
        category: sale.category,
        revenue: 0,
        cost: 0,
        quantity: 0,
        daysActive: new Set(),
      };
    }
    items[sale.itemId].revenue += sale.totalRevenue;
    items[sale.itemId].cost += sale.totalCost;
    items[sale.itemId].quantity += sale.quantity;
    items[sale.itemId].daysActive.add(sale.date);
  });

  return Object.values(items).map(item => ({
    ...item,
    daysActive: item.daysActive.size,
    avgDailyQty: (item.quantity / item.daysActive.size).toFixed(1),
    profit: item.revenue - item.cost,
    margin: ((item.revenue - item.cost) / item.revenue * 100).toFixed(1),
  }));
}

// Get sales for a specific date range
export function filterByDateRange(sales, startDate, endDate) {
  return sales.filter(s => s.date >= startDate && s.date <= endDate);
}

// Calculate totals
export function calculateTotals(sales) {
  return sales.reduce((acc, sale) => ({
    revenue: acc.revenue + sale.totalRevenue,
    cost: acc.cost + sale.totalCost,
    quantity: acc.quantity + sale.quantity,
    transactions: acc.transactions + 1,
  }), { revenue: 0, cost: 0, quantity: 0, transactions: 0 });
}

// Get the last N months of aggregated data
export function getMonthlyData(sales, months = 6) {
  const monthly = groupSalesByPeriod(sales, 'monthly');
  return monthly.slice(-months);
}

// Calculate day-of-week averages
export function getDayOfWeekAverages(sales) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayData = {};

  days.forEach(day => { dayData[day] = { revenue: 0, count: 0 }; });

  const dailySales = groupSalesByPeriod(sales, 'daily');
  dailySales.forEach(day => {
    const dow = days[new Date(day.date).getDay()];
    dayData[dow].revenue += day.revenue;
    dayData[dow].count += 1;
  });

  return days.map(day => ({
    day,
    avgRevenue: dayData[day].count > 0 ? Math.round(dayData[day].revenue / dayData[day].count) : 0,
  }));
}

// Calculate growth rate between two periods
export function calculateGrowthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
}

// Get recent sales (last N days)
export function getRecentSales(sales, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return sales.filter(s => s.date >= cutoffStr);
}

// Format currency
export function formatCurrency(amount) {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// Format number with commas
export function formatNumber(num) {
  return Math.round(num).toLocaleString('en-IN');
}

// Get month name
export function getMonthName(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('-');
  return months[parseInt(parts[1]) - 1] + ' ' + parts[0];
}