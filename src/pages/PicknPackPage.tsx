import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  Calendar, 
  ShoppingCart, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Grid3X3,
  List,
  Minus,
  Layers
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CartDetailsPage from './CartDetailsPage';

interface CartProduct {
  product_id: string;
  producto: string;
  marca: string;
  presentacion: string;
  cantidad_default: number;
  precio_unitario: number;
  stock_actual: number;
}

interface Cart {
  id: string;
  nombre: string;
  descripcion: string;
  productos: CartProduct[];
  total_productos: number;
  missing: string[];
  tipo: string;
  activo: boolean;
  created_at: any;
  updated_at: any;
}

export default function PicknPackPage() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [filteredCarts, setFilteredCarts] = useState<Cart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);

  // Cargar carts desde Firebase
  useEffect(() => {
    const loadCarts = async () => {
      try {
        console.log('🔥 Loading carts...');
        const cartsRef = collection(db, 'carts');
        const q = query(cartsRef, orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        
        console.log('📊 Carts found:', querySnapshot.size);
        
        if (querySnapshot.empty) {
          console.log('⚠️ No carts found');
          setCarts([]);
          setFilteredCarts([]);
          return;
        }
        
        const cartsData: Cart[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          cartsData.push({
            id: doc.id,
            nombre: data.nombre || 'Cart Sin Nombre',
            descripcion: data.descripcion || '',
            productos: data.productos || [],
            total_productos: data.total_productos || 0,
            missing: data.missing || [],
            tipo: data.tipo || 'unknown',
            activo: data.activo !== undefined ? data.activo : true,
            created_at: data.created_at,
            updated_at: data.updated_at
          });
        });
        
        console.log('✅ Carts loaded:', cartsData.length);
        setCarts(cartsData);
        setFilteredCarts(cartsData);
      } catch (error) {
        console.error('❌ Error loading carts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCarts();
  }, []);

  // Filtrar carts
  useEffect(() => {
    let filtered = carts;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(cart =>
        cart.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cart.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cart.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(cart => cart.tipo === typeFilter);
    }

    setFilteredCarts(filtered);
  }, [carts, searchTerm, typeFilter]);

  // Función para obtener el color del badge según el tipo
  const getTypeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'default-catering':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'básico':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mini':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el ícono según el tipo
  const getTypeIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'default-catering':
        return <ShoppingCart className="w-4 h-4" />;
      case 'premium':
        return <Package className="w-4 h-4" />;
      case 'básico':
        return <CheckCircle className="w-4 h-4" />;
      case 'mini':
        return <Minus className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Función para formatear fecha
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Calcular total estimado del cart
  const calculateCartTotal = (productos: CartProduct[]) => {
    return productos.reduce((total, producto) => {
      return total + (producto.precio_unitario * producto.cantidad_default);
    }, 0);
  };

  // Función para navegar a detalles del cart
  const handleViewDetails = (cartId: string) => {
    setSelectedCartId(cartId);
  };

  // Función para volver a la lista
  const handleBackToList = () => {
    setSelectedCartId(null);
  };

  // Si hay un cart seleccionado, mostrar la página de detalles
  if (selectedCartId) {
    return <CartDetailsPage cartId={selectedCartId} onBack={handleBackToList} />;
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pick & Pack</h1>
              <p className="text-muted-foreground">
                Gestiona y monitorea todos los carritos de catering
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  // Placeholder para mapa 3D - por ahora no hace nada
                  console.log('Ver Mapa 3D clicked - placeholder');
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Layers className="w-4 h-4 mr-2" />
                Ver Mapa 3D
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, descripción o tipo de cart..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="default-catering">Default Catering</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="básico">Básico</SelectItem>
                <SelectItem value="mini">Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Carts</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{carts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredCarts.length} mostrados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carts.filter(c => c.activo).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Con Productos</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carts.filter(c => c.total_productos > 0).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Con Missing</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carts.filter(c => c.missing && c.missing.length > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Carts */}
          {filteredCarts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron carts</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay carts registrados en el sistema'
                  }
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCarts.map((cart) => (
                <Card key={cart.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cart.nombre}</CardTitle>
                      <Badge className={`${getTypeColor(cart.tipo)} flex items-center gap-1`}>
                        {getTypeIcon(cart.tipo)}
                        {cart.tipo}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {cart.total_productos} productos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {cart.descripcion}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(cart.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {cart.missing.length} faltantes
                      </span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(calculateCartTotal(cart.productos))}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleViewDetails(cart.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Cart</th>
                        <th className="p-4 font-medium">Tipo</th>
                        <th className="p-4 font-medium">Productos</th>
                        <th className="p-4 font-medium">Valor</th>
                        <th className="p-4 font-medium">Faltantes</th>
                        <th className="p-4 font-medium">Fecha</th>
                        <th className="p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCarts.map((cart) => (
                        <tr key={cart.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="font-medium">{cart.nombre}</div>
                            <div className="text-sm text-muted-foreground">{cart.descripcion}</div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getTypeColor(cart.tipo)} flex items-center gap-1 w-fit`}>
                              {getTypeIcon(cart.tipo)}
                              {cart.tipo}
                            </Badge>
                          </td>
                          <td className="p-4 font-semibold">{cart.total_productos}</td>
                          <td className="p-4 font-semibold">{formatCurrency(calculateCartTotal(cart.productos))}</td>
                          <td className="p-4">
                            <span className={`font-semibold ${cart.missing.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {cart.missing.length}
                            </span>
                          </td>
                          <td className="p-4 text-sm">{formatDate(cart.created_at)}</td>
                          <td className="p-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(cart.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
