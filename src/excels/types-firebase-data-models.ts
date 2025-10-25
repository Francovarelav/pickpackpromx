/**
 * Tipos de datos para la base de datos Firebase
 * Modelos para productos y proveedores
 */

export interface FirebaseSupplierData {
  id: string;
  marca: string;
  dueno_proveedor_principal: string;
  pais_grupo_corporativo: string;
  created_at: Date;
  updated_at: Date;
}

export interface FirebaseProductData {
  id: string;
  producto: string;
  marca: string;
  presentacion: string;
  restock_quantity: number;
  leadtime_days: number;
  supplier_id: string;
  created_at: Date;
  updated_at: Date;
  stock_actual?: number;
  precio_unitario?: number;
}

export interface SupplierRawData {
  marca: string;
  dueno_proveedor_principal: string;
  pais_grupo_corporativo: string;
}

export interface ProductRawData {
  producto: string;
  marca: string;
  presentacion: string;
}

