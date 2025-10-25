import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  IconX, 
  IconMapPin, 
  IconPackage, 
  IconCalendar,
  IconUser,
  IconDollarSign,
  IconCheck
} from "@tabler/icons-react"
import type { Order, OrderItem } from '@/types/order-types'

interface OrderDetailModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

interface ProductWithShelf extends OrderItem {
  shelf_location?: string
  is_picked?: boolean
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  const [products, setProducts] = useState<ProductWithShelf[]>([])

  // Initialize products with shelf locations when order changes
  useEffect(() => {
    if (order) {
      const productsWithShelf: ProductWithShelf[] = order.items.map(item => ({
        ...item,
        shelf_location: `A${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 5) + 1}`, // Mock shelf location
        is_picked: false
      }))
      setProducts(productsWithShelf)
    }
  }, [order])

  if (!isOpen || !order) return null

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold truncate">{order.order_number}</h2>
            <p className="text-muted-foreground truncate">{order.airline_name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-2 flex-shrink-0">
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)] sm:h-[calc(90vh-120px)]">
          {/* Map Section */}
          <div className="lg:w-1/2 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r">
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
                <div className="w-full h-64 sm:h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <div className="text-center p-4">
                    <IconMapPin className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm sm:text-base">Mapa del almacén</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Se implementará próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products List Section */}
          <div className="lg:w-1/2 p-4 sm:p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5" />
                  Lista de Productos
                </CardTitle>
                <CardDescription>
                  {pickedCount} de {totalProducts} productos seleccionados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <IconDollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total:</span>
                    <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Products List */}
                <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                  {products.map((product, index) => (
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
                            {product.is_picked && (
                              <IconCheck className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-muted-foreground">
                            <span>Cantidad: {product.cantidad}</span>
                            <span>Estante: {product.shelf_location}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-muted-foreground mt-1">
                            <span className="truncate">{product.marca} - {product.presentacion}</span>
                            <span className="font-medium">${product.precio_total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
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
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
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
  )
}
