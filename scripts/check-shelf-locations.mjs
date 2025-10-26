import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDqMK7AZaRQyr6DvQwxOxuNJ7wtMxpoex8",
  authDomain: "pickpackpromx.firebaseapp.com",
  projectId: "pickpackpromx",
  storageBucket: "pickpackpromx.firebasestorage.app",
  messagingSenderId: "1072798208281",
  appId: "1:1072798208281:web:b818b9db86bd881430f588"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkShelfLocations() {
  try {
    console.log('🔍 Verificando ubicaciones en shelf_stock...\n');
    
    const shelfStockRef = collection(db, 'shelf_stock');
    const snapshot = await getDocs(shelfStockRef);
    
    if (snapshot.empty) {
      console.log('❌ No hay productos en shelf_stock');
      return;
    }

    const allProducts = [];
    snapshot.forEach((doc) => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Total de productos en shelf_stock: ${allProducts.length}\n`);

    // Analizar orientación global
    const allY = allProducts.map(item => item.coordenada_y);
    const allX = allProducts.map(item => item.coordenada_x);
    const uniqueGlobalX = new Set(allX).size;
    const uniqueGlobalY = new Set(allY).size;
    const globalOrientation = uniqueGlobalX > uniqueGlobalY ? 'horizontal' : 'vertical';

    console.log('📐 Análisis Global:');
    console.log(`   - Columnas únicas (X): ${uniqueGlobalX}`);
    console.log(`   - Filas únicas (Y): ${uniqueGlobalY}`);
    console.log(`   - Orientación detectada: ${globalOrientation}\n`);

    // Calcular tamaño del grid
    const maxRow = Math.max(...allProducts.map(item => item.coordenada_y), 0);
    const maxCol = Math.max(...allProducts.map(item => item.coordenada_x), 0);
    console.log(`📏 Tamaño del grid:`);
    console.log(`   - Max Row: ${maxRow}`);
    console.log(`   - Max Col: ${maxCol}`);
    console.log(`   - Grid Size: ${maxRow + 3} x ${maxCol + 3}\n`);

    // Buscar productos específicos del cart
    const productsToFind = [
      'coca-cola-normal-355-ml',
      'sprite-355-ml',
      'canelitas-gamesa-30-g',
      'leche-lala-light-1-litro'
    ];

    console.log('🔎 Buscando productos del cart:\n');

    productsToFind.forEach(productId => {
      const found = allProducts.filter(p => p.product_id === productId);
      
      if (found.length > 0) {
        console.log(`✅ ${productId}:`);
        found.forEach(item => {
          let adjustedRow = item.coordenada_y;
          let adjustedCol = item.coordenada_x;

          if (globalOrientation === 'horizontal') {
            if (item.lado === 'A') {
              adjustedRow = item.coordenada_y - 1;
            } else if (item.lado === 'B') {
              adjustedRow = item.coordenada_y + 1;
            }
          } else {
            if (item.lado === 'A') {
              adjustedCol = item.coordenada_x - 1;
            } else if (item.lado === 'B') {
              adjustedCol = item.coordenada_x + 1;
            }
          }

          console.log(`   📍 ${item.producto} - ${item.presentacion}`);
          console.log(`      Marca: ${item.marca}`);
          console.log(`      Estante: ${item.numero_estante} | Lado: ${item.lado} | Altura: ${item.altura}`);
          console.log(`      Coordenadas Base: (${item.coordenada_y}, ${item.coordenada_x})`);
          console.log(`      Coordenadas Ajustadas: (${adjustedRow}, ${adjustedCol})`);
          console.log(`      Cantidad: ${item.cantidad}`);
          console.log('');
        });
      } else {
        console.log(`❌ ${productId}: NO ENCONTRADO\n`);
      }
    });

    // Mostrar todos los product_ids únicos disponibles
    console.log('\n📋 Todos los product_ids disponibles en shelf_stock:');
    const uniqueProductIds = [...new Set(allProducts.map(p => p.product_id))].sort();
    uniqueProductIds.forEach((id, idx) => {
      const product = allProducts.find(p => p.product_id === id);
      console.log(`   ${idx + 1}. ${id} - ${product.producto} (${product.presentacion})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkShelfLocations();

