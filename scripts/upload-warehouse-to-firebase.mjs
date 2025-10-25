/**
 * Script Node.js para cargar datos de almacén a Firebase
 * Ejecutar con: npm run upload-warehouse
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const WAREHOUSE_ID = 'warehouse-main-001';

// Datos de warehouse stock
const warehouseStockData = [
  { producto: "Jugo de agua", marca: "Calahua", presentacion: "330 ml", cantidad_total: 480, cantidad_minima: 100, cantidad_maxima: 1000, ubicacion_principal: "Zona A - Bebidas" },
  { producto: "Agua de coco", marca: "Calahua", presentacion: "330 ml", cantidad_total: 360, cantidad_minima: 80, cantidad_maxima: 800, ubicacion_principal: "Zona A - Bebidas" },
  { producto: "Jugo del Valle de manzana", marca: "Del Valle", presentacion: "946 ml", cantidad_total: 240, cantidad_minima: 60, cantidad_maxima: 500, ubicacion_principal: "Zona A - Bebidas" },
  { producto: "Jugo del Valle de naranja", marca: "Del Valle", presentacion: "946 ml", cantidad_total: 288, cantidad_minima: 60, cantidad_maxima: 500, ubicacion_principal: "Zona A - Bebidas" },
  { producto: "Fresa Kiwi", marca: "Del Valle / Ciel", presentacion: "355 ml", cantidad_total: 420, cantidad_minima: 100, cantidad_maxima: 800, ubicacion_principal: "Zona A - Bebidas" },
  { producto: "Leche Light", marca: "Lala", presentacion: "1 litro", cantidad_total: 180, cantidad_minima: 50, cantidad_maxima: 400, ubicacion_principal: "Zona A - Lácteos" },
  { producto: "Jugo de tomate", marca: "Jumex", presentacion: "960 ml", cantidad_total: 156, cantidad_minima: 40, cantidad_maxima: 350, ubicacion_principal: "Zona A - Bebidas" },
  { producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "355 ml", cantidad_total: 960, cantidad_minima: 200, cantidad_maxima: 2000, ubicacion_principal: "Zona B - Refrescos" },
  { producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "1 litro", cantidad_total: 360, cantidad_minima: 80, cantidad_maxima: 800, ubicacion_principal: "Zona B - Refrescos" },
  { producto: "Coca-Cola Cero", marca: "Coca-Cola", presentacion: "355 ml", cantidad_total: 720, cantidad_minima: 150, cantidad_maxima: 1500, ubicacion_principal: "Zona B - Refrescos" },
  { producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "355 ml", cantidad_total: 600, cantidad_minima: 120, cantidad_maxima: 1200, ubicacion_principal: "Zona B - Refrescos" },
  { producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "1 litro", cantidad_total: 240, cantidad_minima: 60, cantidad_maxima: 600, ubicacion_principal: "Zona B - Refrescos" },
  { producto: "Sprite", marca: "Coca-Cola Company", presentacion: "355 ml", cantidad_total: 480, cantidad_minima: 100, cantidad_maxima: 1000, ubicacion_principal: "Zona B - Refrescos" },
  { producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad_total: 1200, cantidad_minima: 300, cantidad_maxima: 2500, ubicacion_principal: "Zona C - Agua" },
  { producto: "Agua Ciel", marca: "Ciel", presentacion: "1.5 litros", cantidad_total: 600, cantidad_minima: 150, cantidad_maxima: 1200, ubicacion_principal: "Zona C - Agua" },
  { producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g", cantidad_total: 800, cantidad_minima: 200, cantidad_maxima: 1500, ubicacion_principal: "Zona D - Snacks" },
  { producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g", cantidad_total: 720, cantidad_minima: 180, cantidad_maxima: 1400, ubicacion_principal: "Zona D - Snacks" },
  { producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete", cantidad_total: 120, cantidad_minima: 30, cantidad_maxima: 250, ubicacion_principal: "Zona E - Café" },
  { producto: "Michelob Ultra", marca: "Michelob", presentacion: "355 ml", cantidad_total: 288, cantidad_minima: 72, cantidad_maxima: 600, ubicacion_principal: "Zona F - Alcohol" },
  { producto: "Heineken Original", marca: "Heineken", presentacion: "355 ml", cantidad_total: 360, cantidad_minima: 96, cantidad_maxima: 720, ubicacion_principal: "Zona F - Alcohol" },
  { producto: "Modelo Especial", marca: "Modelo", presentacion: "355 ml", cantidad_total: 480, cantidad_minima: 120, cantidad_maxima: 960, ubicacion_principal: "Zona F - Alcohol" },
  { producto: "Corona Extra", marca: "Corona", presentacion: "355 ml", cantidad_total: 432, cantidad_minima: 108, cantidad_maxima: 864, ubicacion_principal: "Zona F - Alcohol" }
];

// Buscar producto
async function findProduct(producto, marca, presentacion) {
  const productsRef = collection(db, 'products');
  const querySnapshot = await getDocs(productsRef);
  
  for (const doc of querySnapshot.docs) {
    const product = doc.data();
    if (product.producto.toLowerCase() === producto.toLowerCase() &&
        product.marca.toLowerCase() === marca.toLowerCase() &&
        product.presentacion.toLowerCase() === presentacion.toLowerCase()) {
      return { id: doc.id, ...product };
    }
  }
  return null;
}

// Crear bodega principal
async function createMainWarehouse() {
  console.log('🏢 Verificando bodega principal...');
  
  const warehousesRef = collection(db, 'warehouses');
  const now = new Date();
  
  const warehouseData = {
    id: WAREHOUSE_ID,
    nombre: 'Bodega Principal',
    direccion: 'Av. Principal 123',
    ciudad: 'Ciudad de México',
    pais: 'México',
    activo: true,
    created_at: Timestamp.fromDate(now),
    updated_at: Timestamp.fromDate(now),
  };
  
  await addDoc(warehousesRef, warehouseData);
  console.log('✅ Bodega principal creada\n');
}

// Cargar warehouse stock
async function uploadWarehouseStock() {
  console.log('🏭 Cargando warehouse stock...\n');
  
  const warehouseStockRef = collection(db, 'warehouse_stock');
  let successCount = 0;
  let errorCount = 0;
  
  for (const stock of warehouseStockData) {
    try {
      const product = await findProduct(stock.producto, stock.marca, stock.presentacion);
      
      if (!product) {
        console.warn(`⚠️  Producto no encontrado: ${stock.producto}`);
        errorCount++;
        continue;
      }
      
      const requiere_reorden = stock.cantidad_total <= stock.cantidad_minima;
      const now = new Date();
      
      const data = {
        warehouse_id: WAREHOUSE_ID,
        product_id: product.id,
        producto: product.producto,
        marca: product.marca,
        presentacion: product.presentacion,
        cantidad_total: stock.cantidad_total,
        cantidad_minima: stock.cantidad_minima,
        cantidad_maxima: stock.cantidad_maxima,
        ubicacion_principal: stock.ubicacion_principal,
        requiere_reorden,
        ultima_entrada: Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)),
        ultima_salida: Timestamp.fromDate(new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)),
        created_at: Timestamp.fromDate(now),
        updated_at: Timestamp.fromDate(now),
      };
      
      await addDoc(warehouseStockRef, data);
      successCount++;
      console.log(`✅ ${stock.producto} - ${stock.cantidad_total} unidades`);
    } catch (error) {
      console.error(`❌ Error: ${stock.producto}`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Total: ${warehouseStockData.length} | Éxito: ${successCount} | Errores: ${errorCount}\n`);
}

// Datos de estantes
const shelvesData = [
  // Fila 1 - Zona A (Bebidas)
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  
  // Fila 2 - Zona A (Bebidas)
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  
  // Fila 3 - Zona B (Refrescos)
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  
  // Fila 4 - Zona B (Refrescos)
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  
  // Fila 5 - Zona C (Agua)
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  
  // Fila 6 - Zona C (Agua)
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  
  // Fila 7 - Zona D (Snacks)
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  
  // Fila 8 - Zona D (Snacks)
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  
  // Fila 9 - Zona E (Café)
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  
  // Fila 10 - Zona F (Alcohol)
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  
  // Fila 11 - Zona F (Alcohol)
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' }
];

// Cargar estantes
async function uploadShelves() {
  console.log('📦 Cargando estantes...\n');
  
  const shelvesRef = collection(db, 'shelves');
  let successCount = 0;
  let errorCount = 0;
  
  for (const shelf of shelvesData) {
    try {
      const now = new Date();
      const data = {
        warehouse_id: WAREHOUSE_ID,
        numero_estante: shelf.numero_estante,
        coordenada_x: shelf.coordenada_x,
        coordenada_y: shelf.coordenada_y,
        altura: shelf.altura,
        lado: shelf.lado,
        capacidad_maxima: shelf.capacidad_maxima,
        capacidad_peso_kg: shelf.capacidad_peso_kg,
        tipo_producto: shelf.tipo_producto,
        accesible: true,
        temperatura_controlada: false,
        created_at: Timestamp.fromDate(now),
        updated_at: Timestamp.fromDate(now),
      };
      
      await addDoc(shelvesRef, data);
      successCount++;
      console.log(`✅ Estante ${shelf.numero_estante}-H${shelf.altura}-${shelf.lado} (X:${shelf.coordenada_x}, Y:${shelf.coordenada_y})`);
    } catch (error) {
      console.error(`❌ Error: ${shelf.numero_estante}`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Estantes - Total: ${shelvesData.length} | Éxito: ${successCount} | Errores: ${errorCount}\n`);
}

// Datos de shelf stock (productos en estantes específicos)
const shelfStockData = [
  // Estante A1 - Jugos Calahua
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'A', producto: "Jugo de agua", marca: "Calahua", presentacion: "330 ml", cantidad: 120, cantidad_minima: 30 },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'A', producto: "Jugo de agua", marca: "Calahua", presentacion: "330 ml", cantidad: 100, cantidad_minima: 30 },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'B', producto: "Agua de coco", marca: "Calahua", presentacion: "330 ml", cantidad: 90, cantidad_minima: 25 },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'B', producto: "Agua de coco", marca: "Calahua", presentacion: "330 ml", cantidad: 80, cantidad_minima: 25 },
  
  // Estante A2 - Del Valle
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'A', producto: "Jugo del Valle de manzana", marca: "Del Valle", presentacion: "946 ml", cantidad: 60, cantidad_minima: 20 },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'A', producto: "Jugo del Valle de manzana", marca: "Del Valle", presentacion: "946 ml", cantidad: 50, cantidad_minima: 20 },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'B', producto: "Jugo del Valle de naranja", marca: "Del Valle", presentacion: "946 ml", cantidad: 72, cantidad_minima: 20 },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'B', producto: "Jugo del Valle de naranja", marca: "Del Valle", presentacion: "946 ml", cantidad: 68, cantidad_minima: 20 },
  
  // Estante B1 - Coca-Cola 355ml
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'A', producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 240, cantidad_minima: 60 },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'A', producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 200, cantidad_minima: 60 },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'B', producto: "Coca-Cola Cero", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 180, cantidad_minima: 50 },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'B', producto: "Coca-Cola Cero", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 160, cantidad_minima: 50 },
  
  // Estante B2 - Coca-Cola Light y Sprite
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'A', producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 150, cantidad_minima: 40 },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'A', producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 140, cantidad_minima: 40 },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'B', producto: "Sprite", marca: "Coca-Cola Company", presentacion: "355 ml", cantidad: 120, cantidad_minima: 35 },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'B', producto: "Sprite", marca: "Coca-Cola Company", presentacion: "355 ml", cantidad: 110, cantidad_minima: 35 },
  
  // Estante C1 - Agua Ciel 355ml
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'A', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 300, cantidad_minima: 80 },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'A', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 280, cantidad_minima: 80 },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'B', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 260, cantidad_minima: 80 },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'B', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 240, cantidad_minima: 80 },
  
  // Estante C2 - Agua Ciel 1.5L
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'A', producto: "Agua Ciel", marca: "Ciel", presentacion: "1.5 litros", cantidad: 150, cantidad_minima: 40 },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'A', producto: "Agua Ciel", marca: "Ciel", presentacion: "1.5 litros", cantidad: 140, cantidad_minima: 40 },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'B', producto: "Fresa Kiwi", marca: "Del Valle / Ciel", presentacion: "355 ml", cantidad: 105, cantidad_minima: 30 },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'B', producto: "Leche Light", marca: "Lala", presentacion: "1 litro", cantidad: 45, cantidad_minima: 15 },
  
  // Estante D1 - Galletas Gamesa
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'A', producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g", cantidad: 200, cantidad_minima: 60 },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'A', producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g", cantidad: 180, cantidad_minima: 60 },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'B', producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g", cantidad: 180, cantidad_minima: 55 },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'B', producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g", cantidad: 160, cantidad_minima: 55 },
  
  // Estante D2 - Mixto
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'A', producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g", cantidad: 150, cantidad_minima: 50 },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'A', producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g", cantidad: 140, cantidad_minima: 50 },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'B', producto: "Jugo de tomate", marca: "Jumex", presentacion: "960 ml", cantidad: 39, cantidad_minima: 15 },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'B', producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "1 litro", cantidad: 90, cantidad_minima: 25 },
  
  // Estante E1 - Café
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'A', producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete", cantidad: 30, cantidad_minima: 10 },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'A', producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete", cantidad: 28, cantidad_minima: 10 },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'B', producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete", cantidad: 25, cantidad_minima: 10 },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'B', producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "1 litro", cantidad: 60, cantidad_minima: 20 },
  
  // Estante F1 - Cervezas Premium
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'A', producto: "Michelob Ultra", marca: "Michelob", presentacion: "355 ml", cantidad: 72, cantidad_minima: 24 },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'A', producto: "Michelob Ultra", marca: "Michelob", presentacion: "355 ml", cantidad: 68, cantidad_minima: 24 },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'B', producto: "Heineken Original", marca: "Heineken", presentacion: "355 ml", cantidad: 90, cantidad_minima: 30 },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'B', producto: "Heineken Original", marca: "Heineken", presentacion: "355 ml", cantidad: 85, cantidad_minima: 30 },
  
  // Estante F2 - Cervezas Populares
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'A', producto: "Modelo Especial", marca: "Modelo", presentacion: "355 ml", cantidad: 120, cantidad_minima: 40 },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'A', producto: "Modelo Especial", marca: "Modelo", presentacion: "355 ml", cantidad: 110, cantidad_minima: 40 },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'B', producto: "Corona Extra", marca: "Corona", presentacion: "355 ml", cantidad: 108, cantidad_minima: 36 },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'B', producto: "Corona Extra", marca: "Corona", presentacion: "355 ml", cantidad: 100, cantidad_minima: 36 }
];

// Cargar shelf stock
async function uploadShelfStock() {
  console.log('📍 Cargando shelf stock...\n');
  
  const shelfStockRef = collection(db, 'shelf_stock');
  let successCount = 0;
  let errorCount = 0;
  
  for (const stock of shelfStockData) {
    try {
      const product = await findProduct(stock.producto, stock.marca, stock.presentacion);
      
      if (!product) {
        console.warn(`⚠️  Producto no encontrado: ${stock.producto}`);
        errorCount++;
        continue;
      }
      
      const requiere_reabastecimiento = stock.cantidad <= stock.cantidad_minima;
      const now = new Date();
      
      const data = {
        warehouse_id: WAREHOUSE_ID,
        product_id: product.id,
        producto: product.producto,
        marca: product.marca,
        presentacion: product.presentacion,
        cantidad: stock.cantidad,
        cantidad_minima: stock.cantidad_minima,
        numero_estante: stock.numero_estante,
        coordenada_x: stock.coordenada_x,
        coordenada_y: stock.coordenada_y,
        altura: stock.altura,
        lado: stock.lado,
        requiere_reabastecimiento,
        fecha_ultimo_reabastecimiento: Timestamp.fromDate(new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)),
        created_at: Timestamp.fromDate(now),
        updated_at: Timestamp.fromDate(now),
      };
      
      await addDoc(shelfStockRef, data);
      successCount++;
      console.log(`✅ ${stock.producto} en ${stock.numero_estante}-H${stock.altura}-${stock.lado} (${stock.cantidad} unidades)`);
    } catch (error) {
      console.error(`❌ Error: ${stock.producto}`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Shelf Stock - Total: ${shelfStockData.length} | Éxito: ${successCount} | Errores: ${errorCount}\n`);
}

// Ejecutar
async function main() {
  console.log('\n🚀 ===== CARGA DE DATOS DE ALMACÉN =====\n');
  
  try {
    await createMainWarehouse();
    await uploadWarehouseStock();
    await uploadShelves();
    await uploadShelfStock();
    console.log('\n✅ ===== COMPLETADO =====\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

