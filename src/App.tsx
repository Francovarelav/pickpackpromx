import { useState } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import GenerateOrderPage from './pages/GenerateOrderPage'

type Page = 'dashboard' | 'generate-order'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      case 'generate-order':
        return <GenerateOrderPage onNavigate={setCurrentPage} />
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
