import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Package, 
  Calendar, 
  ShoppingCart, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Minus,
  Edit,
  Save,
  X,
  Mic,
  MicOff,
  Loader2
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombre: '',
    descripcion: '',
    missing: [] as string[]
  });

  // Estados para cleansing
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [cleansingResult, setCleansingResult] = useState<any>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentTranscript, setCurrentTranscript] = useState(''); // Transcript temporal

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
          setEditData({
            nombre: cartData.nombre,
            descripcion: cartData.descripcion,
            missing: [...cartData.missing]
          });
          
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

  // Función para formatear fecha
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Calcular total estimado del cart
  const calculateCartTotal = (productos: CartProduct[]) => {
    return productos.reduce((total, producto) => {
      return total + (producto.precio_unitario * producto.cantidad_default);
    }, 0);
  };

  // Función para agregar producto faltante
  const addMissingProduct = () => {
    const newMissing = prompt('Ingresa el nombre del producto faltante:');
    if (newMissing && newMissing.trim()) {
      setEditData(prev => ({
        ...prev,
        missing: [...prev.missing, newMissing.trim()]
      }));
    }
  };

  // Función para eliminar producto faltante
  const removeMissingProduct = (index: number) => {
    setEditData(prev => ({
      ...prev,
      missing: prev.missing.filter((_, i) => i !== index)
    }));
  };

  // Función para guardar cambios
  const saveChanges = async () => {
    try {
      // Aquí implementarías la lógica para guardar en Firebase
      console.log('💾 Guardando cambios...', editData);
      
      // Por ahora solo actualizamos el estado local
      if (cart) {
        setCart({
          ...cart,
          nombre: editData.nombre,
          descripcion: editData.descripcion,
          missing: editData.missing,
          updated_at: new Date()
        });
      }
      
      setIsEditing(false);
      console.log('✅ Cambios guardados');
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
    }
  };

  // Función para cancelar edición
  const cancelEdit = () => {
    if (cart) {
      setEditData({
        nombre: cart.nombre,
        descripcion: cart.descripcion,
        missing: [...cart.missing]
      });
    }
    setIsEditing(false);
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
      setTranscript('');
      setCurrentTranscript('');
      setCleansingResult(null);
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
        setTranscript(fullTranscript);
        
        // Si el reconocimiento ya terminó, procesar inmediatamente
        if (!isRecording) {
          console.log('🤖 Procesando inmediatamente con Gemini...');
          setIsProcessing(true);
          await processWithGemini(fullTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);
        setCleansingResult({ 
          error: `Error en reconocimiento de voz: ${event.error}` 
        });
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
      setCleansingResult({ 
        error: 'No se pudo iniciar el reconocimiento de voz. Verifica los permisos.' 
      });
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
      setCleansingResult(jsonResult);
    } catch (error) {
      console.error('❌ Error con Gemini:', error);
      setCleansingResult({ 
        error: 'Error procesando con Gemini API',
        details: error
      });
    } finally {
      setIsProcessing(false);
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
                  {isEditing ? (
                    <Input
                      value={editData.nombre}
                      onChange={(e) => setEditData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="text-3xl font-bold border-none p-0 h-auto"
                    />
                  ) : (
                    cart.nombre
                  )}
                </h1>
                <p className="text-muted-foreground">
                  Detalles completos del carrito de catering
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button onClick={saveChanges}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-4 h-4 mr-2" />
                    ) : (
                      <Mic className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing ? 'Procesando...' : isRecording ? 'Detener Grabación' : 'Iniciar Cleansing'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cart.total_productos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateCartTotal(cart.productos))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editData.descripcion}
                  onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del cart..."
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-muted-foreground">{cart.descripcion}</p>
              )}
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
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(producto.precio_unitario)} c/u
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        Total: {formatCurrency(producto.precio_unitario * producto.cantidad_default)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Productos Faltantes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Productos Faltantes</CardTitle>
                  <CardDescription>
                    Productos que están marcados como faltantes o no disponibles
                  </CardDescription>
                </div>
                {isEditing && (
                  <Button onClick={addMissingProduct} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                )}
              </div>
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
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMissingProduct(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Cleansing */}
          {(transcript || cleansingResult) && (
            <div className="space-y-4">
              {/* Transcript */}
              {transcript && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      Transcript del Audio
                    </CardTitle>
                    <CardDescription>
                      Texto reconocido del audio grabado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border rounded-md p-4">
                      <p className="text-lg font-medium">"{transcript}"</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resultado del Cleansing */}
              {cleansingResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Resultado del Cleansing
                    </CardTitle>
                    <CardDescription>
                      Análisis procesado por Gemini AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border rounded-md p-4">
                      <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(cleansingResult, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Información de Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fecha de Creación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{formatDate(cart.created_at)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Última Actualización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{formatDate(cart.updated_at)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
