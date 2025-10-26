/**
 * Script para limpiar botellas de todos los carritos y agregar solo al carrito con alcohol
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

/**
 * Obtiene todas las botellas de alcohol de la base de datos
 */
async function getAlcoholBottles() {
  try {
    console.log('🍷 Obteniendo botellas de alcohol...\n');
    const bottlesRef = collection(db, 'alcohol_bottles');
    const querySnapshot = await getDocs(bottlesRef);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No hay botellas en la colección alcohol_bottles');
      return [];
    }
    
    const bottles = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bottles.push({
        id: doc.id,
        nombre: data.nombre || data.type_id || '',
        marca: data.marca || '',
        tipo: data.tipo || '',
        volumen_ml: data.volumen_ml || 0,
        precio_unitario: data.precio_unitario || 0,
        contenido_alcohol_porcentaje: data.contenido_alcohol_porcentaje || 0
      });
    });
    
    console.log(`✅ Se encontraron ${bottles.length} botellas de alcohol\n`);
    return bottles;
  } catch (error) {
    console.error('❌ Error al obtener botellas:', error);
    return [];
  }
}

/**
 * Obtiene todos los carritos de catering
 */
async function getCarts() {
  try {
    console.log('🛒 Obteniendo carritos...\n');
    const cartsRef = collection(db, 'carts');
    const querySnapshot = await getDocs(cartsRef);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No hay carritos en la colección carts');
      return [];
    }
    
    const carts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      carts.push({
        id: doc.id,
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        productos: data.productos || []
      });
    });
    
    console.log(`✅ Se encontraron ${carts.length} carritos\n`);
    return carts;
  } catch (error) {
    console.error('❌ Error al obtener carritos:', error);
    return [];
  }
}

/**
 * Elimina botellas de alcohol de un carrito
 */
function removeBottlesFromProducts(productos) {
  // Filtra productos que NO sean del tipo botella_alcohol
  return productos.filter(producto => producto.tipo !== 'botella_alcohol');
}

/**
 * Selecciona botellas aleatorias
 */
function selectRandomBottles(bottles, count) {
  const shuffled = [...bottles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Actualiza un carrito
 */
async function updateCart(cartId, productos) {
  try {
    const cartRef = doc(db, 'carts', cartId);
    await updateDoc(cartRef, {
      productos: productos,
      updated_at: new Date()
    });
    return true;
  } catch (error) {
    console.error(`❌ Error al actualizar carrito ${cartId}:`, error);
    return false;
  }
}

/**
 * Función principal
 */
async function fixBottlesInCarts() {
  try {
    console.log('🚀 Iniciando proceso de limpieza y actualización de botellas...\n');
    console.log('═'.repeat(80));
    console.log('\n');
    
    // Obtener botellas y carritos
    const bottles = await getAlcoholBottles();
    const carts = await getCarts();
    
    if (carts.length === 0) {
      console.log('❌ No hay carritos disponibles');
      return;
    }
    
    console.log('📋 Procesando carritos...\n');
    console.log('─'.repeat(80));
    
    let cartsUpdated = 0;
    let bottlesRemoved = 0;
    
    for (const cart of carts) {
      console.log(`\n🛒 Carrito: ${cart.nombre || cart.id}`);
      
      // Contar botellas actuales
      const currentBottles = cart.productos.filter(p => p.tipo === 'botella_alcohol').length;
      
      if (cart.nombre === 'Carrito de Catering con Alcohol') {
        console.log('   🎯 Este es el carrito objetivo');
        
        // Limpiar botellas existentes primero
        let cleanedProducts = removeBottlesFromProducts(cart.productos);
        
        if (currentBottles > 0) {
          console.log(`   🧹 Limpiando ${currentBottles} botellas existentes...`);
        }
        
        // Agregar 3-4 botellas aleatorias
        const bottleCount = Math.floor(Math.random() * 2) + 3; // 3 o 4
        console.log(`   🎲 Agregando ${bottleCount} botellas aleatorias...`);
        
        const selectedBottles = selectRandomBottles(bottles, bottleCount);
        
        // Crear productos de botellas
        const bottleProducts = selectedBottles.map(bottle => ({
          product_id: bottle.id,
          producto: bottle.nombre,
          marca: bottle.marca,
          presentacion: `${bottle.volumen_ml} ml`,
          cantidad_default: 1,
          tipo: 'botella_alcohol',
          volumen_ml: bottle.volumen_ml,
          contenido_alcohol_porcentaje: bottle.contenido_alcohol_porcentaje
        }));
        
        // Mostrar botellas agregadas
        selectedBottles.forEach((bottle, index) => {
          console.log(`   ${index + 1}. ${bottle.nombre} (${bottle.marca}) - ${bottle.volumen_ml}ml`);
        });
        
        // Actualizar con botellas nuevas
        const updatedProducts = [...cleanedProducts, ...bottleProducts];
        const success = await updateCart(cart.id, updatedProducts);
        
        if (success) {
          console.log(`   ✅ Carrito actualizado con ${bottleCount} botellas`);
          cartsUpdated++;
        }
      } else {
        // Para los demás carritos, solo quitar botellas si tienen
        if (currentBottles > 0) {
          console.log(`   🧹 Eliminando ${currentBottles} botella(s)...`);
          const cleanedProducts = removeBottlesFromProducts(cart.productos);
          const success = await updateCart(cart.id, cleanedProducts);
          
          if (success) {
            console.log(`   ✅ Botellas eliminadas`);
            bottlesRemoved += currentBottles;
            cartsUpdated++;
          }
        } else {
          console.log(`   ✓ No tiene botellas, sin cambios`);
        }
      }
    }
    
    console.log('\n');
    console.log('─'.repeat(80));
    console.log('\n📊 RESUMEN:\n');
    console.log(`   ✅ Carritos actualizados: ${cartsUpdated}`);
    console.log(`   🧹 Botellas eliminadas de otros carritos: ${bottlesRemoved}`);
    console.log(`   📦 Total carritos procesados: ${carts.length}`);
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('\n✨ ¡Proceso completado exitosamente!\n');
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    throw error;
  }
}

// Ejecutar el script
fixBottlesInCarts()
  .then(() => {
    console.log('🎉 Script finalizado correctamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

