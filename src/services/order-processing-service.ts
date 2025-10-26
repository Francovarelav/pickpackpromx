/**
 * Servicio de procesamiento de órdenes
 * Calcula precios, crea órdenes y las guarda en Firebase
 */

import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import type { ExtractedOrderData, Order, OrderItem, AirlineCustomer, ProcessedOrderResult } from '@/types/order-types';
import type { FirebaseProductData } from '@/excels/types-firebase-data-models';

// Margen de ganancia por defecto (30%)
const DEFAULT_PROFIT_MARGIN = 0.30;

// IVA en México (16%)
const IVA_RATE = 0.16;

/**
 * Genera un número de orden único
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Busca o crea un cliente aerolínea
 */
async function findOrCreateAirlineCustomer(airlineName: string): Promise<AirlineCustomer> {
  try {
    // Buscar cliente existente
    const customersRef = collection(db, 'airline_customers');
    const q = query(customersRef, where('nombre', '==', airlineName));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      } as AirlineCustomer;
    }
    
    // Crear nuevo cliente
    const newCustomer: Omit<AirlineCustomer, 'id'> = {
      nombre: airlineName,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const docRef = await addDoc(customersRef, {
      ...newCustomer,
      created_at: Timestamp.fromDate(newCustomer.created_at),
      updated_at: Timestamp.fromDate(newCustomer.updated_at),
    });
    
    return {
      id: docRef.id,
      ...newCustomer,
    };
  } catch (error) {
    console.error('Error al buscar/crear cliente:', error);
    throw new Error('No se pudo crear o encontrar el cliente aerolínea');
  }
}

/**
 * Busca un producto en la base de datos por nombre, marca y presentación
 */
async function findProduct(
  productName: string,
  marca?: string,
  presentacion?: string
): Promise<FirebaseProductData | null> {
  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef);
    
    // Buscar por nombre del producto (case insensitive)
    const querySnapshot = await getDocs(q);
    
    // Filtrar manualmente para hacer búsqueda más flexible
    const products = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date(),
      } as FirebaseProductData))
      .filter(product => {
        const nameMatch = product.producto.toLowerCase().includes(productName.toLowerCase()) ||
                         productName.toLowerCase().includes(product.producto.toLowerCase());
        
        const marcaMatch = !marca || 
                          product.marca.toLowerCase().includes(marca.toLowerCase()) ||
                          marca.toLowerCase().includes(product.marca.toLowerCase());
        
        const presentacionMatch = !presentacion || 
                                 product.presentacion.toLowerCase().includes(presentacion.toLowerCase()) ||
                                 presentacion.toLowerCase().includes(product.presentacion.toLowerCase());
        
        return nameMatch && marcaMatch && presentacionMatch;
      });
    
    // Retornar el mejor match
    return products.length > 0 ? products[0] : null;
  } catch (error) {
    console.error('Error al buscar producto:', error);
    return null;
  }
}

/**
 * Calcula el precio de venta con margen de ganancia
 */
function calculateSalePrice(costPrice: number, margin: number = DEFAULT_PROFIT_MARGIN): number {
  return Math.round((costPrice * (1 + margin)) * 100) / 100;
}

/**
 * Procesa los items extraídos y calcula precios
 */
async function processOrderItems(extractedItems: ExtractedOrderData['items']): Promise<{
  items: OrderItem[];
  warnings: string[];
}> {
  const processedItems: OrderItem[] = [];
  const warnings: string[] = [];
  
  for (const extractedItem of extractedItems) {
    try {
      // Buscar el producto en la base de datos
      const product = await findProduct(
        extractedItem.producto,
        extractedItem.marca,
        extractedItem.presentacion
      );
      
      if (!product) {
        warnings.push(`Producto no encontrado en base de datos: ${extractedItem.producto}`);
        
        // Crear item con precio estimado
        const estimatedPrice = 50; // Precio base estimado
        const salePrice = calculateSalePrice(estimatedPrice);
        
        processedItems.push({
          product_id: 'unknown',
          producto: extractedItem.producto,
          marca: extractedItem.marca || 'Desconocida',
          presentacion: extractedItem.presentacion || 'N/A',
          cantidad: extractedItem.cantidad,
          precio_unitario: salePrice,
          precio_total: salePrice * extractedItem.cantidad,
        });
        continue;
      }
      
      // Calcular precio de venta
      const costPrice = product.precio_unitario || 50;
      const salePrice = calculateSalePrice(costPrice);
      
      processedItems.push({
        product_id: product.id,
        producto: product.producto,
        marca: product.marca,
        presentacion: product.presentacion,
        cantidad: extractedItem.cantidad,
        precio_unitario: salePrice,
        precio_total: salePrice * extractedItem.cantidad,
      });
    } catch (error) {
      console.error(`Error procesando item ${extractedItem.producto}:`, error);
      warnings.push(`Error al procesar: ${extractedItem.producto}`);
    }
  }
  
  return { items: processedItems, warnings };
}

