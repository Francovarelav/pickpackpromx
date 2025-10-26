/**
 * Datos mock de estantes y su inventario
 * Basado en el layout del almacén con coordenadas X,Y
 */

export interface ShelfRawData {
  numero_estante: string;
  coordenada_x: number;
  coordenada_y: number;
  altura: number;
  lado: 'A' | 'B';
  capacidad_maxima: number;
  capacidad_peso_kg: number;
  tipo_producto: 'bebidas' | 'snacks' | 'cafe' | 'alcohol' | 'mixto';
}

export interface ShelfStockRawData {
  numero_estante: string;
  coordenada_x: number;
  coordenada_y: number;
  altura: number;
  lado: 'A' | 'B';
  producto: string;
  marca: string;
  presentacion: string;
  cantidad: number;
  cantidad_minima: number;
}

// Definición de estantes (basado en la imagen - 11 filas de estantes)
export const shelvesData: ShelfRawData[] = [
  // Fila 1 - Zona A (Bebidas)
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  
  // Fila 2 - Zona A (Bebidas)
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'bebidas' },
  
  // Fila 3 - Zona B (Refrescos)
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  
  // Fila 4 - Zona B (Refrescos)
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 250, capacidad_peso_kg: 180, tipo_producto: 'bebidas' },
  
  // Fila 5 - Zona C (Agua)
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  
  // Fila 6 - Zona C (Agua)
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 300, capacidad_peso_kg: 200, tipo_producto: 'bebidas' },
  
  // Fila 7 - Zona D (Snacks)
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  
  // Fila 8 - Zona D (Snacks)
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 400, capacidad_peso_kg: 100, tipo_producto: 'snacks' },
  
  // Fila 9 - Zona E (Café)
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 150, capacidad_peso_kg: 80, tipo_producto: 'cafe' },
  
  // Fila 10 - Zona F (Alcohol)
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  
  // Fila 11 - Zona F (Alcohol)
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'A', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'B', capacidad_maxima: 200, capacidad_peso_kg: 150, tipo_producto: 'alcohol' },
];

