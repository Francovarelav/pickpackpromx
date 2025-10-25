# 🚀 Guía de Inicio Rápido

## ⚡ En 3 Pasos

### Paso 1: Configura Firebase (2 minutos)

Edita tu archivo `.env` con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**¿Dónde encontrar estos valores?**
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a ⚙️ **Project Settings** → **General**
4. Scroll hasta **Your apps** → **SDK setup and configuration**
5. Copia los valores del `firebaseConfig`

### Paso 2: Ejecuta la Carga (1 minuto)

**Opción A - Comando npm (Más Rápido) ⚡**

```bash
npm run upload-data
```

**Opción B - Desde un componente**

```tsx
// En cualquier archivo .tsx
import { FirebaseDataUploaderButton } from '@/components/firebase-data-uploader-button';

function MiComponente() {
  return <FirebaseDataUploaderButton />;
}
```

**Opción C - Desde código**

```tsx
import { executeDataUpload } from '@/excels/upload-data-to-firebase-script';

// Ejecutar
await executeDataUpload();
```

### Paso 3: Verifica (1 minuto)

1. Abre [Firebase Console](https://console.firebase.google.com)
2. Ve a **Firestore Database**
3. Deberías ver:
   - ✅ Colección `suppliers` con 14 documentos
   - ✅ Colección `products` con 22 documentos

---

## 📝 Ejemplo Completo de Uso

### 1. Crear una Página de Admin

```tsx
// src/pages/Admin.tsx
import { FirebaseDataUploaderButton } from '@/components/firebase-data-uploader-button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Inicializar Base de Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <FirebaseDataUploaderButton />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Consultar los Datos

```tsx
// src/hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const snapshot = await getDocs(collection(db, 'products'));
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return { products, loading };
}
```

### 3. Mostrar los Productos

```tsx
// src/components/ProductsList.tsx
import { useProducts } from '@/hooks/useProducts';

export function ProductsList() {
  const { products, loading } = useProducts();

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="grid gap-4">
      {products.map(product => (
        <div key={product.id} className="border p-4 rounded">
          <h3 className="font-bold">{product.producto}</h3>
          <p className="text-sm text-gray-600">
            {product.marca} - {product.presentacion}
          </p>
          <p className="text-xs">
            Stock: {product.stock_actual} | Restock: {product.restock_quantity}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔍 Verificación Rápida

### Desde la Consola del Navegador

Abre la consola (F12) y ejecuta:

```javascript
// Verificar conexión
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Contar proveedores
const suppliers = await getDocs(collection(db, 'suppliers'));
console.log(`Proveedores: ${suppliers.size}`); // Debería ser 14

// Contar productos
const products = await getDocs(collection(db, 'products'));
console.log(`Productos: ${products.size}`); // Debería ser 22

// Ver primer producto
const firstProduct = products.docs[0].data();
console.log('Primer producto:', firstProduct);
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo ejecutar la carga múltiples veces?

✅ **Sí**, el sistema previene duplicados automáticamente.

### ¿Qué pasa si ya tengo datos en Firestore?

✅ Solo se crean los registros que no existen. Los existentes se mantienen intactos.

### ¿Puedo modificar las cantidades de restock?

✅ **Sí**, edita la función `getDefaultRestockValues()` en `firebase-upload-functions.ts`

### ¿Cómo agrego más productos?

✅ Edita `products-raw-data.ts` y ejecuta la carga nuevamente.

### ¿Necesito configurar reglas de seguridad?

⚠️ Para desarrollo, puedes usar reglas abiertas. Para producción, configura reglas apropiadas:

```javascript
// Firebase Console → Firestore → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Para desarrollo (NO usar en producción)
    match /{document=**} {
      allow read, write: if true;
    }
    
    // Para producción (ejemplo básico)
    match /suppliers/{supplierId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🎯 Próximos Pasos Sugeridos

Después de cargar los datos, puedes:

1. **Crear un Dashboard de Inventario**
   - Mostrar productos con stock bajo
   - Estadísticas de inventario
   - Alertas de reorden

2. **Sistema de Órdenes de Compra**
   - Generar órdenes automáticas
   - Tracking de entregas
   - Historial de compras

3. **Gestión de Proveedores**
   - Ver productos por proveedor
   - Información de contacto
   - Historial de pedidos

4. **Reportes y Analytics**
   - Productos más vendidos
   - Análisis de stock
   - Tendencias de inventario

---

## 📚 Más Información

- **Documentación completa**: `src/excels/README.md`
- **Ejemplos avanzados**: `src/excels/USAGE_EXAMPLES.md`
- **Vista previa de datos**: `src/excels/DATA_PREVIEW.md`
- **Resumen del proyecto**: `FIREBASE_SETUP_COMPLETE.md`

---

## 💡 Tips Pro

1. **Usa React Query** para cachear datos de Firebase
2. **Implementa búsqueda** con Algolia o similar
3. **Agrega imágenes** de productos en Storage
4. **Crea índices** en Firestore para consultas frecuentes
5. **Implementa paginación** para listas grandes

---

## 🆘 ¿Necesitas Ayuda?

Si encuentras problemas:

1. ✅ Verifica que las variables de entorno estén correctas
2. ✅ Revisa la consola del navegador para errores
3. ✅ Verifica las reglas de seguridad en Firebase Console
4. ✅ Asegúrate de tener conexión a internet
5. ✅ Revisa que Firebase esté habilitado en tu proyecto

---

**¡Listo! En menos de 5 minutos tendrás tu base de datos funcionando.** 🚀

