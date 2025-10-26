# 🛒 Sección de Carrito de Catering

## Descripción

Se ha agregado una nueva sección al dashboard llamada **"Carrito de Catering"** que muestra los productos que el carrito de catering del avión debe contener por defecto.

## ✨ Características

- 📦 **Visualización completa**: Muestra todos los productos del carrito por defecto
- 🏷️ **Información detallada**: Nombre, marca, presentación y cantidad por defecto de cada producto
- 🔄 **Datos en tiempo real**: Conecta directamente con Firebase Firestore
- 📊 **Contador de productos**: Muestra el número total de productos en el carrito
- 🎨 **Diseño moderno**: Interfaz limpia y responsive

## 🚀 ¿Cómo funciona?

### 1. Estructura de Datos

La información se almacena en la colección `carts` de Firebase Firestore con la siguiente estructura:

```typescript
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

### 2. Cargar Datos del Carrito

Para cargar el carrito por defecto en Firebase, ejecuta:

```bash
npm run upload-cart
```

O directamente:

```bash
node scripts/upload-default-cart.mjs
```

### 3. Ver en el Dashboard

Una vez cargados los datos:

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre el navegador en `http://localhost:5173`

3. La sección "Carrito de Catering" aparecerá en el dashboard mostrando:
   - Nombre del carrito
   - Descripción
   - Tabla con todos los productos
   - Cantidades por defecto de cada producto

## 📋 Productos Incluidos

El carrito estándar incluye **13 productos** distribuidos en las siguientes categorías:

### Bebidas No Alcohólicas (6 productos)
- Coca-Cola Normal - 24 unidades
- Coca-Cola Cero - 12 unidades
- Sprite Limón - 12 unidades
- Agua Ciel - 36 unidades
- Jugo Del Valle de Naranja - 6 unidades
- Jugo Calahua de Mango - 6 unidades

### Café (1 producto)
- Café Punta del Cielo - 2 unidades

### Lácteos (1 producto)
- Leche Light - 4 unidades

### Snacks (2 productos)
- Galletas Emperador Chocolate - 12 unidades
- Galletas María - 12 unidades

### Bebidas Alcohólicas (3 productos)
- Cerveza Modelo Especial - 12 unidades
- Cerveza Corona Extra - 12 unidades
- Cerveza Heineken - 8 unidades

**Total: 158 unidades**

## 🔧 Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/components/cart-section.tsx`**
   - Componente React que renderiza la sección del carrito
   - Conecta con Firebase para obtener los datos
   - Maneja estados de carga y errores

2. **`scripts/upload-default-cart.mjs`**
   - Script para cargar el carrito por defecto en Firebase
   - Incluye 13 productos esenciales
   - Muestra progreso detallado

3. **`CART_SETUP.md`** (este archivo)
   - Documentación de la funcionalidad

### Archivos Modificados

1. **`src/excels/types-firebase-data-models.ts`**
   - Agregados tipos: `FirebaseCartData` y `CartProductItem`

2. **`src/pages/Dashboard.tsx`**
   - Importado y agregado componente `CartSection`

3. **`package.json`**
   - Agregado script: `upload-cart`

4. **`scripts/README.md`**
   - Agregada documentación del script `upload-default-cart.mjs`

## 🎯 Casos de Uso

### Modificar el Carrito Por Defecto

Para modificar los productos o cantidades del carrito:

1. Edita el archivo `scripts/upload-default-cart.mjs`
2. Modifica el array `productos` dentro del objeto `defaultCart`
3. Ejecuta el script:
   ```bash
   npm run upload-cart
   ```

### Agregar Múltiples Carritos

Para crear diferentes configuraciones de carritos:

1. Edita `scripts/upload-default-cart.mjs`
2. Crea múltiples objetos de carrito con diferentes `id`
3. Sube cada uno a Firebase
4. El componente mostrará todos los carritos disponibles

### Ejemplo de Nuevo Carrito

```javascript
const vipCart = {
  id: 'vip-catering-cart',
  nombre: 'Carrito de Catering VIP',
  descripcion: 'Productos premium para vuelos de primera clase',
  productos: [
    {
      product_id: 'champagne-moet-chandon-750-ml',
      producto: 'Champagne Moët & Chandon',
      marca: 'Moët & Chandon',
      presentacion: '750 ml',
      cantidad_default: 6
    },
    // ... más productos premium
  ],
  created_at: new Date(),
  updated_at: new Date()
};
```

## 🛡️ Manejo de Errores

El componente maneja elegantemente los siguientes escenarios:

- **⏳ Cargando**: Muestra un indicador de carga
- **⚠️ Sin datos**: Mensaje amigable si no hay carritos configurados
- **❌ Error**: Mensaje de error si falla la conexión con Firebase
- **📦 Carrito vacío**: Indica si un carrito no tiene productos

## 🔄 Actualización de Datos

Para actualizar el carrito:

1. Ejecuta nuevamente el script:
   ```bash
   npm run upload-cart
   ```
   
2. El script usa `merge: true`, por lo que no sobrescribe datos existentes innecesariamente

3. El componente se actualiza automáticamente al recargar la página

## 📱 Responsive Design

La sección está completamente adaptada para:
- 💻 Desktop
- 📱 Tablets
- 📱 Móviles

La tabla se ajusta automáticamente al tamaño de la pantalla.

## 🔍 Verificación

Para verificar que todo funciona correctamente:

1. ✅ Ejecuta `npm run upload-cart`
2. ✅ Verifica en Firebase Console que existe la colección `carts`
3. ✅ Inicia el servidor con `npm run dev`
4. ✅ Verifica que la sección aparece en el dashboard
5. ✅ Confirma que los productos se muestran correctamente

## 📞 Soporte

Si encuentras problemas:

1. Verifica que las credenciales de Firebase estén configuradas en `.env`
2. Asegúrate de que las reglas de Firestore permitan lectura de la colección `carts`
3. Revisa la consola del navegador para mensajes de error
4. Verifica que el carrito exista en Firebase ejecutando el script de carga

---

**Creado para PickPackPro MX** 📦✨

