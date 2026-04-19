// Detects current season based on month
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5)  return 'spring';
  if (month >= 6 && month <= 8)  return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export const SEASONAL_MENUS = {
  summer: {
    label: '☀️ Summer Special',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.1)',
    description: 'Cool down with our refreshing summer menu!',
    items: [
      { id: 's1', name: 'Mango Lassi',        price: 45,  category: 'Beverages', emoji: '🥭', description: 'Fresh mango blended with yogurt' },
      { id: 's2', name: 'Cold Coffee',         price: 55,  category: 'Beverages', emoji: '☕', description: 'Chilled coffee with ice cream' },
      { id: 's3', name: 'Watermelon Juice',    price: 35,  category: 'Beverages', emoji: '🍉', description: 'Fresh watermelon juice' },
      { id: 's4', name: 'Fruit Salad',         price: 60,  category: 'Snacks',    emoji: '🍱', description: 'Mixed seasonal fruits' },
      { id: 's5', name: 'Ice Cream Sandwich',  price: 40,  category: 'Desserts',  emoji: '🍦', description: 'Vanilla ice cream in wafer' },
      { id: 's6', name: 'Chilled Lemonade',    price: 30,  category: 'Beverages', emoji: '🍋', description: 'Fresh lemon with mint' },
    ]
  },
  winter: {
    label: '❄️ Winter Warmers',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.1)',
    description: 'Stay warm with our cozy winter specials!',
    items: [
      { id: 'w1', name: 'Masala Chai',         price: 20,  category: 'Beverages', emoji: '🍵', description: 'Spiced Indian tea' },
      { id: 'w2', name: 'Hot Chocolate',       price: 50,  category: 'Beverages', emoji: '🍫', description: 'Rich creamy hot chocolate' },
      { id: 'w3', name: 'Vegetable Soup',      price: 45,  category: 'Meals',     emoji: '🍲', description: 'Hot veggie soup with bread' },
      { id: 'w4', name: 'Aloo Paratha',        price: 55,  category: 'Meals',     emoji: '🫓', description: 'Stuffed potato flatbread' },
      { id: 'w5', name: 'Ginger Lemon Tea',    price: 25,  category: 'Beverages', emoji: '🫖', description: 'Warm ginger lemon tea' },
      { id: 'w6', name: 'Carrot Halwa',        price: 40,  category: 'Desserts',  emoji: '🥕', description: 'Traditional carrot dessert' },
    ]
  },
  spring: {
    label: '🌸 Spring Fresh',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.1)',
    description: 'Fresh flavors of the season!',
    items: [
      { id: 'sp1', name: 'Green Smoothie',    price: 60,  category: 'Beverages', emoji: '🥤', description: 'Spinach, banana and mango blend' },
      { id: 'sp2', name: 'Garden Salad',      price: 55,  category: 'Meals',     emoji: '🥗', description: 'Fresh garden vegetables' },
      { id: 'sp3', name: 'Mint Lemonade',     price: 35,  category: 'Beverages', emoji: '🍃', description: 'Refreshing mint lemonade' },
      { id: 'sp4', name: 'Sprouts Chaat',     price: 40,  category: 'Snacks',    emoji: '🌱', description: 'Healthy sprout salad' },
      { id: 'sp5', name: 'Fresh Fruit Juice', price: 45,  category: 'Beverages', emoji: '🍊', description: 'Seasonal fresh fruit juice' },
      { id: 'sp6', name: 'Veggie Wrap',       price: 65,  category: 'Meals',     emoji: '🌯', description: 'Grilled veggies in tortilla' },
    ]
  },
  autumn: {
    label: '🍂 Autumn Harvest',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.1)',
    description: 'Rich and hearty autumn flavors!',
    items: [
      { id: 'a1', name: 'Pumpkin Soup',       price: 50,  category: 'Meals',     emoji: '🎃', description: 'Creamy pumpkin soup' },
      { id: 'a2', name: 'Apple Cider',        price: 40,  category: 'Beverages', emoji: '🍎', description: 'Warm spiced apple cider' },
      { id: 'a3', name: 'Corn on the Cob',    price: 30,  category: 'Snacks',    emoji: '🌽', description: 'Roasted corn with spices' },
      { id: 'a4', name: 'Mushroom Toast',     price: 70,  category: 'Meals',     emoji: '🍄', description: 'Sautéed mushroom on toast' },
      { id: 'a5', name: 'Hot Apple Pie',      price: 60,  category: 'Desserts',  emoji: '🥧', description: 'Warm apple pie slice' },
      { id: 'a6', name: 'Spiced Buttermilk',  price: 25,  category: 'Beverages', emoji: '🥛', description: 'Chilled spiced buttermilk' },
    ]
  }
};

// Regular menu items (always available)
export const REGULAR_MENU = [
  { id: 'r1',  name: 'Masala Dosa',      price: 60,  category: 'Meals',     emoji: '🫓', description: 'Crispy rice crepe with potato filling' },
  { id: 'r2',  name: 'Idli Sambar',      price: 40,  category: 'Meals',     emoji: '🍚', description: '2 idlis with sambar and chutney' },
  { id: 'r3',  name: 'Veg Biryani',      price: 80,  category: 'Meals',     emoji: '🍛', description: 'Fragrant vegetable biryani' },
  { id: 'r4',  name: 'Samosa',           price: 15,  category: 'Snacks',    emoji: '🥟', description: 'Crispy potato samosa' },
  { id: 'r5',  name: 'Chai',             price: 15,  category: 'Beverages', emoji: '☕', description: 'Hot Indian tea' },
  { id: 'r6',  name: 'Coffee',           price: 20,  category: 'Beverages', emoji: '☕', description: 'Filter coffee' },
  { id: 'r7',  name: 'Veg Burger',       price: 70,  category: 'Meals',     emoji: '🍔', description: 'Veggie patty with lettuce' },
  { id: 'r8',  name: 'French Fries',     price: 50,  category: 'Snacks',    emoji: '🍟', description: 'Crispy salted fries' },
  { id: 'r9',  name: 'Chocolate Cake',   price: 55,  category: 'Desserts',  emoji: '🎂', description: 'Slice of chocolate cake' },
  { id: 'r10', name: 'Fresh Lime Soda',  price: 30,  category: 'Beverages', emoji: '🥤', description: 'Sweet or salted lime soda' },
];