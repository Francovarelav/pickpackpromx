import './App.css'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Providers from './pages/Providers'
import GenerateOrderPage from './pages/GenerateOrderPage'
import Airlines from './pages/Airlines'
import Employees from './pages/Employees'
import OrderTrackingPage from './pages/OrderTrackingPage'
import OrderDetailPage from './pages/OrderDetailPage'
import type { Order } from '@/types/order-types'
import { NavigationProvider, useNavigation } from './contexts/NavigationContext'

type Page = 'dashboard' | 'products' | 'providers' | 'generate-order' | 'airlines' | 'employees' | 'order-tracking' | 'order-detail'

function AppContent() {
  const { currentPage, setCurrentPage } = useNavigation()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const handleNavigate = (page: Page, order?: Order) => {
    setCurrentPage(page)
    if (order) {
      setSelectedOrder(order)
    } else {
      setSelectedOrder(null)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'products':
        return <Products />
      case 'providers':
        return <Providers />
      case 'generate-order':
        return <GenerateOrderPage onNavigate={handleNavigate} />
      case 'airlines':
        return <Airlines />
      case 'employees':
        return <Employees />
      case 'order-tracking':
        return <OrderTrackingPage onNavigate={handleNavigate} />
      case 'order-detail':
        return <OrderDetailPage order={selectedOrder} onNavigate={handleNavigate} />
      case 'dashboard':
      default:
        return <Dashboard />
    }
  }

  return (
    <>
      {renderPage()}
    </>
  )
}

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  )
}

export default App
