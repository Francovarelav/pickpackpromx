// Tipos para gestión de botellas de alcohol

export interface AlcoholBottle {
  id: string;
  
  // Información básica del producto
  nombre: string;
  marca: string;
  tipo: string; // Vodka, Whisky, Ron, Tequila, Ginebra, etc.
  volumen_ml: number;
  precio_unitario: number;
  contenido_alcohol_porcentaje: number;
  
  // Información de peso para cálculo de nivel
  peso_botella_vacia_gramos?: number; // Peso de la botella vacía
  peso_botella_llena_gramos?: number; // Peso de la botella llena
  densidad_liquido_g_ml?: number; // Densidad del líquido (g/ml)
  
  // Información de tracking de la botella
  nivel_actual: number; // Porcentaje de líquido restante (0-100)
  estado: BottleStatus;
  puede_completarse: boolean; // Si está entre 25% y 50%
  botella_complementaria_id: string | null; // ID de la botella con la que se completó
  vuelo_asignado: string | null; // Número de vuelo asignado
  
  // Metadata
  fecha_registro: string;
  fecha_ultima_actualizacion: string;
  numero_vuelos_usados: number;
  
  // Datos originales del Excel (preservados)
  datos_originales?: any;
}

export type BottleStatus = 
  | 'disponible'      // Disponible para ser asignada a un vuelo
  | 'en_vuelo'        // Actualmente en un vuelo
  | 'procesando'      // Siendo procesada por la báscula y cámara
  | 'completada'      // Completada con otra botella
  | 'descartada';     // Nivel menor a 25%, debe ser descartada

export interface BottleAction {
  action: 'reutilizar' | 'completar' | 'descartar';
  nivel_detectado: number;
  peso_detectado?: number;
  botella_id: string;
  timestamp: string;
}

export interface FlightBottleAssignment {
  vuelo_numero: string;
  fecha_vuelo: string;
  botellas_requeridas: number;
  botellas_asignadas: AlcoholBottle[];
  botellas_completadas: Array<{
    botella_1_id: string;
    botella_2_id: string;
    nivel_combinado: number;
  }>;
}

// Reglas de negocio
export const BOTTLE_RULES = {
  // Si la botella tiene más del 50% se reutiliza directamente
  REUSE_THRESHOLD: 50,
  
  // Si la botella está entre 25% y 50% puede completarse con otra
  MIN_COMPLETION_THRESHOLD: 25,
  MAX_COMPLETION_THRESHOLD: 50,
  
  // Si la botella está por debajo del 25% se descarta
  DISCARD_THRESHOLD: 25,
} as const;

// Helper functions
export function getBottleAction(nivelActual: number): BottleAction['action'] {
  if (nivelActual > BOTTLE_RULES.REUSE_THRESHOLD) {
    return 'reutilizar';
  } else if (nivelActual >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD && 
             nivelActual <= BOTTLE_RULES.MAX_COMPLETION_THRESHOLD) {
    return 'completar';
  } else {
    return 'descartar';
  }
}

export function canBottlesBeCompleted(nivel1: number, nivel2: number): boolean {
  const total = nivel1 + nivel2;
  // Dos botellas pueden completarse si juntas suman más del 50%
  return total >= BOTTLE_RULES.REUSE_THRESHOLD;
}

export function getBottleStatusColor(estado: BottleStatus): string {
  switch (estado) {
    case 'disponible':
      return 'green';
    case 'en_vuelo':
      return 'blue';
    case 'procesando':
      return 'yellow';
    case 'completada':
      return 'purple';
    case 'descartada':
      return 'red';
    default:
      return 'gray';
  }
}

export function getBottleStatusLabel(estado: BottleStatus): string {
  switch (estado) {
    case 'disponible':
      return 'Disponible';
    case 'en_vuelo':
      return 'En Vuelo';
    case 'procesando':
      return 'Procesando';
    case 'completada':
      return 'Completada';
    case 'descartada':
      return 'Descartada';
    default:
      return 'Desconocido';
  }
}

