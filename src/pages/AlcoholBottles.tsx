import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Wine, BarChart3, AlertCircle, Zap, CheckCircle2, Trash2 } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import type { 
  AlcoholBottle
} from '@/types/alcohol-bottles';
import { 
  BOTTLE_RULES,
  calculateLiquidPercentage,
  calculateRemainingML
} from '@/types/alcohol-bottles';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DetectedBottle {
  label: string;
  brand?: string;
  productName?: string;
  type?: string;
  volume?: string;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  matchedProduct?: AlcoholBottle | null;
  matchScore?: number;
  // Información de peso de la báscula
  pesoDetectado?: number; // Peso en gramos detectado por la báscula
  porcentajeLiquido?: number; // Porcentaje calculado (0-100)
  mlRestantes?: number; // ML restantes calculados
}

export default function AlcoholBottles() {
  // Catálogo de referencia de botellas
  const [bottleCatalog, setBottleCatalog] = useState<AlcoholBottle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado de la cámara
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Estado de detección
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedBottles, setDetectedBottles] = useState<DetectedBottle[]>([]);
  const detectionIntervalRef = useRef<number | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [nextRetryTime, setNextRetryTime] = useState<Date | null>(null);
  const lastRequestTime = useRef<number>(0);
  
  // Historial de botellas encontradas
  const [foundBottles, setFoundBottles] = useState<DetectedBottle[]>([]);
  
  // Estadísticas del día
  const [stats, setStats] = useState({
    procesadas: 0,
    reutilizadas: 0,
    completadas: 0,
    descartadas: 0
  });

  // Cargar catálogo de referencia desde Firebase
  useEffect(() => {
    loadBottleCatalog();
  }, []);

  const loadBottleCatalog = async () => {
    try {
      console.log('🔥 Loading bottle catalog...');
      const bottlesRef = collection(db, 'alcohol_bottles');
      const querySnapshot = await getDocs(bottlesRef);
      
      if (querySnapshot.empty) {
        console.log('⚠️ No bottles in catalog');
        setBottleCatalog([]);
        return;
      }
      
      const catalogData: AlcoholBottle[] = [];
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        catalogData.push({
          id: doc.id,
          nombre: data.nombre || data.type_id || '',
          marca: data.marca || '',
          tipo: data.tipo || '',
          volumen_ml: data.volumen_ml || 0,
          precio_unitario: data.precio_unitario || 0,
          contenido_alcohol_porcentaje: data.contenido_alcohol_porcentaje || 0,
          // Campos de peso para cálculo
          peso_botella_vacia_gramos: data.peso_botella_vacia_gramos,
          peso_botella_llena_gramos: data.peso_botella_llena_gramos,
          densidad_liquido_g_ml: data.densidad_liquido_g_ml,
          nivel_actual: 100,
          estado: 'disponible',
          puede_completarse: false,
          botella_complementaria_id: null,
          vuelo_asignado: null,
          fecha_registro: data.fecha_registro || new Date().toISOString(),
          fecha_ultima_actualizacion: data.fecha_ultima_actualizacion || new Date().toISOString(),
          numero_vuelos_usados: 0,
          datos_originales: data.datos_originales || null
        });
      });
      
      console.log('✅ Catalog loaded:', catalogData.length, 'bottle types');
      // Log de una muestra para verificar datos de peso
      if (catalogData.length > 0) {
        console.log('📋 Sample bottle with weight data:', {
          nombre: catalogData[0].nombre,
          peso_vacio: catalogData[0].peso_botella_vacia_gramos,
          peso_lleno: catalogData[0].peso_botella_llena_gramos,
          densidad: catalogData[0].densidad_liquido_g_ml
        });
      }
      setBottleCatalog(catalogData);
    } catch (error) {
      console.error('❌ Error loading catalog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Activar cámara
  const startCamera = async () => {
    try {
      console.log('📷 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('✅ Camera stream obtained');
      streamRef.current = stream;
      
      // Activar el estado primero para que el video se renderice
      setIsCameraActive(true);
      
      // Esperar un momento para que el DOM se actualice
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play()
            .then(() => {
              console.log('✅ Video playing successfully');
              // Iniciar detección automáticamente
              startDetection();
            })
            .catch((error) => {
              console.error('Error playing video:', error);
            });
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error starting camera:', error);
      alert('No se pudo acceder a la cámara. Por favor verifica los permisos.');
    }
  };

  // Iniciar detección con Gemini
  const startDetection = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setGeminiError('⚠️ API Key de Gemini no configurada. Agrega VITE_GEMINI_API_KEY al archivo .env');
      return;
    }

    setIsDetecting(true);
    setGeminiError(null);
    setIsRateLimited(false);
    console.log('🔍 Iniciando detección con Gemini...');
    console.log('⚠️ Límite gratuito: 10 requests/minuto. Detectando cada 6 segundos.');
    
    // Detectar cada 6 segundos para mantenerse bajo el límite (10 por minuto)
    detectionIntervalRef.current = window.setInterval(() => {
      detectBottlesWithGemini();
    }, 6000);
    
    // Primera detección inmediata
    detectBottlesWithGemini();
  };

  // Detener detección
  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    setDetectedBottles([]);
    setIsRateLimited(false);
    setNextRetryTime(null);
    
    // Limpiar canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    console.log('🔍 Detección detenida');
  };

  // Capturar frame del video como base64
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== 4) return null;
    
    // Configurar canvas para captura
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Dibujar el frame del video en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a base64
    return canvas.toDataURL('image/jpeg', 0.7); // Calidad 70% para reducir tamaño
  };

  // Función para hacer matching con la base de datos
  const matchBottleWithDatabase = (
    detectedLabel: string,
    detectedBrand?: string,
    detectedProductName?: string,
    detectedType?: string
  ): { product: AlcoholBottle | null; score: number } => {
    if (bottleCatalog.length === 0) {
      return { product: null, score: 0 };
    }

    // Normalizar todos los campos detectados
    const normalizedLabel = detectedLabel.toLowerCase().trim();
    const normalizedBrand = (detectedBrand || '').toLowerCase().trim();
    const normalizedProductName = (detectedProductName || '').toLowerCase().trim();
    const normalizedType = (detectedType || '').toLowerCase().trim();
    
    // Extraer palabras clave de todos los campos
    const allText = `${normalizedLabel} ${normalizedBrand} ${normalizedProductName} ${normalizedType}`;
    const keywords = allText.split(' ').filter(word => 
      word.length > 2 && 
      !['botella', 'bottle', 'de', 'the', 'of', 'and', 'y'].includes(word)
    );

    let bestMatch: AlcoholBottle | null = null;
    let bestScore = 0;

    // Buscar en el catálogo
    bottleCatalog.forEach(product => {
      let score = 0;
      
      const productName = (product.nombre || '').toLowerCase();
      const productBrand = (product.marca || '').toLowerCase();
      const productType = (product.tipo || '').toLowerCase();

      // COINCIDENCIA DE MARCA (peso muy alto)
      if (normalizedBrand && productBrand) {
        if (productBrand === normalizedBrand) {
          score += 150; // Match exacto
        } else if (productBrand.includes(normalizedBrand) || normalizedBrand.includes(productBrand)) {
          score += 100; // Match parcial
        }
        // Buscar palabras de la marca en común
        const brandWords = normalizedBrand.split(' ');
        brandWords.forEach(word => {
          if (word.length > 2 && productBrand.includes(word)) score += 40;
        });
      }

      // COINCIDENCIA DE NOMBRE DE PRODUCTO
      if (normalizedProductName && productName) {
        if (productName.includes(normalizedProductName) || normalizedProductName.includes(productName)) {
          score += 80;
        }
        // Buscar palabras del nombre en común
        const nameWords = normalizedProductName.split(' ');
        nameWords.forEach(word => {
          if (word.length > 2 && productName.includes(word)) score += 30;
        });
      }

      // COINCIDENCIA DE TIPO
      if (normalizedType && productType) {
        if (productType.includes(normalizedType) || normalizedType.includes(productType)) {
          score += 50;
        }
      }

      // COINCIDENCIA EN LABEL COMPLETO
      if (productName.includes(normalizedLabel) || normalizedLabel.includes(productName)) {
        score += 60;
      }
      if (productBrand.includes(normalizedLabel) || normalizedLabel.includes(productBrand)) {
        score += 60;
      }

      // Match por keywords generales
      keywords.forEach(keyword => {
        if (productName.includes(keyword)) score += 15;
        if (productBrand.includes(keyword)) score += 20;
        if (productType.includes(keyword)) score += 10;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
      }
    });

    // Solo considerar match si el score es mayor a 50 (más estricto ahora)
    if (bestScore < 50) {
      return { product: null, score: 0 };
    }

    return { product: bestMatch, score: bestScore };
  };

  // Detectar botellas usando Gemini API
  const detectBottlesWithGemini = async () => {
    // Si estamos en rate limit, no hacer nada
    if (isRateLimited) {
      return;
    }

    // Verificar que ha pasado suficiente tiempo desde la última request
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < 6000) { // 6 segundos mínimo
      console.log('⏳ Esperando para evitar rate limit...');
      return;
    }

    try {
      const frameData = captureFrame();
      if (!frameData) return;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return;

      // Actualizar tiempo de última request
      lastRequestTime.current = now;

      // Inicializar Gemini con el modelo más rápido
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.1, // Baja temperatura para respuestas más consistentes
        }
      });

      // Preparar la imagen (remover el prefijo data:image/jpeg;base64,)
      const base64Data = frameData.split(',')[1];
      
      const prompt = `ANÁLISIS DE IMAGEN: Busca ESPECÍFICAMENTE estas DOS cosas:

🔴 PRIORIDAD 1: PESO EN BÁSCULA/DISPLAY DIGITAL
- Busca CUALQUIER número visible en displays digitales, pantallas LCD, básculas electrónicas
- Los números pueden estar en color rojo, verde, azul, blanco, negro
- Pueden ser números de 3-4 dígitos (ej: 950, 1200, 475)
- Busca símbolos como "g", "gr", "grams", "kg"
- Si ves CUALQUIER display con números, repórtalos en "scaleWeight"
- INCLUSO si no estás seguro, reporta el número que veas

🔴 PRIORIDAD 2: BOTELLAS DE ALCOHOL
- Lee la etiqueta e identifica:
  * MARCA específica (ej: Jack Daniel's, Johnnie Walker, Absolut)
  * NOMBRE del producto (ej: Old No. 7, Black Label)
  * TIPO de licor (whiskey, vodka, rum, tequila, gin, wine, spirits)
  * VOLUMEN si visible (ej: 750ml, 1L)

⚠️ IMPORTANTE: 
- Responde SOLO con JSON válido
- El "scaleWeight" es CRÍTICO para el cálculo
- Si ves números en un display digital, SIEMPRE inclúyelos

Formato JSON:
{
  "scaleWeight": número en gramos (ej: 950.5) o null,
  "bottles": [
    {
      "label": "descripción completa de la etiqueta",
      "brand": "marca (ej: Absolut)",
      "productName": "nombre producto (ej: Vodka)",
      "type": "tipo licor",
      "volume": "volumen (ej: 750ml)",
      "confidence": 0-100,
      "box": {"x": 0, "y": 0, "width": 0, "height": 0}
    }
  ]
}

Si NO ves nada: {"scaleWeight": null, "bottles": []}

Responde SOLO con el JSON.`;

      console.log('📤 Enviando request a Gemini...');
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parsear respuesta JSON
      try {
        // Limpiar la respuesta (remover markdown si existe)
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/```\n?/g, '');
        }
        
        const parsed = JSON.parse(cleanText);
        
        // Extraer el peso de la báscula si está disponible
        const scaleWeight = parsed.scaleWeight ? parseFloat(parsed.scaleWeight) : null;
        
        console.log('📊 Respuesta completa de Gemini:', parsed);
        
        if (scaleWeight) {
          console.log(`⚖️ Peso detectado en báscula: ${scaleWeight}g`);
        } else {
          console.warn('⚠️ NO se detectó peso de báscula en la imagen. Asegúrate de que la báscula esté visible y muestre números claramente.');
        }
        
        if (parsed.bottles && Array.isArray(parsed.bottles)) {
          // Hacer matching con la base de datos
          const bottlesWithMatches = parsed.bottles.map((bottle: DetectedBottle) => {
            const match = matchBottleWithDatabase(
              bottle.label,
              bottle.brand,
              bottle.productName,
              bottle.type
            );
            
            // Calcular porcentaje y ml restantes si tenemos match y peso
            let porcentajeLiquido = undefined;
            let mlRestantes = undefined;
            
            console.log('🔍 Debug cálculo:', {
              tieneProducto: !!match.product,
              scaleWeight: scaleWeight,
              scaleWeightEsNull: scaleWeight === null,
              pesoVacio: match.product?.peso_botella_vacia_gramos,
              pesoLleno: match.product?.peso_botella_llena_gramos,
              densidad: match.product?.densidad_liquido_g_ml,
              productoNombre: match.product?.nombre
            });
            
            if (match.product && scaleWeight && 
                match.product.peso_botella_vacia_gramos && 
                match.product.peso_botella_llena_gramos) {
              porcentajeLiquido = calculateLiquidPercentage(
                scaleWeight,
                match.product.peso_botella_vacia_gramos,
                match.product.peso_botella_llena_gramos
              );
              
              mlRestantes = calculateRemainingML(
                scaleWeight,
                match.product.peso_botella_vacia_gramos,
                match.product.densidad_liquido_g_ml || 0.94
              );
              
              console.log(`📊 Cálculos: ${porcentajeLiquido}% (${mlRestantes}ml restantes)`);
            } else {
              // Mensaje específico sobre qué falta
              const faltantes = [];
              if (!match.product) faltantes.push('producto no identificado');
              if (!scaleWeight) faltantes.push('peso de báscula NO detectado (Gemini no vio el display)');
              if (match.product && !match.product.peso_botella_vacia_gramos) faltantes.push('peso_botella_vacia_gramos en BD');
              if (match.product && !match.product.peso_botella_llena_gramos) faltantes.push('peso_botella_llena_gramos en BD');
              
              console.warn(`⚠️ No se pudo calcular porcentaje. Falta: ${faltantes.join(', ')}`);
            }
            
            return {
              ...bottle,
              matchedProduct: match.product,
              matchScore: match.score,
              pesoDetectado: scaleWeight || undefined,
              porcentajeLiquido,
              mlRestantes
            };
          });

          setDetectedBottles(bottlesWithMatches);
          drawBoundingBoxes(bottlesWithMatches);
          setGeminiError(null);
          
          if (bottlesWithMatches.length > 0) {
            console.log(`🍾 ${bottlesWithMatches.length} botella(s) detectada(s)`);
            bottlesWithMatches.forEach((bottle: DetectedBottle) => {
              console.log(`📝 Detectado por IA:`);
              console.log(`   Label: ${bottle.label}`);
              if (bottle.brand) console.log(`   Marca: ${bottle.brand}`);
              if (bottle.productName) console.log(`   Producto: ${bottle.productName}`);
              if (bottle.type) console.log(`   Tipo: ${bottle.type}`);
              if (bottle.volume) console.log(`   Volumen: ${bottle.volume}`);
              if (bottle.pesoDetectado) console.log(`   ⚖️ Peso: ${bottle.pesoDetectado}g`);
              
              if (bottle.matchedProduct) {
                console.log(`✅ Match en BD: ${bottle.matchedProduct.nombre} (${bottle.matchedProduct.marca}) - Score: ${bottle.matchScore}`);
                
                if (bottle.porcentajeLiquido !== undefined && bottle.mlRestantes !== undefined) {
                  console.log(`   📊 Nivel: ${bottle.porcentajeLiquido}% (${bottle.mlRestantes}ml restantes)`);
                  
                  // Determinar acción según las reglas de negocio
                  if (bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD) {
                    console.log(`   ♻️ ACCIÓN: REUTILIZAR (>${BOTTLE_RULES.REUSE_THRESHOLD}%)`);
                  } else if (bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD) {
                    console.log(`   🔄 ACCIÓN: COMPLETAR con otra botella (${BOTTLE_RULES.MIN_COMPLETION_THRESHOLD}%-${BOTTLE_RULES.MAX_COMPLETION_THRESHOLD}%)`);
                  } else {
                    console.log(`   🗑️ ACCIÓN: DESCARTAR (<${BOTTLE_RULES.DISCARD_THRESHOLD}%)`);
                  }
                }
              } else {
                console.log(`❌ No se encontró en BD`);
              }
              console.log('---');
            });
            
            // Agregar botellas con match al historial (permitir duplicados)
            const matchedBottles = bottlesWithMatches.filter((b: DetectedBottle) => b.matchedProduct);
            if (matchedBottles.length > 0) {
              setFoundBottles(prev => [...prev, ...matchedBottles]);
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.log('Raw text:', text);
      }
      
    } catch (error: any) {
      console.error('❌ Error con detección Gemini:', error);
      
      // Manejar error 429 (Rate Limit)
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        setIsRateLimited(true);
        
        // Intentar extraer el tiempo de retry del mensaje de error
        const retryMatch = error.message.match(/retry in ([\d.]+)s/);
        const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 60;
        
        const retryTime = new Date(Date.now() + retrySeconds * 1000);
        setNextRetryTime(retryTime);
        setGeminiError(`⏳ Límite de API excedido. Esperando ${Math.ceil(retrySeconds)} segundos...`);
        
        console.log(`⏳ Rate limited. Reintentando en ${retrySeconds} segundos...`);
        
        // Reintentar después del tiempo especificado
        setTimeout(() => {
          setIsRateLimited(false);
          setNextRetryTime(null);
          setGeminiError(null);
          console.log('✅ Reintentando detección...');
        }, retrySeconds * 1000);
        
      } else if (error.message?.includes('API key')) {
        setGeminiError('❌ Error con la API Key de Gemini');
        stopDetection();
      } else {
        setGeminiError('❌ Error de conexión con Gemini');
      }
    }
  };

  // Dibujar bounding boxes en el canvas
  const drawBoundingBoxes = (bottles: DetectedBottle[]) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar cada botella detectada
    bottles.forEach((bottle) => {
      const { x, y, width, height } = bottle.box;
      
      // Color basado en si está en BD y confianza
      let color = '#22c55e'; // verde por defecto
      
      if (bottle.matchedProduct) {
        // Verde brillante si está en BD
        color = '#10b981';
      } else {
        // Rojo si no está en BD
        color = '#ef4444';
      }
      
      // Ajustar por confianza
      if (bottle.confidence < 70) color = '#f59e0b'; // naranja (media confianza)
      
      // Dibujar rectángulo
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, width, height);
      
      // Dibujar fondo para el texto principal
      const label = bottle.matchedProduct 
        ? `${bottle.matchedProduct.nombre} (${bottle.confidence}%)`
        : `${bottle.label} (${bottle.confidence}%)`;
      ctx.font = 'bold 16px Arial';
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 55, Math.max(textWidth + 12, 120), 55);
      
      // Dibujar texto principal
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 6, y - 32);
      
      // Dibujar estado de BD
      ctx.font = 'bold 12px Arial';
      const statusText = bottle.matchedProduct ? '✓ En BD' : '✗ No en BD';
      ctx.fillText(statusText, x + 6, y - 12);
    });
  };

  // Detener cámara
  const stopCamera = () => {
    stopDetection();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      setIsCameraActive(false);
      setDetectedBottles([]);
      setGeminiError(null);
      // No limpiar foundBottles para mantener el historial
      console.log('📷 Cámara detenida');
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (isLoading) {
    return (
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-lg mb-2">Cargando catálogo de botellas...</div>
                <div className="text-sm text-muted-foreground">Por favor espera un momento</div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="space-y-6 px-4 lg:px-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">Control de Botellas en Tiempo Real</h1>
                    <p className="text-muted-foreground">
                      Sistema automático de detección y clasificación de botellas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isCameraActive ? (
                      <Button
                        onClick={startCamera}
                        variant="default"
                        size="lg"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Activar Cámara
                      </Button>
                    ) : (
                      <Button
                        onClick={stopCamera}
                        variant="destructive"
                        size="lg"
                      >
                        <CameraOff className="mr-2 h-5 w-5" />
                        Detener Cámara
                      </Button>
                    )}
                  </div>
                </div>

                {/* Camera Feed - Principal */}
                {isCameraActive ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Vista de Cámara */}
                    <div className="lg:col-span-2">
                      <Card className="bg-black">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-white">Cámara de Detección</CardTitle>
                              <CardDescription className="text-gray-300">
                                Sistema activo - Esperando botella...
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-white text-sm font-medium">EN VIVO</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-contain"
                              style={{ position: 'absolute', top: 0, left: 0 }}
                            />
                            <canvas
                              ref={canvasRef}
                              className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                            />
                            {geminiError && (
                              <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
                                {geminiError}
                              </div>
                            )}
                            {isDetecting && !geminiError && !isRateLimited && (
                              <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                Detectando (cada 6s)
                              </div>
                            )}
                            {isRateLimited && nextRetryTime && (
                              <div className="absolute top-4 right-4 bg-orange-500/90 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                Esperando...
                              </div>
                            )}
                            {detectedBottles.length > 0 && (
                              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                                <p className="text-sm font-semibold">🍾 {detectedBottles.length} botella(s) detectada(s)</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Panel de Estadísticas */}
                    <div className="space-y-4">
                      {/* Ayuda de Báscula */}
                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <span className="text-2xl">⚖️</span>
                            Instrucciones de Peso
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p className="text-gray-700">
                            <strong>Para calcular el % restante:</strong>
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-gray-600">
                            <li>Coloca la botella en la báscula</li>
                            <li>Asegúrate que el display de la báscula sea VISIBLE en la cámara</li>
                            <li>Los números deben verse CLARAMENTE</li>
                            <li>Gemini leerá el peso y calculará automáticamente</li>
                          </ol>
                          <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                            <p className="text-xs text-blue-800">
                              <strong>💡 Tip:</strong> Si no detecta, acerca la cámara al display de la báscula
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Estadísticas del Día</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Procesadas</span>
                            <span className="text-2xl font-bold">{stats.procesadas}</span>
                          </div>
                          <div className="h-px bg-gray-200"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600">♻️ Reutilizadas</span>
                            <span className="text-xl font-bold text-green-600">{stats.reutilizadas}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-orange-600">🔄 Completadas</span>
                            <span className="text-xl font-bold text-orange-600">{stats.completadas}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-red-600">🗑️ Descartadas</span>
                            <span className="text-xl font-bold text-red-600">{stats.descartadas}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detecciones en BD</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {detectedBottles.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {detectedBottles.map((bottle, index) => (
                                <div 
                                  key={index} 
                                  className={`border rounded-lg p-3 bg-white cursor-pointer transition-all hover:shadow-md ${
                                    bottle.matchedProduct ? 'hover:border-green-300' : ''
                                  }`}
                                  onClick={() => {
                                    if (bottle.matchedProduct) {
                                      setSelectedBottle(bottle);
                                      setIsBottleDialogOpen(true);
                                    }
                                  }}
                                >
                                  {/* Detección original */}
                                  <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                    <div className="flex items-center gap-2">
                                      <Wine className="h-4 w-4 text-blue-600" />
                                      <span className="text-xs font-medium text-gray-600">Detectado por IA:</span>
                                    </div>
                                    <Badge 
                                      variant="outline"
                                      className={
                                        bottle.confidence >= 70 
                                          ? 'bg-green-50 text-green-700 border-green-200'
                                          : bottle.confidence >= 50
                                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                                          : 'bg-red-50 text-red-700 border-red-200'
                                      }
                                    >
                                      {bottle.confidence}%
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 mb-2">
                                    {bottle.brand && (
                                      <p className="text-xs">
                                        <span className="text-gray-500">Marca:</span>{' '}
                                        <span className="font-semibold">{bottle.brand}</span>
                                      </p>
                                    )}
                                    {bottle.productName && (
                                      <p className="text-xs">
                                        <span className="text-gray-500">Producto:</span>{' '}
                                        <span className="font-semibold">{bottle.productName}</span>
                                      </p>
                                    )}
                                    {bottle.type && (
                                      <p className="text-xs">
                                        <span className="text-gray-500">Tipo:</span>{' '}
                                        <span className="font-medium">{bottle.type}</span>
                                      </p>
                                    )}
                                    {bottle.volume && (
                                      <p className="text-xs">
                                        <span className="text-gray-500">Volumen:</span>{' '}
                                        <span className="font-medium">{bottle.volume}</span>
                                      </p>
                                    )}
                                    {bottle.pesoDetectado && (
                                      <p className="text-xs">
                                        <span className="text-gray-500">⚖️ Peso:</span>{' '}
                                        <span className="font-bold text-blue-700">{bottle.pesoDetectado}g</span>
                                      </p>
                                    )}
                                  </div>

                                  {/* Producto matcheado */}
                                  {bottle.matchedProduct ? (
                                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                      <div className="flex items-center gap-1 mb-2">
                                        <Badge className="bg-green-600">
                                          ✓ En Base de Datos
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {bottle.matchScore}%
                                        </Badge>
                                      </div>
                                      <p className="text-xs font-semibold text-green-800 truncate">
                                        {bottle.matchedProduct.nombre}
                                      </p>
                                      <p className="text-xs text-green-700">
                                        {bottle.matchedProduct.marca} • {bottle.matchedProduct.volumen_ml}ml
                                      </p>
                                      
                                      {/* Mostrar porcentaje y ml si están disponibles */}
                                      {bottle.porcentajeLiquido !== undefined && bottle.mlRestantes !== undefined && (
                                        <div className="mt-2 pt-2 border-t border-green-300">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-green-700">Nivel:</span>
                                            <div className="flex items-center gap-1">
                                              <Badge className={`text-xs ${
                                                bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD
                                                  ? 'bg-green-600'
                                                  : bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD
                                                  ? 'bg-orange-500'
                                                  : 'bg-red-500'
                                              }`}>
                                                {bottle.porcentajeLiquido}%
                                              </Badge>
                                              <span className="text-xs font-bold text-green-800">{bottle.mlRestantes}ml</span>
                                            </div>
                                          </div>
                                          <p className="text-xs font-bold">
                                            {bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD && (
                                              <span className="text-green-700">♻️ Reutilizar</span>
                                            )}
                                            {bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD && 
                                             bottle.porcentajeLiquido <= BOTTLE_RULES.MAX_COMPLETION_THRESHOLD && (
                                              <span className="text-orange-600">🔄 Completar</span>
                                            )}
                                            {bottle.porcentajeLiquido < BOTTLE_RULES.DISCARD_THRESHOLD && (
                                              <span className="text-red-600">🗑️ Descartar</span>
                                            )}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                        ✗ No encontrado en BD
                                      </Badge>
                                      <p className="text-xs text-red-600 mt-1">
                                        Este producto no está registrado en el catálogo
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Wine className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-muted-foreground">
                                {isDetecting ? 'Buscando botellas...' : 'Sin detecciones'}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Camera className="h-24 w-24 text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Cámara Desactivada</h3>
                      <p className="text-muted-foreground mb-6 text-center max-w-md">
                        Activa la cámara para comenzar a procesar las botellas que regresan de los vuelos
                      </p>
                      <Button onClick={startCamera} size="lg">
                        <Camera className="mr-2 h-5 w-5" />
                        Activar Sistema de Detección
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Información del sistema */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-blue-900">Reglas de Clasificación</h3>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>&gt;{BOTTLE_RULES.REUSE_THRESHOLD}%:</strong> Reutilizar</li>
                            <li>• <strong>{BOTTLE_RULES.MIN_COMPLETION_THRESHOLD}%-{BOTTLE_RULES.MAX_COMPLETION_THRESHOLD}%:</strong> Completar</li>
                            <li>• <strong>&lt;{BOTTLE_RULES.MIN_COMPLETION_THRESHOLD}%:</strong> Descartar</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-green-900">Sistema Gemini AI</h3>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• <strong>Modelo:</strong> Gemini 2.0 Flash</li>
                            <li>• <strong>Frecuencia:</strong> Cada 6 segundos</li>
                            <li>• <strong>Límite:</strong> 10 requests/minuto</li>
                            <li>• <strong>Catálogo:</strong> {bottleCatalog.length} tipos</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sección de Botellas Encontradas */}
                {foundBottles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">Botellas Identificadas</h2>
                        <p className="text-sm text-muted-foreground">
                          {foundBottles.length} producto{foundBottles.length !== 1 ? 's' : ''} encontrado{foundBottles.length !== 1 ? 's' : ''} en la base de datos
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFoundBottles([])}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {foundBottles.map((bottle, index) => (
                        <Card key={index} className="overflow-hidden border-2 border-green-200 hover:shadow-lg transition-shadow">
                          <CardHeader className="bg-gradient-to-br from-green-50 to-green-100 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Encontrado en BD
                              </Badge>
                              <Badge variant="outline" className="bg-white">
                                Match: {bottle.matchScore}%
                              </Badge>
                            </div>
                            
                            {/* Mostrar porcentaje prominente si está disponible */}
                            {bottle.porcentajeLiquido !== undefined && bottle.porcentajeLiquido !== null ? (
                              <div className="text-center py-2">
                                <div className={`inline-flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 ${
                                  bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD
                                    ? 'bg-green-500 border-green-300'
                                    : bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD
                                    ? 'bg-orange-500 border-orange-300'
                                    : 'bg-red-500 border-red-300'
                                }`}>
                                  <span className="text-3xl font-bold text-white">{bottle.porcentajeLiquido}%</span>
                                  <span className="text-xs text-white font-medium">restante</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center py-4">
                                <Wine className="h-16 w-16 text-green-600" />
                                {bottle.pesoDetectado && (
                                  <div className="absolute bottom-2 bg-white px-2 py-1 rounded-lg shadow-md border">
                                    <p className="text-xs text-gray-600">⚖️ {bottle.pesoDetectado}g</p>
                                    <p className="text-xs text-red-600 font-semibold">Sin datos de peso</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="pt-4">
                            {bottle.matchedProduct && (
                              <div className="space-y-3">
                                {/* Nombre y Marca */}
                                <div className="border-b pb-3">
                                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                                    {bottle.matchedProduct.nombre}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {bottle.matchedProduct.marca}
                                  </p>
                                </div>

                                {/* Información en grid */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <p className="text-xs text-blue-600 font-medium">Tipo</p>
                                    <p className="text-sm font-bold text-blue-900 truncate">
                                      {bottle.matchedProduct.tipo}
                                    </p>
                                  </div>

                                  <div className="bg-purple-50 p-2 rounded border border-purple-200">
                                    <p className="text-xs text-purple-600 font-medium">Volumen</p>
                                    <p className="text-sm font-bold text-purple-900">
                                      {bottle.matchedProduct.volumen_ml}ml
                                    </p>
                                  </div>

                                  {bottle.matchedProduct.precio_unitario > 0 && (
                                    <div className="bg-green-50 p-2 rounded border border-green-200">
                                      <p className="text-xs text-green-600 font-medium">Precio</p>
                                      <p className="text-sm font-bold text-green-900">
                                        ${bottle.matchedProduct.precio_unitario}
                                      </p>
                                    </div>
                                  )}

                                  {bottle.matchedProduct.contenido_alcohol_porcentaje > 0 && (
                                    <div className="bg-orange-50 p-2 rounded border border-orange-200">
                                      <p className="text-xs text-orange-600 font-medium">Alcohol</p>
                                      <p className="text-sm font-bold text-orange-900">
                                        {bottle.matchedProduct.contenido_alcohol_porcentaje}%
                                      </p>
                                    </div>
                                  )}
                                  
                                  {bottle.pesoDetectado && (
                                    <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                                      <p className="text-xs text-indigo-600 font-medium">⚖️ Peso</p>
                                      <p className="text-sm font-bold text-indigo-900">
                                        {bottle.pesoDetectado}g
                                      </p>
                                    </div>
                                  )}
                                  
                                  {bottle.mlRestantes !== undefined && (
                                    <div className="bg-cyan-50 p-2 rounded border border-cyan-200">
                                      <p className="text-xs text-cyan-600 font-medium">💧 Restante</p>
                                      <p className="text-sm font-bold text-cyan-900">
                                        {bottle.mlRestantes}ml
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Información de detección */}
                                <div className="bg-gray-50 p-2 rounded border text-xs space-y-1">
                                  <p className="text-gray-700 font-semibold mb-1">Detectado por IA:</p>
                                  {bottle.brand && (
                                    <p className="text-gray-600">
                                      <strong>Marca:</strong> {bottle.brand}
                                    </p>
                                  )}
                                  {bottle.productName && (
                                    <p className="text-gray-600">
                                      <strong>Producto:</strong> {bottle.productName}
                                    </p>
                                  )}
                                  {bottle.type && (
                                    <p className="text-gray-600">
                                      <strong>Tipo:</strong> {bottle.type}
                                    </p>
                                  )}
                                  {bottle.volume && (
                                    <p className="text-gray-600">
                                      <strong>Volumen:</strong> {bottle.volume}
                                    </p>
                                  )}
                                  {bottle.pesoDetectado && (
                                    <p className="text-gray-600">
                                      <strong>⚖️ Peso:</strong> {bottle.pesoDetectado}g
                                    </p>
                                  )}
                                  <div className="flex justify-between pt-1 border-t mt-2">
                                    <span className="text-gray-600">Confianza:</span>
                                    <Badge variant="outline" className="h-5 text-xs">
                                      {bottle.confidence}%
                                    </Badge>
                                  </div>
                                </div>

                                {/* Información de nivel calculado */}
                                {bottle.porcentajeLiquido !== undefined && bottle.mlRestantes !== undefined && (
                                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border-2 border-blue-200">
                                    <p className="text-xs text-blue-700 font-semibold mb-2">📊 Análisis de Contenido:</p>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-blue-900">Líquido restante:</span>
                                        <div className="flex items-center gap-2">
                                          <Badge className="bg-blue-600">{bottle.porcentajeLiquido}%</Badge>
                                          <span className="text-xs font-bold text-blue-900">{bottle.mlRestantes}ml</span>
                                        </div>
                                      </div>
                                      
                                      {/* Barra de progreso */}
                                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div 
                                          className={`h-full ${
                                            bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD
                                              ? 'bg-green-500'
                                              : bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD
                                              ? 'bg-orange-500'
                                              : 'bg-red-500'
                                          }`}
                                          style={{ width: `${bottle.porcentajeLiquido}%` }}
                                        ></div>
                                      </div>
                                      
                                      {/* Acción recomendada */}
                                      <div className={`p-2 rounded border-2 ${
                                        bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD
                                          ? 'bg-green-50 border-green-300'
                                          : bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD
                                          ? 'bg-orange-50 border-orange-300'
                                          : 'bg-red-50 border-red-300'
                                      }`}>
                                        <p className="text-xs font-bold">
                                          {bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD && (
                                            <span className="text-green-700">♻️ REUTILIZAR para siguiente vuelo</span>
                                          )}
                                          {bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD && 
                                           bottle.porcentajeLiquido <= BOTTLE_RULES.MAX_COMPLETION_THRESHOLD && (
                                            <span className="text-orange-700">🔄 COMPLETAR con otra botella</span>
                                          )}
                                          {bottle.porcentajeLiquido < BOTTLE_RULES.DISCARD_THRESHOLD && (
                                            <span className="text-red-700">🗑️ DESCARTAR (nivel muy bajo)</span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Botón de acción */}
                                <Button 
                                  className="w-full"
                                  onClick={() => {
                                    console.log('Procesando botella:', bottle.matchedProduct);
                                    // Aquí agregar lógica de procesamiento
                                  }}
                                >
                                  Procesar Botella
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

