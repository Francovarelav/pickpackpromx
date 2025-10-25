/**
 * Datos mock de stock del almacén principal
 * Stock general disponible en la bodega
 */

export interface WarehouseStockRawData {
  producto: string;
  marca: string;
  presentacion: string;
  cantidad_total: number;
  cantidad_minima: number;
  cantidad_maxima: number;
  ubicacion_principal: string;
}

export const warehouseStockData: WarehouseStockRawData[] = [
  // Bebidas Calahua
  {
    producto: "Jugo de agua",
    marca: "Calahua",
    presentacion: "330 ml",
    cantidad_total: 480,
    cantidad_minima: 100,
    cantidad_maxima: 1000,
    ubicacion_principal: "Zona A - Bebidas"
  },
  {
    producto: "Agua de coco",
    marca: "Calahua",
    presentacion: "330 ml",
    cantidad_total: 360,
    cantidad_minima: 80,
    cantidad_maxima: 800,
    ubicacion_principal: "Zona A - Bebidas"
  },
  
  // Del Valle
  {
    producto: "Jugo del Valle de manzana",
    marca: "Del Valle",
    presentacion: "946 ml",
    cantidad_total: 240,
    cantidad_minima: 60,
    cantidad_maxima: 500,
    ubicacion_principal: "Zona A - Bebidas"
  },
  {
    producto: "Jugo del Valle de naranja",
    marca: "Del Valle",
    presentacion: "946 ml",
    cantidad_total: 288,
    cantidad_minima: 60,
    cantidad_maxima: 500,
    ubicacion_principal: "Zona A - Bebidas"
  },
  {
    producto: "Fresa Kiwi",
    marca: "Del Valle / Ciel",
    presentacion: "355 ml",
    cantidad_total: 420,
    cantidad_minima: 100,
    cantidad_maxima: 800,
    ubicacion_principal: "Zona A - Bebidas"
  },
  
  // Lala
  {
    producto: "Leche Light",
    marca: "Lala",
    presentacion: "1 litro",
    cantidad_total: 180,
    cantidad_minima: 50,
    cantidad_maxima: 400,
    ubicacion_principal: "Zona A - Lácteos"
  },
  
  // Jumex
  {
    producto: "Jugo de tomate",
    marca: "Jumex",
    presentacion: "960 ml",
    cantidad_total: 156,
    cantidad_minima: 40,
    cantidad_maxima: 350,
    ubicacion_principal: "Zona A - Bebidas"
  },
  
  // Coca-Cola
  {
    producto: "Coca-Cola Normal",
    marca: "Coca-Cola",
    presentacion: "355 ml",
    cantidad_total: 960,
    cantidad_minima: 200,
    cantidad_maxima: 2000,
    ubicacion_principal: "Zona B - Refrescos"
  },
  {
    producto: "Coca-Cola Normal",
    marca: "Coca-Cola",
    presentacion: "1 litro",
    cantidad_total: 360,
    cantidad_minima: 80,
    cantidad_maxima: 800,
    ubicacion_principal: "Zona B - Refrescos"
  },
  {
    producto: "Coca-Cola Cero",
    marca: "Coca-Cola",
    presentacion: "355 ml",
    cantidad_total: 720,
    cantidad_minima: 150,
    cantidad_maxima: 1500,
    ubicacion_principal: "Zona B - Refrescos"
  },
  {
    producto: "Coca-Cola Light",
    marca: "Coca-Cola",
    presentacion: "355 ml",
    cantidad_total: 600,
    cantidad_minima: 120,
    cantidad_maxima: 1200,
    ubicacion_principal: "Zona B - Refrescos"
  },
  {
    producto: "Coca-Cola Light",
    marca: "Coca-Cola",
    presentacion: "1 litro",
    cantidad_total: 240,
    cantidad_minima: 60,
    cantidad_maxima: 600,
    ubicacion_principal: "Zona B - Refrescos"
  },
  {
    producto: "Sprite",
    marca: "Coca-Cola Company",
    presentacion: "355 ml",
    cantidad_total: 480,
    cantidad_minima: 100,
    cantidad_maxima: 1000,
    ubicacion_principal: "Zona B - Refrescos"
  },
  
  // Ciel
  {
    producto: "Agua Ciel Mineralizada",
    marca: "Ciel",
    presentacion: "355 ml",
    cantidad_total: 1200,
    cantidad_minima: 300,
    cantidad_maxima: 2500,
    ubicacion_principal: "Zona C - Agua"
  },
  {
    producto: "Agua Ciel",
    marca: "Ciel",
    presentacion: "1.5 litros",
    cantidad_total: 600,
    cantidad_minima: 150,
    cantidad_maxima: 1200,
    ubicacion_principal: "Zona C - Agua"
  },
  
  // Snacks Gamesa
  {
    producto: "Canelitas Galletas",
    marca: "Gamesa",
    presentacion: "30 g",
    cantidad_total: 800,
    cantidad_minima: 200,
    cantidad_maxima: 1500,
    ubicacion_principal: "Zona D - Snacks"
  },
  {
    producto: "Principe Galletas",
    marca: "Gamesa",
    presentacion: "42 g",
    cantidad_total: 720,
    cantidad_minima: 180,
    cantidad_maxima: 1400,
    ubicacion_principal: "Zona D - Snacks"
  },
  
  // Café
  {
    producto: "Cafe Punta del Cielo",
    marca: "Punta del Cielo",
    presentacion: "Paquete",
    cantidad_total: 120,
    cantidad_minima: 30,
    cantidad_maxima: 250,
    ubicacion_principal: "Zona E - Café"
  },
  
  // Cervezas
  {
    producto: "Michelob Ultra",
    marca: "Michelob",
    presentacion: "355 ml",
    cantidad_total: 288,
    cantidad_minima: 72,
    cantidad_maxima: 600,
    ubicacion_principal: "Zona F - Alcohol"
  },
  {
    producto: "Heineken Original",
    marca: "Heineken",
    presentacion: "355 ml",
    cantidad_total: 360,
    cantidad_minima: 96,
    cantidad_maxima: 720,
    ubicacion_principal: "Zona F - Alcohol"
  },
  {
    producto: "Modelo Especial",
    marca: "Modelo",
    presentacion: "355 ml",
    cantidad_total: 480,
    cantidad_minima: 120,
    cantidad_maxima: 960,
    ubicacion_principal: "Zona F - Alcohol"
  },
  {
    producto: "Corona Extra",
    marca: "Corona",
    presentacion: "355 ml",
    cantidad_total: 432,
    cantidad_minima: 108,
    cantidad_maxima: 864,
    ubicacion_principal: "Zona F - Alcohol"
  }
];

