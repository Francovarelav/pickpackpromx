/**
 * Servicio de Gemini AI para procesar archivos PDF y Excel
 * Extrae información de órdenes de aerolíneas
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedOrderData } from '@/types/order-types';

const GEMINI_API_KEY = 'AIzaSyAYv2vcqi_KiLwL811RzLqTNaRpvWoRsqg';

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Convierte un archivo a base64 para enviar a Gemini
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remover el prefijo "data:*/*;base64,"
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Determina el tipo MIME del archivo
 */
function getMimeType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return file.type || 'application/octet-stream';
  }
}

/**
 * Procesa un archivo PDF con Gemini Vision
 */
async function processPDFFile(file: File): Promise<ExtractedOrderData> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  
  const prompt = `
Analiza este documento PDF que contiene una orden de una aerolínea.
Extrae la siguiente información en formato JSON:

{
  "airline_name": "Nombre de la aerolínea",
  "fecha_entrega": "Fecha de entrega solicitada (formato YYYY-MM-DD si está disponible)",
  "items": [
    {
      "producto": "Nombre del producto",
      "cantidad": número,
      "marca": "Marca (si está disponible)",
      "presentacion": "Presentación (ej: 355 ml, 1 litro, etc.)"
    }
  ],
  "notas": "Cualquier nota adicional o comentarios"
}

IMPORTANTE:
- Si no encuentras algún campo, usa null
- Las cantidades deben ser números enteros
- Busca productos como bebidas, snacks, café, etc.
- Identifica la aerolínea por su nombre o código IATA (AM, VB, Y4, etc.)
- Extrae TODOS los productos y sus cantidades del documento

Responde SOLO con el JSON, sin texto adicional.
`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    },
    prompt
  ]);
  
  const response = await result.response;
  const text = response.text();
  
  // Limpiar el texto para obtener solo el JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
  }
  
  const extractedData = JSON.parse(jsonMatch[0]) as ExtractedOrderData;
  return extractedData;
}

/**
 * Procesa un archivo Excel/CSV con Gemini
 */
async function processExcelFile(file: File): Promise<ExtractedOrderData> {
  // Para archivos CSV, podemos leer el contenido directamente
  if (file.name.endsWith('.csv')) {
    const text = await file.text();
    return processTextContent(text, 'CSV');
  }
  
  // Para archivos Excel, usamos Gemini con el archivo completo
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  
  const base64Data = await fileToBase64(file);
  const mimeType = getMimeType(file);
  
  const prompt = `
Analiza este archivo Excel que contiene una orden de una aerolínea.
Extrae la siguiente información en formato JSON:

{
  "airline_name": "Nombre de la aerolínea",
  "fecha_entrega": "Fecha de entrega solicitada (formato YYYY-MM-DD si está disponible)",
  "items": [
    {
      "producto": "Nombre del producto",
      "cantidad": número,
      "marca": "Marca (si está disponible)",
      "presentacion": "Presentación (ej: 355 ml, 1 litro, etc.)"
    }
  ],
  "notas": "Cualquier nota adicional o comentarios"
}

IMPORTANTE:
- Si no encuentras algún campo, usa null
- Las cantidades deben ser números enteros
- Busca productos como bebidas, snacks, café, etc.
- Identifica la aerolínea por su nombre o código IATA (AM, VB, Y4, etc.)
- Extrae TODOS los productos y sus cantidades del documento
- El archivo puede estar desordenado, busca patrones de productos y cantidades

Responde SOLO con el JSON, sin texto adicional.
`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    },
    prompt
  ]);
  
  const response = await result.response;
  const text = response.text();
  
  // Limpiar el texto para obtener solo el JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
  }
  
  const extractedData = JSON.parse(jsonMatch[0]) as ExtractedOrderData;
  return extractedData;
}

/**
 * Procesa contenido de texto (CSV)
 */
async function processTextContent(text: string, fileType: string): Promise<ExtractedOrderData> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `
Analiza este contenido ${fileType} que contiene una orden de una aerolínea.
Extrae la siguiente información en formato JSON:

{
  "airline_name": "Nombre de la aerolínea",
  "fecha_entrega": "Fecha de entrega solicitada (formato YYYY-MM-DD si está disponible)",
  "items": [
    {
      "producto": "Nombre del producto",
      "cantidad": número,
      "marca": "Marca (si está disponible)",
      "presentacion": "Presentación (ej: 355 ml, 1 litro, etc.)"
    }
  ],
  "notas": "Cualquier nota adicional o comentarios"
}

IMPORTANTE:
- Si no encuentras algún campo, usa null
- Las cantidades deben ser números enteros
- Busca productos como bebidas, snacks, café, etc.
- Identifica la aerolínea por su nombre o código IATA (AM, VB, Y4, etc.)
- Extrae TODOS los productos y sus cantidades

Contenido del archivo:
${text}

Responde SOLO con el JSON, sin texto adicional.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const responseText = response.text();
  
  // Limpiar el texto para obtener solo el JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
  }
  
  const extractedData = JSON.parse(jsonMatch[0]) as ExtractedOrderData;
  return extractedData;
}

/**
 * Función principal para procesar cualquier tipo de archivo
 */
export async function processFileWithGemini(file: File): Promise<ExtractedOrderData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  try {
    switch (extension) {
      case 'pdf':
        return await processPDFFile(file);
      case 'csv':
      case 'xls':
      case 'xlsx':
        return await processExcelFile(file);
      default:
        throw new Error(`Tipo de archivo no soportado: ${extension}`);
    }
  } catch (error) {
    console.error('Error procesando archivo con Gemini:', error);
    throw new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Valida que los datos extraídos sean válidos
 */
export function validateExtractedData(data: ExtractedOrderData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.airline_name || data.airline_name.trim() === '') {
    errors.push('No se pudo identificar el nombre de la aerolínea');
  }
  
  if (!data.items || data.items.length === 0) {
    errors.push('No se encontraron productos en el documento');
  }
  
  data.items?.forEach((item, index) => {
    if (!item.producto || item.producto.trim() === '') {
      errors.push(`Producto ${index + 1}: Nombre de producto faltante`);
    }
    if (!item.cantidad || item.cantidad <= 0) {
      errors.push(`Producto ${index + 1}: Cantidad inválida`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

