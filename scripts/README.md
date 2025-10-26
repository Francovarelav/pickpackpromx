# 🚀 Scripts de Utilidad

## 📦 upload-data-to-firebase.mjs

Script para subir datos de proveedores y productos a Firebase Firestore desde la línea de comandos.

### Uso

```bash
npm run upload-data
```

### ¿Qué hace?

1. ✅ Carga las variables de entorno desde `.env`
2. ✅ Se conecta a Firebase Firestore
3. ✅ Sube 14 proveedores
4. ✅ Sube 22 productos con sus relaciones
5. ✅ Previene duplicados automáticamente
6. ✅ Muestra progreso detallado en consola

### Requisitos

- ✅ Archivo `.env` configurado con credenciales de Firebase
- ✅ Conexión a internet
- ✅ Reglas de Firestore que permitan escritura

### Ejemplo de Salida

```
═══════════════════════════════════════════════════
🔥 INICIANDO CARGA DE DATOS A FIREBASE FIRESTORE
═══════════════════════════════════════════════════

✓ Configuración de Firebase verificada
✓ Proyecto: tu-proyecto-id

🚀 Iniciando carga de proveedores...
✓ Proveedor "Coca-Cola" creado (ID: abc123)
✓ Proveedor "Lala" creado (ID: def456)
...
✅ 14 proveedores procesados

🚀 Iniciando carga de productos...
✓ Producto "Coca-Cola Normal (355 ml)" creado
  → Restock: 36 unidades, Leadtime: 3 días
...

📊 Resumen de carga de productos:
   ✅ Creados: 22
   ℹ️  Ya existían: 0
   ❌ Errores: 0
   📦 Total procesados: 22

═══════════════════════════════════════════════════
🎉 CARGA COMPLETADA EXITOSAMENTE
═══════════════════════════════════════════════════
```

### Solución de Problemas

#### Error: "Variables de entorno no configuradas"

Verifica que tu archivo `.env` tenga:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

#### Error: "Permission denied"

Configura las reglas de Firestore en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Para desarrollo
    }
  }
}
```

#### Error: "Cannot find module"

Asegúrate de haber instalado las dependencias:

```bash
npm install
```

### Características

- 🔄 **Idempotente**: Puedes ejecutarlo múltiples veces sin crear duplicados
- 📊 **Logs detallados**: Muestra el progreso de cada operación
- 🛡️ **Manejo de errores**: Continúa la carga incluso si algunos registros fallan
- ⚡ **Rápido**: Carga todos los datos en segundos
- 🎯 **Valores inteligentes**: Asigna automáticamente restock y leadtime según tipo de producto

### Datos que se Cargan

#### Proveedores (14)
- Calahua, Del Valle, Lala, Jumex, Ciel
- Coca-Cola, Sprite, Gamesa
- Punta del Cielo
- Michelob, Heineken, Modelo, Corona

#### Productos (22)
- Jugos y bebidas: 8 productos
- Refrescos: 7 productos
- Agua: 2 productos
- Lácteos: 1 producto
- Galletas: 2 productos
- Café: 1 producto
- Cervezas: 4 productos

### Notas

- El script usa módulos ES6 (`.mjs`)
- Requiere Node.js 14 o superior
- Las fechas se crean con la hora actual
- Los IDs se generan normalizando nombres (sin acentos, minúsculas, con guiones)

---

## 🛒 upload-default-cart.mjs

Script para crear un carrito de catering por defecto en Firebase con productos estándar que deben estar siempre disponibles.

### Uso

```bash
node scripts/upload-default-cart.mjs
```

### ¿Qué hace?

1. ✅ Crea un carrito de catering estándar en la colección `carts`
2. ✅ Incluye 13 productos esenciales con cantidades por defecto
3. ✅ Categoriza productos: bebidas, snacks, lácteos, café y cervezas
4. ✅ Usa merge para evitar sobrescribir datos existentes
5. ✅ Muestra un resumen detallado de los productos cargados

### Productos Incluidos

El carrito estándar incluye:

- **Bebidas no alcohólicas** (6 productos):
  - Coca-Cola Normal (24 unidades)
  - Coca-Cola Cero (12 unidades)
  - Sprite Limón (12 unidades)
  - Agua Ciel (36 unidades)
  - Jugo Del Valle Naranja (6 unidades)
  - Jugo Calahua Mango (6 unidades)

- **Café** (1 producto):
  - Café Punta del Cielo (2 unidades)

- **Lácteos** (1 producto):
  - Leche Light Lala (4 unidades)

- **Snacks** (2 productos):
  - Galletas Emperador (12 unidades)
  - Galletas María (12 unidades)

- **Bebidas alcohólicas** (3 productos):
  - Cerveza Modelo (12 unidades)
  - Cerveza Corona (12 unidades)
  - Cerveza Heineken (8 unidades)

**Total**: 158 unidades distribuidas en 13 productos

### Ejemplo de Salida

```
🚀 Iniciando carga del carrito por defecto...

📦 Creando carrito: Carrito de Catering Estándar
   - 13 productos
   - Descripción: Productos básicos que todo carrito de catering debe contener para un vuelo

✅ Carrito creado exitosamente!

📋 Productos en el carrito:
────────────────────────────────────────────────────────────────────────────────
1. Coca-Cola Normal (Coca-Cola)
   Presentación: 355 ml
   Cantidad default: 24
...
────────────────────────────────────────────────────────────────────────────────
📊 Total de productos: 13
📦 Total de unidades: 158

✨ ¡Proceso completado exitosamente!
```

### Estructura del Carrito en Firebase

```javascript
{
  id: "default-catering-cart",
  nombre: "Carrito de Catering Estándar",
  descripcion: "Productos básicos que todo carrito de catering debe contener para un vuelo",
  productos: [
    {
      product_id: "coca-cola-normal-355-ml",
      producto: "Coca-Cola Normal",
      marca: "Coca-Cola",
      presentacion: "355 ml",
      cantidad_default: 24
    },
    // ... más productos
  ],
  created_at: Date,
  updated_at: Date
}
```

### Visualización en el Dashboard

Los productos del carrito se muestran en la sección "Carrito de Catering" del dashboard:
- Tabla con información detallada de cada producto
- Marca, presentación y cantidad por defecto
- Contador total de productos en el carrito
- Interfaz responsive y moderna

---

**Creado para PickPackPro MX** 📦

