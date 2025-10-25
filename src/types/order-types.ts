/**
 * Tipos de datos para órdenes de aerolíneas
 * Sistema de gestión de pedidos con IA
 */

export interface AirlineCustomer {
  id: string;
  nombre: string;
  codigo_iata?: string; // Código IATA de la aerolínea (ej: AM, VB, Y4)
  contacto_principal?: string;
  email?: string;
  telefono?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  product_id: string;
  producto: string;
  marca: string;
  presentacion: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
}

export interface Order {
  id: string;
  order_number: string; // Número de orden generado automáticamente
  airline_customer_id: string;
  airline_name: string;
  fecha_pedido: Date;
  fecha_entrega_solicitada: Date;
  items: OrderItem[];
  subtotal: number;
  iva: number; // 16% en México
  total: number;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notas?: string;
  archivo_original?: string; // Nombre del archivo original
  processed_by_ai: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ExtractedOrderData {
  airline_name: string;
  fecha_entrega?: string;
  items: {
    producto: string;
    cantidad: number;
    marca?: string;
    presentacion?: string;
  }[];
  notas?: string;
}

export interface ProcessedOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
  warnings?: string[];
}

