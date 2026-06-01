import React from 'react'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Archive, 
  Boxes 
} from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Archive }
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <Boxes size={28} className="brand-icon" />
        <span className="brand-name">NexusStock</span>
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} className="link-icon" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Admin Portal</span>
            <span className="user-role">Super Administrator</span>
          </div>
        </div>
      </div>
    </div>
  )
}
