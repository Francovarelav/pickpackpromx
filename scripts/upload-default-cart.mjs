/**
 * Script para crear un carrito de catering por defecto en Firebase
 * Este carrito contiene los productos que el carrito de catering debe tener obligatoriamente
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
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
 * Carrito de catering por defecto
 * Estos productos deben estar siempre disponibles en el carrito de catering del avión
 */
const defaultCart = {
  id: 'default-catering-cart',
  nombre: 'Carrito de Catering Estándar',
  descripcion: 'Productos básicos que todo carrito de catering debe contener para un vuelo',
  productos: [
    // Bebidas no alcohólicas
    {
      product_id: 'coca-cola-normal-355-ml',
      producto: 'Coca-Cola Normal',
      marca: 'Coca-Cola',
      presentacion: '355 ml',
      cantidad_default: 24
    },
    {
      product_id: 'coca-cola-cero-355-ml',
      producto: 'Coca-Cola Cero',
      marca: 'Coca-Cola',
      presentacion: '355 ml',
      cantidad_default: 12
    },
    {
      product_id: 'sprite-limon-355-ml',
      producto: 'Sprite Limón',
      marca: 'Sprite',
      presentacion: '355 ml',
      cantidad_default: 12
    },
    {
      product_id: 'agua-ciel-600-ml',
      producto: 'Agua Ciel',
      marca: 'Ciel',
      presentacion: '600 ml',
      cantidad_default: 36
    },
    {
      product_id: 'jugo-del-valle-de-naranja-946-ml',
      producto: 'Jugo del Valle de Naranja',
      marca: 'Del Valle',
      presentacion: '946 ml',
      cantidad_default: 6
    },
    {
      product_id: 'jugo-calahua-de-mango-1-litro',
      producto: 'Jugo Calahua de Mango',
      marca: 'Calahua',
      presentacion: '1 litro',
      cantidad_default: 6
    },
    // Café
    {
      product_id: 'cafe-punta-del-cielo-250-g',
      producto: 'Café Punta del Cielo',
      marca: 'Punta del Cielo',
      presentacion: '250 g',
      cantidad_default: 2
    },
    // Lácteos
    {
      product_id: 'leche-light-1-litro',
      producto: 'Leche Light',
      marca: 'Lala',
      presentacion: '1 litro',
      cantidad_default: 4
    },
    // Snacks
    {
      product_id: 'galletas-emperador-chocolate-150-g',
      producto: 'Galletas Emperador Chocolate',
      marca: 'Gamesa',
      presentacion: '150 g',
      cantidad_default: 12
    },
    {
      product_id: 'galletas-maria-200-g',
      producto: 'Galletas María',
      marca: 'Gamesa',
      presentacion: '200 g',
      cantidad_default: 12
    },
    // Bebidas alcohólicas
    {
      product_id: 'cerveza-modelo-especial-355-ml',
      producto: 'Cerveza Modelo Especial',
      marca: 'Modelo',
      presentacion: '355 ml',
      cantidad_default: 12
    },
    {
      product_id: 'cerveza-corona-extra-355-ml',
      producto: 'Cerveza Corona Extra',
      marca: 'Corona',
      presentacion: '355 ml',
      cantidad_default: 12
    },
    {
      product_id: 'cerveza-heineken-355-ml',
      producto: 'Cerveza Heineken',
      marca: 'Heineken',
      presentacion: '355 ml',
      cantidad_default: 8
    }
  ],
  created_at: new Date(),
  updated_at: new Date()
};

/**
 * Sube el carrito por defecto a Firestore
 */
async function uploadDefaultCart() {
  try {
    console.log('🚀 Iniciando carga del carrito por defecto...\n');
    
    const cartRef = doc(db, 'carts', defaultCart.id);
    
    console.log(`📦 Creando carrito: ${defaultCart.nombre}`);
    console.log(`   - ${defaultCart.productos.length} productos`);
    console.log(`   - Descripción: ${defaultCart.descripcion}\n`);
    
    await setDoc(cartRef, defaultCart, { merge: true });
    
    console.log('✅ Carrito creado exitosamente!\n');
    
    // Mostrar resumen de productos
    console.log('📋 Productos en el carrito:');
    console.log('─'.repeat(80));
    
    let totalProductos = 0;
    defaultCart.productos.forEach((producto, index) => {
      console.log(`${index + 1}. ${producto.producto} (${producto.marca})`);
      console.log(`   Presentación: ${producto.presentacion}`);
      console.log(`   Cantidad default: ${producto.cantidad_default}`);
      console.log('');
      totalProductos += producto.cantidad_default;
    });
    
    console.log('─'.repeat(80));
    console.log(`📊 Total de productos: ${defaultCart.productos.length}`);
    console.log(`📦 Total de unidades: ${totalProductos}\n`);
    
    console.log('✨ ¡Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al crear el carrito:', error);
    throw error;
  }
}

// Ejecutar el script
uploadDefaultCart()
  .then(() => {
    console.log('\n🎉 Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

