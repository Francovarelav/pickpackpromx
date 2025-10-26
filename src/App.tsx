import './App.css'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Providers from './pages/Providers'
import PicknPackPage from './pages/PicknPackPage'
import MapPage from './pages/MapPage'
import GenerateOrderPage from './pages/GenerateOrderPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AlcoholBottles from './pages/AlcoholBottles'
import { NavigationProvider, useNavigation } from './contexts/NavigationContext'

function AppContent() {
  const { currentPage } = useNavigation()

  const renderPage = () => {
    switch (currentPage) {
      case 'products':
        return <Products />
      case 'providers':
        return <Providers />
      case 'orders':
        return <PicknPackPage />
      case 'map':
        return <MapPage />
      case 'generate-order':
        return <GenerateOrderPage onNavigate={() => {}} />
      case 'order-tracking':
        return <OrderTrackingPage onNavigate={() => {}} />
      case 'order-detail':
        return <OrderDetailPage order={null} onNavigate={() => {}} />
      case 'alcohol-bottles':
        return <AlcoholBottles />
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
