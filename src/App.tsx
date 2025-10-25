import { useState } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import GenerateOrderPage from './pages/GenerateOrderPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import OrderDetailPage from './pages/OrderDetailPage'
import type { Order } from '@/types/order-types'

type Page = 'dashboard' | 'generate-order' | 'order-tracking' | 'order-detail'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
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
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'generate-order':
        return <GenerateOrderPage onNavigate={handleNavigate} />
      case 'order-tracking':
        return <OrderTrackingPage onNavigate={handleNavigate} />
      case 'order-detail':
        return <OrderDetailPage order={selectedOrder} onNavigate={handleNavigate} />
      default:
        return <Dashboard onNavigate={handleNavigate} />
    }
  }

  return (
    <>
      {renderPage()}
    </>
  )
}

export default App
