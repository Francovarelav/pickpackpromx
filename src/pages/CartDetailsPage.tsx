import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Package, 
  ShoppingCart, 
  AlertCircle, 
  Minus,
  Mic,
  MicOff,
  Loader2,
  CheckCircle,
  Trash2,
  Camera,
  CameraOff,
  Wine
} from 'lucide-react';
import type { AlcoholBottle } from '@/types/alcohol-bottles';
import { 
  BOTTLE_RULES,
  calculateLiquidPercentage,
  calculateRemainingML
} from '@/types/alcohol-bottles';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CartProduct {
  product_id: string;
  producto: string;
  marca: string;
  presentacion: string;
  cantidad_default: number;
  precio_unitario: number;
  stock_actual: number;
}

interface MissingProduct {
  cantidad_missing: number;
  marca: string;
  presentacion: string;
  product_id: string;
  producto: string;
  stock_found: number;
}

type CartStatus = 'Limpieza' | 'Pesaje' | 'Pick and pack' | 'Avión';

interface Cart {
  id: string;
  nombre: string;
  descripcion: string;
  productos: CartProduct[];
  total_productos: number;
  missing: MissingProduct[];
  tipo: string;
  activo: boolean;
  status?: CartStatus; // Estado actual del proceso
  created_at: any;
  updated_at: any;
}

interface CartDetailsPageProps {
  cartId: string;
  onBack: () => void;
}

// Función helper para detectar si un carrito tiene botellas alcohólicas
function hasAlcoholBottles(productos: CartProduct[]): boolean {
  return productos.some(producto => {
    // Verificar si tiene el campo tipo='botella_alcohol'
    const hasBottleType = (producto as any).tipo === 'botella_alcohol';
    
    // O verificar por palabras clave en el nombre
    const alcoholKeywords = ['cerveza', 'beer', 'vino', 'wine', 'whisky', 'whiskey', 'vodka', 'ron', 'rum', 'tequila', 'gin', 'ginebra', 'brandy', 'cognac'];
    const productoLower = producto.producto.toLowerCase();
    const hasAlcoholKeyword = alcoholKeywords.some(keyword => productoLower.includes(keyword));
    
    return hasBottleType || hasAlcoholKeyword;
  });
}

