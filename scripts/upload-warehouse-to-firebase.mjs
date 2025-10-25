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

// Ejecutar
async function main() {
  console.log('\n🚀 ===== CARGA DE DATOS DE ALMACÉN =====\n');
  
  try {
    await createMainWarehouse();
    await uploadWarehouseStock();
    console.log('\n✅ ===== COMPLETADO =====\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

