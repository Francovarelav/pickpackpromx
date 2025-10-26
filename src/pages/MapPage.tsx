import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Map, 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  Search,
  Grid3X3,
  List,
  MapPin
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useNavigation } from '../contexts/NavigationContext';

interface CartProduct {
  product_id: string;
  producto: string;
  marca: string;
  presentacion: string;
  cantidad_default: number;
  precio_unitario: number;
  stock_actual: number;
}

interface MissingProduct {
  cantidad_missing: number;
  marca: string;
  presentacion: string;
  product_id: string;
  producto: string;
  stock_found: number;
}

interface Cart {
  id: string;
  nombre: string;
  descripcion: string;
  productos: CartProduct[];
  total_productos: number;
  missing: MissingProduct[];
  tipo: string;
  activo: boolean;
  created_at: any;
  updated_at: any;
}

export default function MapPage() {
  const { navigate } = useNavigation();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Cargar carts desde Firebase
  useEffect(() => {
    const loadCarts = async () => {
      try {
        console.log('🗺️ Loading carts for Map page...');
        const cartsCollection = collection(db, 'carts');
        const cartSnapshot = await getDocs(cartsCollection);
        
        const cartsData: Cart[] = [];
        cartSnapshot.forEach((doc) => {
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
        
        setCarts(cartsData);
        console.log(`🗺️ Loaded ${cartsData.length} carts for Map`);
      } catch (error) {
        console.error('❌ Error loading carts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCarts();
  }, []);

  // Filtrar carts basado en el término de búsqueda
  const filteredCarts = carts.filter(cart =>
    cart.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cart.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cart.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'catering':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'evento':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'especial':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'catering':
        return <ShoppingCart className="h-3 w-3" />;
      case 'evento':
        return <Package className="h-3 w-3" />;
      case 'especial':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando mapa de carts...</p>
              </div>
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Map className="h-8 w-8" />
                Mapa de Carts
              </h1>
              <p className="text-muted-foreground">
                Visualización geográfica de todos los carts disponibles
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar carts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Carts</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{carts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Carts disponibles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carts Activos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carts.filter(cart => cart.activo).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  En uso actualmente
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Con Productos Faltantes</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carts.filter(cart => cart.missing && cart.missing.length > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren atención
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tipos Diferentes</CardTitle>
                <Map className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(carts.map(cart => cart.tipo)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Categorías únicas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Carts Display */}
          {filteredCarts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Map className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron carts</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay carts disponibles en este momento'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {filteredCarts.map((cart) => (
                <Card key={cart.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cart.nombre}</CardTitle>
                      <Badge className={`${getTypeColor(cart.tipo)} flex items-center gap-1`}>
                        {getTypeIcon(cart.tipo)}
                        {cart.tipo}
                      </Badge>
                    </div>
                    <CardDescription>
                      {cart.descripcion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Productos:</span>
                        <span className="font-medium">{cart.total_productos}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Faltantes:</span>
                        <span className={`font-medium ${cart.missing.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {cart.missing.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge variant={cart.activo ? 'default' : 'secondary'}>
                          {cart.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          navigate('cart-map', { cartId: cart.id });
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Ver Mapa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
