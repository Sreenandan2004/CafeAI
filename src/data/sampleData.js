// Sample data for cafeteria management system
// Generates 6 months of realistic data

const CATEGORIES = ['Beverages', 'Snacks', 'Meals', 'Desserts', 'Combos'];

const MENU_ITEMS = [
  // Beverages
  { id: 1, name: 'Coffee', category: 'Beverages', cost: 15, price: 40, unit: 'cups' },
  { id: 2, name: 'Tea', category: 'Beverages', cost: 8, price: 20, unit: 'cups' },
  { id: 3, name: 'Fresh Juice', category: 'Beverages', cost: 25, price: 60, unit: 'glasses' },
  { id: 4, name: 'Milkshake', category: 'Beverages', cost: 30, price: 70, unit: 'glasses' },
  { id: 5, name: 'Cold Coffee', category: 'Beverages', cost: 20, price: 50, unit: 'cups' },
  { id: 6, name: 'Lemonade', category: 'Beverages', cost: 10, price: 30, unit: 'glasses' },
  // Snacks
  { id: 7, name: 'Samosa', category: 'Snacks', cost: 5, price: 15, unit: 'pcs' },
  { id: 8, name: 'Sandwich', category: 'Snacks', cost: 18, price: 45, unit: 'pcs' },
  { id: 9, name: 'Vada Pav', category: 'Snacks', cost: 8, price: 20, unit: 'pcs' },
  { id: 10, name: 'Spring Roll', category: 'Snacks', cost: 12, price: 35, unit: 'pcs' },
  { id: 11, name: 'Puff', category: 'Snacks', cost: 10, price: 25, unit: 'pcs' },
  { id: 12, name: 'French Fries', category: 'Snacks', cost: 15, price: 40, unit: 'plates' },
  // Meals
  { id: 13, name: 'Veg Thali', category: 'Meals', cost: 40, price: 80, unit: 'plates' },
  { id: 14, name: 'Chicken Biryani', category: 'Meals', cost: 55, price: 120, unit: 'plates' },
  { id: 15, name: 'Paneer Butter Masala', category: 'Meals', cost: 45, price: 100, unit: 'plates' },
  { id: 16, name: 'Fried Rice', category: 'Meals', cost: 30, price: 70, unit: 'plates' },
  { id: 17, name: 'Pasta', category: 'Meals', cost: 25, price: 65, unit: 'plates' },
  { id: 18, name: 'Noodles', category: 'Meals', cost: 22, price: 55, unit: 'plates' },
  { id: 19, name: 'Dosa', category: 'Meals', cost: 20, price: 50, unit: 'pcs' },
  { id: 20, name: 'Idli', category: 'Meals', cost: 12, price: 30, unit: 'plates' },
  // Desserts
  { id: 21, name: 'Gulab Jamun', category: 'Desserts', cost: 8, price: 25, unit: 'pcs' },
  { id: 22, name: 'Ice Cream', category: 'Desserts', cost: 20, price: 50, unit: 'scoops' },
  { id: 23, name: 'Brownie', category: 'Desserts', cost: 18, price: 45, unit: 'pcs' },
  { id: 24, name: 'Rasgulla', category: 'Desserts', cost: 10, price: 30, unit: 'pcs' },
  // Combos
  { id: 25, name: 'Meal + Drink Combo', category: 'Combos', cost: 50, price: 110, unit: 'sets' },
  { id: 26, name: 'Snack + Coffee Combo', category: 'Combos', cost: 25, price: 55, unit: 'sets' },
  { id: 27, name: 'Full Meal Deal', category: 'Combos', cost: 65, price: 140, unit: 'sets' },
];

