import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  MapPin,
  Plane
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useNavigation } from '../contexts/NavigationContext';

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

interface Cart {
  id: string;
  nombre: string;
  descripcion: string;
  productos: CartProduct[];
  total_productos: number;
  missing: MissingProduct[];
  tipo: string;
  activo: boolean;
  created_at: any;
  updated_at: any;
}

interface CartDetailsPageProps {
  cartId: string;
  onBack: () => void;
}

export default function CartDetailsPage({ cartId, onBack }: CartDetailsPageProps) {
  const { navigate } = useNavigation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          
          setCart(cartData);
          
          console.log('✅ Cart loaded:', cartData.nombre);
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

  // Función para mandar a vuelo (borrar todos los missing)
  const sendToFlight = async () => {
    try {
      if (!cart) return;

      console.log('✈️ Enviando cart a vuelo - limpiando productos missing...');

      // Actualizar Firebase eliminando todos los missing
      const cartRef = doc(db, 'carts', cart.id);
      await updateDoc(cartRef, {
        missing: [],
        updated_at: new Date()
      });

      // Actualizar estado local
      setCart(prev => prev ? {
        ...prev,
        missing: [],
        updated_at: new Date()
      } : null);

      console.log('✅ Cart enviado a vuelo - productos missing eliminados');

    } catch (error) {
      console.error('❌ Error enviando cart a vuelo:', error);
    }
  };

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
              
              <Button 
                onClick={() => navigate('cart-map', { cartId: cartId })}
                className="text-lg px-8 py-4 h-auto bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <MapPin className="w-6 h-6 mr-3" />
                Ver Mapa
              </Button>
            </div>
          </div>

          {/* Información General Simplificada */}
          <div className="flex justify-center">
            <Card className="w-fit">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tipo de Cart</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={`${getTypeColor(cart.tipo)} flex items-center gap-1 w-fit`}>
                  {getTypeIcon(cart.tipo)}
                  {cart.tipo}
                </Badge>
              </CardContent>
            </Card>
          </div>

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

          {/* Botón Mandar a Vuelo */}
          {cart.missing.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Envío a Vuelo
                </CardTitle>
                <CardDescription>
                  Marca el cart como completado y elimina todos los productos faltantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button
                    onClick={sendToFlight}
                    className="text-lg px-8 py-4 h-auto bg-orange-600 hover:bg-orange-700 text-white"
                    size="lg"
                  >
                    <Plane className="w-6 h-6 mr-3" />
                    Mandar a Vuelo
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente todos los productos faltantes del cart.
                  </p>
                </div>
              </CardContent>
            </Card>
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
