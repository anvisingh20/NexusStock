import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp, 
  Clock 
} from 'lucide-react'

export default function Dashboard({ apiUrl, setActiveTab }) {
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: 0
  })
  const [lowStockList, setLowStockList] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch KPI stats
        const statsRes = await fetch(`${apiUrl}/dashboard/stats`)
        if (!statsRes.ok) throw new Error('Failed to fetch dashboard metrics')
        const statsData = await statsRes.json()
        setStats(statsData)

        // Fetch products to show low stock list (<=10)
        const productsRes = await fetch(`${apiUrl}/products`)
        if (productsRes.ok) {
          const products = await productsRes.json()
          const lowStock = products.filter(p => p.stock_quantity <= 10)
          setLowStockList(lowStock.slice(0, 5))
        }

        // Fetch recent orders
        const ordersRes = await fetch(`${apiUrl}/orders?limit=5`)
        if (ordersRes.ok) {
          const orders = await ordersRes.json()
          setRecentOrders(orders.slice(0, 5))
        }

      } catch (err) {
        console.error(err)
        setError('Could not connect to the NexusStock API server. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [apiUrl])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="pulse-dot" style={{ width: '24px', height: '24px' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Syncing NexusStock Ledger...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="module-header">
        <div className="module-title-section">
          <h1 className="module-title">System Dashboard</h1>
          <p className="module-subtitle">NexusStock analytics and ledger controls</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.875rem', fontWeight: 600 }}>
          <TrendingUp size={16} />
          <span>Real-time Active</span>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)', marginBottom: '2rem', padding: '1.25rem 1.5rem', background: 'rgba(244, 63, 94, 0.05)' }}>
          <h4 style={{ color: 'var(--accent-rose)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> Network Connection Alert
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid-cols-4">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper kpi-icon-indigo">
            <Package size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Total Products</span>
            <span className="kpi-value">{stats.total_products}</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper kpi-icon-emerald">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Total Customers</span>
            <span className="kpi-value">{stats.total_customers}</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper kpi-icon-rose">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Total Orders</span>
            <span className="kpi-value">{stats.total_orders}</span>
          </div>
        </div>

        <div className="glass-card kpi-card" style={stats.low_stock_products > 0 ? { border: '1px solid rgba(245, 158, 11, 0.3)' } : {}}>
          <div className={`kpi-icon-wrapper ${stats.low_stock_products > 0 ? 'kpi-icon-rose' : 'kpi-icon-amber'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Low Stock Items</span>
            <span className="kpi-value" style={stats.low_stock_products > 0 ? { color: 'var(--accent-rose)' } : {}}>{stats.low_stock_products}</span>
          </div>
        </div>
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Orders Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="dashboard-card-title">
            <Clock size={18} style={{ color: 'var(--accent-indigo)' }} /> Recent Orders
          </h3>
          {recentOrders.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', flexDirection: 'column', color: 'var(--text-secondary)', gap: '0.75rem' }}>
              <ShoppingCart size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>No orders placed yet.</p>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }} onClick={() => setActiveTab('orders')}>
                Draft New Order
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>{order.customer_name}</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${order.status === 'Completed' ? 'badge-success' : 'badge-danger'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts Sidebar */}
        <div className="glass-card">
          <h3 className="dashboard-card-title" style={{ color: stats.low_stock_products > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            <AlertTriangle size={18} style={{ color: stats.low_stock_products > 0 ? 'var(--accent-rose)' : 'var(--accent-amber)' }} /> 
            Critical Stock Warnings
          </h3>
          {lowStockList.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', flexDirection: 'column', color: 'var(--text-secondary)', gap: '0.75rem' }}>
              <TrendingUp size={32} style={{ color: 'var(--accent-emerald)', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>All product inventory levels are securely optimized!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockList.map(prod => (
                <div 
                  key={prod.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.85rem 1rem', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'rgba(244, 63, 94, 0.03)', 
                    border: '1px solid rgba(244, 63, 94, 0.15)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{prod.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {prod.sku}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                      {prod.stock_quantity} left
                    </span>
                    <div className="pulse-dot"></div>
                  </div>
                </div>
              ))}
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', fontSize: '0.8rem', marginTop: '0.5rem', justifyContent: 'center' }}
                onClick={() => setActiveTab('inventory')}
              >
                Refill Inventory
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