// Stock en estantes (distribución del inventario)
export const shelfStockData: ShelfStockRawData[] = [
  // Estante A1 - Jugos Calahua
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'A', producto: "Jugo de agua", marca: "Calahua", presentacion: "330 ml", cantidad: 120, cantidad_minima: 30 },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'A', producto: "Jugo de agua", marca: "Calahua", presentacion: "330 ml", cantidad: 100, cantidad_minima: 30 },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 1, lado: 'B', producto: "Agua de coco", marca: "Calahua", presentacion: "330 ml", cantidad: 90, cantidad_minima: 25 },
  { numero_estante: "A1", coordenada_x: 1, coordenada_y: 1, altura: 2, lado: 'B', producto: "Agua de coco", marca: "Calahua", presentacion: "330 ml", cantidad: 80, cantidad_minima: 25 },
  
  // Estante A2 - Del Valle
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'A', producto: "Jugo del Valle de manzana", marca: "Del Valle", presentacion: "946 ml", cantidad: 60, cantidad_minima: 20 },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'A', producto: "Jugo del Valle de manzana", marca: "Del Valle", presentacion: "946 ml", cantidad: 50, cantidad_minima: 20 },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 1, lado: 'B', producto: "Jugo del Valle de naranja", marca: "Del Valle", presentacion: "946 ml", cantidad: 72, cantidad_minima: 20 },
  { numero_estante: "A2", coordenada_x: 2, coordenada_y: 1, altura: 2, lado: 'B', producto: "Jugo del Valle de naranja", marca: "Del Valle", presentacion: "946 ml", cantidad: 68, cantidad_minima: 20 },
  
  // Estante B1 - Coca-Cola 355ml
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'A', producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 240, cantidad_minima: 60 },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'A', producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 200, cantidad_minima: 60 },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 1, lado: 'B', producto: "Coca-Cola Cero", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 180, cantidad_minima: 50 },
  { numero_estante: "B1", coordenada_x: 3, coordenada_y: 1, altura: 2, lado: 'B', producto: "Coca-Cola Cero", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 160, cantidad_minima: 50 },
  
  // Estante B2 - Coca-Cola Light y Sprite
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'A', producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 150, cantidad_minima: 40 },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'A', producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "355 ml", cantidad: 140, cantidad_minima: 40 },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 1, lado: 'B', producto: "Sprite", marca: "Coca-Cola Company", presentacion: "355 ml", cantidad: 120, cantidad_minima: 35 },
  { numero_estante: "B2", coordenada_x: 4, coordenada_y: 1, altura: 2, lado: 'B', producto: "Sprite", marca: "Coca-Cola Company", presentacion: "355 ml", cantidad: 110, cantidad_minima: 35 },
  
  // Estante C1 - Agua Ciel 355ml
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'A', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 300, cantidad_minima: 80 },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'A', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 280, cantidad_minima: 80 },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 1, lado: 'B', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 260, cantidad_minima: 80 },
  { numero_estante: "C1", coordenada_x: 5, coordenada_y: 1, altura: 2, lado: 'B', producto: "Agua Ciel Mineralizada", marca: "Ciel", presentacion: "355 ml", cantidad: 240, cantidad_minima: 80 },
  
  // Estante C2 - Agua Ciel 1.5L
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'A', producto: "Agua Ciel", marca: "Ciel", presentacion: "1.5 litros", cantidad: 150, cantidad_minima: 40 },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'A', producto: "Agua Ciel", marca: "Ciel", presentacion: "1.5 litros", cantidad: 140, cantidad_minima: 40 },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 1, lado: 'B', producto: "Fresa Kiwi", marca: "Del Valle / Ciel", presentacion: "355 ml", cantidad: 105, cantidad_minima: 30 },
  { numero_estante: "C2", coordenada_x: 6, coordenada_y: 1, altura: 2, lado: 'B', producto: "Leche Light", marca: "Lala", presentacion: "1 litro", cantidad: 45, cantidad_minima: 15 },
  
  // Estante D1 - Galletas Gamesa
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'A', producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g", cantidad: 200, cantidad_minima: 60 },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'A', producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g", cantidad: 180, cantidad_minima: 60 },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 1, lado: 'B', producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g", cantidad: 180, cantidad_minima: 55 },
  { numero_estante: "D1", coordenada_x: 7, coordenada_y: 1, altura: 2, lado: 'B', producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g", cantidad: 160, cantidad_minima: 55 },
  
  // Estante D2 - Mixto
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'A', producto: "Canelitas Galletas", marca: "Gamesa", presentacion: "30 g", cantidad: 150, cantidad_minima: 50 },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'A', producto: "Principe Galletas", marca: "Gamesa", presentacion: "42 g", cantidad: 140, cantidad_minima: 50 },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 1, lado: 'B', producto: "Jugo de tomate", marca: "Jumex", presentacion: "960 ml", cantidad: 39, cantidad_minima: 15 },
  { numero_estante: "D2", coordenada_x: 8, coordenada_y: 1, altura: 2, lado: 'B', producto: "Coca-Cola Normal", marca: "Coca-Cola", presentacion: "1 litro", cantidad: 90, cantidad_minima: 25 },
  
  // Estante E1 - Café
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'A', producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete", cantidad: 30, cantidad_minima: 10 },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'A', producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete", cantidad: 28, cantidad_minima: 10 },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 1, lado: 'B', producto: "Cafe Punta del Cielo", marca: "Punta del Cielo", presentacion: "Paquete", cantidad: 25, cantidad_minima: 10 },
  { numero_estante: "E1", coordenada_x: 9, coordenada_y: 1, altura: 2, lado: 'B', producto: "Coca-Cola Light", marca: "Coca-Cola", presentacion: "1 litro", cantidad: 60, cantidad_minima: 20 },
  
  // Estante F1 - Cervezas Premium
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'A', producto: "Michelob Ultra", marca: "Michelob", presentacion: "355 ml", cantidad: 72, cantidad_minima: 24 },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'A', producto: "Michelob Ultra", marca: "Michelob", presentacion: "355 ml", cantidad: 68, cantidad_minima: 24 },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 1, lado: 'B', producto: "Heineken Original", marca: "Heineken", presentacion: "355 ml", cantidad: 90, cantidad_minima: 30 },
  { numero_estante: "F1", coordenada_x: 10, coordenada_y: 1, altura: 2, lado: 'B', producto: "Heineken Original", marca: "Heineken", presentacion: "355 ml", cantidad: 85, cantidad_minima: 30 },
  
  // Estante F2 - Cervezas Populares
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'A', producto: "Modelo Especial", marca: "Modelo", presentacion: "355 ml", cantidad: 120, cantidad_minima: 40 },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'A', producto: "Modelo Especial", marca: "Modelo", presentacion: "355 ml", cantidad: 110, cantidad_minima: 40 },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 1, lado: 'B', producto: "Corona Extra", marca: "Corona", presentacion: "355 ml", cantidad: 108, cantidad_minima: 36 },
  { numero_estante: "F2", coordenada_x: 11, coordenada_y: 1, altura: 2, lado: 'B', producto: "Corona Extra", marca: "Corona", presentacion: "355 ml", cantidad: 100, cantidad_minima: 36 },
];

