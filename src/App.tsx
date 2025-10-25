import './App.css'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Providers from './pages/Providers'
import GenerateOrderPage from './pages/GenerateOrderPage'
import Airlines from './pages/Airlines'
import Employees from './pages/Employees'
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
      case 'airlines':
        return <Airlines />
      case 'employees':
        return <Employees />
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
