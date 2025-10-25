/**
 * Servicio para buscar ubicaciones de productos en estantes
 * Utiliza los datos reales de stock y ubicación
 */

import { shelfStockData, type ShelfStockRawData } from '@/warehouse/shelf-stock-data'
import type { OrderItem } from '@/types/order-types'

export interface ProductShelfLocation {
  numero_estante: string
  coordenada_x: number
  coordenada_y: number
  altura: number
  lado: 'A' | 'B'
  cantidad_disponible: number
  cantidad_minima: number
  ubicacion_completa: string
}

export interface ProductWithShelfLocation extends OrderItem {
  shelf_locations: ProductShelfLocation[]
  total_available: number
  is_available: boolean
}

/**
 * Busca la ubicación de un producto específico en los estantes
 */
export function findProductShelfLocation(
  producto: string, 
  marca: string, 
  presentacion: string
): ProductShelfLocation[] {
  const locations: ProductShelfLocation[] = []
  
  // Buscar coincidencias exactas primero
  const exactMatches = shelfStockData.filter(stock => 
    stock.producto.toLowerCase() === producto.toLowerCase() &&
    stock.marca.toLowerCase() === marca.toLowerCase() &&
    stock.presentacion.toLowerCase() === presentacion.toLowerCase()
  )
  
  if (exactMatches.length > 0) {
    return exactMatches.map(match => ({
      numero_estante: match.numero_estante,
      coordenada_x: match.coordenada_x,
      coordenada_y: match.coordenada_y,
      altura: match.altura,
      lado: match.lado,
      cantidad_disponible: match.cantidad,
      cantidad_minima: match.cantidad_minima,
      ubicacion_completa: `${match.numero_estante}-${match.lado}${match.altura}`
    }))
  }
  
  // Buscar coincidencias parciales por producto y marca
  const partialMatches = shelfStockData.filter(stock => 
    stock.producto.toLowerCase().includes(producto.toLowerCase()) &&
    stock.marca.toLowerCase().includes(marca.toLowerCase())
  )
  
  if (partialMatches.length > 0) {
    return partialMatches.map(match => ({
      numero_estante: match.numero_estante,
      coordenada_x: match.coordenada_x,
      coordenada_y: match.coordenada_y,
      altura: match.altura,
      lado: match.lado,
      cantidad_disponible: match.cantidad,
      cantidad_minima: match.cantidad_minima,
      ubicacion_completa: `${match.numero_estante}-${match.lado}${match.altura}`
    }))
  }
  
  // Buscar solo por producto si no hay coincidencias
  const productMatches = shelfStockData.filter(stock => 
    stock.producto.toLowerCase().includes(producto.toLowerCase())
  )
  
  return productMatches.map(match => ({
    numero_estante: match.numero_estante,
    coordenada_x: match.coordenada_x,
    coordenada_y: match.coordenada_y,
    altura: match.altura,
    lado: match.lado,
    cantidad_disponible: match.cantidad,
    cantidad_minima: match.cantidad_minima,
    ubicacion_completa: `${match.numero_estante}-${match.lado}${match.altura}`
  }))
}

/**
 * Enriquece los items de una orden con información de ubicación en estantes
 */
export function enrichOrderItemsWithShelfLocations(orderItems: OrderItem[]): ProductWithShelfLocation[] {
  return orderItems.map(item => {
    const shelfLocations = findProductShelfLocation(item.producto, item.marca, item.presentacion)
    const totalAvailable = shelfLocations.reduce((sum, loc) => sum + loc.cantidad_disponible, 0)
    
    return {
      ...item,
      shelf_locations: shelfLocations,
      total_available: totalAvailable,
      is_available: totalAvailable >= item.cantidad
    }
  })
}

/**
 * Obtiene un resumen de disponibilidad de productos
 */
export function getAvailabilitySummary(products: ProductWithShelfLocation[]) {
  const totalProducts = products.length
  const availableProducts = products.filter(p => p.is_available).length
  const unavailableProducts = products.filter(p => !p.is_available)
  
  return {
    totalProducts,
    availableProducts,
    unavailableProducts: unavailableProducts.length,
    unavailableList: unavailableProducts.map(p => ({
      producto: p.producto,
      marca: p.marca,
      presentacion: p.presentacion,
      cantidad_solicitada: p.cantidad,
      cantidad_disponible: p.total_available
    }))
  }
}

/**
 * Genera una lista de estantes únicos que contienen productos de la orden
 */
export function getUniqueShelvesForOrder(products: ProductWithShelfLocation[]): string[] {
  const shelves = new Set<string>()
  
  products.forEach(product => {
    product.shelf_locations.forEach(location => {
      shelves.add(location.numero_estante)
    })
  })
  
  return Array.from(shelves).sort()
}

/**
 * Obtiene estadísticas de stock por zona
 */
export function getStockStatsByZone(products: ProductWithShelfLocation[]) {
  const zoneStats: Record<string, { total: number, available: number, shelves: string[] }> = {}
  
  products.forEach(product => {
    product.shelf_locations.forEach(location => {
      const zone = location.numero_estante.charAt(0) // A, B, C, D, E, F
      if (!zoneStats[zone]) {
        zoneStats[zone] = { total: 0, available: 0, shelves: [] }
      }
      
      zoneStats[zone].total += product.cantidad
      zoneStats[zone].available += location.cantidad_disponible
      if (!zoneStats[zone].shelves.includes(location.numero_estante)) {
        zoneStats[zone].shelves.push(location.numero_estante)
      }
    })
  })
  
  return zoneStats
}
