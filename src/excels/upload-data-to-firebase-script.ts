/**
 * Script principal para ejecutar la carga de datos a Firebase
 * Ejecutar este archivo para subir todos los datos del Excel a Firestore
 * 
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas en .env
 * 2. Ejecuta: npm run upload-data
 * 3. O importa y ejecuta desde un componente React
 */

import { uploadAllDataToFirestore } from './firebase-upload-functions';
import { suppliersRawData } from './suppliers-raw-data';
import { productsRawData } from './products-raw-data';

/**
 * Función principal que ejecuta la carga completa
 */
export async function executeDataUpload(): Promise<void> {
  try {
    console.log('Iniciando proceso de carga de datos...\n');
    
    await uploadAllDataToFirestore(suppliersRawData, productsRawData);
    
    console.log('✅ Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante el proceso de carga:', error);
    throw error;
  }
}

// Para ejecutar desde la consola del navegador o componente React
// Exportar la función principal para uso en la aplicación

