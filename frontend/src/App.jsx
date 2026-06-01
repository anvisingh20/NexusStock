import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ProductModule from './components/ProductModule'
import CustomerModule from './components/CustomerModule'
import OrderModule from './components/OrderModule'
import InventoryModule from './components/InventoryModule'

// Default to local backend. Can be overridden in production/Docker by VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard apiUrl={API_URL} setActiveTab={setActiveTab} />
      case 'products':
        return <ProductModule apiUrl={API_URL} />
      case 'customers':
        return <CustomerModule apiUrl={API_URL} />
      case 'orders':
        return <OrderModule apiUrl={API_URL} />
      case 'inventory':
        return <InventoryModule apiUrl={API_URL} />
      default:
        return <Dashboard apiUrl={API_URL} setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Workspace Frame */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  )
}