// Calcular porcentaje de líquido restante basado en peso
export function calculateLiquidPercentage(
  pesoActual: number,
  pesoVacio: number,
  pesoLleno: number
): number {
  if (!pesoActual || !pesoVacio || !pesoLleno) return 0;
  
  const pesoLiquidoLleno = pesoLleno - pesoVacio;
  const pesoLiquidoActual = pesoActual - pesoVacio;
  
  // Si el peso actual es menor al peso vacío, hay error
  if (pesoLiquidoActual < 0) return 0;
  
  const porcentaje = (pesoLiquidoActual / pesoLiquidoLleno) * 100;
  
  // Limitar entre 0 y 100
  return Math.max(0, Math.min(100, Math.round(porcentaje)));
}

// Calcular ml restantes basado en peso
export function calculateRemainingML(
  pesoActual: number,
  pesoVacio: number,
  densidadLiquido: number = 0.94 // Densidad por defecto (g/ml) para alcohol ~40%
): number {
  if (!pesoActual || !pesoVacio) return 0;
  
  const pesoLiquidoActual = pesoActual - pesoVacio;
  
  if (pesoLiquidoActual <= 0) return 0;
  
  // Volumen = masa / densidad
  const volumenML = pesoLiquidoActual / densidadLiquido;
  
  return Math.max(0, Math.round(volumenML));
}

// Obtener densidad estándar por tipo de licor (g/ml)
export function getDensityByLiquorType(tipo: string): number {
  const tipoLower = tipo.toLowerCase();
  
  // Densidades aproximadas a 20°C
  if (tipoLower.includes('vodka')) return 0.94;
  if (tipoLower.includes('whiskey') || tipoLower.includes('whisky')) return 0.95;
  if (tipoLower.includes('rum') || tipoLower.includes('ron')) return 0.94;
  if (tipoLower.includes('tequila')) return 0.95;
  if (tipoLower.includes('gin') || tipoLower.includes('ginebra')) return 0.94;
  if (tipoLower.includes('brandy') || tipoLower.includes('cognac')) return 0.96;
  if (tipoLower.includes('liqueur') || tipoLower.includes('licor')) return 1.05; // Más densos por azúcar
  if (tipoLower.includes('wine') || tipoLower.includes('vino')) return 0.99;
  if (tipoLower.includes('champagne') || tipoLower.includes('sparkling')) return 0.99;
  if (tipoLower.includes('beer') || tipoLower.includes('cerveza')) return 1.01;
  
  // Por defecto: alcohol 40%
  return 0.94;
}

// Obtener pesos estándar por volumen y tipo
export function getStandardWeights(volumenML: number, tipo: string): {
  pesoVacio: number;
  pesoLleno: number;
  densidad: number;
} {
  const densidad = getDensityByLiquorType(tipo);
  
  // Peso de botella vacía según volumen (vidrio estándar)
  // 750ml: ~450-500g, 1000ml: ~550-600g, 50ml (miniatura): ~50-60g
  let pesoVacio = 0;
  
  if (volumenML <= 100) {
    pesoVacio = 50; // Miniaturas
  } else if (volumenML <= 375) {
    pesoVacio = 250; // Media botella
  } else if (volumenML <= 750) {
    pesoVacio = 475; // Botella estándar 750ml
  } else if (volumenML <= 1000) {
    pesoVacio = 550; // Litro
  } else {
    pesoVacio = 700; // Botellas grandes
  }
  
  // Peso del líquido
  const pesoLiquido = volumenML * densidad;
  
  // Peso total lleno
  const pesoLleno = pesoVacio + pesoLiquido;
  
  return {
    pesoVacio: Math.round(pesoVacio),
    pesoLleno: Math.round(pesoLleno),
    densidad
  };
}

