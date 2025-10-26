# 📦 Sistema de Gestión de Inventario de Almacén

Sistema completo de gestión de inventario con dos niveles: **Stock General del Almacén** y **Stock en Estantes**.

## 🏗️ Estructura del Sistema

### 1. **Warehouse Stock** (Stock General)
Stock total disponible en el almacén. Este es el inventario principal que se usa para:
- Saber cuándo pedir más al proveedor
- Reabastecer los estantes
- Control general del inventario

**Campos principales:**
- `cantidad_total`: Stock total en el almacén
- `cantidad_minima`: Nivel mínimo antes de reordenar al proveedor
- `cantidad_maxima`: Capacidad máxima de almacenamiento
- `ubicacion_principal`: Zona del almacén (Ej: "Zona A - Bebidas")
- `requiere_reorden`: Boolean que indica si necesita pedirse al proveedor

### 2. **Shelf Stock** (Stock en Estantes)
Stock distribuido en estantes específicos con coordenadas. Este inventario se usa para:
- Picking de órdenes
- Saber cuándo reabastecer desde el almacén general
- Optimización de rutas de picking

**Campos principales:**
- `cantidad`: Cantidad actual en el estante
- `cantidad_minima`: Nivel mínimo antes de reabastecer desde almacén
- `coordenada_x`, `coordenada_y`: Posición en el almacén
- `altura`: Nivel del estante (1-5)
- `lado`: Lado A o B del estante
- `requiere_reabastecimiento`: Boolean que indica si necesita reabastecerse

### 3. **Shelves** (Estantes)
Definición física de los estantes en el almacén.

**Coordenadas basadas en layout real:**
```
Fila 1-2:  Zona A (Bebidas)      - X: 1-2, Y: 1
Fila 3-4:  Zona B (Refrescos)    - X: 3-4, Y: 1
Fila 5-6:  Zona C (Agua)         - X: 5-6, Y: 1
Fila 7-8:  Zona D (Snacks)       - X: 7-8, Y: 1
Fila 9:    Zona E (Café)         - X: 9, Y: 1
Fila 10-11: Zona F (Alcohol)     - X: 10-11, Y: 1
```

Cada estante tiene 2 lados (A y B) y 2 alturas (1 y 2).

## 📊 Colecciones de Firebase

### `warehouses`
Información de las bodegas (escalable a múltiples ubicaciones)
```typescript
{
  id: string
  nombre: string
  direccion: string
  ciudad: string
  pais: string
  activo: boolean
}
```

### `warehouse_stock`
Stock general del almacén
```typescript
{
  warehouse_id: string
  product_id: string
  cantidad_total: number
  cantidad_minima: number
  cantidad_maxima: number
  ubicacion_principal: string
  requiere_reorden: boolean
}
```

### `shelves`
Definición de estantes
```typescript
{
  warehouse_id: string
  numero_estante: string  // Ej: "A1", "B2"
  coordenada_x: number
  coordenada_y: number
  altura: number          // 1-5
  lado: 'A' | 'B'
  capacidad_maxima: number
  tipo_producto: string
}
```

### `shelf_stock`
Stock en estantes específicos
```typescript
{
  shelf_id: string
  warehouse_id: string
  product_id: string
  cantidad: number
  cantidad_minima: number
  numero_estante: string
  coordenada_x: number
  coordenada_y: number
  altura: number
  lado: 'A' | 'B'
  requiere_reabastecimiento: boolean
}
```

## 🚀 Cómo Usar

### Cargar datos a Firebase

```bash
npm run upload-warehouse
```

Este comando:
1. Crea la bodega principal
2. Carga el warehouse stock (22 productos)
3. Crea los estantes (44 estantes: 11 filas × 2 lados × 2 alturas)
4. Carga el shelf stock (distribución en estantes)

### Datos Mock Incluidos

**Warehouse Stock:**
- 22 productos diferentes
- Cantidades realistas basadas en demanda
- Niveles mínimos y máximos configurados
- Ubicaciones por zona

**Shelf Stock:**
- 52 ubicaciones de productos en estantes
- Distribución lógica por tipo de producto
- Coordenadas X,Y para cada posición
- Alturas y lados especificados

## 🔄 Flujo de Inventario

### 1. Reorden al Proveedor
```
Warehouse Stock → cantidad_total <= cantidad_minima
→ requiere_reorden = true
→ Crear orden al proveedor
```

### 2. Reabastecimiento de Estantes
```
Shelf Stock → cantidad <= cantidad_minima
→ requiere_reabastecimiento = true
→ Mover desde Warehouse Stock al Shelf Stock
```

### 3. Picking de Órdenes
```
Orden de Aerolínea → Buscar en Shelf Stock
→ Reducir cantidad en estante
→ Si estante < mínimo: marcar para reabastecimiento
→ Reducir Warehouse Stock total
```

## 📈 Escalabilidad

El sistema está diseñado para escalar a múltiples bodegas:

1. **warehouse_id** en todas las tablas
2. Fácil agregar nuevas ubicaciones
3. Reportes por bodega
4. Transferencias entre bodegas

## 🎯 Próximos Pasos

1. **Dashboard de Inventario**: Visualizar stock en tiempo real
2. **Alertas automáticas**: Notificaciones de reorden/reabastecimiento
3. **Optimización de picking**: Rutas óptimas basadas en coordenadas
4. **Reportes**: Análisis de rotación de inventario
5. **Transferencias**: Movimientos entre estantes y bodegas

## 📝 Notas Importantes

- **Stock_actual eliminado de products**: El stock ahora está en tablas separadas
- **Coordenadas basadas en layout real**: X,Y corresponden a la disposición física
- **Dos niveles de control**: Almacén general + Estantes específicos
- **Preparado para múltiples bodegas**: Arquitectura escalable

