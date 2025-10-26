/**
 * Tipos de datos para gestión de inventario de almacén
 * Sistema escalable para múltiples bodegas
 */

export interface WarehouseLocation {
  id: string;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string; // ID de la bodega (para escalabilidad)
  product_id: string;
  producto: string;
  marca: string;
  presentacion: string;
  cantidad_total: number; // Stock total en el almacén
  cantidad_minima: number; // Nivel mínimo antes de reordenar
  cantidad_maxima: number; // Capacidad máxima
  ubicacion_principal: string; // Ubicación principal en el almacén
  requiere_reorden: boolean; // Si está por debajo del mínimo
  ultima_entrada: Date; // Última vez que se recibió stock
  ultima_salida: Date; // Última vez que se despachó
  created_at: Date;
  updated_at: Date;
}

export interface Shelf {
  id: string;
  warehouse_id: string;
  numero_estante: string; // Ej: "A1", "B2", etc.
  coordenada_x: number; // Posición X en el almacén
  coordenada_y: number; // Posición Y en el almacén
  altura: number; // Altura del estante (1-5, donde 1 es más bajo)
  lado: 'A' | 'B'; // Lado A o B del estante
  capacidad_maxima: number; // Capacidad máxima en unidades
  capacidad_peso_kg: number; // Capacidad máxima en kg
  tipo_producto: 'bebidas' | 'snacks' | 'cafe' | 'alcohol' | 'mixto';
  accesible: boolean; // Si está accesible o bloqueado
  temperatura_controlada: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ShelfStock {
  id: string;
  shelf_id: string;
  warehouse_id: string;
  product_id: string;
  producto: string;
  marca: string;
  presentacion: string;
  cantidad: number; // Cantidad actual en este estante
  cantidad_minima: number; // Nivel mínimo antes de reabastecer desde almacén
  numero_estante: string;
  coordenada_x: number;
  coordenada_y: number;
  altura: number;
  lado: 'A' | 'B';
  requiere_reabastecimiento: boolean; // Si necesita reabastecerse desde el almacén
  fecha_ultimo_reabastecimiento: Date;
  created_at: Date;
  updated_at: Date;
}

export interface StockMovement {
  id: string;
  warehouse_id: string;
  product_id: string;
  tipo: 'entrada' | 'salida' | 'reabastecimiento' | 'ajuste';
  cantidad: number;
  origen?: string; // De dónde viene (proveedor, otro estante, etc.)
  destino?: string; // A dónde va (estante, orden, etc.)
  shelf_id?: string; // Si es movimiento de estante
  order_id?: string; // Si es por una orden
  usuario?: string;
  notas?: string;
  created_at: Date;
}

export interface ReorderAlert {
  id: string;
  warehouse_id: string;
  product_id: string;
  producto: string;
  tipo: 'warehouse' | 'shelf'; // Si es del almacén o de un estante
  nivel_actual: number;
  nivel_minimo: number;
  cantidad_sugerida: number;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'pendiente' | 'procesando' | 'completada' | 'cancelada';
  created_at: Date;
  updated_at: Date;
}

