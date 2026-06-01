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

export default function CustomerModule({ apiUrl }) {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('add') // 'add' or 'edit'
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Form values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [formError, setFormError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      setLoading(true)
      const res = await fetch(`${apiUrl}/customers`)
      if (!res.ok) throw new Error('Failed to fetch customers list')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load customers. Check API connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenAdd() {
    setModalType('add')
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    })
    setFormError(null)
    setShowModal(true)
  }

  function handleOpenEdit(customer) {
    setModalType('edit')
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || ''
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    // Basic format validation
    if (!formData.name.trim()) return setFormError('Customer Name is required')
    if (!formData.email.trim()) return setFormError('Email address is required')
    
    // Simple email regex format verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      return setFormError('Please enter a valid email format (e.g. name@domain.com)')
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null
    }

    try {
      let url = `${apiUrl}/customers`
      let method = 'POST'

      if (modalType === 'edit') {
        url = `${apiUrl}/customers/${selectedCustomer.id}`
        method = 'PUT'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save customer record')
      }

      showToast(modalType === 'add' ? 'Customer profile created' : 'Customer profile updated')
      setShowModal(false)
      fetchCustomers()
    } catch (err) {
      console.error(err)
      setFormError(err.message)
    }
  }

  async function handleDelete(customer) {
    if (!window.confirm(`Are you sure you want to delete profile for "${customer.name}"?`)) return

    try {
      const res = await fetch(`${apiUrl}/customers/${customer.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to delete customer')
      }
      showToast('Customer profile deleted')
      fetchCustomers()
    } catch (err) {
      alert(err.message)
    }
  }

  function showToast(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="module-title">Customer Ledger</h1>
          <p className="module-subtitle">Register and oversee customer profiles, addresses, and contacts</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Customer</span>
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
              placeholder="Search by Name or Email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p>Loading database directory...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-rose)' }}>
            <p>{error}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1rem' }}>No customer profiles registered matching criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Shipping Address</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customer.name}</td>
                    <td style={{ color: 'var(--accent-indigo)', fontWeight: 500 }}>{customer.email}</td>
                    <td>{customer.phone || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', maxW: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {customer.address || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button className="btn btn-icon" onClick={() => handleOpenEdit(customer)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(customer)}>
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
                {modalType === 'add' ? 'Add Customer Profile' : 'Modify Customer Specifications'}
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
                <label className="form-label">Full Name*</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Johnathan Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address*</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +1 (555) 019-2834" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shipping / Billing Address</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="e.g. 100 Main St, Suite 400, Seattle, WA 98101" 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
