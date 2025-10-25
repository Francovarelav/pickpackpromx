import './App.css'
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
        return <GenerateOrderPage onNavigate={() => {}} />
      default:
        return <Dashboard onNavigate={() => {}} />
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
