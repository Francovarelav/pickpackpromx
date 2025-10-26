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
import { 
  IconCheck, 
  IconClock, 
  IconTruck, 
  IconPackage, 
  IconAlertCircle,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconEye,
  IconDownload
} from "@tabler/icons-react"
import { getAllOrders } from '@/services/order-processing-service'
import type { Order } from '@/types/order-types'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface OrderTrackingPageProps {
  onNavigate: (page: 'dashboard' | 'generate-order' | 'order-detail', order?: Order) => void
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: IconClock,
    description: 'Orden recibida, esperando confirmación'
  },
  processing: {
    label: 'Procesando',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: IconPackage,
    description: 'Preparando productos para envío'
  },
  confirmed: {
    label: 'Confirmada',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: IconCheck,
    description: 'Orden confirmada y lista para envío'
  },
  shipped: {
    label: 'Enviada',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: IconTruck,
    description: 'Orden en camino al destino'
  },
  delivered: {
    label: 'Entregada',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    icon: IconCheck,
    description: 'Orden entregada exitosamente'
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: IconAlertCircle,
    description: 'Orden cancelada'
  }
}

const statusOrder = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function OrderTrackingPage({ onNavigate }: OrderTrackingPageProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadOrders = async () => {
    try {
      setLoading(true)
      const ordersData = await getAllOrders()
      setOrders(ordersData)
    } catch (error) {
      console.error('Error cargando órdenes:', error)
      toast.error('Error al cargar las órdenes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.airline_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusProgress = (order: Order) => {
    const currentIndex = statusOrder.indexOf(order.status)
    return {
      current: currentIndex,
      total: statusOrder.length - 1,
      percentage: (currentIndex / (statusOrder.length - 1)) * 100
    }
  }

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    const IconComponent = config.icon
    return (
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        isCompleted 
          ? 'bg-green-500 text-white' 
          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        <IconComponent className="w-4 h-4" />
      </div>
    )
  }

  const handleOrderClick = (order: Order) => {
    onNavigate('order-detail', order)
  }

  return (
    <>
      <Toaster />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" onNavigate={onNavigate} />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Order Tracking</h1>
                    <p className="text-muted-foreground">
                      Rastrea el estado de todas las órdenes de aerolíneas
                    </p>
                  </div>

                  {/* Filters and Search */}
                  <Card className="mb-6">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Buscar por número de orden o aerolínea..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="all">Todos los estados</option>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                          <Button
                            onClick={loadOrders}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                          >
                            <IconRefresh className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Orders List */}
                  {loading ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span className="ml-2">Cargando órdenes...</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : filteredOrders.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <IconPackage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No hay órdenes</h3>
                          <p className="text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'No se encontraron órdenes con los filtros aplicados'
                              : 'Aún no se han creado órdenes'
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => {
                        const progress = getStatusProgress(order)
                        const currentStatus = statusConfig[order.status as keyof typeof statusConfig]
                        
                        return (
                          <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOrderClick(order)}>
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Order Info */}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold text-lg">{order.order_number}</h3>
                                    <p className="text-sm text-muted-foreground">{order.airline_name}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Fecha de pedido:</span>
                                      <span>{new Date(order.fecha_pedido).toLocaleDateString('es-MX')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>Entrega solicitada:</span>
                                      <span>{new Date(order.fecha_entrega_solicitada).toLocaleDateString('es-MX')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>Total:</span>
                                      <span className="font-semibold">${order.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Status Progress */}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <Badge className={currentStatus.color}>
                                      {currentStatus.label}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {progress.percentage.toFixed(0)}% completado
                                    </span>
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${progress.percentage}%` }}
                                    ></div>
                                  </div>

                                  {/* Status Steps */}
                                  <div className="flex justify-between">
                                    {statusOrder.map((status, index) => {
                                      const config = statusConfig[status as keyof typeof statusConfig]
                                      const isCompleted = index <= progress.current
                                      const isCurrent = index === progress.current
                                      
                                      return (
                                        <div key={status} className="flex flex-col items-center space-y-1">
                                          {getStatusIcon(status, isCompleted)}
                                          <span className={`text-xs text-center ${
                                            isCurrent ? 'font-semibold text-primary' : 
                                            isCompleted ? 'text-green-600' : 'text-muted-foreground'
                                          }`}>
                                            {config.label}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Order Details */}
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Productos ({order.items.length})</h4>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {order.items.slice(0, 3).map((item, index) => (
                                        <div key={index} className="text-sm text-muted-foreground">
                                          {item.cantidad}x {item.producto} - ${item.precio_total.toFixed(2)}
                                        </div>
                                      ))}
                                      {order.items.length > 3 && (
                                        <div className="text-sm text-muted-foreground">
                                          +{order.items.length - 3} productos más...
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOrderClick(order)
                                      }}
                                    >
                                      <IconEye className="w-4 h-4 mr-2" />
                                      Ver Detalles
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <IconDownload className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {/* Summary Stats */}
                  {orders.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Resumen de Órdenes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(statusConfig).map(([status, config]) => {
                            const count = orders.filter(order => order.status === status).length
                            return (
                              <div key={status} className="text-center">
                                <div className="text-2xl font-bold">{count}</div>
                                <div className="text-sm text-muted-foreground">{config.label}</div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
