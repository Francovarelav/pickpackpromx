/**
 * Script para cargar datos de almacén a Firebase
 * Warehouse Stock y Shelf Stock
 */

import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { warehouseStockData } from './warehouse-stock-data';
import { shelvesData, shelfStockData } from './shelf-stock-data';
import type { FirebaseProductData } from '../excels/types-firebase-data-models';

const WAREHOUSE_ID = 'warehouse-main-001'; // ID de la bodega principal

/**
 * Busca un producto por nombre, marca y presentación
 */
async function findProduct(
  producto: string,
  marca: string,
  presentacion: string
): Promise<FirebaseProductData | null> {
  try {
    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    
    const products = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      } as FirebaseProductData))
      .filter(product => {
        const nameMatch = product.producto.toLowerCase() === producto.toLowerCase();
        const marcaMatch = product.marca.toLowerCase() === marca.toLowerCase();
        const presentacionMatch = product.presentacion.toLowerCase() === presentacion.toLowerCase();
        return nameMatch && marcaMatch && presentacionMatch;
      });
    
    return products.length > 0 ? products[0] : null;
  } catch (error) {
    console.error('Error buscando producto:', error);
    return null;
  }
}

/**
 * Carga warehouse stock a Firebase
 */
async function uploadWarehouseStock() {
  console.log('🏭 Cargando warehouse stock...');
  
  const warehouseStockRef = collection(db, 'warehouse_stock');
  let successCount = 0;
  let errorCount = 0;
  
  for (const stock of warehouseStockData) {
    try {
      // Buscar el producto
      const product = await findProduct(stock.producto, stock.marca, stock.presentacion);
      
      if (!product) {
        console.warn(`⚠️  Producto no encontrado: ${stock.producto} - ${stock.marca} - ${stock.presentacion}`);
        errorCount++;
        continue;
      }
      
      // Calcular si requiere reorden
      const requiere_reorden = stock.cantidad_total <= stock.cantidad_minima;
      
      const now = new Date();
      const warehouseStockData = {
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
        ultima_entrada: Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)), // Últimos 7 días
        ultima_salida: Timestamp.fromDate(new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)), // Últimos 2 días
        created_at: Timestamp.fromDate(now),
        updated_at: Timestamp.fromDate(now),
      };
      
      await addDoc(warehouseStockRef, warehouseStockData);
      successCount++;
      console.log(`✅ Warehouse stock agregado: ${stock.producto} (${stock.cantidad_total} unidades)`);
    } catch (error) {
      console.error(`❌ Error agregando warehouse stock ${stock.producto}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Warehouse Stock - Total: ${warehouseStockData.length} | Éxito: ${successCount} | Errores: ${errorCount}\n`);
}

/**
 * Carga shelves a Firebase
 */
async function uploadShelves() {
  console.log('📦 Cargando estantes...');
  
  const shelvesRef = collection(db, 'shelves');
  let successCount = 0;
  let errorCount = 0;
  
  // Agrupar estantes por número_estante + altura + lado para evitar duplicados
  const uniqueShelves = new Map<string, typeof shelvesData[0]>();
  
  for (const shelf of shelvesData) {
    const key = `${shelf.numero_estante}-${shelf.altura}-${shelf.lado}`;
    if (!uniqueShelves.has(key)) {
      uniqueShelves.set(key, shelf);
    }
  }
  
  for (const shelf of uniqueShelves.values()) {
    try {
      const now = new Date();
      const shelfData = {
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
      
      await addDoc(shelvesRef, shelfData);
      successCount++;
      console.log(`✅ Estante agregado: ${shelf.numero_estante}-H${shelf.altura}-${shelf.lado}`);
    } catch (error) {
      console.error(`❌ Error agregando estante ${shelf.numero_estante}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Estantes - Total: ${uniqueShelves.size} | Éxito: ${successCount} | Errores: ${errorCount}\n`);
}

/**
 * Carga shelf stock a Firebase
 */
async function uploadShelfStock() {
  console.log('📍 Cargando shelf stock...');
  
  const shelfStockRef = collection(db, 'shelf_stock');
  const shelvesRef = collection(db, 'shelves');
  let successCount = 0;
  let errorCount = 0;
  
  for (const stock of shelfStockData) {
    try {
      // Buscar el producto
      const product = await findProduct(stock.producto, stock.marca, stock.presentacion);
      
      if (!product) {
        console.warn(`⚠️  Producto no encontrado: ${stock.producto} - ${stock.marca} - ${stock.presentacion}`);
        errorCount++;
        continue;
      }
      
      // Buscar el estante correspondiente
      const shelvesQuery = query(
        shelvesRef,
        where('numero_estante', '==', stock.numero_estante),
        where('altura', '==', stock.altura),
        where('lado', '==', stock.lado)
      );
      
      const shelvesSnapshot = await getDocs(shelvesQuery);
      
      if (shelvesSnapshot.empty) {
        console.warn(`⚠️  Estante no encontrado: ${stock.numero_estante}-H${stock.altura}-${stock.lado}`);
        errorCount++;
        continue;
      }
      
      const shelf = shelvesSnapshot.docs[0];
      const requiere_reabastecimiento = stock.cantidad <= stock.cantidad_minima;
      
      const now = new Date();
      const shelfStockData = {
        shelf_id: shelf.id,
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
      
      await addDoc(shelfStockRef, shelfStockData);
      successCount++;
      console.log(`✅ Shelf stock agregado: ${stock.producto} en ${stock.numero_estante}-H${stock.altura}-${stock.lado} (${stock.cantidad} unidades)`);
    } catch (error) {
      console.error(`❌ Error agregando shelf stock:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Shelf Stock - Total: ${shelfStockData.length} | Éxito: ${successCount} | Errores: ${errorCount}\n`);
}

/**
 * Crea la bodega principal si no existe
 */
async function createMainWarehouse() {
  console.log('🏢 Verificando bodega principal...');
  
  const warehousesRef = collection(db, 'warehouses');
  const warehouseQuery = query(warehousesRef, where('id', '==', WAREHOUSE_ID));
  const warehouseSnapshot = await getDocs(warehouseQuery);
  
  if (warehouseSnapshot.empty) {
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
  } else {
    console.log('✅ Bodega principal ya existe\n');
  }
}

/**
 * Ejecuta la carga completa de datos de almacén
 */
export async function executeWarehouseDataUpload() {
  console.log('\n🚀 ===== INICIANDO CARGA DE DATOS DE ALMACÉN =====\n');
  
  try {
    // 1. Crear bodega principal
    await createMainWarehouse();
    
    // 2. Cargar warehouse stock
    await uploadWarehouseStock();
    
    // 3. Cargar estantes
    await uploadShelves();
    
    // 4. Cargar shelf stock
    await uploadShelfStock();
    
    console.log('\n✅ ===== CARGA DE DATOS DE ALMACÉN COMPLETADA =====\n');
  } catch (error) {
    console.error('\n❌ Error en la carga de datos de almacén:', error);
    throw error;
  }
}

