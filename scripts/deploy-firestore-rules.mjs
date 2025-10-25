#!/usr/bin/env node

/**
 * Script para desplegar reglas de Firestore
 * Uso: npm run deploy-rules
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Desplegando reglas de Firestore...');

try {
  // Verificar si Firebase CLI está instalado
  execSync('firebase --version', { stdio: 'pipe' });
  
  // Desplegar reglas de Firestore
  execSync('firebase deploy --only firestore:rules', { 
    cwd: projectRoot,
    stdio: 'inherit' 
  });
  
  console.log('✅ Reglas de Firestore desplegadas exitosamente!');
  
} catch (error) {
  console.error('❌ Error al desplegar reglas:', error.message);
  
  if (error.message.includes('firebase: command not found')) {
    console.log('\n📝 Para instalar Firebase CLI:');
    console.log('npm install -g firebase-tools');
    console.log('firebase login');
  }
  
  process.exit(1);
}
