# Configuración de Gemini API para Detección de Botellas

## 🔑 Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Get API Key" o "Crear clave de API"
4. Copia la API key generada

## ⚙️ Configurar en el Proyecto

1. Crea un archivo `.env` en la raíz del proyecto (si no existe)
2. Agrega tu API key:

```env
VITE_GEMINI_API_KEY=tu-api-key-aqui
```

3. Guarda el archivo
4. Reinicia el servidor de desarrollo:

```bash
npm run dev
```

## 🎯 Cómo Funciona el Sistema

### 1. Captura de Video
- Usa `getUserMedia` para acceder a la cámara
- Resolución: 1280x720px
- Modo: Cámara trasera preferida (móviles)

### 2. Captura de Frames
- Cada 6 segundos se captura un frame del video (respeta límite de API gratuita)
- Se dibuja en un canvas
- Se convierte a base64 (JPEG, calidad 70%)

### 3. Detección con Gemini
- Modelo: `gemini-2.0-flash-exp` (el más rápido)
- Temperatura: 0.1 (respuestas consistentes)
- Prompt optimizado para detectar solo botellas de alcohol

### 4. Respuesta de Gemini
El modelo devuelve JSON con:
```json
{
  "bottles": [
    {
      "label": "botella de vino",
      "confidence": 95,
      "box": {
        "x": 100,
        "y": 50,
        "width": 80,
        "height": 200
      }
    }
  ]
}
```

### 5. Visualización
- Se dibujan bounding boxes en un canvas overlay
- Colores según confianza:
  - 🟢 Verde: ≥70% confianza
  - 🟠 Naranja: 50-69% confianza
  - 🔴 Rojo: <50% confianza

## 📊 Interfaz de Usuario

### Video Principal
- Feed de cámara en tiempo real
- Canvas overlay con detecciones
- Indicador "Detectando..." cuando está activo
- Contador de botellas detectadas

### Panel de Detecciones
- Lista de todas las botellas detectadas
- Etiqueta del tipo de botella
- Porcentaje de confianza
- Badge con color según confianza

### Panel de Estadísticas
- Total procesadas
- Reutilizadas
- Completadas
- Descartadas

## 🚀 Uso del Sistema

1. **Activar cámara**: Click en "Activar Cámara"
2. **Detección automática**: Comienza automáticamente
3. **Posicionar botella**: Coloca una botella frente a la cámara
4. **Ver resultados**: Bounding box aparece en tiempo real
5. **Panel lateral**: Muestra detalles de detecciones

## 🎨 Características Visuales

- ✅ Bounding boxes en tiempo real
- ✅ Etiquetas con nombre y confianza
- ✅ Colores dinámicos según confianza
- ✅ Indicador de estado (Detectando...)
- ✅ Contador de botellas
- ✅ Panel de detecciones con scroll
- ✅ Badges con colores

## ⚡ Rendimiento

- **Velocidad**: 6 segundos por detección (límite API gratuita)
- **Modelo**: Gemini 2.0 Flash (optimizado para velocidad)
- **Compresión**: JPEG 70% para reducir datos
- **Respuesta**: ~1-2 segundos por frame
- **Límite gratuito**: 10 requests por minuto

## 🚨 Rate Limiting

El sistema incluye manejo automático de límites:
- **Frecuencia**: Máximo 10 detecciones por minuto
- **Detección automática**: Si excedes el límite, espera automáticamente
- **Retry inteligente**: Se reinicia automáticamente después del tiempo de espera
- **Indicadores visuales**: Muestra "Esperando..." cuando está en cooldown

## 🔧 Ajustes Posibles

### Cambiar frecuencia de detección
```typescript
// En startDetection()
detectionIntervalRef.current = window.setInterval(() => {
  detectBottlesWithGemini();
}, 6000); // 6000ms = 6 segundos (recomendado para API gratuita)

// NOTA: No bajes de 6 segundos o excederás el límite gratuito de 10 requests/minuto
```

### Cambiar calidad de imagen
```typescript
// En captureFrame()
return canvas.toDataURL('image/jpeg', 0.9); // Cambia 0.7 a 0.9
```

### Cambiar modelo
```typescript
// En detectBottlesWithGemini()
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash" // Cambia el modelo
});
```

## 🐛 Solución de Problemas

### Error: "API Key no configurada"
- Verifica que el archivo `.env` existe
- Verifica que la variable se llama `VITE_GEMINI_API_KEY`
- Reinicia el servidor después de agregar la key

### No detecta botellas
- Asegúrate de tener buena iluminación
- Coloca la botella centrada en la imagen
- Espera 2-3 segundos para que Gemini procese
- Verifica la consola para ver respuestas de Gemini

### Detección lenta
- Aumenta el intervalo (500ms → 1000ms)
- Reduce la calidad de imagen (0.7 → 0.5)
- Verifica tu conexión a internet

### Canvas no muestra boxes
- Verifica que el canvas esté sobre el video
- Revisa la consola para errores de parsing
- Verifica que Gemini devuelve coordenadas válidas

## 📝 Estructura del Código

```
src/pages/AlcoholBottles.tsx
├── startCamera()          # Activa cámara y video
├── startDetection()       # Inicia loop de detección
├── captureFrame()         # Captura frame del video
├── detectBottlesWithGemini() # Envía a Gemini API
├── drawBoundingBoxes()    # Dibuja boxes en canvas
└── stopCamera()           # Limpia todo
```

## 🎓 Limitaciones

- Requiere **internet** (API en la nube)
- **Costo**: Gemini tiene cuota gratuita limitada
- **Latencia**: ~1-2 segundos por detección
- **Precisión**: Depende de iluminación y ángulo
- **Tipos**: Detecta botellas genéricas, no marcas específicas

## 💡 Mejoras Futuras

1. **Cache de detecciones** para no procesar frames similares
2. **Tracking de objetos** entre frames
3. **Detección de etiquetas** (OCR) para identificar marca
4. **Integración con báscula** para medir nivel real
5. **Base de datos local** de botellas identificadas
6. **Procesamiento en lote** cuando hay múltiples botellas

---

**Versión**: 1.0.0  
**Modelo**: Gemini 2.0 Flash Experimental  
**Framework**: React + TypeScript + Vite

