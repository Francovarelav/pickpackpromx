import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Map, 
  Package, 
  ShoppingCart, 
  AlertCircle,
  MapPin,
  Layers
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

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

interface CartMapPageProps {
  cartId: string;
  onBack: () => void;
}

export default function CartMapPage({ cartId, onBack }: CartMapPageProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar cart desde Firebase
  useEffect(() => {
    const loadCart = async () => {
      try {
        console.log('🗺️ Loading cart for map view...');
        const cartRef = doc(db, 'carts', cartId);
        const cartSnap = await getDoc(cartRef);
        
        if (cartSnap.exists()) {
          const data = cartSnap.data();
          const cartData: Cart = {
            id: cartSnap.id,
            nombre: data.nombre || 'Cart Sin Nombre',
            descripcion: data.descripcion || '',
            productos: data.productos || [],
            total_productos: data.total_productos || 0,
            missing: data.missing || [],
            tipo: data.tipo || 'unknown',
            activo: data.activo !== undefined ? data.activo : true,
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          
          setCart(cartData);
          console.log('🗺️ Cart loaded for map:', cartData.nombre);
        } else {
          console.error('❌ Cart not found');
        }
      } catch (error) {
        console.error('❌ Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [cartId]);

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
                <p className="text-muted-foreground">Cargando mapa del cart...</p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!cart) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Map className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cart no encontrado</h3>
                <p className="text-muted-foreground mb-4">El cart solicitado no existe o fue eliminado</p>
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
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
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Map className="h-8 w-8" />
                  Mapa de {cart.nombre}
                </h1>
                <p className="text-muted-foreground">
                  Visualización geográfica del cart
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getTypeColor(cart.tipo)} flex items-center gap-1`}>
                {getTypeIcon(cart.tipo)}
                {cart.tipo}
              </Badge>
            </div>
          </div>

          {/* Main Map Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Left Side - 2D Map */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Mapa 2D
                </CardTitle>
                <CardDescription>
                  Vista plana del almacén y ubicación de productos
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Mapa 2D</h3>
                  <p className="text-muted-foreground">
                    Aquí se mostrará el mapa 2D del almacén
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cart: {cart.nombre}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Side - 3D Map */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Mapa 3D
                </CardTitle>
                <CardDescription>
                  Vista tridimensional del almacén
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ver Mapa 3D</h3>
                  <p className="text-muted-foreground">
                    Aquí se mostrará el mapa 3D del almacén
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cart: {cart.nombre}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Info Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cart</CardTitle>
              <CardDescription>
                Detalles del cart seleccionado para el mapa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Productos</h4>
                  <p className="text-2xl font-bold text-blue-600">{cart.total_productos}</p>
                  <p className="text-sm text-muted-foreground">Total de productos</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Faltantes</h4>
                  <p className={`text-2xl font-bold ${cart.missing.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cart.missing.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Productos faltantes</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Estado</h4>
                  <Badge variant={cart.activo ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                    {cart.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Estado actual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
