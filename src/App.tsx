import { useState } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import GenerateOrderPage from './pages/GenerateOrderPage'
import OrderTrackingPage from './pages/OrderTrackingPage'

type Page = 'dashboard' | 'generate-order' | 'order-tracking'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      case 'generate-order':
        return <GenerateOrderPage onNavigate={setCurrentPage} />
      case 'order-tracking':
        return <OrderTrackingPage onNavigate={setCurrentPage} />
      default:
        return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  return (
    <>
      {renderPage()}
    </>
  )
}

export default App