/**
 * Calcula totales de la orden
 */
function calculateOrderTotals(items: OrderItem[]): {
  subtotal: number;
  iva: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.precio_total, 0);
  const iva = Math.round(subtotal * IVA_RATE * 100) / 100;
  const total = Math.round((subtotal + iva) * 100) / 100;
  
  return { subtotal, iva, total };
}

/**
 * Parsea fecha de string a Date
 */
function parseDeliveryDate(dateString?: string): Date {
  if (!dateString) {
    // Si no hay fecha, usar 7 días desde hoy
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }
  
  try {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) {
      throw new Error('Fecha inválida');
    }
    return parsed;
  } catch {
    // Si falla el parseo, usar 7 días desde hoy
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }
}

/**
 * Crea una orden completa a partir de datos extraídos
 */
export async function createOrderFromExtractedData(
  extractedData: ExtractedOrderData,
  fileName: string
): Promise<ProcessedOrderResult> {
  try {
    // Buscar o crear cliente
    const customer = await findOrCreateAirlineCustomer(extractedData.airline_name);
    
    // Procesar items y calcular precios
    const { items, warnings } = await processOrderItems(extractedData.items);
    
    if (items.length === 0) {
      return {
        success: false,
        error: 'No se pudieron procesar los productos de la orden',
        warnings,
      };
    }
    
    // Calcular totales
    const { subtotal, iva, total } = calculateOrderTotals(items);
    
    // Parsear fecha de entrega
    const fechaEntrega = parseDeliveryDate(extractedData.fecha_entrega);
    
    // Crear orden
    const order: Omit<Order, 'id'> = {
      order_number: generateOrderNumber(),
      airline_customer_id: customer.id,
      airline_name: customer.nombre,
      fecha_pedido: new Date(),
      fecha_entrega_solicitada: fechaEntrega,
      items,
      subtotal,
      iva,
      total,
      status: 'pending',
      notas: extractedData.notas,
      archivo_original: fileName,
      processed_by_ai: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Guardar en Firebase
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...order,
      fecha_pedido: Timestamp.fromDate(order.fecha_pedido),
      fecha_entrega_solicitada: Timestamp.fromDate(order.fecha_entrega_solicitada),
      created_at: Timestamp.fromDate(order.created_at),
      updated_at: Timestamp.fromDate(order.updated_at),
    });
    
    const savedOrder: Order = {
      id: docRef.id,
      ...order,
    };
    
    return {
      success: true,
      order: savedOrder,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Error creando orden:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al crear la orden',
    };
  }
}

/**
 * Obtiene todas las órdenes
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const querySnapshot = await getDocs(ordersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha_pedido: doc.data().fecha_pedido?.toDate() || new Date(),
      fecha_entrega_solicitada: doc.data().fecha_entrega_solicitada?.toDate() || new Date(),
      created_at: doc.data().created_at?.toDate() || new Date(),
      updated_at: doc.data().updated_at?.toDate() || new Date(),
    } as Order));
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return [];
  }
}

/**
 * Obtiene todas las aerolíneas clientes
 */
export async function getAllAirlineCustomers(): Promise<AirlineCustomer[]> {
  try {
    const customersRef = collection(db, 'airline_customers');
    const querySnapshot = await getDocs(customersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date(),
      updated_at: doc.data().updated_at?.toDate() || new Date(),
    } as AirlineCustomer));
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return [];
  }
}

