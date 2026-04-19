import { useState, useEffect, useRef } from 'react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', next: 'preparing', nextLabel: 'Start Cooking 👨‍🍳' },
  preparing: { label: 'Preparing', color: '#3b82f6', next: 'ready',     nextLabel: 'Mark Ready ✅' },
  ready:     { label: 'Ready',     color: '#10b981', next: 'collected', nextLabel: 'Mark Collected 🎉' },
  collected: { label: 'Collected', color: '#6b7280', next: null,        nextLabel: null },
};

const STORAGE_KEY = 'cafeiq_kitchen_orders';

function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Could not save orders', e);
  }
}

export default function KitchenDisplay({ newOrders = [] }) {
  const [orders, setOrders] = useState(() => loadOrders());
  const seenOrderNumbers = useRef(new Set(loadOrders().map(o => o.orderNumber)));

  // Whenever orders change, save to localStorage immediately
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  // When new orders arrive from CustomerOrder page, add only unseen ones
  useEffect(() => {
    if (newOrders.length === 0) return;

    const toAdd = newOrders.filter(
      o => !seenOrderNumbers.current.has(o.orderNumber)
    );

    if (toAdd.length === 0) return;

    toAdd.forEach(o => seenOrderNumbers.current.add(o.orderNumber));

    const formatted = toAdd.map(o => ({
      id: `${o.orderNumber}-${Date.now()}`,
      orderNumber: o.orderNumber,
      customer: o.customer || 'Customer',
      time: new Date().toLocaleTimeString(),
      status: 'pending',
      items: o.items.map(i => ({
        name: i.name,
        qty:  i.qty,
        emoji: i.emoji || '🍽️',
      })),
      total: o.total,
    }));

    setOrders(prev => [...formatted, ...prev]);
  }, [newOrders]);

  // Update order status — saved automatically via the useEffect above
  const updateStatus = (id) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== id) return order;
      const next = STATUS_CONFIG[order.status]?.next;
      if (!next) return order;
      return { ...order, status: next };
    }));
  };

  // Clear ALL orders from state and storage
  const clearOrders = () => {
    setOrders([]);
    seenOrderNumbers.current = new Set();
    localStorage.removeItem(STORAGE_KEY);
  };

  const activeOrders  = orders.filter(o => o.status !== 'collected');
  const collected     = orders.filter(o => o.status === 'collected');

  const stats = {
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready:     orders.filter(o => o.status === 'ready').length,
    collected: collected.length,
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0 }}>
          🔥 Active Orders ({activeOrders.length})
        </h3>
        <button
          onClick={clearOrders}
          style={{
            padding: '8px 18px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '8px', color: '#ef4444',
            cursor: 'pointer', fontWeight: '600',
            fontSize: '0.85rem'
          }}
        >
          🗑️ Clear All Orders
        </button>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: '16px', marginBottom: '28px'
      }}>
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} style={{
            background: 'var(--color-surface, #1e1e2e)',
            borderRadius: '12px', padding: '16px',
            border: `2px solid ${STATUS_CONFIG[key].color}40`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem', fontWeight: '800',
              color: STATUS_CONFIG[key].color
            }}>{val}</div>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary, #888)',
              textTransform: 'capitalize'
            }}>
              {STATUS_CONFIG[key].label}
            </div>
          </div>
        ))}
      </div>

      {/* Active orders grid */}
      {activeOrders.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          background: 'var(--color-surface, #1e1e2e)',
          borderRadius: '16px',
          color: 'var(--color-text-secondary, #888)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
          <p style={{ margin: 0 }}>No active orders! All caught up.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {activeOrders.map(order => {
            const config = STATUS_CONFIG[order.status];
            return (
              <div key={order.id} style={{
                background: 'var(--color-surface, #1e1e2e)',
                borderRadius: '16px', padding: '20px',
                border: `2px solid ${config.color}`,
                position: 'relative', overflow: 'hidden'
              }}>
                {/* Status badge */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  background: config.color, padding: '4px 14px',
                  borderBottomLeftRadius: '10px',
                  fontSize: '0.75rem', fontWeight: '700', color: '#fff'
                }}>
                  {config.label}
                </div>

                {/* Header */}
                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.2rem' }}>
                    #{order.orderNumber}
                  </h4>
                  <p style={{
                    margin: '4px 0 0',
                    color: 'var(--color-text-secondary, #888)',
                    fontSize: '0.8rem'
                  }}>
                    👤 {order.customer} &nbsp;|&nbsp; 🕐 {order.time}
                  </p>
                </div>

                {/* Items list */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  padding: '12px', marginBottom: '16px'
                }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: idx < order.items.length - 1
                        ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                      <span style={{ fontSize: '0.9rem' }}>
                        {item.emoji} {item.name}
                      </span>
                      <span style={{ fontWeight: '700', color: config.color }}>
                        ×{item.qty}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '14px', fontSize: '0.9rem'
                }}>
                  <span style={{ color: 'var(--color-text-secondary, #888)' }}>
                    Total
                  </span>
                  <span style={{ fontWeight: '700' }}>₹{order.total}</span>
                </div>

                {/* Action button */}
                {config.next && (
                  <button
                    onClick={() => updateStatus(order.id)}
                    style={{
                      width: '100%', padding: '10px',
                      background: config.color,
                      border: 'none', borderRadius: '10px',
                      color: '#fff', fontWeight: '700',
                      cursor: 'pointer', fontSize: '0.9rem'
                    }}
                  >
                    {config.nextLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Collected section */}
      {collected.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{
            marginBottom: '16px',
            color: 'var(--color-text-secondary, #888)'
          }}>
            ✅ Collected Today ({collected.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {collected.map(order => (
              <div key={order.id} style={{
                background: 'var(--color-surface, #1e1e2e)',
                borderRadius: '10px', padding: '12px 16px',
                border: '1px solid var(--color-border, #333)',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', opacity: 0.6
              }}>
                <span>#{order.orderNumber} — {order.customer}</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>
                  Collected ✅
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}