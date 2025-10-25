# 👀 Vista Previa de los Datos en Firebase

Este documento muestra cómo se verán los datos una vez cargados en Firestore.

---

## 📊 Colección: `suppliers`

### Ejemplo 1: Coca-Cola
```json
{
  "id": "coca-cola",
  "marca": "Coca-Cola",
  "dueno_proveedor_principal": "The Coca-Cola Company",
  "pais_grupo_corporativo": "Estados Unidos",
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

### Ejemplo 2: Grupo Lala
```json
{
  "id": "lala",
  "marca": "Lala",
  "dueno_proveedor_principal": "Grupo Lala S.A.B. de C.V.",
  "pais_grupo_corporativo": "México",
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

### Ejemplo 3: Heineken
```json
{
  "id": "heineken",
  "marca": "Heineken",
  "dueno_proveedor_principal": "Heineken N.V.",
  "pais_grupo_corporativo": "Países Bajos",
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

**Total de proveedores**: 14

---

## 📦 Colección: `products`

### Bebidas No Alcohólicas

#### Coca-Cola Normal 355ml
```json
{
  "id": "coca-cola-normal-355-ml",
  "producto": "Coca-Cola Normal",
  "marca": "Coca-Cola",
  "presentacion": "355 ml",
  "restock_quantity": 36,
  "leadtime_days": 3,
  "supplier_id": "coca-cola",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

#### Agua Ciel 1.5L
```json
{
  "id": "agua-ciel-1-5-litros",
  "producto": "Agua Ciel",
  "marca": "Ciel",
  "presentacion": "1.5 litros",
  "restock_quantity": 24,
  "leadtime_days": 3,
  "supplier_id": "ciel",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

#### Jugo del Valle de Naranja
```json
{
  "id": "jugo-del-valle-de-naranja-946-ml",
  "producto": "Jugo del Valle de naranja",
  "marca": "Del Valle",
  "presentacion": "946 ml",
  "restock_quantity": 24,
  "leadtime_days": 5,
  "supplier_id": "del-valle",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

### Lácteos

#### Leche Light Lala
```json
{
  "id": "leche-light-1-litro",
  "producto": "Leche Light",
  "marca": "Lala",
  "presentacion": "1 litro",
  "restock_quantity": 12,
  "leadtime_days": 2,
  "supplier_id": "lala",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

### Snacks

#### Canelitas Galletas
```json
{
  "id": "canelitas-galletas-30-g",
  "producto": "Canelitas Galletas",
  "marca": "Gamesa",
  "presentacion": "30 g",
  "restock_quantity": 30,
  "leadtime_days": 7,
  "supplier_id": "gamesa",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

### Bebidas Alcohólicas

#### Corona Extra
```json
{
  "id": "corona-extra-355-ml",
  "producto": "Corona Extra",
  "marca": "Corona",
  "presentacion": "355 ml",
  "restock_quantity": 48,
  "leadtime_days": 7,
  "supplier_id": "corona",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

#### Modelo Especial
```json
{
  "id": "modelo-especial-355-ml",
  "producto": "Modelo Especial",
  "marca": "Modelo",
  "presentacion": "355 ml",
  "restock_quantity": 48,
  "leadtime_days": 7,
  "supplier_id": "modelo",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

#### Heineken Original
```json
{
  "id": "heineken-original-355-ml",
  "producto": "Heineken Original",
  "marca": "Heineken",
  "presentacion": "355 ml",
  "restock_quantity": 48,
  "leadtime_days": 7,
  "supplier_id": "heineken",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

### Café

#### Café Punta del Cielo
```json
{
  "id": "cafe-punta-del-cielo-paquete",
  "producto": "Cafe Punta del Cielo",
  "marca": "Punta del Cielo",
  "presentacion": "Paquete",
  "restock_quantity": 10,
  "leadtime_days": 5,
  "supplier_id": "punta-del-cielo",
  "stock_actual": 0,
  "precio_unitario": 0,
  "created_at": "2025-10-25T08:00:00.000Z",
  "updated_at": "2025-10-25T08:00:00.000Z"
}
```

**Total de productos**: 22

---

## 📈 Resumen de Datos

### Por Categoría

| Categoría | Cantidad | Restock Promedio | Leadtime Promedio |
|-----------|----------|------------------|-------------------|
| 🥤 Refrescos | 7 | 32 unidades | 3 días |
| 🧃 Jugos | 5 | 24 unidades | 5 días |
| 💧 Agua | 2 | 30 unidades | 3 días |
| 🍺 Cervezas | 4 | 48 unidades | 7 días |
| 🥛 Lácteos | 1 | 12 unidades | 2 días |
| 🍪 Galletas | 2 | 30 unidades | 7 días |
| ☕ Café | 1 | 10 unidades | 5 días |

### Por Proveedor

| Proveedor | Productos | País |
|-----------|-----------|------|
| Coca-Cola | 6 | Estados Unidos |
| Del Valle | 3 | Estados Unidos / México |
| Calahua | 2 | México |
| Ciel | 2 | Estados Unidos / México |
| Gamesa | 2 | Estados Unidos |
| Modelo | 1 | Bélgica / México |
| Corona | 1 | Bélgica / México |
| Heineken | 1 | Países Bajos |
| Michelob | 1 | Bélgica / México |
| Lala | 1 | México |
| Jumex | 1 | México |
| Punta del Cielo | 1 | México |

---

## 🔗 Relaciones en la Base de Datos

### Ejemplo de Consulta con Relación

Para obtener un producto con su información de proveedor:

```typescript
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

async function getProductWithSupplier(productId: string) {
  // Obtener producto
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  
  if (!productSnap.exists()) {
    throw new Error('Producto no encontrado');
  }
  
  const productData = productSnap.data();
  
  // Obtener proveedor
  const suppliersRef = collection(db, 'suppliers');
  const q = query(suppliersRef, where('id', '==', productData.supplier_id));
  const supplierSnap = await getDocs(q);
  
  const supplierData = supplierSnap.docs[0]?.data();
  
  return {
    product: {
      id: productSnap.id,
      ...productData
    },
    supplier: supplierData ? {
      id: supplierSnap.docs[0].id,
      ...supplierData
    } : null
  };
}

// Uso
const result = await getProductWithSupplier('coca-cola-normal-355-ml');
console.log(result);
// {
//   product: { producto: "Coca-Cola Normal", marca: "Coca-Cola", ... },
//   supplier: { marca: "Coca-Cola", dueno_proveedor_principal: "The Coca-Cola Company", ... }
// }
```

---

## 🎨 Visualización de Datos

### Estructura de Árbol

```
Firestore Database
│
├── suppliers/ (14 documentos)
│   ├── coca-cola
│   ├── del-valle
│   ├── lala
│   ├── jumex
│   ├── ciel
│   ├── gamesa
│   ├── punta-del-cielo
│   ├── michelob
│   ├── heineken
│   ├── modelo
│   ├── corona
│   └── ...
│
└── products/ (22 documentos)
    ├── coca-cola-normal-355-ml
    ├── coca-cola-normal-1-litro
    ├── coca-cola-cero-355-ml
    ├── coca-cola-light-355-ml
    ├── agua-ciel-1-5-litros
    ├── leche-light-1-litro
    ├── corona-extra-355-ml
    ├── modelo-especial-355-ml
    └── ...
```

---

## 💡 Tips para Consultas Eficientes

### 1. Consultar por Marca
```typescript
const q = query(
  collection(db, 'products'),
  where('marca', '==', 'Coca-Cola')
);
```

### 2. Productos con Stock Bajo
```typescript
const q = query(
  collection(db, 'products'),
  where('stock_actual', '<', 10)
);
```

### 3. Productos de un Proveedor
```typescript
const q = query(
  collection(db, 'products'),
  where('supplier_id', '==', 'coca-cola')
);
```

### 4. Productos por Leadtime
```typescript
const q = query(
  collection(db, 'products'),
  where('leadtime_days', '<=', 3)
);
```

---

## 📊 Estadísticas de los Datos

- **Total de proveedores**: 14
- **Total de productos**: 22
- **Países representados**: 5 (México, Estados Unidos, Bélgica, Países Bajos, Internacional)
- **Categorías de productos**: 7
- **Rango de restock**: 10-48 unidades
- **Rango de leadtime**: 2-7 días
- **Productos con presentación en ml**: 18
- **Productos con presentación en litros**: 3
- **Productos con presentación en gramos**: 2

---

**Vista previa generada para PickPackPro MX** 📦

