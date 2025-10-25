# ✅ Sistema de Carga de Datos a Firebase - COMPLETADO

## 🎉 ¡Todo está listo!

Se ha creado un sistema completo para cargar datos de productos y proveedores a Firebase Firestore.

---

## 📦 Archivos Creados

### 📁 `src/excels/` - Módulo de Datos
```
src/excels/
├── types-firebase-data-models.ts          # Tipos TypeScript
├── suppliers-raw-data.ts                  # 14 proveedores
├── products-raw-data.ts                   # 22 productos
├── firebase-upload-functions.ts           # Funciones de carga
├── upload-data-to-firebase-script.ts      # Script principal
├── README.md                              # Documentación completa
└── USAGE_EXAMPLES.md                      # 8 ejemplos de uso
```

### 🎨 Componentes
```
src/components/
└── firebase-data-uploader-button.tsx      # Botón de carga con UI

src/pages/
└── FirebaseDataUploadPage.tsx             # Página completa de administración
```

---

## 🚀 Cómo Usar

### Opción 1: Comando npm (Más Rápido) ⚡

```bash
npm run upload-data
```

Este comando ejecuta el script desde la terminal y muestra el progreso en tiempo real.

### Opción 2: Usar la Página de Administración

1. Importa la página en tu router o App.tsx:

```tsx
import FirebaseDataUploadPage from '@/pages/FirebaseDataUploadPage';

// En tu router o navegación
<Route path="/admin/upload-data" element={<FirebaseDataUploadPage />} />
```

2. Navega a `/admin/upload-data` y haz clic en el botón

### Opción 3: Usar el Botón en Cualquier Componente

```tsx
import { FirebaseDataUploaderButton } from '@/components/firebase-data-uploader-button';

function MiComponente() {
  return (
    <div>
      <h1>Configuración Inicial</h1>
      <FirebaseDataUploaderButton />
    </div>
  );
}
```

### Opción 4: Ejecutar Programáticamente

```tsx
import { executeDataUpload } from '@/excels/upload-data-to-firebase-script';

async function inicializarBaseDeDatos() {
  await executeDataUpload();
}
```

---

## 📊 Datos que se Cargarán

### 🏢 Proveedores (14 marcas)
- **Bebidas**: Calahua, Del Valle, Jumex, Ciel, Coca-Cola, Sprite
- **Lácteos**: Lala
- **Snacks**: Gamesa
- **Café**: Punta del Cielo
- **Cervezas**: Michelob, Heineken, Modelo, Corona

### 📦 Productos (22 productos)
- **Jugos**: 5 productos (Calahua, Del Valle, Jumex)
- **Refrescos**: 7 productos (Coca-Cola, Sprite, Fresa Kiwi)
- **Agua**: 2 productos (Ciel)
- **Lácteos**: 1 producto (Leche Lala)
- **Galletas**: 2 productos (Gamesa)
- **Café**: 1 producto (Punta del Cielo)
- **Cervezas**: 4 productos (Michelob, Heineken, Modelo, Corona)

---

## 🗄️ Estructura en Firestore

### Colección: `suppliers`
```typescript
{
  id: "coca-cola",
  marca: "Coca-Cola",
  dueno_proveedor_principal: "The Coca-Cola Company",
  pais_grupo_corporativo: "Estados Unidos",
  created_at: Date,
  updated_at: Date
}
```

### Colección: `products`
```typescript
{
  id: "coca-cola-normal-355-ml",
  producto: "Coca-Cola Normal",
  marca: "Coca-Cola",
  presentacion: "355 ml",
  restock_quantity: 36,          // ✨ Calculado automáticamente
  leadtime_days: 3,              // ✨ Calculado automáticamente
  supplier_id: "coca-cola",      // ✨ Vinculado automáticamente
  stock_actual: 0,
  precio_unitario: 0,
  created_at: Date,
  updated_at: Date
}
```

---

## ✨ Características Inteligentes

### 🎯 Valores Automáticos de Restock y Leadtime

