#!/usr/bin/env node

/**
 * Script para subir datos a Firebase desde la línea de comandos
 * Uso: npm run upload-data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

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

// Datos de proveedores
const suppliersRawData = [
  { marca: "Calahua", dueno_proveedor_principal: "Grupo Calahua S.A. de C.V.", pais_grupo_corporativo: "México" },
  { marca: "Del Valle", dueno_proveedor_principal: "The Coca-Cola Company / FEMSA", pais_grupo_corporativo: "Estados Unidos / México" },
  { marca: "Lala", dueno_proveedor_principal: "Grupo Lala S.A.B. de C.V.", pais_grupo_corporativo: "México" },
  { marca: "Jumex", dueno_proveedor_principal: "Grupo Jumex (Fructícolas del Valle S.A. de C.V.)", pais_grupo_corporativo: "México" },
  { marca: "Ciel", dueno_proveedor_principal: "The Coca-Cola Company / FEMSA", pais_grupo_corporativo: "Estados Unidos / México" },
  { marca: "Del Valle / Ciel", dueno_proveedor_principal: "The Coca-Cola Company", pais_grupo_corporativo: "Estados Unidos" },
  { marca: "Coca-Cola", dueno_proveedor_principal: "The Coca-Cola Company", pais_grupo_corporativo: "Estados Unidos" },
  { marca: "Coca-Cola Company", dueno_proveedor_principal: "The Coca-Cola Company", pais_grupo_corporativo: "Estados Unidos" },
  { marca: "Gamesa", dueno_proveedor_principal: "PepsiCo Inc.", pais_grupo_corporativo: "Estados Unidos" },
  { marca: "Punta del Cielo", dueno_proveedor_principal: "Café Punta del Cielo S.A. de C.V.", pais_grupo_corporativo: "México" },
  { marca: "Michelob", dueno_proveedor_principal: "Anheuser-Busch InBev (Grupo Modelo)", pais_grupo_corporativo: "Bélgica / México" },
  { marca: "Heineken", dueno_proveedor_principal: "Heineken N.V.", pais_grupo_corporativo: "Países Bajos" },
  { marca: "Modelo", dueno_proveedor_principal: "Anheuser-Busch InBev (Grupo Modelo)", pais_grupo_corporativo: "Bélgica / México" },
  { marca: "Corona", dueno_proveedor_principal: "Anheuser-Busch InBev (Grupo Modelo)", pais_grupo_corporativo: "Bélgica / México" }
];

// Datos de productos
const productsRawData = [
  { producto: "Jugo de agua", marca: "Calahua", presentacion: "330 ml" },
  { producto: "Jugo del Valle de manzana", marca: "Del Valle", presentacion: "946 ml" },
  { producto: "Leche Light", marca: "Lala", presentacion: "1 litro" },
  { producto: "Jugo de tomate", marca: "Jumex", presentacion: "960 ml" },
  { producto: "Jugo del Valle de naranja", marca: "Del Valle", presentacion: "946 ml" },
  { producto: "Agua de coco", marca: "Calahua", presentacion: "330 ml" },
  { producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "355 ml" },
  { producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "1 litro" },
  { producto: "Coca-Cola Cero", marca: "Coca-Cola", presentacion: "355 ml" },
  { producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "355 ml" },
  { producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "1 litro" },
  { producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml" },
  { producto: "Fresa Kiwi", marca: "Del Valle / Ciel", presentacion: "355 ml" },
  { producto: "Sprite", marca: "Coca-Cola Company", presentacion: "355 ml" },
  { producto: "Agua Ciel", marca: "Ciel", presentacion: "1.5 litros" },
  { producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g" },
  { producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g" },
  { producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete" },
  { producto: "Michelob Ultra", marca: "Michelob", presentacion: "355 ml" },
  { producto: "Heineken Original", marca: "Heineken", presentacion: "355 ml" },
  { producto: "Modelo Especial", marca: "Modelo", presentacion: "355 ml" },
  { producto: "Corona Extra", marca: "Corona", presentacion: "355 ml" }
];

// Funciones auxiliares
function generateSupplierId(marca) {
  return marca
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateProductId(producto, presentacion) {
  const combined = `${producto}-${presentacion}`;
  return combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getDefaultRestockValues(producto, presentacion) {
  const productoLower = producto.toLowerCase();
  const presentacionLower = presentacion.toLowerCase();
  
  if (productoLower.includes('cerveza') || 
      productoLower.includes('michelob') || 
      productoLower.includes('heineken') || 
      productoLower.includes('modelo') || 
      productoLower.includes('corona')) {
    return { restock_quantity: 48, leadtime_days: 7 };
  }
  
  if (presentacionLower.includes('litro') || presentacionLower.includes('l')) {
    return { restock_quantity: 24, leadtime_days: 3 };
  }
  
  if (productoLower.includes('coca') || 
      productoLower.includes('sprite') || 
      productoLower.includes('agua')) {
    return { restock_quantity: 36, leadtime_days: 3 };
  }
  
  if (productoLower.includes('jugo')) {
    return { restock_quantity: 24, leadtime_days: 5 };
  }
  
  if (productoLower.includes('leche')) {
    return { restock_quantity: 12, leadtime_days: 2 };
  }
  
  if (productoLower.includes('galleta')) {
    return { restock_quantity: 30, leadtime_days: 7 };
  }
  
  if (productoLower.includes('cafe') || productoLower.includes('café')) {
    return { restock_quantity: 10, leadtime_days: 5 };
  }
  
  return { restock_quantity: 20, leadtime_days: 5 };
}

// Función para subir proveedores
async function uploadSuppliers() {
  const supplierIdMap = new Map();
  const suppliersCollection = collection(db, 'suppliers');
  
  console.log('🚀 Iniciando carga de proveedores...');
  
  for (const supplier of suppliersRawData) {
    try {
      const q = query(suppliersCollection, where('marca', '==', supplier.marca));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        supplierIdMap.set(supplier.marca, existingDoc.id);
        console.log(`✓ Proveedor "${supplier.marca}" ya existe (ID: ${existingDoc.id})`);
        continue;
      }
      
      const supplierId = generateSupplierId(supplier.marca);
      const supplierData = {
        id: supplierId,
        marca: supplier.marca,
        dueno_proveedor_principal: supplier.dueno_proveedor_principal,
        pais_grupo_corporativo: supplier.pais_grupo_corporativo,
        created_at: Timestamp.now().toDate(),
        updated_at: Timestamp.now().toDate()
      };
      
      const docRef = await addDoc(suppliersCollection, supplierData);
      supplierIdMap.set(supplier.marca, docRef.id);
      console.log(`✓ Proveedor "${supplier.marca}" creado (ID: ${docRef.id})`);
      
    } catch (error) {
      console.error(`❌ Error al crear proveedor "${supplier.marca}":`, error.message);
    }
  }
  
  console.log(`✅ ${supplierIdMap.size} proveedores procesados\n`);
  return supplierIdMap;
}

// Función para subir productos
async function uploadProducts(supplierIdMap) {
  const productsCollection = collection(db, 'products');
  let createdCount = 0;
  let existingCount = 0;
  let errorCount = 0;
  
  console.log('🚀 Iniciando carga de productos...');
  
  for (const product of productsRawData) {
    try {
      const q = query(
        productsCollection,
        where('producto', '==', product.producto),
        where('presentacion', '==', product.presentacion)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        existingCount++;
        console.log(`✓ Producto "${product.producto} (${product.presentacion})" ya existe`);
        continue;
      }
      
      const supplierId = supplierIdMap.get(product.marca);
      if (!supplierId) {
        console.warn(`⚠️  No se encontró proveedor para la marca "${product.marca}"`);
        errorCount++;
        continue;
      }
      
      const { restock_quantity, leadtime_days } = getDefaultRestockValues(
        product.producto,
        product.presentacion
      );
      
      const productId = generateProductId(product.producto, product.presentacion);
      const productData = {
        id: productId,
        producto: product.producto,
        marca: product.marca,
        presentacion: product.presentacion,
        restock_quantity,
        leadtime_days,
        supplier_id: supplierId,
        created_at: Timestamp.now().toDate(),
        updated_at: Timestamp.now().toDate(),
        stock_actual: 0,
        precio_unitario: 0
      };
      
      await addDoc(productsCollection, productData);
      createdCount++;
      console.log(`✓ Producto "${product.producto} (${product.presentacion})" creado`);
      console.log(`  → Restock: ${restock_quantity} unidades, Leadtime: ${leadtime_days} días`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error al crear producto "${product.producto}":`, error.message);
    }
  }
  
  console.log('\n📊 Resumen de carga de productos:');
  console.log(`   ✅ Creados: ${createdCount}`);
  console.log(`   ℹ️  Ya existían: ${existingCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📦 Total procesados: ${productsRawData.length}\n`);
}

// Función principal
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔥 INICIANDO CARGA DE DATOS A FIREBASE FIRESTORE');
    console.log('═══════════════════════════════════════════════════\n');
    
    // Verificar configuración
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
      throw new Error('❌ Variables de entorno de Firebase no configuradas. Verifica tu archivo .env');
    }
    
    console.log('✓ Configuración de Firebase verificada');
    console.log(`✓ Proyecto: ${firebaseConfig.projectId}\n`);
    
    // Subir datos
    const supplierIdMap = await uploadSuppliers();
    await uploadProducts(supplierIdMap);
    
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 CARGA COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Error fatal durante la carga:', error.message);
    console.error('\n💡 Verifica que:');
    console.error('   1. Las variables de entorno estén configuradas en .env');
    console.error('   2. Tengas conexión a internet');
    console.error('   3. Las reglas de Firestore permitan escritura\n');
    process.exit(1);
  }
}

// Ejecutar
main();