export default function CartDetailsPage({ cartId, onBack }: CartDetailsPageProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el flujo de fases
  type ProcessPhase = 'cleasing' | 'bottle-control' | 'finished';
  const [currentPhase, setCurrentPhase] = useState<ProcessPhase>('cleasing');
  const [hasBottles, setHasBottles] = useState<boolean>(false);
  const [cleasingCompleted, setCleasingCompleted] = useState<boolean>(false);

  // Estados para cleansing
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentTranscript, setCurrentTranscript] = useState(''); // Transcript temporal
  
  // Estados para manejo de productos unknown
  const [unknownProducts, setUnknownProducts] = useState<string[]>([]);
  const [showUnknownDialog, setShowUnknownDialog] = useState(false);
  const [selectedCartProduct, setSelectedCartProduct] = useState<CartProduct | null>(null);
  const [unknownQuantity, setUnknownQuantity] = useState<number>(1);

  // Estados para correcciones finales
  const [isCorrectionRecording, setIsCorrectionRecording] = useState(false);
  const [isCorrectionProcessing, setIsCorrectionProcessing] = useState(false);
  const [correctionRecognition, setCorrectionRecognition] = useState<any>(null);
  const [correctionTranscript, setCorrectionTranscript] = useState('');

  // Estados para formulario manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSelectedProduct, setManualSelectedProduct] = useState<CartProduct | null>(null);
  const [manualQuantity, setManualQuantity] = useState<number>(1);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Estados para Control Bottles Waste
  interface DetectedBottle {
    label: string;
    brand?: string;
    productName?: string;
    type?: string;
    volume?: string;
    confidence: number;
    matchedProduct?: AlcoholBottle | null;
    matchScore?: number;
    pesoDetectado?: number;
    porcentajeLiquido?: number;
    mlRestantes?: number;
    isMerged?: boolean; // Indica si es una botella combinada de 2
  }

  interface BottlePair {
    id: string;
    bottle1: DetectedBottle;
    bottle2: DetectedBottle;
    combinedPercentage: number;
    combinedML: number;
    productId: string;
    productName: string;
    timestamp: Date;
  }

  const [bottleCatalog, setBottleCatalog] = useState<AlcoholBottle[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedBottles, setDetectedBottles] = useState<DetectedBottle[]>([]);
  const detectionIntervalRef = useRef<number | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [foundBottles, setFoundBottles] = useState<DetectedBottle[]>([]);
  const lastRequestTime = useRef<number>(0);
  const [countdown, setCountdown] = useState<number>(6); // Contador para siguiente captura
  const countdownIntervalRef = useRef<number | null>(null);
  const [bottlePairs, setBottlePairs] = useState<BottlePair[]>([]); // Pares de botellas que se pueden combinar

  // Función para actualizar el status del carrito en Firebase
  const updateCartStatus = async (newStatus: CartStatus) => {
    if (!cart) return;
    
    try {
      console.log(`📊 Actualizando status del carrito a: ${newStatus}`);
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        status: newStatus,
        updated_at: new Date()
      });
      
      // Actualizar estado local
      setCart(prev => prev ? {
        ...prev,
        status: newStatus,
        updated_at: new Date()
      } : null);
      
      console.log(`✅ Status actualizado a: ${newStatus}`);
    } catch (error) {
      console.error('❌ Error actualizando status:', error);
    }
  };

  // Cargar cart desde Firebase
  useEffect(() => {
    const loadCart = async () => {
      try {
        console.log('🔥 Loading cart details...');
        const cartRef = doc(db, 'carts', cartId);
        const cartSnap = await getDoc(cartRef);
        
        if (cartSnap.exists()) {
          const data = cartSnap.data();
          const cartData: Cart = {
            id: cartSnap.id,
            nombre: data.nombre || 'Cart Sin Nombre',
            descripcion: data.descripcion || '',
            productos: data.productos || [],
            total_productos: data.total_productos || 0,
            missing: data.missing || [],
            tipo: data.tipo || 'unknown',
            activo: data.activo !== undefined ? data.activo : true,
            status: data.status || 'Limpieza', // Estado por defecto
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          
          setCart(cartData);
          
          // Detectar si el carrito tiene botellas alcohólicas
          const hasAlcohol = hasAlcoholBottles(cartData.productos);
          setHasBottles(hasAlcohol);
          
          // Si el carrito no tiene status, establecerlo en Limpieza
          if (!data.status) {
            await updateCartStatus('Limpieza');
          }
          
          console.log('✅ Cart loaded:', cartData.nombre);
          console.log('🍾 Tiene botellas alcohólicas:', hasAlcohol);
          console.log('📊 Status actual:', cartData.status);
        } else {
          console.log('❌ Cart not found');
        }
      } catch (error) {
        console.error('❌ Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [cartId]);

  // Función para obtener el color del badge según el tipo
  const getTypeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'default-catering':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'básico':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mini':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el ícono según el tipo
  const getTypeIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'default-catering':
        return <ShoppingCart className="w-4 h-4" />;
      case 'premium':
        return <Package className="w-4 h-4" />;
      case 'básico':
        return <CheckCircle className="w-4 h-4" />;
      case 'mini':
        return <Minus className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };





  // Funciones para cleansing
  const startRecording = async () => {
    try {
      console.log('🎤 Iniciando reconocimiento de voz...');
      
      // Verificar si el navegador soporta Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Este navegador no soporta reconocimiento de voz');
      }

      // Limpiar completamente todos los estados anteriores
      setCurrentTranscript('');
      setIsProcessing(false);
      setIsRecording(true);
      
      // Limpiar productos unknown del diálogo anterior
      setUnknownProducts([]);
      setSelectedCartProduct(null);
      setUnknownQuantity(1);
      setShowUnknownDialog(false); // Asegurar que el diálogo esté cerrado

      // Crear instancia de reconocimiento de voz
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'es-ES';
      recognitionInstance.continuous = true; // Permite grabar continuamente
      recognitionInstance.interimResults = false;

      recognitionInstance.onstart = () => {
        console.log('✅ Reconocimiento de voz iniciado');
      };

      recognitionInstance.onresult = async (event: any) => {
        console.log('📝 Resultado recibido');
        
        // Concatenar todos los resultados
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        fullTranscript = fullTranscript.trim();
        
        console.log('📝 Transcript completo:', fullTranscript);
        setCurrentTranscript(fullTranscript);
        
        // Si el reconocimiento ya terminó, procesar inmediatamente
        if (!isRecording) {
          console.log('🤖 Procesando inmediatamente con Gemini...');
          setIsProcessing(true);
          await processWithGemini(fullTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);
        setIsRecording(false);
        
        // Mostrar mensaje específico según el tipo de error
        let errorMessage = 'Error en el reconocimiento de voz';
        
        switch(event.error) {
          case 'network':
            errorMessage = 'Error de conexión: El reconocimiento de voz requiere conexión a internet.';
            break;
          case 'not-allowed':
            errorMessage = 'Permiso denegado: Por favor permite el acceso al micrófono en tu navegador.';
            break;
          case 'no-speech':
            errorMessage = 'No se detectó audio: Por favor habla más fuerte o verifica tu micrófono.';
            break;
          case 'audio-capture':
            errorMessage = 'No se puede acceder al micrófono: Verifica que tu micrófono esté conectado y funcionando.';
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }
        
        errorMessage += '\n\nPuedes usar el formulario manual para agregar productos faltantes.';
        
        // Activar formulario manual y guardar el error
        setVoiceError(errorMessage);
        setShowManualForm(true);
        
        alert(errorMessage);
      };

      recognitionInstance.onend = () => {
        console.log('🏁 Reconocimiento terminado');
        setIsRecording(false);
        
        // Si tenemos transcript, procesarlo
        if (currentTranscript && currentTranscript.trim().length > 0) {
          console.log('🤖 Procesando con Gemini desde onend...');
          setIsProcessing(true);
          processWithGemini(currentTranscript);
        } else {
          console.log('⚠️ No hay transcript en onend');
        }
      };

      recognitionInstance.start();
      setRecognition(recognitionInstance);

    } catch (error) {
      console.error('❌ Error iniciando reconocimiento:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (recognition && isRecording) {
      console.log('🛑 Deteniendo reconocimiento...');
      recognition.stop();
      // No cambiar setIsRecording aquí, lo hará onend
    }
  };

  // Funciones para correcciones finales
  const startCorrectionRecording = async () => {
    try {
      console.log('🎤 Iniciando grabación de correcciones...');
      
      // Verificar si el navegador soporta Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Este navegador no soporta reconocimiento de voz');
      }

      // Limpiar estados de corrección
      setCorrectionTranscript('');
      setIsCorrectionProcessing(false);
      setIsCorrectionRecording(true);

      // Crear instancia de reconocimiento de voz
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'es-ES';
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;

      recognitionInstance.onstart = () => {
        console.log('✅ Reconocimiento de correcciones iniciado');
      };

      recognitionInstance.onresult = async (event: any) => {
        console.log('📝 Resultado de corrección recibido');
        
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        fullTranscript = fullTranscript.trim();
        
        console.log('📝 Transcript de corrección:', fullTranscript);
        setCorrectionTranscript(fullTranscript);
        
        if (!isCorrectionRecording) {
          console.log('🤖 Procesando corrección con Gemini...');
          setIsCorrectionProcessing(true);
          await processCorrectionWithGemini(fullTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento de corrección:', event.error);
        setIsCorrectionRecording(false);
      };

      recognitionInstance.onend = () => {
        console.log('🏁 Reconocimiento de corrección terminado');
        setIsCorrectionRecording(false);
        
        if (correctionTranscript && correctionTranscript.trim().length > 0) {
          console.log('🤖 Procesando corrección con Gemini desde onend...');
          setIsCorrectionProcessing(true);
          processCorrectionWithGemini(correctionTranscript);
        } else {
          console.log('⚠️ No hay transcript de corrección en onend');
        }
      };

      recognitionInstance.start();
      setCorrectionRecognition(recognitionInstance);

    } catch (error) {
      console.error('❌ Error iniciando reconocimiento de corrección:', error);
      setIsCorrectionRecording(false);
    }
  };

  const stopCorrectionRecording = async () => {
    if (correctionRecognition && isCorrectionRecording) {
      console.log('🛑 Deteniendo reconocimiento de corrección...');
      correctionRecognition.stop();
    }
  };

  const processWithGemini = async (transcriptText: string) => {
    try {
      console.log('🤖 Procesando con Gemini...');
      
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Preparar lista de productos del cart
      const productList = cart?.productos.map(producto => ({
        product_brand: producto.marca,
        product_id: producto.product_id,
        product_name: producto.producto,
        product_presentation: producto.presentacion,
        unit_price: producto.precio_unitario
      })) || [];

      const prompt = `Eres un asistente de procesamiento de lenguaje natural y detección de inventario minorista, experto en cotejar menciones de voz (transcripts) contra listas de productos predefinidas.

Tu tarea es:
1. **Analizar** el siguiente \`TRANSCRIPT_DE_AUDIO\`.
2. **Cotejar** cada mención de producto en el transcript contra la \`LISTA_DE_PRODUCTOS\` proporcionada.
3. **Determinar la Cantidad:** Inferir la cantidad de unidades mencionadas para cada producto (ej. "una", "dos", "tres" o implícito). Si la cantidad no es clara, asume 1, o usa el valor numérico explícito.
4. **Clasificar el texto restante:** Colocar cualquier palabra o frase del transcript que NO corresponda a un producto de la lista en la sección "unknown".

**Formato de Salida Requerido:**
Debes devolver **SOLO** un objeto JSON siguiendo esta estructura estricta:

* **\`products\`**: Un array de objetos, donde cada objeto representa un producto detectado que SÍ está en la lista. Debe incluir el \`product_id\` (de tu lista) y la \`quantity_mentioned\` (inferida del transcript).
* **\`unknown\`**: Un array de strings con el texto remanente del transcript que no se pudo asociar a ningún producto de la lista.

---
**LISTA_DE_PRODUCTOS:**
${JSON.stringify(productList, null, 2)}

**TRANSCRIPT_DE_AUDIO:**
"${transcriptText}"
---

**PROPORCIONA ÚNICAMENTE LA RESPUESTA EN FORMATO JSON, SIN NINGÚN TEXTO ADICIONAL ANTES O DESPUÉS.**`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Respuesta de Gemini:', text);
      
      // Limpiar el texto para extraer solo el JSON
      let cleanText = text.trim();
      
      // Remover markdown code blocks si existen
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/g, '');
      }
      
      const jsonResult = JSON.parse(cleanText);
      console.log('✅ JSON parseado:', jsonResult);
      
      // Procesar productos detectados
      if (jsonResult.products && jsonResult.products.length > 0) {
        await updateMissingProducts(jsonResult.products);
      }
      
      // Manejar productos unknown
      if (jsonResult.unknown && jsonResult.unknown.length > 0) {
        console.log('🔍 Productos unknown detectados:', jsonResult.unknown);
        // Limpiar completamente el estado anterior del diálogo
        setSelectedCartProduct(null);
        setUnknownQuantity(1);
        // Establecer nuevos productos unknown
        setUnknownProducts(jsonResult.unknown);
        setShowUnknownDialog(true);
      } else {
        console.log('✅ No hay productos unknown en esta sesión');
        // Asegurar que el diálogo esté cerrado si no hay unknown products
        setShowUnknownDialog(false);
      }
      
    } catch (error) {
      console.error('❌ Error con Gemini:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processCorrectionWithGemini = async (transcriptText: string) => {
    try {
      console.log('🤖 Procesando correcciones con Gemini...');
      
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Preparar lista de productos del cart
      const productList = cart?.productos.map(producto => ({
        product_brand: producto.marca,
        product_id: producto.product_id,
        product_name: producto.producto,
        product_presentation: producto.presentacion,
        unit_price: producto.precio_unitario
      })) || [];

      // Preparar missing products actuales
      const currentMissing = cart?.missing || [];

      const prompt = `Eres un asistente especializado en corrección de inventarios minoristas. Tu tarea es procesar correcciones de voz del usuario y ajustar la lista de productos faltantes.

**INSTRUCCIONES:**
1. Analiza el TRANSCRIPT_DE_CORRECCION del usuario
2. Compara con la LISTA_DE_PRODUCTOS_DISPONIBLES y MISSING_PRODUCTS_ACTUALES
3. Aplica las correcciones mencionadas por el usuario
4. Devuelve el JSON actualizado de missing products

**TIPOS DE CORRECCIONES QUE PUEDES PROCESAR:**
- "No encontré X productos, sino Y" → Ajustar cantidad faltante
- "Faltó que encontrara X productos" → Agregar a missing
- "También van a faltar X productos" → Agregar nuevos a missing
- "Ya no faltan X productos" → Remover de missing
- "Cambiar X por Y" → Reemplazar productos

**FORMATO DE SALIDA:**
Devuelve ÚNICAMENTE un objeto JSON con el array "missing" actualizado:

\`\`\`json
{
  "missing": [
    {
      "cantidad_missing": 5,
      "marca": "Coca-Cola",
      "presentacion": "355 ml",
      "product_id": "coca-cola-normal-355-ml",
      "producto": "Coca-Cola Normal",
      "stock_found": 0
    }
  ]
}
\`\`\`

**LISTA_DE_PRODUCTOS_DISPONIBLES:**
${JSON.stringify(productList, null, 2)}

**MISSING_PRODUCTS_ACTUALES:**
${JSON.stringify(currentMissing, null, 2)}

**TRANSCRIPT_DE_CORRECCION:**
"${transcriptText}"

**PROPORCIONA ÚNICAMENTE LA RESPUESTA EN FORMATO JSON, SIN NINGÚN TEXTO ADICIONAL ANTES O DESPUÉS.**`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let cleanText = response.text().trim();

      // Limpiar markdown si está presente
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/g, '');
      }

      const jsonResult = JSON.parse(cleanText);
      console.log('✅ Corrección procesada:', jsonResult);

      // Actualizar missing products con la corrección
      if (jsonResult.missing) {
        await updateMissingProductsFromCorrection(jsonResult.missing);
      }
      
    } catch (error) {
      console.error('❌ Error procesando corrección con Gemini:', error);
    } finally {
      setIsCorrectionProcessing(false);
    }
  };

  // Función para actualizar productos missing en Firebase
  const updateMissingProducts = async (detectedProducts: any[]) => {
    try {
      console.log('🔄 Calculando productos missing basado en detección de Gemini...');
      console.log('📊 Productos detectados por Gemini:', detectedProducts);
      
      if (!cart) return;
      
      console.log('📦 Productos del cart:', cart.productos.map(p => ({ 
        producto: p.producto, 
        product_id: p.product_id, 
        cantidad_default: p.cantidad_default 
      })));
      
      // Obtener productos missing actuales
      const currentMissing = cart.missing || [];
      console.log('📋 Missing products actuales:', currentMissing);
      
      const missingProducts: MissingProduct[] = [...currentMissing];
      
      // Para cada producto detectado por Gemini, actualizar los missing existentes
      detectedProducts.forEach(detectedProduct => {
        const cartProduct = cart.productos.find(p => p.product_id === detectedProduct.product_id);
        if (!cartProduct) return;
        
        console.log(`\n🔍 Procesando producto detectado: ${cartProduct.producto} (${detectedProduct.quantity_mentioned} unidades)`);
        
        // Buscar si ya existe en missing
        const existingMissingIndex = missingProducts.findIndex(m => m.product_id === detectedProduct.product_id);
        
        if (existingMissingIndex >= 0) {
          // Ya existe en missing - actualizar cantidad
          const existingMissing = missingProducts[existingMissingIndex];
          const cantidadDetectada = detectedProduct.quantity_mentioned || 0;
          const cantidadDefault = cartProduct.cantidad_default;
          
          console.log(`📝 Actualizando missing existente: ${existingMissing.cantidad_missing} -> ${cantidadDefault - cantidadDetectada}`);
          
          if (cantidadDetectada >= cantidadDefault) {
            // Ya no falta - remover de missing
            missingProducts.splice(existingMissingIndex, 1);
            console.log(`✅ Producto completamente cubierto: ${cartProduct.producto} - Removido de missing`);
          } else {
            // Actualizar cantidad faltante
            const cantidadFaltante = cantidadDefault - cantidadDetectada;
            missingProducts[existingMissingIndex] = {
              ...existingMissing,
              cantidad_missing: cantidadFaltante,
              stock_found: cantidadDetectada
            };
            console.log(`⚠️ Actualizado: ${cartProduct.producto} - ${cantidadFaltante} unidades faltantes`);
          }
        } else {
          // No existe en missing - agregar si falta
          const cantidadDetectada = detectedProduct.quantity_mentioned || 0;
          const cantidadDefault = cartProduct.cantidad_default;
          
          if (cantidadDetectada < cantidadDefault) {
            const cantidadFaltante = cantidadDefault - cantidadDetectada;
            const missingEntry = {
              cantidad_missing: cantidadFaltante,
              marca: cartProduct.marca,
              presentacion: cartProduct.presentacion,
              product_id: cartProduct.product_id,
              producto: cartProduct.producto,
              stock_found: cantidadDetectada
            };
            missingProducts.push(missingEntry);
            console.log(`➕ Nuevo missing: ${cartProduct.producto} - ${cantidadFaltante} unidades faltantes`);
          } else {
            console.log(`✅ Producto completamente cubierto: ${cartProduct.producto}`);
          }
        }
      });
      
      console.log(`\n📋 Lista final de missing:`, missingProducts);
      
      // Actualizar el cart en Firebase
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: missingProducts,
        updated_at: new Date()
      });
      
      // Actualizar el estado local
      setCart(prev => prev ? {
        ...prev,
        missing: missingProducts,
        updated_at: new Date()
      } : null);
      
      console.log('✅ Productos missing actualizados en Firebase y estado local');
      
    } catch (error) {
      console.error('❌ Error actualizando missing products:', error);
    }
  };

  // Función para actualizar missing products desde corrección
  const updateMissingProductsFromCorrection = async (correctedMissing: MissingProduct[]) => {
    try {
      console.log('🔄 Actualizando missing products desde corrección...');
      console.log('📊 Missing products corregidos:', correctedMissing);
      
      if (!cart) return;
      
      // Actualizar el cart en Firebase
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: correctedMissing,
        updated_at: new Date()
      });
      
      // Actualizar el estado local
      setCart(prev => prev ? {
        ...prev,
        missing: correctedMissing,
        updated_at: new Date()
      } : null);
      
      console.log('✅ Missing products actualizados desde corrección');
      
    } catch (error) {
      console.error('❌ Error actualizando missing products desde corrección:', error);
    }
  };

  // Función para completar la fase de cleasing y pasar a la siguiente
  const completeCleasingPhase = async () => {
    console.log('✅ Cleasing completado');
    setCleasingCompleted(true);
    
    if (hasBottles) {
      console.log('🍾 Carrito tiene botellas alcohólicas, pasando a Control Bottles Waste...');
      setCurrentPhase('bottle-control');
      await updateCartStatus('Pesaje');
    } else {
      console.log('📝 Carrito sin botellas, pasando directamente a resultado final...');
      setCurrentPhase('finished');
      await updateCartStatus('Pick and pack');
    }
  };

  // Función para completar la fase de control de botellas
  const completeBottleControlPhase = async () => {
    console.log('✅ Control de botellas completado');
    setCurrentPhase('finished');
    await updateCartStatus('Pick and pack');
  };

  // Función para limpiar los missing products del carrito
  const clearMissingProducts = async () => {
    try {
      if (!cart) return;
      
      console.log('🗑️ Limpiando missing products...');
      
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: [],
        updated_at: new Date()
      });
      
      setCart(prev => prev ? {
        ...prev,
        missing: [],
        updated_at: new Date()
      } : null);
      
      console.log('✅ Missing products limpiados');
      
    } catch (error) {
      console.error('❌ Error limpiando missing products:', error);
    }
  };

  // Función para agregar producto manualmente a missing
  const addManualProductToMissing = async () => {
    try {
      if (!cart || !manualSelectedProduct || manualQuantity <= 0) {
        alert('Por favor selecciona un producto y una cantidad válida');
        return;
      }
      
      console.log('📝 Agregando producto manual a missing:', {
        producto: manualSelectedProduct.producto,
        cantidad: manualQuantity
      });
      
      const currentMissing = cart.missing || [];
      
      // Verificar si el producto ya existe en missing
      const existingIndex = currentMissing.findIndex(m => m.product_id === manualSelectedProduct.product_id);
      
      let updatedMissing: MissingProduct[];
      
      if (existingIndex >= 0) {
        // Si ya existe, actualizar la cantidad
        updatedMissing = [...currentMissing];
        updatedMissing[existingIndex] = {
          ...updatedMissing[existingIndex],
          cantidad_missing: updatedMissing[existingIndex].cantidad_missing + manualQuantity
        };
        console.log(`   Actualizando cantidad existente. Nueva cantidad: ${updatedMissing[existingIndex].cantidad_missing}`);
      } else {
        // Si no existe, agregar nuevo
        const newMissing: MissingProduct = {
          cantidad_missing: manualQuantity,
          marca: manualSelectedProduct.marca,
          presentacion: manualSelectedProduct.presentacion,
          product_id: manualSelectedProduct.product_id,
          producto: manualSelectedProduct.producto,
          stock_found: 0
        };
        updatedMissing = [...currentMissing, newMissing];
        console.log('   Agregando nuevo producto a missing');
      }
      
      // Actualizar en Firebase
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: updatedMissing,
        updated_at: new Date()
      });
      
      // Actualizar estado local
      setCart(prev => prev ? {
        ...prev,
        missing: updatedMissing,
        updated_at: new Date()
      } : null);
      
      console.log('✅ Producto agregado a missing manualmente');
      
      // Limpiar formulario
      setManualSelectedProduct(null);
      setManualQuantity(1);
      
      alert(`✅ ${manualSelectedProduct.producto} agregado a faltantes (${manualQuantity} unidades)`);
      
    } catch (error) {
      console.error('❌ Error agregando producto manual:', error);
      alert('Error al agregar el producto. Por favor intenta de nuevo.');
    }
  };

  // ============ FUNCIONES PARA CONTROL BOTTLES WASTE ============

  // Cargar catálogo de botellas cuando se entra a la fase de botellas
  useEffect(() => {
    if (currentPhase === 'bottle-control' && hasBottles) {
      loadBottleCatalog();
    }
  }, [currentPhase, hasBottles]);

  // Detectar pares de botellas combinables cuando foundBottles cambia
  useEffect(() => {
    if (foundBottles.length >= 2) {
      detectBottlePairs();
    }
  }, [foundBottles]);

  // Función para detectar pares de botellas que se pueden combinar
  const detectBottlePairs = () => {
    console.log('🔍 Detectando pares de botellas combinables...');
    
    const newPairs: BottlePair[] = [];
    const processedIndices = new Set<number>();

    for (let i = 0; i < foundBottles.length; i++) {
      if (processedIndices.has(i)) continue;

      const bottle1 = foundBottles[i];
      if (!bottle1.matchedProduct || !bottle1.porcentajeLiquido || !bottle1.mlRestantes) continue;

      // Verificar si la botella está en el rango de completar (25%-50%)
      const percentage1 = bottle1.porcentajeLiquido;
      if (percentage1 < BOTTLE_RULES.MIN_COMPLETION_THRESHOLD || 
          percentage1 > BOTTLE_RULES.MAX_COMPLETION_THRESHOLD) continue;

      // Buscar otra botella del mismo producto
      for (let j = i + 1; j < foundBottles.length; j++) {
        if (processedIndices.has(j)) continue;

        const bottle2 = foundBottles[j];
        if (!bottle2.matchedProduct || !bottle2.porcentajeLiquido || !bottle2.mlRestantes) continue;

        // Verificar si es el mismo producto
        if (bottle1.matchedProduct.id !== bottle2.matchedProduct.id) continue;

        const percentage2 = bottle2.porcentajeLiquido;
        
        // Verificar si la segunda botella también está en rango
        if (percentage2 < BOTTLE_RULES.MIN_COMPLETION_THRESHOLD || 
            percentage2 > BOTTLE_RULES.MAX_COMPLETION_THRESHOLD) continue;

        // Calcular si juntas alcanzan al menos 50%
        const combinedPercentage = percentage1 + percentage2;
        if (combinedPercentage < BOTTLE_RULES.REUSE_THRESHOLD) continue;

        const combinedML = (bottle1.mlRestantes || 0) + (bottle2.mlRestantes || 0);

        // Crear el par
        const pair: BottlePair = {
          id: `${bottle1.matchedProduct.id}-${Date.now()}-${i}-${j}`,
          bottle1,
          bottle2,
          combinedPercentage,
          combinedML,
          productId: bottle1.matchedProduct.id!,
          productName: bottle1.matchedProduct.nombre,
          timestamp: new Date()
        };

        newPairs.push(pair);
        processedIndices.add(i);
        processedIndices.add(j);
        
        console.log(`✅ Par detectado: ${pair.productName} (${percentage1}% + ${percentage2}% = ${combinedPercentage}%)`);
        break; // Solo emparejar una vez cada botella
      }
    }

    if (newPairs.length > 0) {
      setBottlePairs(prev => {
        // Evitar duplicados
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPairs = newPairs.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNewPairs];
      });
      console.log(`🎯 ${newPairs.length} par(es) detectado(s)`);
    }
  };

  // Función para combinar dos botellas
  const mergeBottles = async (pair: BottlePair) => {
    if (!pair.bottle1.matchedProduct) return;

    try {
      console.log(`🔄 Combinando botellas: ${pair.productName}`);
      
      // Actualizar foundBottles: actualizar bottle1 con los valores combinados y eliminar bottle2
      setFoundBottles(prev => prev.map(bottle => {
        if (bottle === pair.bottle1) {
          // Actualizar la primera botella con valores combinados
          return {
            ...bottle,
            porcentajeLiquido: pair.combinedPercentage,
            mlRestantes: pair.combinedML,
            label: `${pair.productName} (COMBINADA)`,
            confidence: Math.min((bottle.confidence || 50) + 10, 100),
            isMerged: true // Marcar como botella combinada
          };
        }
        return bottle;
      }).filter(bottle => bottle !== pair.bottle2)); // Eliminar la segunda botella

      // Eliminar el par de la lista
      setBottlePairs(prev => prev.filter(p => p.id !== pair.id));

      console.log(`✅ Botellas combinadas exitosamente`);
      alert(`✅ Botellas combinadas: ${pair.productName}\n${pair.bottle1.porcentajeLiquido}% + ${pair.bottle2.porcentajeLiquido}% = ${pair.combinedPercentage}%\nTotal: ${pair.combinedML}ml`);

    } catch (error) {
      console.error('❌ Error al combinar botellas:', error);
      alert('Error al combinar las botellas. Por favor intenta de nuevo.');
    }
  };

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
      querySnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        catalogData.push({
          id: docSnap.id,
          nombre: data.nombre || data.type_id || '',
          marca: data.marca || '',
          tipo: data.tipo || '',
          volumen_ml: data.volumen_ml || 0,
          precio_unitario: data.precio_unitario || 0,
          contenido_alcohol_porcentaje: data.contenido_alcohol_porcentaje || 0,
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
      setBottleCatalog(catalogData);
    } catch (error) {
      console.error('❌ Error loading catalog:', error);
    }
  };

  // Activar cámara
  const startBottleCamera = async () => {
    try {
      console.log('📷 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          frameRate: { ideal: 20, max: 24 } // FPS moderado para mejor rendimiento
        } 
      });
      
      streamRef.current = stream;
      setIsCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          // Configurar el video para mejor rendimiento
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play()
            .then(() => {
              console.log('✅ Video playing');
              startBottleDetection();
            })
            .catch((error) => console.error('Error playing video:', error));
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error starting camera:', error);
      alert('No se pudo acceder a la cámara. Por favor verifica los permisos.');
    }
  };

  // Detener cámara
  const stopBottleCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsDetecting(false);
    setCountdown(6);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      setIsCameraActive(false);
      setDetectedBottles([]);
      console.log('📷 Cámara detenida');
    }
  };

  // Iniciar detección
  const startBottleDetection = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setGeminiError('⚠️ API Key de Gemini no configurada');
      return;
    }

    setIsDetecting(true);
    setGeminiError(null);
    setCountdown(6);
    console.log('🔍 Iniciando detección con Gemini...');
    console.log('⏱️ Primera captura en 6 segundos...');
    
    // Countdown visual cada segundo
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 6; // Reiniciar countdown
        }
        return prev - 1;
      });
    }, 1000);
    
    // Detectar cada 6 segundos, SIN llamada inmediata
    detectionIntervalRef.current = window.setInterval(() => {
      console.log('📸 Capturando fotograma y enviando a Gemini...');
      detectBottlesWithGemini();
    }, 6000);
  };

  // Capturar frame del video
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== 4) return null;
    
    // Usar dimensiones reducidas para mejor rendimiento
    const targetWidth = 800;
    const targetHeight = 600;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    
    if (!ctx) return null;
    
    // Limpiar canvas antes de dibujar
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    
    // Dibujar imagen redimensionada
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    
    // Comprimir más para reducir carga
    const imageData = canvas.toDataURL('image/jpeg', 0.5);
    
    // Limpiar canvas después de capturar
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    
    return imageData;
  };

  // Detectar botellas con Gemini
  const detectBottlesWithGemini = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < 6000) return;

    try {
      const frameData = captureFrame();
      if (!frameData) {
        console.log('⚠️ No se pudo capturar frame');
        return;
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return;

      lastRequestTime.current = now;
      console.log('📡 Enviando a Gemini API...');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: { temperature: 0.1 }
      });

      const base64Data = frameData.split(',')[1];
      
      const prompt = `ANÁLISIS DE IMAGEN: Busca ESPECÍFICAMENTE:

🔴 PRIORIDAD 1: PESO EN BÁSCULA/DISPLAY DIGITAL
- Busca números en displays digitales, pantallas LCD, básculas
- Números de 3-4 dígitos (ej: 950, 1200, 475)
- Símbolos como "g", "gr", "grams"
- Reporta en "scaleWeight"

🔴 PRIORIDAD 2: BOTELLAS DE ALCOHOL
- MARCA específica (Jack Daniel's, Absolut, Bacardi, etc)
- NOMBRE del producto
- TIPO de licor (whiskey, vodka, rum, tequila, gin)
- VOLUMEN si visible (750ml, 1L, 1.75L)

Formato JSON:
{
  "scaleWeight": número en gramos o null,
  "bottles": [
    {
      "label": "descripción completa",
      "brand": "marca",
      "productName": "nombre",
      "type": "tipo",
      "volume": "volumen",
      "confidence": 0-100
    }
  ]
}

Si NO ves nada: {"scaleWeight": null, "bottles": []}
Responde SOLO con el JSON.`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
      ]);

      const response = await result.response;
      const text = response.text();
      
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanText);
      const scaleWeight = parsed.scaleWeight ? parseFloat(parsed.scaleWeight) : null;
      
      if (scaleWeight) {
        console.log(`⚖️ Peso detectado: ${scaleWeight}g`);
      }
      
      if (parsed.bottles && Array.isArray(parsed.bottles)) {
        const bottlesWithMatches = parsed.bottles.map((bottle: any) => {
          const match = matchBottleWithDatabase(
            bottle.label,
            bottle.brand,
            bottle.productName,
            bottle.type
          );
          
          let porcentajeLiquido = undefined;
          let mlRestantes = undefined;
          
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
            
            console.log(`📊 ${match.product.nombre}: ${porcentajeLiquido}% (${mlRestantes}ml)`);
          }
          
          return {
            label: bottle.label,
            brand: bottle.brand,
            productName: bottle.productName,
            type: bottle.type,
            volume: bottle.volume,
            confidence: bottle.confidence || 50,
            matchedProduct: match.product,
            matchScore: match.score,
            pesoDetectado: scaleWeight || undefined,
            porcentajeLiquido,
            mlRestantes
          };
        });

        setDetectedBottles(bottlesWithMatches);
        setGeminiError(null);
        
        if (bottlesWithMatches.length > 0) {
          const matchedBottles = bottlesWithMatches.filter((b: DetectedBottle) => b.matchedProduct);
          if (matchedBottles.length > 0) {
            console.log(`✅ ${matchedBottles.length} botella(s) detectada(s) y agregada(s)`);
            
            // Auto-agregar botellas <25% a faltantes
            const bottlesToDiscard = matchedBottles.filter(
              (b: DetectedBottle) => b.porcentajeLiquido !== undefined && b.porcentajeLiquido < BOTTLE_RULES.DISCARD_THRESHOLD
            );
            
            if (bottlesToDiscard.length > 0) {
              console.log(`🗑️ Auto-descartando ${bottlesToDiscard.length} botella(s) <25%`);
              bottlesToDiscard.forEach((bottle: DetectedBottle) => {
                // No esperar, ejecutar async
                addDiscardedBottleToMissing(bottle, true); // true = auto mode
              });
            }
            
            setFoundBottles(prev => [...prev, ...matchedBottles]);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error con Gemini:', error);
      setGeminiError('❌ Error de conexión con Gemini');
    } finally {
      // Forzar liberación de memoria
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    }
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

    const normalizedLabel = detectedLabel.toLowerCase().trim();
    const normalizedBrand = (detectedBrand || '').toLowerCase().trim();
    const normalizedProductName = (detectedProductName || '').toLowerCase().trim();
    const normalizedType = (detectedType || '').toLowerCase().trim();
    
    let bestMatch: AlcoholBottle | null = null;
    let bestScore = 0;

    bottleCatalog.forEach(product => {
      let score = 0;
      
      const productName = (product.nombre || '').toLowerCase();
      const productBrand = (product.marca || '').toLowerCase();
      const productType = (product.tipo || '').toLowerCase();

      // Coincidencia de marca
      if (normalizedBrand && productBrand) {
        if (productBrand === normalizedBrand) {
          score += 150;
        } else if (productBrand.includes(normalizedBrand) || normalizedBrand.includes(productBrand)) {
          score += 100;
        }
      }

      // Coincidencia de nombre
      if (normalizedProductName && productName) {
        if (productName.includes(normalizedProductName) || normalizedProductName.includes(productName)) {
          score += 80;
        }
      }

      // Coincidencia de tipo
      if (normalizedType && productType) {
        if (productType.includes(normalizedType) || normalizedType.includes(productType)) {
          score += 50;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
      }
    });

    if (bestScore < 50) {
      return { product: null, score: 0 };
    }

    return { product: bestMatch, score: bestScore };
  };

  // Agregar botella descartada a missing
  const addDiscardedBottleToMissing = async (bottle: DetectedBottle, autoMode = false) => {
    if (!cart || !bottle.matchedProduct) return;
    
    try {
      console.log(`🗑️ ${autoMode ? 'Auto-agregando' : 'Agregando'} botella descartada a missing:`, bottle.matchedProduct.nombre);
      
      const currentMissing = cart.missing || [];
      const existingIndex = currentMissing.findIndex(m => m.product_id === bottle.matchedProduct!.id);
      
      let updatedMissing: MissingProduct[];
      
      if (existingIndex >= 0) {
        updatedMissing = [...currentMissing];
        updatedMissing[existingIndex] = {
          ...updatedMissing[existingIndex],
          cantidad_missing: updatedMissing[existingIndex].cantidad_missing + 1
        };
      } else {
        const newMissing: MissingProduct = {
          cantidad_missing: 1,
          marca: bottle.matchedProduct.marca,
          presentacion: `${bottle.matchedProduct.volumen_ml} ml`,
          product_id: bottle.matchedProduct.id,
          producto: bottle.matchedProduct.nombre,
          stock_found: 0
        };
        updatedMissing = [...currentMissing, newMissing];
      }
      
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: updatedMissing,
        updated_at: new Date()
      });
      
      setCart(prev => prev ? {
        ...prev,
        missing: updatedMissing,
        updated_at: new Date()
      } : null);
      
      // NO remover de foundBottles - mantenerla visible para referencia
      // Las botellas descartadas se quedan en la lista para que el usuario vea su info
      
      console.log(`✅ Botella descartada ${autoMode ? 'auto-agregada' : 'agregada'} a missing (permanece visible)`);
    } catch (error) {
      console.error('❌ Error agregando botella descartada:', error);
    }
  };

  // Cleanup de cámara al desmontar o cambiar de fase
  useEffect(() => {
    return () => {
      if (currentPhase !== 'bottle-control') {
        stopBottleCamera();
      }
    };
  }, [currentPhase]);

  // ============ FIN FUNCIONES CONTROL BOTTLES WASTE ============

  // Función para agregar producto unknown a missing
  const addUnknownToMissing = async () => {
    try {
      if (!cart || !selectedCartProduct) return;
      
      const productToAdd: MissingProduct = {
        cantidad_missing: unknownQuantity,
        marca: selectedCartProduct.marca,
        presentacion: selectedCartProduct.presentacion,
        product_id: selectedCartProduct.product_id,
        producto: selectedCartProduct.producto,
        stock_found: 0
      };
      
      // Actualizar Firebase
      const cartRef = doc(db, 'carts', cart.id);
      const updatedMissing = [...cart.missing, productToAdd];
      
      await updateDoc(cartRef, {
        missing: updatedMissing,
        updated_at: new Date()
      });
      
      // Actualizar estado local
      setCart(prev => prev ? {
        ...prev,
        missing: updatedMissing,
        updated_at: new Date()
      } : null);
      
      // Limpiar formulario
      setSelectedCartProduct(null);
      setUnknownQuantity(1);
      
      console.log('✅ Producto unknown agregado:', productToAdd);
      
    } catch (error) {
      console.error('❌ Error agregando producto unknown:', error);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!cart) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cart no encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  El cart con ID "{cartId}" no existe o fue eliminado.
                </p>
                <Button onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Pick & Pack
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {cart.nombre}
                </h1>
                <p className="text-muted-foreground">
                  Detalles completos del carrito de catering
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Estado:</span>
              <Badge className={`text-lg px-4 py-2 font-bold ${
                cart.status === 'Limpieza' ? 'bg-blue-600 hover:bg-blue-700' :
                cart.status === 'Pesaje' ? 'bg-orange-600 hover:bg-orange-700' :
                cart.status === 'Pick and pack' ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-green-600 hover:bg-green-700'
              }`}>
                {cart.status === 'Limpieza' && '🧹'}
                {cart.status === 'Pesaje' && '⚖️'}
                {cart.status === 'Pick and pack' && '📦'}
                {cart.status === 'Avión' && '✈️'}
                {' '}
                {cart.status}
              </Badge>
            </div>
          </div>

          {/* Indicador de Progreso de Fases */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {/* Fase 1: Cleasing */}
                <div className="flex-1 flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentPhase === 'cleasing' ? 'bg-blue-600 text-white' : 
                    cleasingCompleted ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {cleasingCompleted ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold">1</span>}
                  </div>
                  <div className="ml-3">
                    <p className={`font-semibold ${currentPhase === 'cleasing' ? 'text-blue-900' : 'text-gray-700'}`}>
                      Cleasing por Voz
                    </p>
                    <p className="text-xs text-gray-600">Agregar productos faltantes</p>
                  </div>
                </div>

                {/* Línea conectora */}
                <div className={`flex-1 h-1 mx-4 ${
                  cleasingCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />

                {/* Fase 2: Control Bottles Waste (solo si tiene botellas) */}
                {hasBottles && (
                  <>
                    <div className="flex-1 flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        currentPhase === 'bottle-control' ? 'bg-orange-600 text-white' : 
                        currentPhase === 'finished' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {currentPhase === 'finished' ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold">2</span>}
                      </div>
                      <div className="ml-3">
                        <p className={`font-semibold ${currentPhase === 'bottle-control' ? 'text-orange-900' : 'text-gray-700'}`}>
                          Control Bottles Waste
                        </p>
                        <p className="text-xs text-gray-600">Clasificar botellas</p>
                      </div>
                    </div>

                    {/* Línea conectora */}
                    <div className={`flex-1 h-1 mx-4 ${
                      currentPhase === 'finished' ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  </>
                )}

                {/* Fase Final: Resultado */}
                <div className="flex-1 flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentPhase === 'finished' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    <span className="font-bold">{hasBottles ? '3' : '2'}</span>
                  </div>
                  <div className="ml-3">
                    <p className={`font-semibold ${currentPhase === 'finished' ? 'text-green-900' : 'text-gray-700'}`}>
                      Finalizado
                    </p>
                    <p className="text-xs text-gray-600">Registro completo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenido según la fase actual */}
          {currentPhase === 'cleasing' && (
            <>
              {/* Botón principal de Cleasing */}
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`text-lg px-8 py-4 h-auto ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  disabled={isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-6 h-6 mr-3" />
                  ) : (
                    <Mic className="w-6 h-6 mr-3" />
                  )}
                  {isProcessing ? 'Procesando...' : isRecording ? 'Detener Grabación' : 'Iniciar Cleansing'}
                </Button>

                {/* Botón para mostrar formulario manual */}
                <Button 
                  onClick={() => setShowManualForm(!showManualForm)}
                  variant="outline"
                  className="text-lg px-6 py-4 h-auto"
                  size="lg"
                >
                  <Package className="w-5 h-5 mr-2" />
                  {showManualForm ? 'Ocultar' : 'Agregar'} Manual
                </Button>
              </div>

              {/* Formulario Manual para agregar productos */}
              {showManualForm && (
                <Card className="border-2 border-blue-300 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Package className="h-6 w-6" />
                      Formulario Manual - Agregar Productos Faltantes
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      {voiceError ? (
                        <span className="text-red-600 font-semibold">
                          ⚠️ El reconocimiento de voz falló. Usa este formulario para agregar productos manualmente.
                        </span>
                      ) : (
                        'Selecciona productos del carrito y especifica la cantidad faltante'
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selector de producto */}
                    <div>
                      <Label htmlFor="manual-product" className="text-sm font-semibold mb-2 block">
                        Seleccionar Producto:
                      </Label>
                      <Select 
                        value={manualSelectedProduct?.product_id || ''}
                        onValueChange={(value) => {
                          const product = cart?.productos.find(p => p.product_id === value);
                          if (product) {
                            setManualSelectedProduct(product);
                            setManualQuantity(1);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Selecciona un producto del carrito..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {cart?.productos.map((product) => (
                            <SelectItem key={product.product_id} value={product.product_id}>
                              <div className="flex flex-col">
                                <span className="font-semibold">{product.producto}</span>
                                <span className="text-xs text-gray-600">
                                  {product.marca} • {product.presentacion} • Cant. default: {product.cantidad_default}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Vista del producto seleccionado */}
                    {manualSelectedProduct && (
                      <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Producto Seleccionado:</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-600">Nombre:</p>
                            <p className="font-semibold">{manualSelectedProduct.producto}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Marca:</p>
                            <p className="font-semibold">{manualSelectedProduct.marca}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Presentación:</p>
                            <p className="font-semibold">{manualSelectedProduct.presentacion}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Cantidad Default:</p>
                            <p className="font-semibold">{manualSelectedProduct.cantidad_default}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Input de cantidad */}
                    {manualSelectedProduct && (
                      <div>
                        <Label htmlFor="manual-quantity" className="text-sm font-semibold mb-2 block">
                          Cantidad Faltante:
                        </Label>
                        <Input
                          id="manual-quantity"
                          type="number"
                          min="1"
                          value={manualQuantity}
                          onChange={(e) => setManualQuantity(parseInt(e.target.value) || 1)}
                          className="bg-white text-lg font-semibold"
                          placeholder="Cantidad faltante..."
                        />
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={addManualProductToMissing}
                        disabled={!manualSelectedProduct || manualQuantity <= 0}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Agregar a Faltantes
                      </Button>
                      <Button
                        onClick={() => {
                          setManualSelectedProduct(null);
                          setManualQuantity(1);
                          setShowManualForm(false);
                          setVoiceError(null);
                        }}
                        variant="outline"
                        size="lg"
                      >
                        Cerrar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{cart.descripcion}</p>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos del Cart</CardTitle>
              <CardDescription>
                Lista completa de productos incluidos en este cart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.productos.map((producto, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{producto.producto}</h4>
                      <p className="text-sm text-muted-foreground">
                        {producto.marca} - {producto.presentacion}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{producto.cantidad_default} unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Productos Faltantes */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Faltantes</CardTitle>
              <CardDescription>
                Productos que están marcados como faltantes o no disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.missing.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No hay productos faltantes</p>
                  <p className="text-sm">Todos los productos están disponibles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.missing.map((missing, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <div className="text-red-800 font-medium">
                          <div className="font-semibold">{missing.producto}</div>
                          <div className="text-sm text-red-600">
                            {missing.marca} - {missing.presentacion}
                          </div>
                          <div className="text-sm">
                            Faltan: {missing.cantidad_missing} unidades | 
                            Encontradas: {missing.stock_found} unidades
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón de Correcciones Finales */}
          {cart.missing.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Correcciones Finales</CardTitle>
                <CardDescription>
                  Graba correcciones para ajustar los productos faltantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button
                    onClick={isCorrectionRecording ? stopCorrectionRecording : startCorrectionRecording}
                    className={`text-lg px-8 py-4 h-auto ${
                      isCorrectionRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={isCorrectionProcessing}
                    size="lg"
                  >
                    {isCorrectionProcessing ? (
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    ) : isCorrectionRecording ? (
                      <MicOff className="w-6 h-6 mr-3" />
                    ) : (
                      <Mic className="w-6 h-6 mr-3" />
                    )}
                    {isCorrectionProcessing ? 'Procesando Corrección...' : isCorrectionRecording ? 'Detener Corrección' : 'Iniciar Corrección'}
                  </Button>
                </div>
                {correctionTranscript && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Corrección grabada:</strong> {correctionTranscript}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botón para completar cleasing y pasar a la siguiente fase */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={completeCleasingPhase}
              className="text-lg px-12 py-6 h-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              size="lg"
            >
              <CheckCircle className="w-6 h-6 mr-3" />
              Completar Cleasing{hasBottles && ' y Pasar a Control de Botellas'}
            </Button>
          </div>
        </>
          )}

          {/* Fase 2: Control Bottles Waste */}
          {currentPhase === 'bottle-control' && hasBottles && (
            <>
              {/* Header con botón de cámara */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-orange-900">🍾 Control Bottles Waste</h2>
                  <p className="text-orange-700">
                    Escanea las botellas con la cámara y báscula para clasificarlas
                  </p>
                </div>
                <Button 
                  onClick={isCameraActive ? stopBottleCamera : startBottleCamera}
                  className={`text-lg px-6 py-4 ${
                    isCameraActive 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  size="lg"
                >
                  {isCameraActive ? (
                    <><CameraOff className="w-5 h-5 mr-2" /> Detener Cámara</>
                  ) : (
                    <><Camera className="w-5 h-5 mr-2" /> Activar Cámara</>
                  )}
                </Button>
              </div>


              {/* Vista de cámara */}
              {isCameraActive && (
                <Card className="bg-black max-w-3xl mx-auto">
                  <CardContent className="p-4">
                    <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ maxHeight: '500px' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto"
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                      {geminiError && (
                        <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
                          {geminiError}
                        </div>
                      )}
                      {isDetecting && !geminiError && (
                        <>
                          {/* Indicador de detección activa */}
                          <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            Detectando activo
                          </div>
                          
                          {/* Contador de próxima captura */}
                          <div className="absolute top-4 left-4 bg-blue-600/90 text-white px-4 py-3 rounded-lg shadow-lg">
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-medium mb-1">Próxima captura en:</div>
                              <div className="text-3xl font-bold tabular-nums">
                                {countdown}s
                              </div>
                            </div>
                          </div>
                          
                          {/* Animación cuando countdown llega a 1 */}
                          {countdown === 1 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 animate-ping">
                                <Camera className="w-12 h-12 text-white" />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pares de botellas combinables */}
              {bottlePairs.length > 0 && (
                <Card className="border-4 border-blue-500 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">
                      💡 Botellas que se Pueden Combinar ({bottlePairs.length})
                    </CardTitle>
                    <CardDescription className="text-blue-700 font-medium">
                      Se detectaron botellas del mismo producto que juntas pueden formar una botella completa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bottlePairs.map((pair) => (
                        <Card key={pair.id} className="border-2 border-blue-300 bg-white shadow-lg">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                              {/* Botella 1 */}
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-orange-500 border-4 border-orange-300 flex items-center justify-center mb-2">
                                  <span className="text-xl font-bold text-white">{pair.bottle1.porcentajeLiquido}%</span>
                                </div>
                                <p className="text-sm text-center font-medium">{pair.productName}</p>
                                <p className="text-xs text-gray-600 text-center">{pair.bottle1.mlRestantes}ml</p>
                              </div>

                              {/* Operación */}
                              <div className="flex flex-col items-center">
                                <div className="text-4xl mb-2">➕</div>
                                <div className="w-16 h-16 rounded-full bg-orange-500 border-4 border-orange-300 flex items-center justify-center mb-2">
                                  <span className="text-xl font-bold text-white">{pair.bottle2.porcentajeLiquido}%</span>
                                </div>
                                <p className="text-xs text-gray-600 text-center">{pair.bottle2.mlRestantes}ml</p>
                              </div>

                              {/* Resultado */}
                              <div className="flex flex-col items-center">
                                <div className="text-4xl mb-2">🟰</div>
                                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-2 ${
                                  pair.combinedPercentage >= BOTTLE_RULES.REUSE_THRESHOLD
                                    ? 'bg-green-500 border-green-300'
                                    : 'bg-orange-500 border-orange-300'
                                }`}>
                                  <span className="text-2xl font-bold text-white">{pair.combinedPercentage.toFixed(0)}%</span>
                                </div>
                                <p className="text-sm font-bold text-center text-green-700">¡Botella Completa!</p>
                                <p className="text-xs text-gray-600 text-center">{pair.combinedML.toFixed(0)}ml totales</p>
                              </div>
                            </div>

                            {/* Botón de acción */}
                            <div className="mt-4">
                              <Button
                                onClick={() => mergeBottles(pair)}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6"
                                size="lg"
                              >
                                <Wine className="w-5 h-5 mr-2" />
                                Juntar estas 2 Botellas en 1
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botellas escaneadas */}
              {foundBottles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Botellas Escaneadas ({foundBottles.length})</CardTitle>
                    <CardDescription>
                      Clasifica cada botella según su nivel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {foundBottles.map((bottle, index) => (
                        <Card key={index} className={`border-2 ${bottle.isMerged ? 'border-purple-500 bg-purple-50' : 'border-orange-200'}`}>
                          <CardHeader className="pb-3">
                            {/* Badge especial para botellas combinadas */}
                            {bottle.isMerged && (
                              <Badge className="mb-2 w-full justify-center bg-purple-600 text-white font-bold py-1">
                                ⚗️ 2 BOTELLAS COMBINADAS EN 1
                              </Badge>
                            )}
                            
                            {bottle.porcentajeLiquido !== undefined ? (
                              <div className="flex justify-center">
                                <div className={`inline-flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${
                                  bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD
                                    ? 'bg-green-500 border-green-300'
                                    : bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD
                                    ? 'bg-orange-500 border-orange-300'
                                    : 'bg-red-500 border-red-300'
                                }`}>
                                  <span className="text-2xl font-bold text-white">{bottle.porcentajeLiquido}%</span>
                                </div>
                              </div>
                            ) : (
                              <Wine className="h-12 w-12 mx-auto text-orange-600" />
                            )}
                          </CardHeader>
                          <CardContent>
                            {bottle.matchedProduct && (
                              <div className="space-y-2">
                                <h3 className="font-bold text-center">{bottle.matchedProduct.nombre}</h3>
                                <p className="text-sm text-center text-gray-600">
                                  {bottle.matchedProduct.marca} • {bottle.matchedProduct.volumen_ml}ml
                                </p>
                                
                                {bottle.porcentajeLiquido !== undefined && bottle.mlRestantes !== undefined ? (
                                  <>
                                    <div className="text-center py-2 bg-gray-100 rounded">
                                      <p className="text-xs text-gray-600">ML Restantes</p>
                                      <p className="text-lg font-bold">{bottle.mlRestantes}ml</p>
                                    </div>
                                    
                                    {/* Acción */}
                                    {bottle.porcentajeLiquido > BOTTLE_RULES.REUSE_THRESHOLD ? (
                                      <Badge className="w-full justify-center bg-green-600 py-2">
                                        ♻️ REUTILIZAR
                                      </Badge>
                                    ) : bottle.porcentajeLiquido >= BOTTLE_RULES.MIN_COMPLETION_THRESHOLD ? (
                                      <Badge className="w-full justify-center bg-orange-600 py-2">
                                        🔄 COMPLETAR
                                      </Badge>
                                    ) : (
                                      <Badge className="w-full justify-center bg-red-600 py-2">
                                        🗑️ AGREGADO AUTOMÁTICAMENTE A FALTANTES
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-xs text-center text-red-600">
                                    Faltan datos de peso
                                  </p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Productos Faltantes en este Carrito */}
              {cart && cart.missing && cart.missing.length > 0 && (
                <Card className="border-2 border-red-500 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6" />
                      Productos Faltantes en este Carrito ({cart.missing.length})
                    </CardTitle>
                    <CardDescription className="text-red-700 font-medium">
                      Botellas que han sido descartadas y necesitan reposición
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cart.missing.map((item, index) => (
                        <Card key={index} className="border border-red-300 bg-white">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{item.producto}</h4>
                                <p className="text-sm text-gray-600">
                                  {item.marca} • {item.presentacion}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="destructive" className="text-lg px-4 py-2">
                                  {item.cantidad_missing} {item.cantidad_missing === 1 ? 'unidad' : 'unidades'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botón para completar fase */}
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    stopBottleCamera();
                    completeBottleControlPhase();
                  }}
                  className="text-lg px-12 py-6 h-auto bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white"
                  size="lg"
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Finalizar Control de Botellas
                </Button>
              </div>
            </>
          )}

          {/* Fase Final: Resultado y resumen */}
          {currentPhase === 'finished' && (
            <>
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 rounded-full p-3">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-green-900">
                        ¡Proceso Completado!
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        El cleasing del carrito ha finalizado exitosamente
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Registro de Faltantes */}
              <Card>
                <CardHeader>
                  <CardTitle>📋 Registro Completo de Productos Faltantes</CardTitle>
                  <CardDescription>
                    Lista final de productos que necesitan ser reabastecidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cart.missing.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p className="text-lg font-semibold">¡Todo completo!</p>
                      <p>No hay productos faltantes en este carrito</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-6">
                        {cart.missing.map((missing, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-red-600 rounded-full p-2">
                                <AlertCircle className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-bold text-red-900">{missing.producto}</div>
                                <div className="text-sm text-red-700">
                                  {missing.marca} - {missing.presentacion}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">
                                {missing.cantidad_missing}
                              </div>
                              <div className="text-xs text-red-500">unidades faltantes</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resumen */}
                      <div className="bg-gray-100 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total de productos faltantes:</span>
                          <span className="text-2xl font-bold text-red-600">{cart.missing.length}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-semibold">Total de unidades faltantes:</span>
                          <span className="text-2xl font-bold text-red-600">
                            {cart.missing.reduce((sum, m) => sum + m.cantidad_missing, 0)}
                          </span>
                        </div>
                      </div>

                    </>
                  )}
                </CardContent>
              </Card>

              {/* Botón para volver */}
              <div className="flex justify-center">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="text-lg px-8 py-4"
                  size="lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Volver a Pick & Pack
                </Button>
              </div>
            </>
          )}

        </div>
      </SidebarInset>
      
      {/* Diálogo para productos unknown */}
      <Dialog open={showUnknownDialog} onOpenChange={setShowUnknownDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Productos No Reconocidos</DialogTitle>
            <DialogDescription>
              Los siguientes productos no pudieron ser identificados automáticamente. 
              Puedes agregarlos manualmente a la lista de faltantes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Lista de productos unknown */}
            <div>
              <Label className="text-sm font-medium">Productos detectados:</Label>
              <div className="mt-2 space-y-2">
                {unknownProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-yellow-800 font-medium">{product}</span>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value) => {
                        const cartProduct = cart?.productos.find(p => p.product_id === value);
                        if (cartProduct) {
                          setSelectedCartProduct(cartProduct);
                          setUnknownQuantity(1);
                        }
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {cart?.productos.map((cartProduct) => (
                            <SelectItem key={cartProduct.product_id} value={cartProduct.product_id}>
                              {cartProduct.producto} ({cartProduct.marca})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Formulario para agregar producto */}
            {selectedCartProduct && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Agregar a faltantes:</Label>
                <div className="mt-2 space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="font-semibold">Producto seleccionado:</div>
                      <div>{selectedCartProduct.producto} ({selectedCartProduct.marca})</div>
                      <div className="text-xs text-blue-600">
                        {selectedCartProduct.presentacion} | Cantidad por defecto: {selectedCartProduct.cantidad_default}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Cantidad faltante:</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={unknownQuantity}
                      onChange={(e) => setUnknownQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Cantidad faltante"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={addUnknownToMissing}>
                      Agregar a Faltantes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCartProduct(null);
                        setUnknownQuantity(1);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex justify-between pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUnknownDialog(false);
                  setUnknownProducts([]);
                  setSelectedCartProduct(null);
                }}
              >
                Cerrar
              </Button>
              <Button 
                onClick={() => {
                  // Cerrar diálogo y limpiar completamente
                  setShowUnknownDialog(false);
                  setUnknownProducts([]);
                  setSelectedCartProduct(null);
                  setUnknownQuantity(1);
                  
                  // Esperar un poco para que el diálogo se cierre completamente
                  setTimeout(() => {
                    console.log('🔄 Iniciando nueva grabación después de limpiar diálogo...');
                    startRecording();
                  }, 1000);
                }}
              >
                Repetir Grabación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
