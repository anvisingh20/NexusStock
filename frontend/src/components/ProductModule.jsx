import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

export default function ProductModule({ apiUrl }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('add') // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  // Form values
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    stock_quantity: ''
  })
  const [formError, setFormError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const res = await fetch(`${apiUrl}/products`)
      if (!res.ok) throw new Error('Failed to fetch products list')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load products. Check API connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenAdd() {
    setModalType('add')
    setFormData({
      sku: '',
      name: '',
      description: '',
      price: '',
      stock_quantity: '0'
    })
    setFormError(null)
    setShowModal(true)
  }

  function handleOpenEdit(product) {
    setModalType('edit')
    setSelectedProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity.toString()
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    // Client-side validations
    const priceNum = parseFloat(formData.price)
    const stockNum = parseInt(formData.stock_quantity)

    if (!formData.sku.trim()) return setFormError('SKU is required')
    if (!formData.name.trim()) return setFormError('Product Name is required')
    if (isNaN(priceNum) || priceNum <= 0) return setFormError('Price must be greater than zero')
    if (isNaN(stockNum) || stockNum < 0) return setFormError('Stock quantity cannot be negative')

    const payload = {
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: priceNum,
      stock_quantity: stockNum
    }

    try {
      let url = `${apiUrl}/products`
      let method = 'POST'

      if (modalType === 'edit') {
        url = `${apiUrl}/products/${selectedProduct.id}`
        method = 'PUT'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save product')
      }

      showToast(modalType === 'add' ? 'Product created successfully' : 'Product updated successfully')
      setShowModal(false)
      fetchProducts()
    } catch (err) {
      console.error(err)
      setFormError(err.message)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      const res = await fetch(`${apiUrl}/products/${product.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to delete product')
      }
      showToast('Product deleted successfully')
      fetchProducts()
    } catch (err) {
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
          <h1 className="module-title">Products Registry</h1>
          <p className="module-subtitle">Register, inspect, and update core product inventories</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="glass-card">
        {/* Search controls */}
        <div className="search-section">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="form-input search-input" 
              placeholder="Search by Product Name or SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p>Gathering inventory sheets...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-rose)' }}>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1rem' }}>No products registered matching criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>UnitPrice</th>
                  <th>StockQty</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
                      {product.sku}
                    </td>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td style={{ color: 'var(--text-secondary)', maxW: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.description || '—'}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${product.stock_quantity > 10 ? 'badge-success' : 'badge-danger'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button className="btn btn-icon" onClick={() => handleOpenEdit(product)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(product)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalType === 'add' ? 'Add New Product' : 'Edit Product Specifications'}
              </h3>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">SKU (Unique ID)*</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. LAP-MAC-16" 
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  disabled={modalType === 'edit'}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Name*</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. MacBook Pro 16 Inch" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Provide specifications or tags..." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Unit Price ($)*</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    placeholder="1299.99" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Stock Level*</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="50" 
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Save Specifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
