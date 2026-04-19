import { useState } from 'react';
import { REGULAR_MENU, SEASONAL_MENUS, getCurrentSeason } from '../data/seasonalData';
import { useAuth } from '../context/AuthContext';

export default function CustomerOrder({ onOrderPlaced }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('regular');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);

  const season = getCurrentSeason();
  const seasonalMenu = SEASONAL_MENUS[season];

  const currentMenu = activeTab === 'regular' ? REGULAR_MENU : seasonalMenu.items;
  const categories = ['All', ...new Set(currentMenu.map(i => i.category))];
  const filtered = activeCategory === 'All'
    ? currentMenu
    : currentMenu.filter(i => i.category === activeCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === id);
      if (exists.qty === 1) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

  const placeOrder = () => {
    if (cart.length === 0) return;
    const num = Math.floor(Math.random() * 900) + 100;
    setOrderNumber(num);
    setOrderPlaced(true);
    if (onOrderPlaced) onOrderPlaced({ items: cart, total, orderNumber: num, customer: user.name });
    setCart([]);
  };

  if (orderPlaced) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '5rem', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: 'var(--color-success, #10b981)', fontSize: '1.8rem' }}>Order Placed!</h2>
        <p style={{ color: 'var(--color-text-secondary, #888)', fontSize: '1.1rem' }}>
          Your order number is
        </p>
        <div style={{
          fontSize: '3rem', fontWeight: '800',
          color: 'var(--color-primary, #667eea)',
          margin: '12px 0'
        }}>
          #{orderNumber}
        </div>
        <p style={{ color: 'var(--color-text-secondary, #888)' }}>
          Show this number at the counter to collect your order 🎉
        </p>
        <button
          onClick={() => setOrderPlaced(false)}
          style={{
            marginTop: '24px', padding: '12px 32px',
            background: 'var(--color-primary, #667eea)',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontSize: '1rem',
            fontWeight: '600', cursor: 'pointer'
          }}
        >
          Order Again
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
      {/* LEFT — Menu */}
      <div>
        {/* Tab selector */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => { setActiveTab('regular'); setActiveCategory('All'); }}
            style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: activeTab === 'regular' ? 'var(--color-primary, #667eea)' : 'var(--color-surface, #1e1e2e)',
              color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            🍽️ Regular Menu
          </button>
          <button
            onClick={() => { setActiveTab('seasonal'); setActiveCategory('All'); }}
            style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: activeTab === 'seasonal' ? seasonalMenu.color : 'var(--color-surface, #1e1e2e)',
              color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            {seasonalMenu.label}
          </button>
        </div>

        {/* Seasonal banner */}
        {activeTab === 'seasonal' && (
          <div style={{
            background: seasonalMenu.bgColor,
            border: `1px solid ${seasonalMenu.color}40`,
            borderRadius: '12px', padding: '16px 20px',
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{ fontSize: '2rem' }}>🌟</span>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: seasonalMenu.color }}>
                {seasonalMenu.label}
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary, #888)', fontSize: '0.85rem' }}>
                {seasonalMenu.description}
              </p>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: 'none',
                background: activeCategory === cat ? 'var(--color-primary, #667eea)' : 'var(--color-surface, #1e1e2e)',
                color: activeCategory === cat ? '#fff' : 'var(--color-text-secondary, #888)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filtered.map(item => {
            const inCart = cart.find(c => c.id === item.id);
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--color-surface, #1e1e2e)',
                  borderRadius: '14px', padding: '20px',
                  border: inCart ? '2px solid var(--color-primary, #667eea)' : '1px solid var(--color-border, #333)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '12px' }}>
                  {item.emoji}
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>{item.name}</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: 'var(--color-text-secondary, #888)' }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', color: 'var(--color-primary, #667eea)' }}>
                    ₹{item.price}
                  </span>
                  {inCart ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => removeFromCart(item.id)}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                          background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>
                        −
                      </button>
                      <span style={{ fontWeight: '700' }}>{inCart.qty}</span>
                      <button onClick={() => addToCart(item)}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                          background: 'var(--color-primary, #667eea)', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>
                        +
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none',
                        background: 'var(--color-primary, #667eea)',
                        color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
                      }}>
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT — Cart */}
      <div style={{
        background: 'var(--color-surface, #1e1e2e)',
        borderRadius: '16px', padding: '24px',
        border: '1px solid var(--color-border, #333)',
        position: 'sticky', top: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px', display: 'flex', justifyContent: 'space-between' }}>
          🛒 Your Cart
          {totalItems > 0 && (
            <span style={{
              background: 'var(--color-primary, #667eea)',
              color: '#fff', borderRadius: '50%',
              width: '24px', height: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: '700'
            }}>
              {totalItems}
            </span>
          )}
        </h3>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary, #888)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍽️</div>
            <p style={{ margin: 0 }}>Your cart is empty</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Add items from the menu</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '10px 0',
                  borderBottom: '1px solid var(--color-border, #333)'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                      {item.emoji} {item.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary, #888)' }}>
                      ₹{item.price} × {item.qty}
                    </p>
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--color-primary, #667eea)' }}>
                    ₹{item.price * item.qty}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 0', borderTop: '2px solid var(--color-border, #333)',
              marginBottom: '16px'
            }}>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Total</span>
              <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--color-primary, #667eea)' }}>
                ₹{total}
              </span>
            </div>

            <button
              onClick={placeOrder}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '1rem',
                fontWeight: '700', cursor: 'pointer'
              }}
            >
              Place Order ✅
            </button>

            <button
              onClick={() => setCart([])}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent',
                border: '1px solid #ef4444',
                borderRadius: '12px', color: '#ef4444',
                fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px'
              }}
            >
              Clear Cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}