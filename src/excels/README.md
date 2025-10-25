# 📦 Sistema de Carga de Datos a Firebase

Este módulo contiene las funciones y datos necesarios para cargar información de productos y proveedores a Firebase Firestore.

## 📁 Estructura de Archivos

```
src/excels/
├── types-firebase-data-models.ts          # Tipos TypeScript para los modelos de datos
├── suppliers-raw-data.ts                  # Datos de proveedores del Excel
├── products-raw-data.ts                   # Datos de productos del Excel
├── firebase-upload-functions.ts           # Funciones de carga a Firestore
├── upload-data-to-firebase-script.ts      # Script principal de ejecución
└── README.md                              # Esta documentación
```

## 🗄️ Estructura de Datos en Firestore

### Colección: `suppliers`

```typescript
{
  id: string,                          // ID generado automáticamente
  marca: string,                       // Nombre de la marca
  dueno_proveedor_principal: string,   // Empresa propietaria
  pais_grupo_corporativo: string,      // País de origen
  created_at: Date,                    // Fecha de creación
  updated_at: Date                     // Fecha de actualización
}
```

### Colección: `products`

```typescript
{
  id: string,                    // ID generado automáticamente
  producto: string,              // Nombre del producto
  marca: string,                 // Marca del producto
  presentacion: string,          // Presentación (ej: "355 ml")
  restock_quantity: number,      // Cantidad de reorden
  leadtime_days: number,         // Días de tiempo de entrega
  supplier_id: string,           // ID del proveedor (referencia)
  stock_actual: number,          // Stock actual (default: 0)
  precio_unitario: number,       // Precio unitario (default: 0)
  created_at: Date,              // Fecha de creación
  updated_at: Date               // Fecha de actualización
}
```

## 🚀 Cómo Usar

### Opción 1: Desde un Componente React

Usa el componente `FirebaseDataUploaderButton`:

```tsx
import { FirebaseDataUploaderButton } from '@/components/firebase-data-uploader-button';

function MiComponente() {
  return (
    <div>
      <h1>Cargar Datos a Firebase</h1>
      <FirebaseDataUploaderButton />
    </div>
  );
}
```

### Opción 2: Desde la Consola del Navegador

1. Abre la consola del navegador (F12)
2. Ejecuta:

```javascript
import { executeDataUpload } from './src/excels/upload-data-to-firebase-script';
await executeDataUpload();
```

### Opción 3: Programáticamente

```typescript
import { executeDataUpload } from '@/excels/upload-data-to-firebase-script';

async function cargarDatos() {
  try {
    await executeDataUpload();
    console.log('Datos cargados exitosamente');
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
}
```

## 📊 Valores por Defecto de Restock y Leadtime

El sistema asigna automáticamente valores de `restock_quantity` y `leadtime_days` basados en el tipo de producto:

| Tipo de Producto | Restock Quantity | Leadtime (días) |
|------------------|------------------|-----------------|
| Bebidas alcohólicas (cerveza) | 48 unidades | 7 días |
| Bebidas grandes (1L+) | 24 unidades | 3 días |
| Refrescos individuales | 36 unidades | 3 días |
| Jugos | 24 unidades | 5 días |
| Lácteos | 12 unidades | 2 días |
| Galletas/snacks | 30 unidades | 7 días |
| Café | 10 unidades | 5 días |
| Otros | 20 unidades | 5 días |

## ⚙️ Configuración

Asegúrate de tener configuradas las variables de entorno en tu archivo `.env`:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

## 🔍 Características

- ✅ **Prevención de duplicados**: Verifica si los datos ya existen antes de crear nuevos registros
- ✅ **Generación automática de IDs**: Crea IDs únicos basados en los nombres
- ✅ **Valores inteligentes**: Asigna automáticamente cantidades de restock y leadtime según el tipo de producto
- ✅ **Relaciones**: Vincula automáticamente productos con sus proveedores
- ✅ **Logs detallados**: Proporciona información clara del proceso de carga
- ✅ **Manejo de errores**: Continúa la carga incluso si algunos registros fallan

## 📝 Datos Incluidos

### Proveedores (14 marcas)
- Calahua, Del Valle, Lala, Jumex, Ciel
- Coca-Cola, Sprite, Gamesa
- Punta del Cielo
- Michelob, Heineken, Modelo, Corona

### Productos (22 productos)
- Jugos y bebidas (8 productos)
- Refrescos Coca-Cola (5 variantes)
- Agua (2 productos)
- Galletas (2 productos)
- Café (1 producto)
- Cervezas (4 marcas)

## 🛠️ Personalización

Para modificar los valores de restock o leadtime, edita la función `getDefaultRestockValues()` en `firebase-upload-functions.ts`.

Para agregar más productos o proveedores, edita los archivos:
- `suppliers-raw-data.ts`
- `products-raw-data.ts`

## ⚠️ Notas Importantes

1. La carga es **idempotente**: puedes ejecutarla múltiples veces sin crear duplicados
2. Los productos necesitan que sus proveedores existan primero
3. Los timestamps se crean automáticamente con la hora actual
4. Los IDs se generan normalizando los nombres (sin acentos, en minúsculas, con guiones)

## 🎯 Próximos Pasos

Después de cargar los datos, puedes:
1. Consultar los datos desde tu aplicación
2. Actualizar stock y precios
3. Crear órdenes de compra basadas en los niveles de restock
4. Generar reportes de inventario

