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
  CheckCircle
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

interface Cart {
  id: string;
  nombre: string;
  descripcion: string;
  productos: CartProduct[];
  total_productos: number;
  missing: string[];
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
  const [selectedUnknownProduct, setSelectedUnknownProduct] = useState<string>('');
  const [unknownQuantity, setUnknownQuantity] = useState<number>(1);

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

      // Limpiar resultados anteriores
      setCurrentTranscript('');
      setIsRecording(true);

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

  const processWithGemini = async (transcriptText: string) => {
    try {
      console.log('🤖 Procesando con Gemini...');
      
      const genAI = new GoogleGenerativeAI('AIzaSyAYv2vcqi_KiLwL811RzLqTNaRpvWoRsqg');
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
        setUnknownProducts(jsonResult.unknown);
        setShowUnknownDialog(true);
      }
      
    } catch (error) {
      console.error('❌ Error con Gemini:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para actualizar productos missing en Firebase
  const updateMissingProducts = async (detectedProducts: any[]) => {
    try {
      console.log('🔄 Calculando productos missing basado en detección de Gemini...');
      
      if (!cart) return;
      
      const missingProducts: string[] = [];
      
      // Para cada producto del cart, verificar si fue detectado por Gemini
      cart.productos.forEach(cartProduct => {
        const detectedProduct = detectedProducts.find(detected => 
          detected.product_id === cartProduct.product_id
        );
        
        if (!detectedProduct) {
          // Producto no detectado por Gemini - va completo a missing
          missingProducts.push(`${cartProduct.producto} (${cartProduct.marca}) - ${cartProduct.cantidad_default} unidades`);
          console.log(`❌ Producto no detectado: ${cartProduct.producto}`);
        } else {
          // Producto detectado - calcular diferencia
          const cantidadDetectada = detectedProduct.quantity_mentioned || 0;
          const cantidadDefault = cartProduct.cantidad_default;
          
          if (cantidadDetectada < cantidadDefault) {
            // Faltan unidades - agregar la diferencia a missing
            const cantidadFaltante = cantidadDefault - cantidadDetectada;
            missingProducts.push(`${cartProduct.producto} (${cartProduct.marca}) - ${cantidadFaltante} unidades faltantes`);
            console.log(`⚠️ Producto parcialmente detectado: ${cartProduct.producto} - Faltan ${cantidadFaltante} unidades`);
          } else {
            console.log(`✅ Producto completamente detectado: ${cartProduct.producto}`);
          }
        }
      });
      
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
      
      console.log('✅ Productos missing calculados:', missingProducts);
      
    } catch (error) {
      console.error('❌ Error actualizando missing products:', error);
    }
  };

  // Función para agregar producto unknown a missing
  const addUnknownToMissing = async () => {
    try {
      if (!cart || !selectedUnknownProduct) return;
      
      const productToAdd = `${selectedUnknownProduct} - ${unknownQuantity} unidades`;
      
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
      setSelectedUnknownProduct('');
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
            <div className="flex justify-center">
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
                        <span className="text-red-800 font-medium">{missing}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUnknownProduct(product);
                        setUnknownQuantity(1);
                      }}
                    >
                      Seleccionar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Formulario para agregar producto */}
            {selectedUnknownProduct && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Agregar a faltantes:</Label>
                <div className="mt-2 space-y-4">
                  <div>
                    <Label htmlFor="product-name">Producto:</Label>
                    <Input
                      id="product-name"
                      value={selectedUnknownProduct}
                      onChange={(e) => setSelectedUnknownProduct(e.target.value)}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Cantidad:</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={unknownQuantity}
                      onChange={(e) => setUnknownQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Cantidad"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={addUnknownToMissing}>
                      Agregar a Faltantes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedUnknownProduct('');
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
                  setSelectedUnknownProduct('');
                }}
              >
                Cerrar
              </Button>
              <Button 
                onClick={() => {
                  setShowUnknownDialog(false);
                  setUnknownProducts([]);
                  setSelectedUnknownProduct('');
                  // Reiniciar grabación
                  setTimeout(() => {
                    startRecording();
                  }, 500);
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
