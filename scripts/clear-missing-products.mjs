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

async function clearMissingProducts() {
  try {
    console.log('🧹 Iniciando limpieza de productos missing...');
    
    // Obtener todos los carts
    const cartsRef = collection(db, 'carts');
    const cartsSnapshot = await getDocs(cartsRef);
    
    console.log(`📦 Encontrados ${cartsSnapshot.size} carts`);
    
    let updatedCount = 0;
    
    // Procesar cada cart
    for (const cartDoc of cartsSnapshot.docs) {
      const cartData = cartDoc.data();
      const cartId = cartDoc.id;
      
      console.log(`\n🔄 Procesando cart: ${cartData.nombre} (${cartId})`);
      console.log(`   Missing actual: ${cartData.missing ? cartData.missing.length : 0} productos`);
      
      // Limpiar el array missing
      const cartRef = doc(db, 'carts', cartId);
      await updateDoc(cartRef, {
        missing: [],
        updated_at: new Date()
      });
      
      updatedCount++;
      console.log(`   ✅ Missing limpiado`);
    }
    
    console.log(`\n🎉 Limpieza completada!`);
    console.log(`📊 Carts actualizados: ${updatedCount}`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar la función
clearMissingProducts()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });
