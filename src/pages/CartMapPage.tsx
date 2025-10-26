import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Package, 
  ShoppingCart, 
  AlertCircle,
  MapPin,
  Layers,
  Navigation,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface ShelfProduct {
  id: string;
  name: string;
  row: number;
  col: number;
  cantidad: number;
  marca: string;
  estante: string;
  lado: string;
  altura: string;
  product_id: string;
}

interface CartMapPageProps {
  cartId: string;
  onBack: () => void;
}

export default function CartMapPage({ cartId, onBack }: CartMapPageProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 13 });
  const [startPos] = useState({ row: 0, col: 0 });
  const [products, setProducts] = useState<ShelfProduct[]>([]);
  const [obstacles, setObstacles] = useState<{row: number, col: number}[]>([]);
  const [completedProducts, setCompletedProducts] = useState<string[]>([]);
  const [optimalPath, setOptimalPath] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [show3DDialog, setShow3DDialog] = useState(false);

  // Cargar cart y productos desde Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🗺️ Loading cart and shelf data...');
        
        // Cargar cart
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
          console.log('✅ Cart loaded:', cartData.nombre);

          // Cargar productos del shelf_stock
          const shelfStockRef = collection(db, 'shelf_stock');
          const snapshot = await getDocs(shelfStockRef);
          
          if (!snapshot.empty) {
            const shelfData: any[] = [];
            snapshot.forEach((doc) => {
              shelfData.push({ id: doc.id, ...doc.data() });
            });

            console.log(`✅ ${shelfData.length} shelf products loaded`);

            // Calcular tamaño del grid
            const maxRow = Math.max(...shelfData.map(item => item.coordenada_y), 0);
            const maxCol = Math.max(...shelfData.map(item => item.coordenada_x), 0);
            const newGridSize = {
              rows: Math.max(maxRow + 3, 6),
              cols: Math.max(maxCol + 3, 14)
            };
            setGridSize(newGridSize);

            // Detectar orientación global
            const allY = shelfData.map(item => item.coordenada_y);
            const allX = shelfData.map(item => item.coordenada_x);
            const uniqueGlobalX = new Set(allX).size;
            const uniqueGlobalY = new Set(allY).size;
            const globalOrientation = uniqueGlobalX > uniqueGlobalY ? 'horizontal' : 'vertical';

            // Procesar productos
            const loadedProducts = shelfData.map((item) => {
              let adjustedRow = item.coordenada_y;
              let adjustedCol = item.coordenada_x;

              if (globalOrientation === 'horizontal') {
                if (item.lado === 'A') {
                  adjustedRow = item.coordenada_y - 1;
                } else if (item.lado === 'B') {
                  adjustedRow = item.coordenada_y + 1;
                }
              } else {
                if (item.lado === 'A') {
                  adjustedCol = item.coordenada_x - 1;
                } else if (item.lado === 'B') {
                  adjustedCol = item.coordenada_x + 1;
                }
              }

              return {
                id: item.id,
                name: `${item.producto} (${item.presentacion})`,
                row: Math.max(0, adjustedRow),
                col: Math.max(0, adjustedCol),
                cantidad: item.cantidad,
                marca: item.marca,
                estante: item.numero_estante,
                lado: item.lado,
                altura: item.altura,
                product_id: item.product_id
              };
            });

            setProducts(loadedProducts);

            // Crear obstáculos (estanterías)
            const obstaclePositions = new Set();
            shelfData.forEach((item) => {
              obstaclePositions.add(`${item.coordenada_x},${item.coordenada_y}`);
            });

            const loadedObstacles = Array.from(obstaclePositions).map((pos) => {
              const [col, row] = (pos as string).split(',').map(Number);
              return { row, col };
            });

            setObstacles(loadedObstacles);
            console.log(`🚧 ${loadedObstacles.length} obstacles created`);
          }
        } else {
          console.error('❌ Cart not found');
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [cartId]);

  // Calcular ruta óptima automáticamente cuando se carga el cart
  useEffect(() => {
    if (cart && cart.missing.length > 0 && products.length > 0 && !isCalculating) {
      calculateOptimalRoute();
    }
  }, [cart, products]);

  const findPath = (start: {row: number, col: number}, end: {row: number, col: number}) => {
    const isValid = (r: number, c: number) => {
      if (r < 0 || r >= gridSize.rows || c < 0 || c >= gridSize.cols) return false;
      return !obstacles.some(obs => obs.row === r && obs.col === c);
    };

    const heuristic = (a: {row: number, col: number}, b: {row: number, col: number}) => 
      Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

    const openSet = [{ ...start, g: 0, h: heuristic(start, end), f: heuristic(start, end), path: [start] }];
    const closedSet = new Set<string>();

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      if (current.row === end.row && current.col === end.col) {
        return current.path;
      }

      const key = `${current.row},${current.col}`;
      if (closedSet.has(key)) continue;
      closedSet.add(key);

      const neighbors = [
        { row: current.row - 1, col: current.col, cost: 1 },
        { row: current.row + 1, col: current.col, cost: 1 },
        { row: current.row, col: current.col - 1, cost: 1 },
        { row: current.row, col: current.col + 1, cost: 1 },
        { row: current.row - 1, col: current.col - 1, cost: 1.414 },
        { row: current.row - 1, col: current.col + 1, cost: 1.414 },
        { row: current.row + 1, col: current.col - 1, cost: 1.414 },
        { row: current.row + 1, col: current.col + 1, cost: 1.414 },
      ];

      for (const neighbor of neighbors) {
        if (!isValid(neighbor.row, neighbor.col)) continue;
        
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + neighbor.cost;
        const h = heuristic(neighbor, end);
        const f = g + h;

        const existingNode = openSet.find(n => n.row === neighbor.row && n.col === neighbor.col);
        if (!existingNode || g < existingNode.g) {
          const newPath = [...current.path, { row: neighbor.row, col: neighbor.col }];
          if (existingNode) {
            existingNode.g = g;
            existingNode.f = f;
            existingNode.path = newPath;
          } else {
            openSet.push({ row: neighbor.row, col: neighbor.col, g, h, f, path: newPath });
          }
        }
      }
    }

    return null;
  };

  const calculateOptimalRoute = () => {
    if (!cart || cart.missing.length === 0) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      // Filtrar productos missing que no están completados
      const activeMissing = cart.missing.filter(m => !completedProducts.includes(m.product_id));
      
      // Encontrar productos en shelf que coincidan con missing
      const productsToVisit = activeMissing
        .map(missing => products.find(p => p.product_id === missing.product_id))
        .filter(p => p !== undefined) as ShelfProduct[];

      if (productsToVisit.length === 0) {
        setOptimalPath(null);
        setIsCalculating(false);
        return;
      }

      let currentPos = startPos;
      let remaining = [...productsToVisit];
      let route: any[] = [];
      let totalDistance = 0;
      let stepNumber = 1;

      while (remaining.length > 0) {
        let nearestIndex = 0;
        let shortestPath = null;
        let shortestDistance = Infinity;

        for (let i = 0; i < remaining.length; i++) {
          const path = findPath(currentPos, remaining[i]);
          if (path && path.length < shortestDistance) {
            shortestDistance = path.length;
            shortestPath = path;
            nearestIndex = i;
          }
        }

        if (!shortestPath) break;

        const nextProduct = remaining[nearestIndex];
        
        const pathWithSteps = shortestPath.map((cell, idx) => ({
          ...cell,
          stepNumber: stepNumber + idx
        }));
        
        route.push({
          product: nextProduct,
          path: pathWithSteps,
          distance: Math.round(shortestDistance * 10) / 10,
          startStep: stepNumber,
          endStep: stepNumber + shortestDistance - 1
        });

        stepNumber += shortestDistance;
        totalDistance += shortestDistance;
        currentPos = nextProduct;
        remaining.splice(nearestIndex, 1);
      }

      setOptimalPath({
        route,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalProducts: productsToVisit.length
      });
      setIsCalculating(false);
    }, 100);
  };

  const toggleProductCompletion = async (productId: string) => {
    const newCompleted = completedProducts.includes(productId)
      ? completedProducts.filter(id => id !== productId)
      : [...completedProducts, productId];
    
    setCompletedProducts(newCompleted);
    
    // Recalcular ruta
    setTimeout(() => calculateOptimalRoute(), 100);
  };

  const saveCompletedProducts = async () => {
    if (!cart) return;

    try {
      // Actualizar missing products eliminando los completados
      const updatedMissing = cart.missing.filter(m => !completedProducts.includes(m.product_id));
      
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: updatedMissing,
        updated_at: new Date()
      });

      // Actualizar estado local
      setCart(prev => prev ? {
        ...prev,
        missing: updatedMissing,
        updated_at: new Date()
      } : null);

      setCompletedProducts([]);
      console.log('✅ Productos completados guardados en Firebase');
    } catch (error) {
      console.error('❌ Error guardando productos completados:', error);
    }
  };

  const getCellContent = (row: number, col: number) => {
    if (row === startPos.row && col === startPos.col) {
      return { type: 'start', content: '🏁' };
    }

    // Mostrar ruta
    if (optimalPath) {
      for (const segment of optimalPath.route) {
        const cellInPath = segment.path.find((p: any) => p.row === row && p.col === col);
        if (cellInPath) {
          return { type: 'path', content: cellInPath.stepNumber };
        }
      }
    }

    // Mostrar obstáculos
    if (obstacles.some(obs => obs.row === row && obs.col === col)) {
      return { type: 'obstacle', content: '🚧' };
    }

    // Mostrar productos
    const product = products.find(p => p.row === row && p.col === col);
    if (product) {
      const isMissing = cart?.missing.some(m => m.product_id === product.product_id);
      const isCompleted = completedProducts.includes(product.product_id);
      return { 
        type: 'product', 
        content: product.name[0], 
        isMissing, 
        isCompleted,
        productId: product.id 
      };
    }

    return { type: 'empty', content: '' };
  };

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
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
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
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cart no encontrado</h3>
                <p className="text-muted-foreground mb-4">El cart solicitado no existe o fue eliminado</p>
                <Button onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Mapa
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
                  <Navigation className="h-8 w-8 text-blue-600" />
                  {cart.nombre}
                </h1>
                <p className="text-muted-foreground">
                  Ruta óptima de recolección
                </p>
              </div>
            </div>
            <Badge className={`${getTypeColor(cart.tipo)} flex items-center gap-1`}>
              {getTypeIcon(cart.tipo)}
              {cart.tipo}
            </Badge>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Side - 2D Map */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Mapa 2D - Ruta Óptima
                      </CardTitle>
                      <CardDescription>
                        {optimalPath ? `${optimalPath.totalDistance} pasos • ${optimalPath.totalProducts} productos` : 'Calculando ruta...'}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShow3DDialog(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Ver Mapa 3D
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <div 
                      className="inline-block bg-white rounded-lg shadow-inner p-4"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
                        gap: '2px'
                      }}
                    >
                      {Array.from({ length: gridSize.rows }, (_, row) =>
                        Array.from({ length: gridSize.cols }, (_, col) => {
                          const cell = getCellContent(row, col);
                          return (
                            <div
                              key={`${row}-${col}`}
                              className={`
                                w-10 h-10 flex items-center justify-center text-xs font-bold
                                transition-all border border-slate-200 rounded
                                ${cell.type === 'start' ? 'bg-green-400 text-lg shadow-md' : ''}
                                ${cell.type === 'product' && cell.isMissing && !cell.isCompleted ? 'bg-red-500 text-white shadow-sm' : ''}
                                ${cell.type === 'product' && cell.isMissing && cell.isCompleted ? 'bg-green-500 text-white shadow-sm' : ''}
                                ${cell.type === 'product' && !cell.isMissing ? 'bg-blue-200 text-blue-800' : ''}
                                ${cell.type === 'obstacle' ? 'bg-gradient-to-br from-gray-500 to-gray-600 text-lg shadow-md' : ''}
                                ${cell.type === 'path' ? 'bg-yellow-200 text-yellow-800 font-bold' : ''}
                                ${cell.type === 'empty' ? 'bg-slate-50' : ''}
                              `}
                              title={`(${row}, ${col})`}
                            >
                              {cell.content}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-400 rounded shadow"></div>
                      <span>🏁 Inicio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded shadow"></div>
                      <span>📦 Faltante</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded shadow"></div>
                      <span>✅ Completado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded shadow"></div>
                      <span>🚧 Estantería</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-200 rounded"></div>
                      <span>🛤️ Ruta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-200 rounded"></div>
                      <span>📦 Producto</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Missing Products List */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Productos Faltantes
                  </CardTitle>
                  <CardDescription>
                    {cart.missing.length} productos por recolectar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {cart.missing.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>No hay productos faltantes</p>
                      </div>
                    ) : (
                      cart.missing.map((missing, index) => {
                        const isCompleted = completedProducts.includes(missing.product_id);
                        const shelfProduct = products.find(p => p.product_id === missing.product_id);
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                              isCompleted 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleProductCompletion(missing.product_id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold ${isCompleted ? 'line-through text-green-700' : 'text-red-800'}`}>
                                {missing.producto}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {missing.marca} - {missing.presentacion}
                              </div>
                              <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
                                <span className={isCompleted ? 'text-green-600' : 'text-red-600'}>
                                  Faltan: {missing.cantidad_missing}
                                </span>
                                {shelfProduct && (
                                  <>
                                    <span className="text-blue-600">
                                      📍 {shelfProduct.estante}
                                    </span>
                                    <span className={shelfProduct.lado === 'A' ? 'text-purple-600' : 'text-orange-600'}>
                                      {shelfProduct.lado === 'A' ? '⬆️A' : '⬇️B'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {completedProducts.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        onClick={saveCompletedProducts}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Guardar Productos Completados ({completedProducts.length})
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Dialog para Mapa 3D */}
      <Dialog open={show3DDialog} onOpenChange={setShow3DDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Mapa 3D
            </DialogTitle>
            <DialogDescription>
              Vista tridimensional del almacén
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-muted-foreground">
              <Layers className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Mapa 3D</p>
              <p className="text-sm">Espacio reservado para el mapa 3D</p>
              <p className="text-xs mt-2">Aquí se mostrará la vista tridimensional del almacén</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}