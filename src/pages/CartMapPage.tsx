import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Package,
  Navigation,
  CheckCircle,
  Loader2,
  Plane
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

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
  missing: MissingProduct[];
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
  baseRow: number;
  baseCol: number;
  orientation: string;
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
  const [startPos] = useState({ row: 19, col: 4 });
  const [products, setProducts] = useState<ShelfProduct[]>([]);
  const [obstacles, setObstacles] = useState<{row: number, col: number}[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [completedProducts, setCompletedProducts] = useState<string[]>([]);
  const [optimalPath, setOptimalPath] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Cargar cart y productos desde Firebase
  useEffect(() => {
    const loadDataFromFirebase = async () => {
      setIsLoading(true);
      
      try {
        console.log('🔄 Conectando con Firebase...');
        
        // Cargar cart
        const cartRef = doc(db, 'carts', cartId);
        const cartSnap = await getDoc(cartRef);
        
        if (cartSnap.exists()) {
          const data = cartSnap.data();
          const cartData: Cart = {
            id: cartSnap.id,
            nombre: data.nombre || 'Cart Sin Nombre',
            descripcion: data.descripcion || '',
            missing: data.missing || []
          };
          
          setCart(cartData);
          console.log('✅ Cart loaded:', cartData.nombre);
        }

        // Leer datos de Firestore
        const shelfStockRef = collection(db, 'shelf_stock');
        const snapshot = await getDocs(shelfStockRef);
        
        if (snapshot.empty) {
          throw new Error('No se encontraron productos en la colección shelf_stock');
        }

        const FIREBASE_DATA: any[] = [];
        snapshot.forEach((doc) => {
          FIREBASE_DATA.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ ${FIREBASE_DATA.length} documentos leídos de Firebase`);

        // Analizar el patrón global del almacén
        const allY = FIREBASE_DATA.map(item => item.coordenada_y);
        const allX = FIREBASE_DATA.map(item => item.coordenada_x);
        const uniqueGlobalY = new Set(allY).size;
        const uniqueGlobalX = new Set(allX).size;
        
        const globalOrientation = uniqueGlobalX > uniqueGlobalY ? 'horizontal' : 'vertical';
        
        console.log(`🔍 Análisis global:`);
        console.log(`   - Columnas únicas (X): ${uniqueGlobalX}`);
        console.log(`   - Filas únicas (Y): ${uniqueGlobalY}`);
        console.log(`   - Orientación detectada: ${globalOrientation}`);

        // Agrupar productos por estante
        const shelfGroups: {[key: string]: any[]} = {};
        FIREBASE_DATA.forEach(item => {
          if (!shelfGroups[item.numero_estante]) {
            shelfGroups[item.numero_estante] = [];
          }
          shelfGroups[item.numero_estante].push(item);
        });

        // Asignar la orientación global a TODOS los estantes
        const shelfOrientations: {[key: string]: string} = {};
        Object.keys(shelfGroups).forEach(shelfName => {
          shelfOrientations[shelfName] = globalOrientation;
        });

        // Calcular tamaño del grid
        const maxRow = Math.max(...FIREBASE_DATA.map(item => item.coordenada_y), 0);
        const maxCol = Math.max(...FIREBASE_DATA.map(item => item.coordenada_x), 0);
        const newGridSize = {
          rows: Math.max(maxRow + 3, 6),
          cols: Math.max(maxCol + 3, 14)
        };
        setGridSize(newGridSize);

        // Ajustar posiciones de productos
        const loadedProducts = FIREBASE_DATA.map((item) => {
          const orientation = shelfOrientations[item.numero_estante];
          let adjustedRow = item.coordenada_y;
          let adjustedCol = item.coordenada_x;

          if (orientation === 'horizontal') {
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
            baseRow: item.coordenada_y,
            baseCol: item.coordenada_x,
            orientation: orientation,
            product_id: item.product_id
          };
        });

        // Crear obstáculos
        const obstaclePositions = new Set();
        FIREBASE_DATA.forEach((item) => {
          obstaclePositions.add(`${item.coordenada_x},${item.coordenada_y}`);
        });

        const loadedObstacles = Array.from(obstaclePositions).map((pos) => {
          const [col, row] = (pos as string).split(',').map(Number);
          return { row, col };
        });

        setProducts(loadedProducts);
        setObstacles(loadedObstacles);
        
        console.log(`✅ ${loadedProducts.length} productos cargados`);
        console.log(`🚧 ${loadedObstacles.length} estanterías`);
        console.log(`📐 Orientación: ${globalOrientation}`);

        // Pre-seleccionar productos del cart
        if (cartSnap.exists()) {
          const cartData = cartSnap.data();
          
          if (cartData.missing && Array.isArray(cartData.missing)) {
            console.log(`📦 ${cartData.missing.length} productos en missing`);
            
            const productIdsToSelect: string[] = [];
            
            cartData.missing.forEach((missingItem: MissingProduct) => {
              const productId = missingItem.product_id;
              const matchedProduct = loadedProducts.find(p => p.product_id === productId);
              
              if (matchedProduct) {
                productIdsToSelect.push(matchedProduct.id);
                console.log(`✓ Producto encontrado: ${matchedProduct.name}`);
              } else {
                console.log(`⚠️ Producto no encontrado: ${productId}`);
              }
            });
            
            setSelectedProducts(productIdsToSelect);
            console.log(`✅ ${productIdsToSelect.length} productos pre-seleccionados`);
          }
        }

      } catch (error) {
        console.error('❌ Error al cargar datos de Firebase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromFirebase();
  }, [cartId]);

  // Calcular ruta óptima automáticamente
  useEffect(() => {
    if (cart && cart.missing.length > 0 && products.length > 0 && selectedProducts.length > 0 && !isCalculating && !optimalPath) {
      calculateOptimalRoute();
    }
  }, [cart, products, selectedProducts]);

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
    if (selectedProducts.length === 0) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      const productsToVisit = selectedProducts.map(id => 
        products.find(p => p.id === id)
      ).filter(p => p !== undefined) as ShelfProduct[];

      let currentPos = startPos;
      let remaining = [...productsToVisit];
      let route = [];
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
        totalProducts: selectedProducts.length
      });
      setIsCalculating(false);
    }, 100);
  };

  const getCellContent = (row: number, col: number) => {
    if (row === startPos.row && col === startPos.col) {
      return { type: 'start', content: '🏁' };
    }

    // Verificar si esta celda es el destino de un segmento de ruta
    let isRouteDestination = false;
    if (optimalPath) {
      for (const segment of optimalPath.route) {
        const destination = segment.path[segment.path.length - 1];
        if (destination && destination.row === row && destination.col === col) {
          isRouteDestination = true;
          break;
        }
      }
    }

    // Verificar si hay un producto seleccionado en esta celda
    const product = products.find(p => p.row === row && p.col === col);
    
    // Si es un producto seleccionado Y es destino de la ruta, mostrar el producto
    if (product && selectedProducts.includes(product.id) && isRouteDestination) {
      return { type: 'product', content: product.name[0], isSelected: true, productId: product.id };
    }

    // Mostrar números de ruta
    if (optimalPath) {
      for (const segment of optimalPath.route) {
        const cellInPath = segment.path.find((p: any) => p.row === row && p.col === col);
        if (cellInPath) {
          return { type: 'path', content: cellInPath.stepNumber };
        }
      }
    }

    if (obstacles.some(obs => obs.row === row && obs.col === col)) {
      return { type: 'obstacle', content: '🚧' };
    }

    if (product) {
      const isSelected = selectedProducts.includes(product.id);
      return { type: 'product', content: product.name[0], isSelected, productId: product.id };
    }

    return { type: 'empty', content: '' };
  };

  const toggleProductCompletion = async (productId: string) => {
    const newCompleted = completedProducts.includes(productId)
      ? completedProducts.filter(id => id !== productId)
      : [...completedProducts, productId];
    
    setCompletedProducts(newCompleted);

    // Si todos los productos están completados, actualizar Firebase
    if (newCompleted.length === selectedProducts.length && cart) {
      try {
        const cartRef = doc(db, 'carts', cart.id);
        await updateDoc(cartRef, {
          missing: [],
          updated_at: new Date()
        });
        console.log('✅ Todos los productos completados - missing actualizado en Firebase');
      } catch (error) {
        console.error('❌ Error actualizando cart:', error);
      }
    }
  };

  // Función para mandar a avión (limpiar missing del cart)
  const sendToPlane = async () => {
    try {
      if (!cart) return;

      console.log('✈️ Enviando cart a avión - limpiando productos missing...');

      // Actualizar Firebase eliminando todos los missing
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: [],
        updated_at: new Date()
      });

      // Actualizar estado local
      setCart(prev => prev ? {
        ...prev,
        missing: []
      } : null);

      // Limpiar productos completados también
      setCompletedProducts([]);
      setSelectedProducts([]);
      setOptimalPath(null);

      console.log('✅ Cart enviado a avión - productos missing eliminados');

    } catch (error) {
      console.error('❌ Error enviando cart a avión:', error);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-semibold">Cargando mapa del almacén...</p>
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
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-red-600">Error: Cart no encontrado</p>
              <Button onClick={onBack} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
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
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Navigation className="text-blue-600" />
                  {cart.nombre}
                </h1>
                <p className="text-muted-foreground">
                  Ruta óptima de recolección
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Lista de productos faltantes */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Productos Faltantes
                  </CardTitle>
                  <CardDescription>
                    {completedProducts.length} de {cart.missing.length} completados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cart.missing.map((item, idx) => {
                      const product = products.find(p => p.product_id === item.product_id);
                      const isCompleted = product ? completedProducts.includes(product.id) : false;
                      
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => product && toggleProductCompletion(product.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {item.producto}
                            </p>
                            <p className="text-sm text-slate-600">
                              {item.marca} - {item.presentacion}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-semibold text-red-600">
                                Faltan: {item.cantidad_missing}
                              </span>
                              {product && (
                                <span className="text-xs text-slate-500">
                                  📍 {product.estante}
                                </span>
                              )}
                            </div>
                          </div>
                          {isCompleted && (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Botón Mandar a Avión */}
                  {cart.missing.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <Button
                        onClick={sendToPlane}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        size="lg"
                      >
                        <Plane className="w-5 h-5 mr-2" />
                        Mandar a Avión
                      </Button>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Elimina todos los productos faltantes del cart
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha: Mapa 2D */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-800">
                        Mapa 2D - Ruta Óptima
                      </CardTitle>
                      <CardDescription>
                        {optimalPath ? `${optimalPath.totalDistance} pasos • ${optimalPath.totalProducts} productos` : 'Calculando ruta...'}
                      </CardDescription>
                    </div>
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
                                ${cell.type === 'product' && cell.isSelected ? 'bg-blue-500 text-white shadow-sm' : ''}
                                ${cell.type === 'product' && !cell.isSelected ? 'bg-blue-200 text-blue-800' : ''}
                                ${cell.type === 'obstacle' ? 'bg-gradient-to-br from-red-500 to-red-600 text-lg shadow-md' : ''}
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

                  {/* Leyenda */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-400 rounded shadow"></div>
                      <span>🏁 Inicio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded shadow"></div>
                      <span>📦 Producto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded shadow"></div>
                      <span>🚧 Estantería</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-200 rounded"></div>
                      <span>🛤️ Ruta</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
