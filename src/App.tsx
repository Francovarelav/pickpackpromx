import './App.css'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Providers from './pages/Providers'
import GenerateOrderPage from './pages/GenerateOrderPage'
import { NavigationProvider, useNavigation } from './contexts/NavigationContext'

function AppContent() {
  const { currentPage } = useNavigation()

  const renderPage = () => {
    switch (currentPage) {
      case 'products':
        return <Products />
      case 'providers':
        return <Providers />
      case 'generate-order':
        return <GenerateOrderPage />
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
