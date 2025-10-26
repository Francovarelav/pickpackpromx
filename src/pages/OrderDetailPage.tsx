import { useState, useEffect } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  IconArrowLeft, 
  IconMapPin, 
  IconPackage, 
  IconCalendar,
  IconUser,
  IconCurrencyDollar,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle
} from "@tabler/icons-react"
import type { Order } from '@/types/order-types'
import { 
  enrichOrderItemsWithShelfLocations, 
  getAvailabilitySummary,
  getUniqueShelvesForOrder,
  // getStockStatsByZone, // Comentado porque no se usa
  type ProductWithShelfLocation 
} from '@/services/shelf-location-service'

interface ProductWithPicking extends ProductWithShelfLocation {
  is_picked?: boolean
}

interface OrderDetailPageProps {
  order: Order | null
  onNavigate: (page: 'dashboard' | 'generate-order' | 'order-tracking') => void
}

export default function OrderDetailPage({ order, onNavigate }: OrderDetailPageProps) {
  const [products, setProducts] = useState<ProductWithPicking[]>([])
  const [availabilitySummary, setAvailabilitySummary] = useState<any>(null)
  const [uniqueShelves, setUniqueShelves] = useState<string[]>([])
  // const [zoneStats] = useState<any>({}) // Comentado porque no se usa

  // Initialize products with real shelf locations when order changes
  useEffect(() => {
    if (order) {
      const enrichedProducts = enrichOrderItemsWithShelfLocations(order.items)
      const productsWithPicking: ProductWithPicking[] = enrichedProducts.map(product => ({
        ...product,
        is_picked: false
      }))
      
      setProducts(productsWithPicking)
      
      // Get additional data for the modal
      const summary = getAvailabilitySummary(enrichedProducts)
      const shelves = getUniqueShelvesForOrder(enrichedProducts)
      // const stats = getStockStatsByZone(enrichedProducts) // Comentado porque no se usa
      
      setAvailabilitySummary(summary)
      setUniqueShelves(shelves)
    }
  }, [order])

  if (!order) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar onNavigate={(page: string) => onNavigate(page as any)} />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="text-center py-8">
                    <h1 className="text-2xl font-bold mb-2">Orden no encontrada</h1>
                    <p className="text-muted-foreground mb-4">La orden solicitada no existe o ha sido eliminada.</p>
                    <Button onClick={() => onNavigate('order-tracking')}>
                      <IconArrowLeft className="mr-2 h-4 w-4" />
                      Volver a Órdenes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const handleProductToggle = (productId: string, isPicked: boolean) => {
    setProducts(prev => 
      prev.map(product => 
        product.product_id === productId 
          ? { ...product, is_picked: isPicked }
          : product
      )
    )
  }

  const pickedCount = products.filter(p => p.is_picked).length
  const totalProducts = products.length
  const allPicked = pickedCount === totalProducts

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar onNavigate={(page: string) => onNavigate(page as any)} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Header */}
                <div className="mb-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => onNavigate('order-tracking')}
                    className="mb-4"
                  >
                    <IconArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Órdenes
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{order.order_number}</h1>
                    <p className="text-muted-foreground text-lg">{order.airline_name}</p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Map Section */}
                  <div>
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconMapPin className="h-5 w-5" />
                          Mapa del Almacén
                        </CardTitle>
                        <CardDescription>
                          Visualización de la ubicación de los productos
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                          <div className="text-center p-4">
                            <IconMapPin className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground text-lg">Mapa del almacén</p>
                            <p className="text-sm text-muted-foreground">Se implementará próximamente</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Products List Section */}
                  <div>
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex-shrink-0">
                        <CardTitle className="flex items-center gap-2">
                          <IconPackage className="h-5 w-5" />
                          Lista de Productos
                        </CardTitle>
                        <CardDescription>
                          {pickedCount} de {totalProducts} productos seleccionados
                          {availabilitySummary && (
                            <span className={`ml-2 ${availabilitySummary.unavailableProducts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              • {availabilitySummary.availableProducts}/{availabilitySummary.totalProducts} disponibles
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(pickedCount / totalProducts) * 100}%` }}
                          ></div>
                        </div>

                        {/* Order Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <IconUser className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Cliente:</span>
                            <span className="text-sm">{order.airline_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconCalendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Entrega:</span>
                            <span className="text-sm">{new Date(order.fecha_entrega_solicitada).toLocaleDateString('es-MX')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconPackage className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Productos:</span>
                            <span className="text-sm">{totalProducts}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Total:</span>
                            <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Availability Alert */}
                        {availabilitySummary && availabilitySummary.unavailableProducts > 0 && (
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                              <IconAlertTriangle className="h-4 w-4" />
                              <span className="font-medium">Productos con stock insuficiente</span>
                            </div>
                            <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                              {availabilitySummary.unavailableProducts} producto(s) no tienen suficiente stock disponible
                            </div>
                          </div>
                        )}

                        {/* Shelves Info */}
                        {uniqueShelves.length > 0 && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                              <IconInfoCircle className="h-4 w-4" />
                              <span className="font-medium">Estantes a visitar</span>
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                              {uniqueShelves.join(', ')}
                            </div>
                          </div>
                        )}

                        {/* Products List */}
                        <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
                          {products.map((product) => (
                            <div 
                              key={product.product_id}
                              className={`p-3 border rounded-lg transition-colors ${
                                product.is_picked 
                                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={product.is_picked}
                                  onCheckedChange={(checked) => 
                                    handleProductToggle(product.product_id, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-sm truncate">
                                      {product.producto}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {!product.is_available && (
                                        <IconAlertTriangle className="h-4 w-4 text-orange-500" />
                                      )}
                                      {product.is_picked && (
                                        <IconCheck className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-muted-foreground">
                                    <span>Cantidad: {product.cantidad}</span>
                                    <span className={`${!product.is_available ? 'text-orange-600' : ''}`}>
                                      Disponible: {product.total_available}
                                    </span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-muted-foreground mt-1">
                                    <span className="truncate">{product.marca} - {product.presentacion}</span>
                                    <span className="font-medium">${product.precio_total.toFixed(2)}</span>
                                  </div>
                                  {/* Shelf Locations */}
                                  {product.shelf_locations.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs font-medium text-muted-foreground mb-1">Ubicaciones:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {product.shelf_locations.map((location, locIndex) => (
                                          <Badge 
                                            key={locIndex} 
                                            variant="outline" 
                                            className="text-xs"
                                          >
                                            {location.ubicacion_completa} ({location.cantidad_disponible})
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setProducts(prev => prev.map(p => ({ ...p, is_picked: false })))}
                          >
                            Desmarcar Todo
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => setProducts(prev => prev.map(p => ({ ...p, is_picked: true })))}
                          >
                            Marcar Todo
                          </Button>
                        </div>

                        {/* Completion Status */}
                        {allPicked && (
                          <div className="flex-shrink-0 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                              <IconCheck className="h-5 w-5" />
                              <span className="font-medium">¡Todos los productos han sido seleccionados!</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