El sistema asigna automáticamente cantidades óptimas según el tipo de producto:

| Tipo | Restock | Leadtime | Ejemplo |
|------|---------|----------|---------|
| 🍺 Cervezas | 48 unidades | 7 días | Modelo, Corona |
| 🥤 Refrescos grandes | 24 unidades | 3 días | Coca-Cola 1L |
| 🥤 Refrescos individuales | 36 unidades | 3 días | Coca-Cola 355ml |
| 🧃 Jugos | 24 unidades | 5 días | Del Valle |
| 🥛 Lácteos | 12 unidades | 2 días | Leche Lala |
| 🍪 Galletas | 30 unidades | 7 días | Gamesa |
| ☕ Café | 10 unidades | 5 días | Punta del Cielo |

### 🛡️ Prevención de Duplicados
- ✅ Verifica si los datos ya existen antes de crear
- ✅ Puedes ejecutar la carga múltiples veces sin problemas
- ✅ Operación **idempotente**

### 🔗 Relaciones Automáticas
- ✅ Vincula cada producto con su proveedor
- ✅ Usa el campo `supplier_id` para las relaciones
- ✅ IDs normalizados (sin acentos, minúsculas, con guiones)

---

## 📝 Próximos Pasos

### 1. Configurar Variables de Entorno

Asegúrate de que tu archivo `.env` tenga:

```env
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 2. Ejecutar la Carga

Usa cualquiera de las opciones mencionadas arriba para cargar los datos.

### 3. Verificar en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a Firestore Database
4. Verifica que existan las colecciones `suppliers` y `products`

### 4. Consultar los Datos

```tsx
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

// Obtener todos los productos
const productsRef = collection(db, 'products');
const snapshot = await getDocs(productsRef);
const products = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

console.log('Productos cargados:', products);
```

---

## 📚 Documentación

- **Documentación completa**: `src/excels/README.md`
- **Ejemplos de uso**: `src/excels/USAGE_EXAMPLES.md` (8 ejemplos prácticos)

---

## 🎯 Casos de Uso

### 1. Dashboard de Inventario
Muestra estadísticas de stock, productos con stock bajo, etc.

### 2. Sistema de Reorden Automático
Genera órdenes de compra cuando el stock está bajo.

### 3. Gestión de Proveedores
Consulta información de proveedores y sus productos.

### 4. Reportes de Inventario
Genera reportes por categoría, marca o proveedor.

### 5. Actualización de Precios
Actualiza precios unitarios de productos.

### 6. Control de Stock
Actualiza stock actual cuando se realizan ventas o compras.

---

## ⚠️ Notas Importantes

1. **Primera vez**: Ejecuta la carga una vez para inicializar la base de datos
2. **Idempotente**: Puedes ejecutarla múltiples veces sin crear duplicados
3. **Logs detallados**: Abre la consola del navegador (F12) para ver el progreso
4. **Timestamps**: Se crean automáticamente con la fecha/hora actual
5. **IDs únicos**: Se generan normalizando los nombres (sin acentos, etc.)

---

## 🐛 Solución de Problemas

### Error: "Firebase not initialized"
- Verifica que las variables de entorno estén configuradas
- Reinicia el servidor de desarrollo

### Error: "Permission denied"
- Configura las reglas de seguridad en Firebase Console
- Para desarrollo, puedes usar:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ Solo para desarrollo
    }
  }
}
```

### Los datos no aparecen
- Verifica la consola del navegador para errores
- Revisa Firebase Console para ver si los datos se guardaron
- Asegúrate de que la conexión a internet esté activa

---

## 🎉 ¡Listo para Usar!

Todo está configurado y listo. Solo necesitas:

1. ✅ Configurar las variables de entorno de Firebase
2. ✅ Ejecutar la carga usando cualquiera de las opciones
3. ✅ ¡Empezar a usar los datos en tu aplicación!

**¿Necesitas ayuda?** Revisa los archivos de documentación en `src/excels/`

---

**Creado con ❤️ para PickPackPro MX**

