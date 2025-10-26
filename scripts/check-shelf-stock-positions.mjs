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

async function checkShelfStockPositions() {
  try {
    console.log('🔍 Verificando posiciones en shelf_stock...\n');
    
    const shelfStockRef = collection(db, 'shelf_stock');
    const snapshot = await getDocs(shelfStockRef);
    
    if (snapshot.empty) {
      console.log('❌ No hay productos en shelf_stock');
      return;
    }

    const shelfData = [];
    snapshot.forEach((doc) => {
      shelfData.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Total de productos en shelf_stock: ${shelfData.length}\n`);

    // Analizar orientación global
    const allY = shelfData.map(item => item.coordenada_y);
    const allX = shelfData.map(item => item.coordenada_x);
    const uniqueGlobalX = new Set(allX).size;
    const uniqueGlobalY = new Set(allY).size;
    const globalOrientation = uniqueGlobalX > uniqueGlobalY ? 'horizontal' : 'vertical';

    console.log('📐 ANÁLISIS GLOBAL:');
    console.log(`   - Columnas únicas (X): ${uniqueGlobalX}`);
    console.log(`   - Filas únicas (Y): ${uniqueGlobalY}`);
    console.log(`   - Orientación detectada: ${globalOrientation}\n`);

    // Calcular grid size
    const maxRow = Math.max(...shelfData.map(item => item.coordenada_y), 0);
    const maxCol = Math.max(...shelfData.map(item => item.coordenada_x), 0);
    console.log(`📏 TAMAÑO DEL GRID:`);
    console.log(`   - Max Row (Y): ${maxRow}`);
    console.log(`   - Max Col (X): ${maxCol}`);
    console.log(`   - Grid Size: ${maxRow + 3} x ${maxCol + 3}\n`);

    // Mostrar primeros 20 productos con sus posiciones
    console.log('📦 PRIMEROS 20 PRODUCTOS CON POSICIONES:\n');
    shelfData.slice(0, 20).forEach((item, idx) => {
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

      console.log(`${idx + 1}. ${item.producto} (${item.presentacion})`);
      console.log(`   Product ID: ${item.product_id}`);
      console.log(`   Estante: ${item.numero_estante} | Lado: ${item.lado} | Altura: ${item.altura}`);
      console.log(`   Coordenadas BASE: (${item.coordenada_x}, ${item.coordenada_y})`);
      console.log(`   Coordenadas AJUSTADAS: (${adjustedCol}, ${adjustedRow})`);
      console.log('');
    });

    // Buscar productos específicos del cart (Coca-Cola, Sprite, Canelitas, Leche Light)
    console.log('\n🎯 PRODUCTOS ESPECÍFICOS DEL CART:\n');
    
    const targetProducts = [
      'coca-cola-normal-355-ml',
      'sprite-355-ml', 
      'canelitas-gamesa-30-g',
      'leche-light-lala-1-litro'
    ];

    targetProducts.forEach(productId => {
      const found = shelfData.filter(item => item.product_id === productId);
      
      if (found.length > 0) {
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

          console.log(`✓ ${item.producto} (${item.presentacion})`);
          console.log(`  Product ID: ${item.product_id}`);
          console.log(`  Estante: ${item.numero_estante} | Lado: ${item.lado} | Altura: ${item.altura}`);
          console.log(`  Coordenadas BASE: (X:${item.coordenada_x}, Y:${item.coordenada_y})`);
          console.log(`  Coordenadas AJUSTADAS: (Col:${adjustedCol}, Row:${adjustedRow})`);
          console.log(`  Cantidad: ${item.cantidad}`);
          console.log('');
        });
      } else {
        console.log(`❌ No encontrado: ${productId}\n`);
      }
    });

    // Mostrar distribución de estantes
    console.log('\n🏢 DISTRIBUCIÓN DE ESTANTES:\n');
    const shelfGroups = {};
    shelfData.forEach(item => {
      if (!shelfGroups[item.numero_estante]) {
        shelfGroups[item.numero_estante] = [];
      }
      shelfGroups[item.numero_estante].push(item);
    });

    Object.keys(shelfGroups).sort().forEach(shelfName => {
      const items = shelfGroups[shelfName];
      const coords = items.map(i => `(${i.coordenada_x},${i.coordenada_y})`);
      const uniqueCoords = [...new Set(coords)];
      console.log(`${shelfName}: ${items.length} productos en ${uniqueCoords.length} posición(es)`);
      console.log(`  Coordenadas: ${uniqueCoords.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkShelfStockPositions();