// Generate 6 months of daily sales data
function generateSalesData() {
  const sales = [];
  const startDate = new Date(2025, 8, 1); // Sept 1, 2025
  const endDate = new Date(2026, 2, 12); // March 12, 2026
  let saleId = 1;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const month = d.getMonth();

    // Base multiplier: weekdays = more sales, weekends = less
    const dayMultiplier = isWeekday ? 1.0 : 0.4;

    // Seasonal trend: slight increase over time (growth)
    const dayIndex = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
    const trendMultiplier = 1 + (dayIndex * 0.001);

    // Random variation
    MENU_ITEMS.forEach(item => {
      let baseQty;
      switch (item.category) {
        case 'Beverages': baseQty = 25 + Math.random() * 35; break;
        case 'Snacks': baseQty = 20 + Math.random() * 30; break;
        case 'Meals': baseQty = 15 + Math.random() * 25; break;
        case 'Desserts': baseQty = 8 + Math.random() * 15; break;
        case 'Combos': baseQty = 5 + Math.random() * 12; break;
        default: baseQty = 10;
      }

      // Some items are more popular
      if ([1, 7, 9, 14, 13].includes(item.id)) baseQty *= 1.4;
      if ([22, 4, 27].includes(item.id)) baseQty *= 0.7;

      // Month-based variation (cold drinks less in winter, hot drinks more)
      if (item.category === 'Beverages') {
        if ([11, 0, 1].includes(month)) { // Nov-Feb
          if (['Coffee', 'Tea'].includes(item.name)) baseQty *= 1.3;
          else baseQty *= 0.6;
        } else {
          if (['Coffee', 'Tea'].includes(item.name)) baseQty *= 0.8;
          else baseQty *= 1.3;
        }
      }

      const quantity = Math.max(1, Math.round(baseQty * dayMultiplier * trendMultiplier + (Math.random() - 0.5) * 8));

      sales.push({
        id: saleId++,
        date: new Date(d).toISOString().split('T')[0],
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        quantity,
        costPerUnit: item.cost,
        pricePerUnit: item.price,
        totalRevenue: quantity * item.price,
        totalCost: quantity * item.cost,
      });
    });
  }

  return sales;
}

// Generate inventory data
function generateInventoryData() {
  return MENU_ITEMS.map(item => {
    const maxStock = item.category === 'Meals' ? 200 : item.category === 'Beverages' ? 300 : 150;
    const currentStock = Math.floor(Math.random() * maxStock * 0.8) + Math.floor(maxStock * 0.1);
    const reorderLevel = Math.floor(maxStock * 0.2);

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock,
      maxStock,
      reorderLevel,
      costPerUnit: item.cost,
      pricePerUnit: item.price,
      unit: item.unit,
      lastRestocked: new Date(2026, 2, Math.floor(Math.random() * 10) + 1).toISOString().split('T')[0],
      supplier: ['Metro Foods', 'Fresh Daily', 'Campus Supplies', 'Quick Deliver', 'Farm Fresh'][Math.floor(Math.random() * 5)],
    };
  });
}

// Storage helpers
const STORAGE_KEYS = {
  SALES: 'cafeiq_sales',
  INVENTORY: 'cafeiq_inventory',
  MENU_ITEMS: 'cafeiq_menu_items',
};

export function getFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

export function initializeData() {
  if (!getFromStorage(STORAGE_KEYS.SALES)) {
    saveToStorage(STORAGE_KEYS.SALES, generateSalesData());
  }
  if (!getFromStorage(STORAGE_KEYS.INVENTORY)) {
    saveToStorage(STORAGE_KEYS.INVENTORY, generateInventoryData());
  }
  if (!getFromStorage(STORAGE_KEYS.MENU_ITEMS)) {
    saveToStorage(STORAGE_KEYS.MENU_ITEMS, MENU_ITEMS);
  }
}

export function getSalesData() {
  return getFromStorage(STORAGE_KEYS.SALES) || generateSalesData();
}

export function getInventoryData() {
  return getFromStorage(STORAGE_KEYS.INVENTORY) || generateInventoryData();
}

export function getMenuItems() {
  return getFromStorage(STORAGE_KEYS.MENU_ITEMS) || MENU_ITEMS;
}

export function updateInventory(inventory) {
  saveToStorage(STORAGE_KEYS.INVENTORY, inventory);
}

export function addSale(sale) {
  const sales = getSalesData();
  sale.id = sales.length + 1;
  sales.push(sale);
  saveToStorage(STORAGE_KEYS.SALES, sales);
  return sale;
}

export { CATEGORIES, MENU_ITEMS, STORAGE_KEYS };
