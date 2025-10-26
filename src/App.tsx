import './App.css'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Providers from './pages/Providers'
import PicknPackPage from './pages/PicknPackPage'
import MapPage from './pages/MapPage'
import CartMapPage from './pages/CartMapPage'
import Render3DPage from './pages/Render3DPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AlcoholBottles from './pages/AlcoholBottles'
import { NavigationProvider, useNavigation } from './contexts/NavigationContext'

function AppContent() {
  const { currentPage, navigationParams, setCurrentPage } = useNavigation()

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
      case 'cart-map':
        return <CartMapPage 
          cartId={navigationParams.cartId || ''} 
          onBack={() => setCurrentPage('map')} 
        />
      case 'render-3d':
        return <Render3DPage />
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
