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

**Creado para PickPackPro MX** 📦

