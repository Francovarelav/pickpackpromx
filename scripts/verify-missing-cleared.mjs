import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function verifyMissingCleared() {
  try {
    console.log('🔍 Verificando que todos los missing están vacíos...');
    
    // Obtener todos los carts
    const cartsRef = collection(db, 'carts');
    const cartsSnapshot = await getDocs(cartsRef);
    
    console.log(`📦 Verificando ${cartsSnapshot.size} carts\n`);
    
    let allEmpty = true;
    
    // Verificar cada cart
    for (const cartDoc of cartsSnapshot.docs) {
      const cartData = cartDoc.data();
      const cartId = cartDoc.id;
      const missingCount = cartData.missing ? cartData.missing.length : 0;
      
      console.log(`📋 ${cartData.nombre}`);
      console.log(`   ID: ${cartId}`);
      console.log(`   Missing: ${missingCount} productos`);
      
      if (missingCount > 0) {
        console.log(`   ❌ AÚN TIENE PRODUCTOS MISSING!`);
        allEmpty = false;
      } else {
        console.log(`   ✅ Missing vacío`);
      }
      console.log('');
    }
    
    if (allEmpty) {
      console.log('🎉 ¡Todos los carts tienen missing vacío! Listos para testing.');
    } else {
      console.log('⚠️ Algunos carts aún tienen productos missing.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar la función
verifyMissingCleared()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la verificación:', error);
    process.exit(1);
  });
