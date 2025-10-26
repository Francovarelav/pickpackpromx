/**
 * Funciones para subir datos a Firebase Firestore
 * Maneja la carga de proveedores y productos
 */

import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import type { FirebaseSupplierData, FirebaseProductData, SupplierRawData, ProductRawData } from './types-firebase-data-models';

/**
 * Genera un ID único basado en el nombre
 */
function generateSupplierId(marca: string): string {
  return marca
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, '-') // Reemplazar caracteres especiales con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final
}

/**
 * Genera un ID único para productos
 */
function generateProductId(producto: string, presentacion: string): string {
  const combined = `${producto}-${presentacion}`;
  return combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Sube los proveedores a Firestore
 * @param suppliers Array de datos de proveedores
 * @returns Mapa de marca -> ID del documento en Firestore
 */
export async function uploadSuppliersToFirestore(
  suppliers: SupplierRawData[]
): Promise<Map<string, string>> {
  const supplierIdMap = new Map<string, string>();
  const suppliersCollection = collection(db, 'suppliers');
  
  console.log('🚀 Iniciando carga de proveedores...');
  
  for (const supplier of suppliers) {
    try {
      // Verificar si el proveedor ya existe
      const q = query(
        suppliersCollection,
        where('marca', '==', supplier.marca)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Si ya existe, usar el ID existente
        const existingDoc = querySnapshot.docs[0];
        supplierIdMap.set(supplier.marca, existingDoc.id);
        console.log(`✓ Proveedor "${supplier.marca}" ya existe (ID: ${existingDoc.id})`);
        continue;
      }
      
      // Crear nuevo proveedor
      const supplierId = generateSupplierId(supplier.marca);
      const supplierData: Omit<FirebaseSupplierData, 'id'> = {
        marca: supplier.marca,
        dueno_proveedor_principal: supplier.dueno_proveedor_principal,
        pais_grupo_corporativo: supplier.pais_grupo_corporativo,
        created_at: Timestamp.now().toDate(),
        updated_at: Timestamp.now().toDate()
      };
      
      const docRef = await addDoc(suppliersCollection, {
        ...supplierData,
        id: supplierId
      });
      
      supplierIdMap.set(supplier.marca, docRef.id);
      console.log(`✓ Proveedor "${supplier.marca}" creado (ID: ${docRef.id})`);
      
    } catch (error) {
      console.error(`❌ Error al crear proveedor "${supplier.marca}":`, error);
      throw error;
    }
  }
  
  console.log(`✅ ${supplierIdMap.size} proveedores procesados\n`);
  return supplierIdMap;
}

/**
 * Valores por defecto para restock y leadtime basados en tipo de producto
 */
function getDefaultRestockValues(producto: string, presentacion: string): {
  restock_quantity: number;
  leadtime_days: number;
} {
  const productoLower = producto.toLowerCase();
  const presentacionLower = presentacion.toLowerCase();
  
  // Bebidas alcohólicas
  if (productoLower.includes('cerveza') || 
      productoLower.includes('michelob') || 
      productoLower.includes('heineken') || 
      productoLower.includes('modelo') || 
      productoLower.includes('corona')) {
    return { restock_quantity: 48, leadtime_days: 7 }; // 2 cajas de 24
  }
  
  // Refrescos y bebidas grandes (1 litro o más)
  if (presentacionLower.includes('litro') || presentacionLower.includes('l')) {
    return { restock_quantity: 24, leadtime_days: 3 };
  }
  
  // Refrescos individuales
  if (productoLower.includes('coca') || 
      productoLower.includes('sprite') || 
      productoLower.includes('agua')) {
    return { restock_quantity: 36, leadtime_days: 3 }; // 1.5 cajas de 24
  }
  
  // Jugos
  if (productoLower.includes('jugo')) {
    return { restock_quantity: 24, leadtime_days: 5 };
  }
  
  // Lácteos (perecederos)
  if (productoLower.includes('leche')) {
    return { restock_quantity: 12, leadtime_days: 2 };
  }
  
  // Galletas y snacks
  if (productoLower.includes('galleta')) {
    return { restock_quantity: 30, leadtime_days: 7 };
  }
  
  // Café
  if (productoLower.includes('cafe') || productoLower.includes('café')) {
    return { restock_quantity: 10, leadtime_days: 5 };
  }
  
  // Default
  return { restock_quantity: 20, leadtime_days: 5 };
}

/**
 * Sube los productos a Firestore
 * @param products Array de datos de productos
 * @param supplierIdMap Mapa de marca -> ID del proveedor
 */
export async function uploadProductsToFirestore(
  products: ProductRawData[],
  supplierIdMap: Map<string, string>
): Promise<void> {
  const productsCollection = collection(db, 'products');
  let createdCount = 0;
  let existingCount = 0;
  let errorCount = 0;
  
  console.log('🚀 Iniciando carga de productos...');
  
  for (const product of products) {
    try {
      // Verificar si el producto ya existe
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
      
      // Buscar el ID del proveedor
      const supplierId = supplierIdMap.get(product.marca);
      if (!supplierId) {
        console.warn(`⚠️  No se encontró proveedor para la marca "${product.marca}"`);
        errorCount++;
        continue;
      }
      
      // Obtener valores por defecto de restock y leadtime
      const { restock_quantity, leadtime_days } = getDefaultRestockValues(
        product.producto,
        product.presentacion
      );
      
      // Crear nuevo producto
      const productId = generateProductId(product.producto, product.presentacion);
      const productData: Omit<FirebaseProductData, 'id'> = {
        producto: product.producto,
        marca: product.marca,
        presentacion: product.presentacion,
        restock_quantity,
        leadtime_days,
        supplier_id: supplierId,
        created_at: Timestamp.now().toDate(),
        updated_at: Timestamp.now().toDate(),
        precio_unitario: 0
      };
      
      await addDoc(productsCollection, {
        ...productData,
        id: productId
      });
      
      createdCount++;
      console.log(`✓ Producto "${product.producto} (${product.presentacion})" creado`);
      console.log(`  → Restock: ${restock_quantity} unidades, Leadtime: ${leadtime_days} días`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error al crear producto "${product.producto}":`, error);
    }
  }
  
  console.log('\n📊 Resumen de carga de productos:');
  console.log(`   ✅ Creados: ${createdCount}`);
  console.log(`   ℹ️  Ya existían: ${existingCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📦 Total procesados: ${products.length}\n`);
}

/**
 * Función principal para ejecutar toda la carga de datos
 */
export async function uploadAllDataToFirestore(
  suppliers: SupplierRawData[],
  products: ProductRawData[]
): Promise<void> {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔥 INICIANDO CARGA DE DATOS A FIREBASE FIRESTORE');
    console.log('═══════════════════════════════════════════════════\n');
    
    // Paso 1: Subir proveedores
    const supplierIdMap = await uploadSuppliersToFirestore(suppliers);
    
    // Paso 2: Subir productos
    await uploadProductsToFirestore(products, supplierIdMap);
    
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 CARGA COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('💥 Error fatal durante la carga:', error);
    throw error;
  }
}

