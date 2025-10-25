# 📚 Ejemplos de Uso - Sistema de Carga de Datos

## 🎯 Ejemplo 1: Usar el Componente en una Página

```tsx
// En cualquier página de tu aplicación
import { FirebaseDataUploaderButton } from '@/components/firebase-data-uploader-button';

function AdminPage() {
  return (
    <div className="p-6">
      <h1>Panel de Administración</h1>
      <FirebaseDataUploaderButton />
    </div>
  );
}
```

## 🎯 Ejemplo 2: Ejecutar Programáticamente

```tsx
import { executeDataUpload } from '@/excels/upload-data-to-firebase-script';
import { toast } from 'sonner';

async function handleInitialSetup() {
  try {
    console.log('Iniciando configuración inicial...');
    await executeDataUpload();
    toast.success('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error en configuración:', error);
    toast.error('Error al inicializar la base de datos');
  }
}
```

## 🎯 Ejemplo 3: Consultar Datos Después de la Carga

```tsx
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

// Obtener todos los proveedores
async function getAllSuppliers() {
  const suppliersRef = collection(db, 'suppliers');
  const snapshot = await getDocs(suppliersRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Obtener productos de una marca específica
async function getProductsByBrand(marca: string) {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('marca', '==', marca));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Obtener productos que necesitan restock
async function getProductsNeedingRestock(currentStock: number) {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(product => 
      (product.stock_actual || 0) < product.restock_quantity
    );
}
```

## 🎯 Ejemplo 4: Actualizar Stock de un Producto

```tsx
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

async function updateProductStock(productId: string, newStock: number) {
  const productRef = doc(db, 'products', productId);
  
  await updateDoc(productRef, {
    stock_actual: newStock,
    updated_at: Timestamp.now().toDate()
  });
  
  console.log(`Stock actualizado para producto ${productId}: ${newStock}`);
}

// Ejemplo de uso
await updateProductStock('coca-cola-normal-355-ml', 48);
```

## 🎯 Ejemplo 5: Crear un Hook Personalizado

```tsx
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface Product {
  id: string;
  producto: string;
  marca: string;
  presentacion: string;
  stock_actual: number;
  restock_quantity: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        setProducts(productsData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}

// Uso en un componente
function ProductsList() {
  const { products, loading, error } = useProducts();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          {product.producto} - {product.presentacion}
          (Stock: {product.stock_actual})
        </li>
      ))}
    </ul>
  );
}
```

## 🎯 Ejemplo 6: Generar Orden de Compra Automática

```tsx
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

interface PurchaseOrderItem {
  product_id: string;
  producto: string;
  marca: string;
  supplier_id: string;
  quantity: number;
  current_stock: number;
  restock_quantity: number;
}

async function generatePurchaseOrder() {
  // Obtener productos con stock bajo
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  const itemsToOrder: PurchaseOrderItem[] = [];
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const currentStock = data.stock_actual || 0;
    const restockQty = data.restock_quantity;
    
    if (currentStock < restockQty * 0.3) { // Si está por debajo del 30%
      itemsToOrder.push({
        product_id: doc.id,
        producto: data.producto,
        marca: data.marca,
        supplier_id: data.supplier_id,
        quantity: restockQty,
        current_stock: currentStock,
        restock_quantity: restockQty
      });
    }
  });
  
  // Crear orden de compra
  if (itemsToOrder.length > 0) {
    const ordersRef = collection(db, 'purchase_orders');
    const orderRef = await addDoc(ordersRef, {
      items: itemsToOrder,
      status: 'pending',
      total_items: itemsToOrder.length,
      created_at: Timestamp.now().toDate(),
      expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    });
    
    console.log(`Orden de compra creada: ${orderRef.id}`);
    console.log(`Total de productos: ${itemsToOrder.length}`);
    
    return orderRef.id;
  }
  
  console.log('No hay productos que necesiten restock');
  return null;
}
```

## 🎯 Ejemplo 7: Dashboard de Inventario

```tsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface InventoryStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalSuppliers: number;
}

function InventoryDashboard() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalSuppliers: 0
  });

  useEffect(() => {
    async function fetchStats() {
      // Productos
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      
      let lowStock = 0;
      let outOfStock = 0;
      
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const stock = data.stock_actual || 0;
        const restock = data.restock_quantity;
        
        if (stock === 0) outOfStock++;
        else if (stock < restock * 0.3) lowStock++;
      });
      
      // Proveedores
      const suppliersRef = collection(db, 'suppliers');
      const suppliersSnapshot = await getDocs(suppliersRef);
      
      setStats({
        totalProducts: productsSnapshot.size,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
        totalSuppliers: suppliersSnapshot.size
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 border rounded">
        <h3 className="text-sm text-muted-foreground">Total Productos</h3>
        <p className="text-3xl font-bold">{stats.totalProducts}</p>
      </div>
      <div className="p-4 border rounded">
        <h3 className="text-sm text-muted-foreground">Stock Bajo</h3>
        <p className="text-3xl font-bold text-yellow-500">{stats.lowStockProducts}</p>
      </div>
      <div className="p-4 border rounded">
        <h3 className="text-sm text-muted-foreground">Sin Stock</h3>
        <p className="text-3xl font-bold text-red-500">{stats.outOfStockProducts}</p>
      </div>
      <div className="p-4 border rounded">
        <h3 className="text-sm text-muted-foreground">Proveedores</h3>
        <p className="text-3xl font-bold">{stats.totalSuppliers}</p>
      </div>
    </div>
  );
}
```

## 🎯 Ejemplo 8: Filtrar Productos por Categoría

```tsx
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

type ProductCategory = 'bebidas' | 'alcohol' | 'snacks' | 'lacteos' | 'cafe';

function categorizeProduct(producto: string): ProductCategory {
  const productoLower = producto.toLowerCase();
  
  if (productoLower.includes('cerveza') || 
      productoLower.includes('michelob') || 
      productoLower.includes('heineken') || 
      productoLower.includes('modelo') || 
      productoLower.includes('corona')) {
    return 'alcohol';
  }
  
  if (productoLower.includes('leche')) {
    return 'lacteos';
  }
  
  if (productoLower.includes('galleta')) {
    return 'snacks';
  }
  
  if (productoLower.includes('cafe') || productoLower.includes('café')) {
    return 'cafe';
  }
  
  return 'bebidas';
}

async function getProductsByCategory(category: ProductCategory) {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(product => categorizeProduct(product.producto) === category);
}

// Uso
const bebidasAlcoholicas = await getProductsByCategory('alcohol');
console.log(`Encontradas ${bebidasAlcoholicas.length} bebidas alcohólicas`);
```

## 💡 Tips y Mejores Prácticas

1. **Siempre maneja errores**: Usa try-catch para operaciones de Firebase
2. **Usa índices**: Para consultas frecuentes, crea índices en Firebase Console
3. **Optimiza lecturas**: Usa `onSnapshot` para datos en tiempo real solo cuando sea necesario
4. **Cachea datos**: Considera usar React Query o SWR para cachear datos de Firebase
5. **Valida datos**: Usa Zod o similar para validar datos antes de guardar
6. **Timestamps**: Siempre actualiza `updated_at` al modificar documentos
7. **Seguridad**: Configura reglas de seguridad en Firebase Console

## 🔗 Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs/firestore)
- [Guía de Consultas de Firestore](https://firebase.google.com/docs/firestore/query-data/queries)
- [Mejores Prácticas de Firestore](https://firebase.google.com/docs/firestore/best-practices)

