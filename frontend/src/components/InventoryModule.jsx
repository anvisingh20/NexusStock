import React, { useState, useEffect } from 'react'
import { 
  Search, 
  AlertTriangle, 
  RotateCw, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react'

export default function InventoryModule({ apiUrl }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Quick Refill adjustment states
  const [adjustingProduct, setAdjustingProduct] = useState(null)
  const [adjustQty, setAdjustQty] = useState(10)
  const [adjustType, setAdjustType] = useState('add') // 'add' or 'set'
  
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    try {
      setLoading(true)
      const res = await fetch(`${apiUrl}/products`)
      if (!res.ok) throw new Error('Failed to fetch product inventory')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error(err)
      setError('Could not read inventory specs from database')
    } finally {
      setLoading(false)
    }
  }

  async function handleQuickAdjust(e) {
    e.preventDefault()
    if (!adjustingProduct) return

    let newQty = adjustingProduct.stock_quantity
    if (adjustType === 'add') {
      newQty += adjustQty
    } else {
      newQty = adjustQty
    }

    if (newQty < 0) {
      alert('Stock level cannot be adjusted below zero')
      return
    }

    try {
      const res = await fetch(`${apiUrl}/products/${adjustingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: newQty })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Adjustment error')

      showToast(`Stock updated for ${adjustingProduct.name} to ${newQty} units`)
      setAdjustingProduct(null)
      fetchInventory()
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  function showToast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const lowStockCount = products.filter(p => p.stock_quantity <= 10).length

  return (
    <div>
      {/* Toast Notification */}
      {successMsg && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1100, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.95)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', color: '#ffffff', boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.2s ease-out' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      <div className="module-header">
        <div className="module-title-section">
          <h1 className="module-title">Inventory Control</h1>
          <p className="module-subtitle">Monitor available sheets, track critical levels and trigger quick stock refills</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchInventory} style={{ padding: '0.5rem 0.8rem' }}>
            <RotateCw size={16} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: lowStockCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', background: lowStockCount > 0 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.15)', fontSize: '0.875rem', fontWeight: 600 }}>
            {lowStockCount > 0 ? <AlertTriangle size={16} /> : <TrendingUp size={16} />}
            <span>{lowStockCount > 0 ? `${lowStockCount} Low Level Warnings` : 'All Stock Optimized'}</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        {/* Search controls */}
        <div className="search-section">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="form-input search-input" 
              placeholder="Filter stock records by Name or SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p>Scanning physical ledger databases...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-rose)' }}>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1rem' }}>No inventory specs recorded matching criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Spec Name</th>
                  <th>Stock Quantity</th>
                  <th>Status Indicator</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLow = product.stock_quantity <= 10
                  const isZero = product.stock_quantity === 0
                  return (
                    <tr key={product.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
                        {product.sku}
                      </td>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', marginRight: '0.25rem' }}>
                          {product.stock_quantity}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>units</span>
                      </td>
                      <td>
                        {isZero ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-warning">Low Level</span>
                            <div className="pulse-dot"></div>
                          </div>
                        ) : (
                          <span className="badge badge-success">Optimized</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.25rem' }}
                          onClick={() => {
                            setAdjustingProduct(product)
                            setAdjustQty(10)
                            setAdjustType('add')
                          }}
                        >
                          <Sliders size={13} style={{ color: 'var(--accent-indigo)' }} />
                          <span>Refill</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refill Quick Adjust Modal */}
      {adjustingProduct && (
        <div className="modal-overlay">
          <div className="glass-card modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1.25rem' }}>Refill Adjustments</h3>
              <button className="btn btn-icon" onClick={() => setAdjustingProduct(null)}>
                ✕
              </button>
            </div>
            
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Product Name:</span>
                <span style={{ fontWeight: 600 }}>{adjustingProduct.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Stock:</span>
                <span style={{ fontWeight: 600, color: adjustingProduct.stock_quantity <= 10 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                  {adjustingProduct.stock_quantity} units
                </span>
              </div>
            </div>

            <form onSubmit={handleQuickAdjust}>
              <div className="form-group">
                <label className="form-label">Adjustment Formula</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${adjustType === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                    onClick={() => setAdjustType('add')}
                  >
                    <ArrowUpRight size={14} />
                    <span>Increment (+)</span>
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${adjustType === 'set' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                    onClick={() => setAdjustType('set')}
                  >
                    <span>Overwite (=)</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Adjustment</label>
                <input 
                  type="number" 
                  min={adjustType === 'set' ? '0' : '1'}
                  className="form-input"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(adjustType === 'set' ? 0 : 1, parseInt(e.target.value) || 0))}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustingProduct(null)}>
                  Abort
                </button>
                <button type="submit" className="btn btn-primary">
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
