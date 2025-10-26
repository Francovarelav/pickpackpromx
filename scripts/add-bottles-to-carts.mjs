/**
 * Script para agregar botellas de alcohol a los carritos de catering
 * Agrega 2-4 botellas aleatorias de la colección alcohol_bottles a los carritos que tienen alcohol
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
 * Verifica si un carrito tiene productos con alcohol
 */
function hasAlcohol(cart) {
  const alcoholKeywords = ['cerveza', 'beer', 'vino', 'wine', 'whisky', 'vodka', 'ron', 'tequila'];
  
  return cart.productos.some(producto => {
    const productoLower = producto.producto?.toLowerCase() || '';
    return alcoholKeywords.some(keyword => productoLower.includes(keyword));
  });
}

/**
 * Selecciona botellas aleatorias
 */
function selectRandomBottles(bottles, count) {
  const shuffled = [...bottles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Agrega botellas a un carrito
 */
async function addBottlesToCart(cartId, bottles) {
  try {
    const cartRef = doc(db, 'carts', cartId);
    
    // Obtener el carrito actual
    const cartsRef = collection(db, 'carts');
    const querySnapshot = await getDocs(cartsRef);
    let currentCart = null;
    
    querySnapshot.forEach((doc) => {
      if (doc.id === cartId) {
        currentCart = doc.data();
      }
    });
    
    if (!currentCart) {
      console.log(`❌ No se encontró el carrito ${cartId}`);
      return false;
    }
    
    // Crear productos de botellas
    const bottleProducts = bottles.map(bottle => ({
      product_id: bottle.id,
      producto: bottle.nombre,
      marca: bottle.marca,
      presentacion: `${bottle.volumen_ml} ml`,
      cantidad_default: 1, // 1 botella por defecto
      tipo: 'botella_alcohol',
      volumen_ml: bottle.volumen_ml,
      contenido_alcohol_porcentaje: bottle.contenido_alcohol_porcentaje
    }));
    
    // Agregar las botellas a los productos existentes
    const updatedProducts = [...currentCart.productos, ...bottleProducts];
    
    // Actualizar el carrito
    await updateDoc(cartRef, {
      productos: updatedProducts,
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
async function addBottlesToCarts() {
  try {
    console.log('🚀 Iniciando proceso de agregar botellas a carritos...\n');
    console.log('═'.repeat(80));
    console.log('\n');
    
    // Obtener botellas y carritos
    const bottles = await getAlcoholBottles();
    const carts = await getCarts();
    
    if (bottles.length === 0) {
      console.log('❌ No hay botellas disponibles para agregar');
      return;
    }
    
    if (carts.length === 0) {
      console.log('❌ No hay carritos disponibles');
      return;
    }
    
    console.log('📋 Procesando carritos...\n');
    console.log('─'.repeat(80));
    
    let cartsUpdated = 0;
    let cartsSkipped = 0;
    
    for (const cart of carts) {
      console.log(`\n🛒 Carrito: ${cart.nombre || cart.id}`);
      
      // Verificar si el carrito tiene alcohol
      if (!hasAlcohol(cart)) {
        console.log('   ⏭️  Este carrito no tiene productos con alcohol, omitiendo...');
        cartsSkipped++;
        continue;
      }
      
      // Determinar cuántas botellas agregar (2-4 aleatorio)
      const bottleCount = Math.floor(Math.random() * 3) + 2; // 2, 3 o 4
      console.log(`   🎲 Agregando ${bottleCount} botellas aleatorias...`);
      
      // Seleccionar botellas aleatorias
      const selectedBottles = selectRandomBottles(bottles, bottleCount);
      
      // Mostrar botellas seleccionadas
      selectedBottles.forEach((bottle, index) => {
        console.log(`   ${index + 1}. ${bottle.nombre} (${bottle.marca}) - ${bottle.volumen_ml}ml`);
      });
      
      // Agregar botellas al carrito
      const success = await addBottlesToCart(cart.id, selectedBottles);
      
      if (success) {
        console.log(`   ✅ Carrito actualizado exitosamente`);
        cartsUpdated++;
      } else {
        console.log(`   ❌ Error al actualizar carrito`);
      }
    }
    
    console.log('\n');
    console.log('─'.repeat(80));
    console.log('\n📊 RESUMEN:\n');
    console.log(`   ✅ Carritos actualizados: ${cartsUpdated}`);
    console.log(`   ⏭️  Carritos omitidos (sin alcohol): ${cartsSkipped}`);
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
addBottlesToCarts()
  .then(() => {
    console.log('🎉 Script finalizado correctamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

