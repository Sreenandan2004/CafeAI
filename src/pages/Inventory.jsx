import { useState, useMemo } from 'react';
import { getInventoryData, updateInventory, CATEGORIES } from '../data/sampleData';
import { formatCurrency } from '../data/dataUtils';

export default function Inventory() {
  const [inventory, setInventory] = useState(() => getInventoryData());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category: 'Beverages', currentStock: '', maxStock: '',
    reorderLevel: '', costPerUnit: '', pricePerUnit: '', unit: 'pcs', supplier: ''
  });

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchTerm, filterCategory]);

  const stats = useMemo(() => ({
    total: inventory.length,
    lowStock: inventory.filter(i => i.currentStock <= i.reorderLevel).length,
    totalValue: inventory.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0),
    categories: [...new Set(inventory.map(i => i.category))].length,
  }), [inventory]);

  function getStockStatus(item) {
    if (item.currentStock === 0) return { label: 'Out of Stock', color: 'rose' };
    if (item.currentStock <= item.reorderLevel) return { label: 'Low Stock', color: 'amber' };
    if (item.currentStock >= item.maxStock * 0.8) return { label: 'Well Stocked', color: 'green' };
    return { label: 'Normal', color: 'blue' };
  }

  function getStockPercent(item) {
    return Math.min(100, (item.currentStock / item.maxStock) * 100);
  }

  function openAddModal() {
    setEditItem(null);
    setFormData({
      name: '', category: 'Beverages', currentStock: '', maxStock: '',
      reorderLevel: '', costPerUnit: '', pricePerUnit: '', unit: 'pcs', supplier: ''
    });
    setShowModal(true);
  }

  function openEditModal(item) {
    setEditItem(item);
    setFormData({
      name: item.name, category: item.category, currentStock: item.currentStock,
      maxStock: item.maxStock, reorderLevel: item.reorderLevel, costPerUnit: item.costPerUnit,
      pricePerUnit: item.pricePerUnit, unit: item.unit, supplier: item.supplier,
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!formData.name || !formData.currentStock) return;

    let updated;
    if (editItem) {
      updated = inventory.map(i => i.id === editItem.id ? {
        ...i, ...formData,
        currentStock: parseInt(formData.currentStock),
        maxStock: parseInt(formData.maxStock),
        reorderLevel: parseInt(formData.reorderLevel),
        costPerUnit: parseFloat(formData.costPerUnit),
        pricePerUnit: parseFloat(formData.pricePerUnit),
      } : i);
    } else {
      const newItem = {
        id: Math.max(...inventory.map(i => i.id)) + 1,
        ...formData,
        currentStock: parseInt(formData.currentStock),
        maxStock: parseInt(formData.maxStock),
        reorderLevel: parseInt(formData.reorderLevel),
        costPerUnit: parseFloat(formData.costPerUnit),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        lastRestocked: new Date().toISOString().split('T')[0],
      };
      updated = [...inventory, newItem];
    }

    setInventory(updated);
    updateInventory(updated);
    setShowModal(false);
  }

  function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const updated = inventory.filter(i => i.id !== id);
    setInventory(updated);
    updateInventory(updated);
  }

  function handleRestock(id) {
    const updated = inventory.map(i => {
      if (i.id === id) {
        return { ...i, currentStock: i.maxStock, lastRestocked: new Date().toISOString().split('T')[0] };
      }
      return i;
    });
    setInventory(updated);
    updateInventory(updated);
  }

  return (
    <div className="slide-up">
      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card teal">
          <div className="kpi-icon teal">📦</div>
          <div className="kpi-info">
            <div className="kpi-label">Total Items</div>
            <div className="kpi-value">{stats.total}</div>
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon amber">⚠️</div>
          <div className="kpi-info">
            <div className="kpi-label">Low Stock</div>
            <div className="kpi-value">{stats.lowStock}</div>
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple">💰</div>
          <div className="kpi-info">
            <div className="kpi-label">Inventory Value</div>
            <div className="kpi-value">{formatCurrency(stats.totalValue)}</div>
          </div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue">🏷️</div>
          <div className="kpi-info">
            <div className="kpi-label">Categories</div>
            <div className="kpi-value">{stats.categories}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="filter-bar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            id="inventory-search"
          />
        </div>
        <div className="tabs">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              className={`tab ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openAddModal} id="add-item-btn" style={{ marginLeft: 'auto' }}>
          ➕ Add Item
        </button>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table" id="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Supplier</th>
                <th>Last Restocked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const status = getStockStatus(item);
                const stockPct = getStockPercent(item);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><span className="badge teal">{item.category}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {item.currentStock} / {item.maxStock}
                        </span>
                      </div>
                      <div className="progress-bar" style={{ width: 120 }}>
                        <div
                          className={`progress-fill ${stockPct <= 25 ? 'rose' : stockPct <= 50 ? 'amber' : 'green'}`}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>
                    </td>
                    <td><span className={`badge ${status.color}`}>{status.label}</span></td>
                    <td>{formatCurrency(item.costPerUnit)}</td>
                    <td>{formatCurrency(item.pricePerUnit)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.supplier}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.lastRestocked}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(item)} title="Edit">✏️</button>
                        <button className="btn btn-sm btn-primary" onClick={() => handleRestock(item.id)} title="Restock">🔄</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Coffee" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                  {['pcs', 'cups', 'glasses', 'plates', 'scoops', 'sets', 'kg', 'liters'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Current Stock</label>
                <input className="form-input" type="number" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Stock</label>
                <input className="form-input" type="number" value={formData.maxStock} onChange={e => setFormData({...formData, maxStock: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input className="form-input" type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input className="form-input" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="e.g. Metro Foods" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cost per Unit (₹)</label>
                <input className="form-input" type="number" value={formData.costPerUnit} onChange={e => setFormData({...formData, costPerUnit: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (₹)</label>
                <input className="form-input" type="number" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: e.target.value})} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} id="save-item-btn">
                {editItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
