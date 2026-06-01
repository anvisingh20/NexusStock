import React, { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Undo2, 
  CheckCircle2, 
  Receipt 
} from 'lucide-react'

export default function OrderModule({ apiUrl }) {
  // Master data
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  
  // App states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Order Composer states
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [cart, setCart] = useState([]) // Array of { product_id, name, sku, quantity, price }
  
  // Expanded Order details tracker (orderId -> boolean)
  const [expandedOrders, setExpandedOrders] = useState({})
  
  // Feedback
  const [formError, setFormError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    fetchMasterData()
  }, [])

  async function fetchMasterData() {
    try {
      setLoading(true)
      setError(null)
      
      const [custRes, prodRes, ordRes] = await Promise.all([
        fetch(`${apiUrl}/customers`),
        fetch(`${apiUrl}/products`),
        fetch(`${apiUrl}/orders`)
      ])

      if (!custRes.ok || !prodRes.ok || !ordRes.ok) {
        throw new Error('Failed to load ledger records from the server')
      }

      const [custData, prodData, ordData] = await Promise.all([
        custRes.json(),
        prodRes.json(),
        ordRes.json()
      ])

      setCustomers(custData)
      setProducts(prodData)
      setOrders(ordData)
    } catch (err) {
      console.error(err)
      setError('Failed to synchronize order registries. Ensure backend is active.')
    } finally {
      setLoading(false)
    }
  }

  // Cart operations
  function handleAddToCart() {
    setFormError(null)
    if (!selectedProductId) return setFormError('Please select a product')
    if (itemQuantity <= 0) return setFormError('Quantity must be greater than zero')

    const product = products.find(p => p.id === selectedProductId)
    if (!product) return setFormError('Product specs not found')

    // Verify stock locally first for helper
    if (product.stock_quantity < itemQuantity) {
      return setFormError(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`)
    }

    // Check if already in cart
    const existingIndex = cart.findIndex(item => item.product_id === selectedProductId)
    let newCart = [...cart]

    if (existingIndex > -1) {
      const newQty = newCart[existingIndex].quantity + itemQuantity
      if (product.stock_quantity < newQty) {
        return setFormError(`Insufficient cumulative stock. Cart total (${newQty}) exceeds available stock (${product.stock_quantity})`)
      }
      newCart[existingIndex].quantity = newQty
    } else {
      newCart.push({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: itemQuantity,
        price: parseFloat(product.price)
      })
    }

    setCart(newCart)
    setSelectedProductId('')
    setItemQuantity(1)
  }

  function handleRemoveFromCart(index) {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  // Submit order
  async function handleSubmitOrder(e) {
    e.preventDefault()
    setFormError(null)

    if (!selectedCustomerId) return setFormError('Please select a customer for this order')
    if (cart.length === 0) return setFormError('Please add at least one product spec to the cart')

    const payload = {
      customer_id: selectedCustomerId,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    }

    try {
      const res = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to authorize order ledger')
      }

      showToast('Order ledger registered and completed')
      setCart([])
      setSelectedCustomerId('')
      fetchMasterData() // Refresh counts and stock levels
    } catch (err) {
      console.error(err)
      setFormError(err.message)
    }
  }

  // Cancel order
  async function handleCancelOrder(orderId) {
    if (!window.confirm('Are you sure you want to CANCEL this order? This will restock all products in this invoice.')) return

    try {
      const res = await fetch(`${apiUrl}/orders/${orderId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to cancel order')
      }

      showToast('Order cancelled. Stocks successfully restored.')
      fetchMasterData()
    } catch (err) {
      alert(err.message)
    }
  }

  function toggleExpandOrder(orderId) {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  function showToast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

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
          <h1 className="module-title">Order Center</h1>
          <p className="module-subtitle">Compose real-time transactions, track delivery status and cancel invoices</p>
        </div>
      </div>

      {error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-rose)' }}>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>Syncing transaction records...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Active Order Builder Grid */}
          <div className="order-builder">
            
            {/* Left side: Cart Composer */}
            <div className="glass-card">
              <h3 className="dashboard-card-title">
                <ShoppingCart size={18} style={{ color: 'var(--accent-indigo)' }} /> Cart Composer
              </h3>
              
              {formError && (
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Select Customer */}
              <div className="form-group">
                <label className="form-label">Customer Registry Profile*</label>
                <select 
                  className="form-input"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Add Product Specs</h4>
                
                {/* Select Product */}
                <div className="form-group">
                  <label className="form-label">Available Product*</label>
                  <select 
                    className="form-input"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">-- Select Product Spec --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} - SKU: {p.sku} (${parseFloat(p.price).toFixed(2)}) [{p.stock_quantity} left]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Order Quantity*</label>
                    <input 
                      type="number"
                      min="1"
                      className="form-input"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ width: '100%', justifyContent: 'center', height: '42px', borderColor: 'var(--accent-indigo)', color: 'var(--text-primary)' }}
                      onClick={handleAddToCart}
                    >
                      <Plus size={16} />
                      <span>Stage Product</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Cart Summary and Checkout */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="dashboard-card-title">
                <Receipt size={18} style={{ color: 'var(--accent-indigo)' }} /> Invoice Summary
              </h3>

              {cart.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', flexDirection: 'column', color: 'var(--text-secondary)', gap: '0.75rem' }}>
                  <ShoppingCart size={32} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: '0.9rem' }}>Staged cart is empty</p>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="order-items-list">
                    {cart.map((item, idx) => (
                      <div key={item.product_id} className="order-item-card">
                        <div className="order-item-info">
                          <span className="order-item-name">{item.name}</span>
                          <span className="order-item-price">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button 
                            type="button" 
                            className="btn btn-icon" 
                            style={{ color: 'var(--accent-rose)', padding: '0.25rem' }}
                            onClick={() => handleRemoveFromCart(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <div className="order-summary-row">
                      <span style={{ color: 'var(--text-secondary)' }}>Staged Items</span>
                      <span>{cart.length}</span>
                    </div>
                    <div className="order-summary-row order-summary-total">
                      <span>Invoice Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem 1rem', fontSize: '0.95rem', justifyContent: 'center' }}
                      onClick={handleSubmitOrder}
                    >
                      <span>Commit Ledger Order</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Previous Orders Registry */}
          <div className="glass-card">
            <h3 className="dashboard-card-title">
              <Receipt size={18} style={{ color: 'var(--accent-indigo)' }} /> Audit Ledger Log
            </h3>
            
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>No orders registered in system catalog yet.</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Order ID / Date</th>
                      <th>Customer Name</th>
                      <th>Total Amount</th>
                      <th>Status Badge</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const isExpanded = !!expandedOrders[order.id]
                      return (
                        <React.Fragment key={order.id}>
                          <tr>
                            <td>
                              <button 
                                className="btn btn-icon" 
                                style={{ padding: '0.2rem' }}
                                onClick={() => toggleExpandOrder(order.id)}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {order.id.substring(0, 8)}...
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {new Date(order.created_at).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                            <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                              ${parseFloat(order.total_amount).toFixed(2)}
                            </td>
                            <td>
                              <span className={`badge ${order.status === 'Completed' ? 'badge-success' : 'badge-danger'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {order.status !== 'Cancelled' && (
                                <button 
                                  className="btn btn-icon" 
                                  style={{ color: 'var(--accent-rose)', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
                                  onClick={() => handleCancelOrder(order.id)}
                                >
                                  <Undo2 size={14} />
                                  <span>Cancel Invoice</span>
                                </button>
                              )}
                            </td>
                          </tr>
                          
                          {/* Expanded Order Items Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="6" style={{ background: 'rgba(255,255,255, 0.01)', padding: '1.25rem 2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                                    Invoice Item Details
                                  </span>
                                  <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                                      <thead>
                                        <tr style={{ background: 'rgba(0,0,0, 0.1)' }}>
                                          <th>Product Spec</th>
                                          <th>Quantity Invoiced</th>
                                          <th>Unit Selling Price</th>
                                          <th style={{ textAlign: 'right' }}>Cumulative Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.items.map(item => (
                                          <tr key={item.id}>
                                            <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                                            <td>{item.quantity}</td>
                                            <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                              ${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  )
}
