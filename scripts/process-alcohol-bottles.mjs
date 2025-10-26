import XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully');

// Función para obtener densidad por tipo de licor (g/ml)
function getDensityByLiquorType(tipo) {
  const tipoLower = tipo.toLowerCase();
  
  if (tipoLower.includes('vodka')) return 0.94;
  if (tipoLower.includes('whiskey') || tipoLower.includes('whisky') || tipoLower.includes('spirits')) return 0.95;
  if (tipoLower.includes('rum') || tipoLower.includes('ron')) return 0.94;
  if (tipoLower.includes('tequila')) return 0.95;
  if (tipoLower.includes('gin') || tipoLower.includes('ginebra')) return 0.94;
  if (tipoLower.includes('brandy') || tipoLower.includes('cognac')) return 0.96;
  if (tipoLower.includes('liqueur') || tipoLower.includes('licor')) return 1.05;
  if (tipoLower.includes('wine') || tipoLower.includes('vino')) return 0.99;
  if (tipoLower.includes('champagne') || tipoLower.includes('sparkling')) return 0.99;
  if (tipoLower.includes('beer') || tipoLower.includes('cerveza')) return 1.01;
  
  return 0.94; // Default
}

// Función para obtener pesos estándar
function getStandardWeights(volumenML, tipo) {
  const densidad = getDensityByLiquorType(tipo);
  
  // Peso de botella vacía según volumen
  let pesoVacio = 0;
  if (volumenML <= 100) {
    pesoVacio = 50;
  } else if (volumenML <= 375) {
    pesoVacio = 250;
  } else if (volumenML <= 750) {
    pesoVacio = 475;
  } else if (volumenML <= 1000) {
    pesoVacio = 550;
  } else {
    pesoVacio = 700;
  }
  
  const pesoLiquido = volumenML * densidad;
  const pesoLleno = pesoVacio + pesoLiquido;
  
  return {
    pesoVacio: Math.round(pesoVacio),
    pesoLleno: Math.round(pesoLleno),
    densidad: Number(densidad.toFixed(3))
  };
}

async function processAlcoholBottles() {
  try {
    console.log('📖 Reading Excel file: datos.xlsx');
    
    // Read the Excel file
    const workbook = XLSX.readFile(path.resolve(__dirname, '..', 'datos.xlsx'));
    console.log('📊 Available sheets:', workbook.SheetNames);
    
    // Assuming the first sheet contains the bottle data
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Read raw data
    const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    console.log('📋 First few rows:', rawData.slice(0, 3));
    
    // Parse the pipe-separated data
    const headers = rawData[0][0].split('|').map(h => h.trim()).filter(Boolean);
    console.log('📋 Headers:', headers);
    
    const data = rawData.slice(1).map(row => {
      if (!row[0]) return null;
      const values = row[0].split('|').map(v => v.trim()).filter(Boolean);
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    }).filter(Boolean);
    
    console.log(`📦 Found ${data.length} rows of data`);
    console.log('📋 Sample parsed data:', data[0]);
    
    // Clear existing bottles (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing bottles from Firebase...');
    const bottlesRef = collection(db, 'alcohol_bottles');
    const existingBottles = await getDocs(bottlesRef);
    const deletePromises = existingBottles.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${existingBottles.size} existing bottles`);
    
    // Process and upload each bottle
    console.log('⬆️ Uploading bottles to Firebase...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        // Map the Excel columns to our bottle structure
        const volumenML = parseFloat(row.Bottle_Size || 0);
        const tipo = row.Category || 'Liquor';
        
        // Calcular pesos estándar basados en volumen y tipo
        const pesos = getStandardWeights(volumenML, tipo);
        
        const bottleData = {
          // Common fields from the parsed data
          type_id: row.Type_ID || '',
          nombre: row.Product_Name || '',
          marca: row.Brand || '',
          tipo: tipo,
          volumen_ml: volumenML,
          
          // Additional fields (can be filled later)
          precio_unitario: 0, // Will be set later or from another source
          contenido_alcohol_porcentaje: 0, // Will be set later
          
          // Información de peso para cálculo de nivel
          peso_botella_vacia_gramos: pesos.pesoVacio,
          peso_botella_llena_gramos: pesos.pesoLleno,
          densidad_liquido_g_ml: pesos.densidad,
          
          // Bottle tracking fields
          nivel_actual: 100, // New bottles start at 100%
          estado: 'disponible', // disponible, en_vuelo, procesando, completada, descartada
          puede_completarse: false, // Will be updated based on nivel_actual
          botella_complementaria_id: null, // ID of the bottle it's paired with
          vuelo_asignado: null, // Flight number this bottle is assigned to
          
          // Metadata
          fecha_registro: new Date().toISOString(),
          fecha_ultima_actualizacion: new Date().toISOString(),
          numero_vuelos_usados: 0,
          
          // Original data preservation
          datos_originales: row
        };
        
        await addDoc(bottlesRef, bottleData);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`   ✓ Uploaded ${successCount} bottles...`);
        }
      } catch (error) {
        console.error(`   ✗ Error uploading bottle:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n✅ Upload complete!');
    console.log(`   ✓ Successfully uploaded: ${successCount} bottles`);
    console.log(`   ✗ Errors: ${errorCount} bottles`);
    
    // Display some statistics
    const allBottles = await getDocs(bottlesRef);
    console.log(`\n📊 Total bottles in database: ${allBottles.size}`);
    
    // Sample data
    if (allBottles.size > 0) {
      const sampleBottle = allBottles.docs[0].data();
      console.log('\n📋 Sample bottle data:');
      console.log(JSON.stringify(sampleBottle, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error processing alcohol bottles:', error);
    process.exit(1);
  }
}

// Run the script
processAlcoholBottles()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

