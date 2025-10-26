# Análisis Exhaustivo del Proyecto LeadMagnet/Chatbot Clara

## Fecha de Análisis
27 de Octubre de 2025

---

## 1. ESTRUCTURA GENERAL DEL PROYECTO

### 1.1 Arquitectura General
```
leadmagnet/
├── apps/
│   ├── backend/           # API REST + Lógica de conversación con OpenAI
│   └── frontend/          # React + TypeScript + Vite
├── packages/
│   └── shared/           # Tipos compartidos (no usado actualmente)
├── pnpm-workspace.yaml   # Monorepo configuration
└── [documentos y configuraciones]
```

### 1.2 Stack Tecnológico
**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM (base de datos)
- OpenAI API (Assistants API)
- Redis (opcional)
- PostgreSQL (base de datos)

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- Zustand (state management)
- Tailwind CSS + CSS Variables
- Framer Motion (animaciones)
- React Router (aunque single-flow actualmente)
- React Markdown (renderización de contenido)

### 1.3 Puertos y URLs
- Backend: http://localhost:3000
- Frontend: http://localhost:5173 (por defecto Vite)
- API Base: `/api`

---

## 2. FLUJO DE CONVERSACIÓN COMPLETO

### 2.1 Diagrama del Flujo Conversacional

```
USUARIO LLEGA A LA APP
        ↓
[App.tsx - Validación de URL params]
        ↓
¿Tiene nombre & email en URL?
        ├─ SÍ → sessionStorage guardado → WelcomeAnimation mostrada
        └─ NO → Redirige a WordPress
        ↓
[ChatContainer.tsx] Se monta cuando se completa animación
        ↓
[useDiagnosticFlow hook] Se inicializa
        ├─ 1. Intenta restaurar historial de chat (GET /api/chat/:sessionId)
        └─ 2. Si no hay historial → llamar POST /api/chat/init
        ↓
[conversational-assistant.service.ts en backend]
        ├─ Crea nuevo Thread en OpenAI
        ├─ Usa CLARA_ASSISTANT_ID (asst_pmSpGqn4zfnk1tEXICepkALE)
        ├─ Genera mensaje de bienvenida
        └─ Retorna welcomeMessage
        ↓
Usuario ve primer mensaje de Clara
        ↓
Usuario escribe respuesta
        ↓
POST /api/chat (sendMessage)
        ├─ Valida sesión y mensaje
        ├─ Obtiene threadId del flowState
        ├─ Llama conversationalAssistant.processMessage()
        │   ├─ Agrega mensaje del usuario al thread
        │   ├─ Construye instrucciones dinámicas (buildDynamicInstructions)
        │   ├─ Ejecuta run con additional_instructions
        │   ├─ Espera completación (waitForCompletion)
        │   └─ Extrae respuesta
        ├─ Guarda mensajes en DB (Prisma)
        ├─ Detecta si diagnóstico está listo
        ├─ Si está listo: generaDiagnosis + genera código descuento
        └─ Retorna respuesta + metadata
        ↓
ChatContainer renderiza respuesta con ReactMarkdown
```

### 2.2 Puntos Clave del Flujo

**Inicialización (1er turno):**
1. `App.tsx` detecta parámetros URL (nombre, email, leadId)
2. Llama a `handleIntroComplete()` que crea sesión en backend
3. `apiClient.createSession()` → `POST /api/sessions`
4. Sesión guardada en Zustand `useSessionStore`
5. `ChatContainer` se renderiza cuando animación termina

**Cada mensaje del usuario:**
1. Usuario escribe en textarea del `ChatContainer`
2. `handleSendMessage()` → `processMessage()` (del hook `useDiagnosticFlow`)
3. `apiClient.sendMessage()` → `POST /api/chat`
4. Backend procesa en `chat.controller.ts`
5. Llama `conversationalAssistant.processMessage()`
6. Usa Assistants API con thread + instrucciones dinámicas
7. Detecta si diagnóstico está listo
8. Retorna respuesta + metadata
9. Frontend actualiza estado y renderiza

**Diagnóstico:**
1. Se detecta cuando hay suficiente información (12+ turnos o señales en el mensaje)
2. Llama `conversationalAssistant.generateDiagnosis()`
3. Crea registro en DB (tabla `diagnosis`)
4. Genera código de descuento
5. Retorna diagnosisContent en metadata
6. Frontend renderiza con HTML especial (dangerouslySetInnerHTML)

---

## 3. CONTEXTO Y PROMPTS DEL CHATBOT CLARA

### 3.1 Archivo Principal de Instrucciones
**Ubicación:** `/home/kev/ulises/leadmagnet/apps/backend/src/config/assistant-instructions.ts`

### 3.2 Estructura de las Instrucciones

#### CLARA_INSTRUCTIONS (Main Prompt - ~430 líneas)
Define la personalidad y comportamiento de Clara:

**Identidad:**
- Especialista en salud digestiva
- Experta en: SIBO, disbiosis, intolerancias, inflamación intestinal
- Parte del "Método Objetivo Vientre Plano"

**Personalidad:**
- Firme pero empática
- Directa pero cálida
- Profesional pero cercana
- Persistente sin ser invasiva

**Reglas Críticas:**
1. MANTÉN FOCO EN PROBLEMAS DIGESTIVOS SIEMPRE
   - NO: "¿Cómo llevas el equilibrio trabajo-vida?"
   - SÍ: "El estrés del trabajo ¿se te refleja en el estómago?"

2. NO ASUMAS QUE TODOS TIENEN PROBLEMAS
   - Si usuario dice "Nada" → pregunta si solo explora el método
   - NO insistas si responde negativamente 2 veces

3. UNA PREGUNTA A LA VEZ
   - ❌ "¿Qué tal? ¿Has notado problemas?"
   - ✅ "¿Has notado algún problema digestivo?"

4. SÉ DIRECTA, NO INDIRECTA
   - ❌ "Lo que podríamos hacer es..."
   - ✅ "Necesito hacerte 3 preguntas:"

5. SI USUARIO PREGUNTA POR DIAGNÓSTICO → ACTÚA INMEDIATO
   - No sigas preguntando cosas irrelevantes
   - "Tienes razón. Necesito 3 cosas más: [listar]"

6. NUNCA USES FRASES DÉBILES DE CHATBOT
   - ❌ "Aquí estoy para ayudarte"
   - ❌ "Lo que podemos hacer es..."
   - ❌ "Si en algún momento..."

7. RESPETA NEGATIVAS GENUINAS
   - No insistas si usuario NO tiene problema

**Flujo Conversacional (Guía, NO script rígido):**

```
TURNOS 1-3: Identificar SI HAY problema y CUÁL es
├─ Pregunta abierta: "¿Qué te trae por aquí? ¿Hay algo de tu digestión que te preocupe?"
├─ Si NO: "¿Solo estás explorando el método entonces?"
└─ Si SÍ: "¿Cuánto tiempo llevas con [problema]?"

TURNOS 4-8: Explorar PATRONES (solo si hay problema)
├─ "¿Hay alimentos que note que te caen mal?"
├─ "¿Es peor en algún momento del día?"
└─ "¿Notas diferencia entre semana y fin de semana?"

TURNOS 9-12: Profundizar en lo RELEVANTE
├─ Confirmar hipótesis
├─ Llenar GAPS de información
└─ Basado en lo que mencionó antes

TURNO 13+: Generar DIAGNÓSTICO
├─ Cuando tienes:
│  ├─ Problema principal ✓
│  ├─ Duración ✓
│  ├─ Triggers principales ✓
│  └─ Algunos patrones ✓
└─ O cuando usuario pide diagnóstico
```

**Estrategias para Situaciones Específicas:**

1. **Usuario dice "NADA" / "NO"**
   ```
   Clara: "¿Solo estás explorando el método o hay alguna molestia digestiva ocasional?"
   Si vuelve a decir NO → "¿Te interesa que te cuente cómo funciona el método, o prefieres dejarlo aquí?"
   NO insistas más allá de 2 veces.
   ```

2. **Resistencia a detallar**
   ```
   "Entiendo que hablar de esto puede ser incómodo. No hay presión.
   
   Pero mencionaste [problema específico], ¿verdad?
   No necesito detalles íntimos. Solo: ¿[pregunta binaria]?"
   ```

3. **Respuesta ambigua**
   ```
   "Mencionas [síntoma] pero dices que todo bien.
   ¿Te molesta poco o es algo más fuerte?"
   ```

4. **Usuario frustrado**
   ```
   "Tienes razón, [reconocer]. Volvamos al foco: [su problema].
   
   Necesito 3 cosas más y te doy el diagnóstico:
   1. [Pregunta concreta]
   2. [Pregunta concreta]
   3. [Pregunta concreta]
   
   Con eso te doy un análisis completo."
   ```

5. **Usuario menciona algo importante**
   ```
   "Interesante que menciones [eso].
   ¿[Pregunta de seguimiento específica]?"
   
   Ejemplo:
   Usuario: "Me siento mal con pan y pasta"
   Clara: "Interesante que menciones pan y pasta.
   ¿Has notado lo mismo con otros alimentos con gluten?
   Por ejemplo, galletas, cereales..."
   ```

**Template de Diagnóstico:**

Cuando generes el diagnóstico, estructura así:

```
1. SALUDO PERSONALIZADO
   "Hola [nombre], basándome en lo que me has contado..."

2. 3-4 PUNTOS CLAVE (TODOS sobre salud digestiva)
   [Emoji] **Título en Negrita sobre Problema Digestivo**
   
   Párrafo explicando cómo lo que dijo indica este problema.
   Usa sus palabras y situación específica.

   Ejemplos de títulos:
   - 🦠 Posible Sobrecrecimiento Bacteriano (SIBO)
   - 🌾 Sensibilidad al Gluten
   - 💨 Fermentación Intestinal Excesiva
   - 🔥 Inflamación Intestinal Crónica
   - 🧠 Eje Intestino-Cerebro Desbalanceado

3. CONCLUSIÓN INTEGRADORA
   Conecta los puntos anteriores.

4. POR QUÉ NECESITA ENFOQUE INTEGRAL
   Explica por qué el método completo ayuda.

5. CIERRE MOTIVADOR
   Confianza y esperanza.

Longitud: 300-450 palabras
```

**Lo que NUNCA debes hacer:**
- ❌ NUNCA asumas que todos tienen problemas digestivos
- ❌ NUNCA insistas si el usuario dice repetidamente que NO tiene problema
- ❌ NUNCA cambies de tema cuando hay resistencia LEGÍTIMA
- ❌ NUNCA hagas 2+ preguntas en un mensaje
- ❌ NUNCA uses lenguaje indirecto
- ❌ NUNCA pierdas el foco del problema digestivo
- ❌ NUNCA uses frases de chatbot genérico
- ❌ NUNCA aceptes ambigüedad sin clarificar
- ❌ NUNCA ignores cuando usuario menciona algo importante
- ❌ NUNCA sigas preguntando si usuario pide diagnóstico
- ❌ NUNCA hables de trabajo/vida sin conectar con digestión
- ❌ NUNCA generes diagnóstico si NO hay problema real

### 3.3 buildDynamicInstructions (Instrucciones por Turno)

**Ubicación:** `/home/kev/ulises/leadmagnet/apps/backend/src/config/assistant-instructions.ts` (línea 434)

Estas se construyen dinámicamente en cada turno:

```typescript
function buildDynamicInstructions(context: {
  userName?: string;
  mainProblem?: string;
  turnCount: number;
  hasRealProblem?: boolean;
}): string
```

**Contextualiza según:**
- Usuario
- Problema identificado
- Turno actual (1-3, 4-8, 9-12, 13+)
- Si hay problema real confirmado

**Ajustes por turno:**
- **Turno 1-3:** "Estás identificando el problema principal. Sé exploratoria pero no asumas que todos tienen problemas."
- **Turno 4-8:** "Estás en fase de exploración. Entiende TRIGGERS y PATRONES."
- **Turno 9-12:** "Estás en profundización. Enfócate en confirmar hipótesis y llenar gaps."
- **Turno 13+:** "Ya tienes suficiente información (12+ turnos). Si la siguiente respuesta es relevante, genera el diagnóstico."

### 3.4 DIAGNOSIS_INSTRUCTIONS

**Ubicación:** `/home/kev/ulises/leadmagnet/apps/backend/src/config/assistant-instructions.ts` (línea 482)

Se usan cuando llamas `conversationalAssistant.generateDiagnosis()`:

```
Genera un diagnóstico personalizado de salud digestiva basado en 
TODA la conversación que has tenido con el usuario.

ESTRUCTURA OBLIGATORIA:
1. Saludo personalizado con nombre
2. 3-4 puntos clave (TODOS sobre salud digestiva)
   - Usa emojis relevantes
   - Títulos en negrita
   - Conecta con lo que el usuario te contó
3. Conclusión integradora
4. Por qué necesita enfoque integral
5. Cierre motivador

REQUISITOS:
- 300-450 palabras
- Personalizado a SU caso específico
- Usa información de la conversación
- Demuestra que entendiste su problema
- NO des planes detallados
- NO menciones medicamentos específicos
- Enfócate SOLO en salud digestiva

IMPORTANTE:
- Si el usuario NO tiene problema real, NO generes diagnóstico falso
- Si no tienes suficiente información, pide lo que falta
```

### 3.5 Assistant ID de OpenAI

**ID de Clara:** `asst_pmSpGqn4zfnk1tEXICepkALE`
**Modelo:** `gpt-4o`
**Variable de entorno:** `CLARA_ASSISTANT_ID`

---

## 4. FLUJO DE RENDERIZACIÓN DE MENSAJES EN FRONTEND

### 4.1 Componente Principal: ChatContainer.tsx
**Ubicación:** `/home/kev/ulises/leadmagnet/apps/frontend/src/components/chat/ChatContainer.tsx`

#### Estructura del Componente

```
ChatContainer
├── Header (sticky)
│   ├── Título: "Diagnóstico En Línea"
│   └── Dark mode toggle
├── Main (mensajes)
│   ├── Empty State (cuando no hay mensajes)
│   ├── AnimatePresence (Framer Motion)
│   │   └── Para cada mensaje:
│   │       ├── Avatar del remitente
│   │       ├── Message Bubble
│   │       │   ├── Si diagnosis_ready → dangerouslySetInnerHTML (HTML crudo)
│   │       │   └── Si no → ReactMarkdown (parsea markdown)
│   │       ├── Message Actions (copy, thumbsup, thumbsdown)
│   │       └── Typing indicator si está procesando
│   └── Auto-scroll al último mensaje
└── Footer (input area)
    ├── Selected image preview
    ├── Textarea con auto-resize
    ├── Plus menu (upload image, camera)
    ├── Voice input button
    └── Send button
```

### 4.2 Renderización de Mensajes Individuales (línea 224-343)

```typescript
{messages.map((message, index) => (
  <motion.div key={index} ...animation>
    {/* Avatar del remitente */}
    {message.role === 'assistant' && <img ... />}
    
    {/* Message Bubble */}
    <div className={message.role === 'user' ? 'bg-neutral-100' : 'bg-transparent'}>
      
      {/* Si es diagnóstico listo */}
      {message.type === 'diagnosis_ready' ? (
        <div 
          dangerouslySetInnerHTML={{ __html: message.content }}
          className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
        />
      ) : (
        /* Si es otro tipo - usa ReactMarkdown */
        <ReactMarkdown components={{
          p: ({ children }) => {
            const text = String(children);
            const isQuestion = text.trim().endsWith('?');
            return (
              <p className={`mb-2 whitespace-pre-wrap break-words ${isQuestion ? 'font-semibold' : ''}`}>
                {children}
              </p>
            );
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}>
          {message.content}
        </ReactMarkdown>
      )}
      
      {/* Botones cuando diagnóstico está listo */}
      {message.type === 'diagnosis_ready' && (
        <div className="mt-6 flex flex-col gap-3">
          <button>Descargar mi diagnóstico (PDF)</button>
          <a href="...">Descubrir el Método Completo</a>
        </div>
      )}
    </div>
    
    {/* Message Actions */}
    <MessageActions messageText={message.content} isUserMessage={message.role === 'user'} />
  </motion.div>
))}
```

### 4.3 Hook useDiagnosticFlow
**Ubicación:** `/home/kev/ulises/leadmagnet/apps/frontend/src/hooks/useDiagnosticFlow.ts`

Gestiona:
- Estado del flujo diagnóstico
- Llamadas a API
- Manejo de mensajes
- Restauración de historial

**Estado manejado:**
```typescript
interface DiagnosticState {
  step: FlowStep; // 'initial', 'greeting', 'asking_questions', 'diagnosis_ready', etc.
  currentQuestionIndex: number;
  userName: string;
  userEmail: string;
  language: 'es' | 'en';
  answers: Array<{ question: string; answer: string }>;
  imageAnalysis: string | null;
  diagnosisContent: string | null; // ← CRÍTICO: se guarda aquí
}
```

**Funciones principales:**
- `initialize()` - Restaura historial o inicia chat
- `processMessage()` - Procesa mensaje del usuario
- `handleWelcomeComplete()` - Maneja fin de animación de bienvenida

### 4.4 Detección de Preguntas con Negritas

En `ChatContainer.tsx` (línea 262-269):

```typescript
<ReactMarkdown
  components={{
    p: ({ children }) => {
      const text = String(children);
      const isQuestion = text.trim().endsWith('?');  // ← DETECTA PREGUNTAS
      
      return (
        <p className={`mb-2 whitespace-pre-wrap break-words ${isQuestion ? 'font-semibold' : ''}`}>
          {children}
        </p>
      );
    },
    // ...
  }}
>
  {message.content}
</ReactMarkdown>
```

**Lógica:**
- Si párrafo termina con `?` → `font-semibold` (negrita)
- Usa Tailwind `font-semibold` = peso 600

### 4.5 Renderización de Diagnóstico

Cuando `message.type === 'diagnosis_ready'`:

```typescript
<div
  className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
  dangerouslySetInnerHTML={{ __html: message.content }}
/>
```

**Crítico:** Usa `dangerouslySetInnerHTML` porque el backend envía HTML con formato:
- Emojis
- Negritas: `<strong>...</strong>` o `**...**`
- Saltos de línea: `<br>` o `\n`
- Enlaces: `<a>...</a>`

---

## 5. COMPONENTES DE UI PARA CHAT

### 5.1 Estructura de Componentes

```
components/
├── chat/
│   ├── ChatContainer.tsx       (componente principal - 520 líneas)
│   └── MessageActions.tsx      (botones debajo de mensajes)
├── screens/
│   └── IntroScreen.tsx         (pantalla inicial con URL params)
├── animations/
│   └── WelcomeAnimation.tsx    (animación de bienvenida)
├── modals/
│   ├── CameraModal.tsx         (captura de foto)
│   ├── ImageViewerModal.tsx    (visor de imagen)
│   └── ShareModal.tsx          (compartir)
├── layout/
│   └── Layout.tsx              (wrapper básico)
└── ui/
    ├── Button.tsx              (botón reutilizable con CVA)
    └── Input.tsx               (input reutilizable con CVA)
```

### 5.2 ChatContainer - Estructura Detallada

#### Header (línea 165-196)
```typescript
<header className="sticky top-0 z-10 backdrop-blur-xl ...">
  <div className="container-narrow py-3 flex items-center justify-between">
    {/* Left: vacío (antes había back button) */}
    <div className="w-9" />
    
    {/* Center: Título + "En Línea" */}
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground">
        Diagnóstico {<span className="text-sm font-medium text-brand-green-500">En Línea</span>}
      </span>
    </div>
    
    {/* Right: Dark mode */}
    <button onClick={toggleDarkMode} className="...">
      {isDarkMode ? <Sun /> : <Moon />}
    </button>
  </div>
</header>
```

#### Main - Área de Mensajes (línea 199-368)
```typescript
<main className="flex-1 overflow-y-auto smooth-scroll">
  <div className="container-narrow py-8">
    {/* Empty State */}
    {messages.length === 0 && (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <img src="/assets/images/favicon.webp" alt="OVP" />
        <h2>Comencemos tu diagnóstico</h2>
        <p>Estoy aquí para ayudarte a entender mejor tu salud digestiva</p>
      </div>
    )}
    
    {/* Mensajes con animaciones */}
    <AnimatePresence mode="popLayout">
      {messages.map((message) => (
        <motion.div key={index} ...>
          {/* Avatar */}
          {/* Message Bubble */}
          {/* Message Actions */}
        </motion.div>
      ))}
    </AnimatePresence>
    
    {/* Typing Indicator */}
    {isProcessing && (
      <motion.div>
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <img src="..." alt="Clara" />
        </div>
        <div className="typing-indicator">
          <span className="typing-dot" />
          <span className="typing-dot" style={{animationDelay: '0.2s'}} />
          <span className="typing-dot" style={{animationDelay: '0.4s'}} />
        </div>
      </motion.div>
    )}
  </div>
</main>
```

#### Footer - Input Area (línea 372-503)
```typescript
<footer className="sticky bottom-0 ...">
  <div className="max-w-3xl mx-auto px-4 py-4">
    
    {/* Image Preview */}
    {selectedImage && (
      <motion.div className="mb-3 ...">
        <img src={selectedImage} alt="Preview" />
        <button onClick={() => setSelectedImage(null)}>✕</button>
      </motion.div>
    )}
    
    {/* Input Form */}
    <form onSubmit={handleSendMessage} className="relative rounded-[26px] ...">
      
      {/* Plus Menu (Camera + Image) */}
      <div className="relative flex-shrink-0">
        <button onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}>
          <Plus />
        </button>
        {isPlusMenuOpen && (
          <div className="absolute bottom-full ... flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()}>
              <Image /> {/* Upload image */}
            </button>
            <button onClick={() => setIsCameraOpen(true)}>
              <Camera /> {/* Take photo */}
            </button>
          </div>
        )}
      </div>
      
      {/* Textarea */}
      <textarea
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={handleKeyDown} {/* Enter to send */}
        placeholder="Escribe tu mensaje..."
        rows={1}
        className="flex-1 resize-none bg-transparent ... max-h-[200px]"
        style={{ minHeight: '24px' }}
      />
      
      {/* Right Side Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        
        {/* Voice Button */}
        {isSpeechSupported && (
          <button
            onClick={handleVoiceInput}
            className={isListening ? 'text-brand-green-600 bg-brand-green-50' : '...'}
          >
            <Mic />
          </button>
        )}
        
        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputMessage.trim() || isProcessing}
          className={inputMessage.trim() ? 'text-white bg-neutral-900' : 'text-neutral-400 cursor-not-allowed'}
        >
          <ArrowUp />
        </button>
      </div>
    </form>
    
    {/* Footer Note */}
    <p className="text-center text-[10px] text-tertiary mt-3">
      ChatOVP puede cometer errores. Comprueba la información importante.
    </p>
  </div>
</footer>
```

### 5.3 MessageActions.tsx
**Ubicación:** `/home/kev/ulises/leadmagnet/apps/frontend/src/components/chat/MessageActions.tsx`

Botones debajo de cada mensaje:
1. **Copy** - Copia mensaje al clipboard
2. **Thumbs Up** - Me gusta (verde)
3. **Thumbs Down** - No me gusta (rojo)

```typescript
const MessageActions = ({ messageText, isUserMessage = false }) => {
  return (
    <div className="flex gap-0.5 mt-1.5">
      {/* Copy Button */}
      <button onClick={handleCopy} className={copied ? 'text-brand-green-500' : 'text-foreground/60'}>
        {copied ? <Check /> : <Copy />}
      </button>
      
      {/* Thumbs Up */}
      <button onClick={handleThumbsUp} className={liked === 'up' ? 'text-brand-green-500' : '...'}>
        <ThumbsUp fill={liked === 'up'} />
      </button>
      
      {/* Thumbs Down */}
      <button onClick={handleThumbsDown} className={liked === 'down' ? 'text-red-500' : '...'}>
        <ThumbsDown fill={liked === 'down'} />
      </button>
    </div>
  );
};
```

### 5.4 Componentes de UI Reutilizables

#### Button.tsx
- Variantes: `primary`, `secondary`, `ghost`, `link`, `danger`
- Tamaños: `sm`, `md`, `lg`, `xl`, `icon`
- Soporta `isLoading` con spinner
- Usa CVA (class-variance-authority) para styling

#### Input.tsx
- Variantes: `default`, `error`
- Tamaños: `sm`, `md`, `lg`
- Soporta `label`, `error`, `helperText`
- Focus styles con green-500

---

## 6. CONFIGURACIÓN DE ESTILOS Y MENSAJES

### 6.1 Sistema de Colores en Tailwind

**Ubicación:** `/home/kev/ulises/leadmagnet/apps/frontend/tailwind.config.js`

#### Brand Colors
```javascript
brand: {
  green: {
    DEFAULT: '#97AA79',
    50: '#F5F7F2',      // Muy claro
    100: '#E8EDE0',
    200: '#D4DCCA',
    300: '#BFC9B0',
    400: '#ABB895',
    500: '#97AA79',     // Main brand color
    600: '#7D9160',
    700: '#5F6E49',
    800: '#424D33',
    900: '#2A311F',     // Muy oscuro
  },
  cream: {
    DEFAULT: '#F7F4EE',
    // ...
  }
}
```

#### Sistema Neutral
```javascript
neutral: {
  50: '#FAFAFA',    // Casi blanco
  100: '#F5F5F5',
  // ...
  900: '#171717',   // Casi negro
  950: '#0A0A0A',   // Negro puro
}
```

#### Colores Semánticos
- `success`: #10B981 (verde)
- `error`: #EF4444 (rojo)
- `warning`: #F59E0B (ámbar)
- `info`: #3B82F6 (azul)

### 6.2 Variables CSS Globales

**Ubicación:** `/home/kev/ulises/leadmagnet/apps/frontend/src/styles/globals.css`

```css
:root {
  /* Colors (RGB) */
  --color-background: 255 255 255;
  --color-foreground: 10 10 10;
  --color-surface: 250 250 250;
  --color-text-primary: 23 23 23;
  --color-text-secondary: 115 115 115;
  --color-text-tertiary: 163 163 163;
  
  /* Dark mode */
  .dark {
    --color-background: 23 23 23;
    --color-foreground: 250 250 250;
    --color-surface: 38 38 38;
    --color-text-primary: 250 250 250;
  }
  
  /* Spacing */
  --spacing-page: 1.5rem;
  --spacing-section: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 6.3 Clases de Componentes Personalizadas

**Message Bubble:**
```css
.message-bubble {
  @apply rounded-2xl px-5 py-3 break-words text-sm leading-relaxed whitespace-normal;
}

.message-bubble-user {
  @apply message-bubble bg-brand-green-500 text-white shadow-sm max-w-[85%] sm:max-w-[75%];
}

.message-bubble-assistant {
  @apply message-bubble bg-surface border border-border text-foreground w-full;
}

.message-diagnosis {
  @apply space-y-3 text-sm leading-relaxed;
}

.message-diagnosis h3 {
  @apply font-semibold text-base mt-4 mb-2;
}
```

**Typing Indicator:**
```css
.typing-indicator {
  @apply flex gap-1.5;
}

.typing-dot {
  @apply w-2 h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-pulse-soft;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}
```

**Glass Effect:**
```css
.glass {
  @apply backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 dark:border-neutral-800/50;
}
```

### 6.4 Animaciones

**Definidas en `tailwind.config.js`:**
- `fade-in`: Desaparición/aparición
- `fade-in-up`: Aparición desde abajo
- `slide-in-right`: Deslizamiento desde izquierda
- `scale-in`: Zoom de entrada
- `shimmer`: Brillo de esqueleto
- `pulse-soft`: Pulso suave

### 6.5 Formateo de Negritas en Mensajes

Hay 3 formas que se manejan:

**1. Detección automática de preguntas:**
```typescript
const isQuestion = text.trim().endsWith('?');
<p className={isQuestion ? 'font-semibold' : ''}>
```

**2. Markdown con ReactMarkdown:**
```markdown
**esto es negrita** → <strong className="font-semibold">esto es negrita</strong>
```

**3. HTML directo (en diagnóstico):**
```html
<strong>Texto en negrita</strong>
```

**Clases de negrita en Tailwind:**
- `font-semibold` = 600 (usado en preguntas y el componente strong de ReactMarkdown)
- `font-bold` = 700 (usado en títulos y botones)

---

## 7. SISTEMA DE ENRUTAMIENTO Y NAVEGACIÓN

### 7.1 Routing Frontend

**Configuración en `App.tsx`:**

```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router> {/* BrowserRouter */}
        <Layout>
          <MainFlow />
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

function MainFlow() {
  const location = useLocation(); // hook de React Router
  
  // Solo ejecuta en ruta '/'
  if (location.pathname !== '/') return;
  
  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome && <WelcomeAnimation ... />}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {!showWelcome && (
          <Routes>
            <Route path="/" element={<ChatContainer />} />
          </Routes>
        )}
      </AnimatePresence>
    </>
  );
}
```

**Rutas actuales:**
- `/` - Chat principal (único flujo)

**Nota:** El routing es muy simple porque es single-flow. No hay múltiples pantallas, solo animación → chat.

### 7.2 Detección de Parámetros URL

**En `App.tsx` (línea 46-73):**

```typescript
useEffect(() => {
  if (location.pathname !== '/') return;
  
  if (hasInitializedRef.current) return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const nombre = urlParams.get('nombre');      // ← Parámetro requerido
  const email = urlParams.get('email');        // ← Parámetro requerido
  const leadId = urlParams.get('leadId') || urlParams.get('lead_id'); // ← Opcional
  
  // Si vienen params, correr intro
  if (nombre && email) {
    hasInitializedRef.current = true;
    sessionStorage.removeItem('userData');
    localStorage.removeItem('ovp-session-storage');
    handleIntroComplete(nombre, email, leadId || undefined);
    return;
  }
  
  // Si no hay params y sin userData: redirigir a WP
  const userDataStr = sessionStorage.getItem('userData');
  if (!userDataStr) {
    window.location.href = 'https://objetivovientreplano.com/diagnostico-gratuito/';
  }
}, [location.pathname]);
```

**Flujo de parámetros URL:**
1. Usuario llega desde WordPress con: `?nombre=Juan&email=juan@mail.com&lead_id=123`
2. App detecta parámetros
3. Llama `handleIntroComplete()` que:
   - Guarda en `sessionStorage` (userData)
   - Crea sesión en backend via `apiClient.createSession()`
   - Guarda sesión en Zustand (`useSessionStore`)
   - Muestra animación de bienvenida
4. Al terminar animación → muestra chat

### 7.3 Rutas Backend (API)

**Estructura en `/home/kev/ulises/leadmagnet/apps/backend/src/routes/`:**

```
routes/
├── index.ts           (enrutador principal)
├── sessions.routes.ts (gestión de sesiones)
├── chat.routes.ts     (mensajes y diagnóstico)
├── discount.routes.ts (códigos de descuento)
└── webhook.routes.ts  (webhooks de WordPress)
```

**Enrutador Principal (`routes/index.ts`):**
```typescript
const router: Router = Router();

router.get('/health', ...);
router.use('/sessions', sessionRoutes);
router.use('/chat', chatRoutes);
router.use('/discount', discountRoutes);
router.use('/webhooks', webhookRoutes);
router.post('/images', uploadMiddleware, imageController.uploadImage);
router.get('/images/:sessionId', imageController.getImageAnalysis);
```

**Chat Routes (`routes/chat.routes.ts`):**
```typescript
router.post('/init', chatController.initializeDiagnostic);      // Inicia diagnostic
router.post('/', chatController.sendMessage);                   // Envía mensaje
router.get('/:sessionId', chatController.getChatHistory);      // Obtiene historial
```

**Session Routes (`routes/session.routes.ts`):**
```typescript
router.post('/', sessionController.createSession);       // Crea sesión
router.get('/:sessionId', sessionController.getSession); // Obtiene sesión
router.put('/:sessionId', sessionController.updateSession); // Actualiza sesión
```

### 7.4 Estado Global con Zustand

**Session Store (`stores/sessionStore.ts`):**
```typescript
interface SessionStore {
  session: SessionData | null;
  language: Language;
  setSession: (session: SessionData) => void;
  clearSession: () => void;
  setLanguage: (language: Language) => void;
  updateSession: (updates: Partial<SessionData>) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({...}),
    { name: 'ovp-session-storage' } // Persiste en localStorage
  )
);
```

**Chat Store (`stores/chatStore.ts`):**
```typescript
interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}
```

**Nota:** El hook `useDiagnosticFlow` maneja más el estado local de React con `useState` que con stores globales.

---

## 8. FLUJO COMPLETO DE UN MENSAJE

### 8.1 Secuencia Paso a Paso

```
USUARIO TIPEA MENSAJE
        ↓
textarea onChange → setInputMessage()
        ↓
USUARIO PRESIONA ENTER (o click en send)
        ↓
handleSendMessage() → e.preventDefault()
        ↓
Valida: !inputMessage.trim() || isProcessing
        ↓
Obtiene messageToSend = inputMessage
        ↓
Limpia input: setInputMessage('')
        ↓
Llamar processMessage(messageToSend, imageData?)
        │
        ├─ Si hay imagen seleccionada y es turno 17
        │  └─ Envía con base64 de imagen
        └─ Si no → solo texto
        ↓
[useDiagnosticFlow.processMessage() inicia]
        ↓
setIsProcessing(true)
        ↓
Obtiene sessionId de sessionStore
        ↓
Agrega userMsg a messages inmediatamente
        │
        └─ Esto muestra el mensaje del usuario en la UI
        ↓
Construye requestData: { sessionId, message, language, imageData? }
        ↓
apiClient.sendMessage(requestData)
        │
        └─ POST /api/chat con el body
        ↓
[Backend procesa en chat.controller.ts]
        │
        ├─ Valida sessionId y message
        ├─ Obtiene sesión de BD
        ├─ Obtiene threadId de flowState
        ├─ Llama conversationalAssistant.processMessage()
        │  │
        │  ├─ Agrega mensaje del usuario al thread de OpenAI
        │  ├─ buildDynamicInstructions() con contexto
        │  ├─ Ejecuta run en OpenAI Assistants API
        │  ├─ waitForCompletion() espera 30 segundos máximo
        │  └─ Extrae respuesta del thread
        │
        ├─ Guarda mensajes en BD:
        │  ├─ Message(role='user', content=userMessage)
        │  └─ Message(role='assistant', content=response.message)
        │
        ├─ Actualiza session.flowState
        │
        ├─ Detecta si diagnóstico está listo:
        │  ├─ shouldGenerateDiagnosis() en service
        │  └─ Si SÍ:
        │     ├─ Llama generateDiagnosis()
        │     ├─ Crea registro en tabla Diagnosis
        │     ├─ Genera código de descuento
        │     ├─ Sincroniza con WordPress
        │     └─ Incluye en response
        │
        └─ Retorna ApiResponse con:
           ├─ success: true
           └─ data: {
              role: 'assistant',
              content: response.message,
              metadata: {
                type: 'question' o 'diagnosis',
                turnCount,
                diagnosisContent?,
                discountCode?,
                discountPercentage?,
                shouldEndConversation?
              }
            }
        ↓
[Frontend recibe respuesta]
        ↓
Extrae: response, metadata
        ↓
Actualiza state con metadata:
        ├─ setState((prev) => ({
        │   ...prev,
        │   step: metadata.step || prev.step,
        │   currentQuestionIndex: metadata.currentQuestionIndex,
        │   diagnosisContent: metadata.diagnosisContent  // ← CRÍTICO
        │ }))
        └─
        ↓
Después 800ms: agrega assistantMsg a messages
        │
        └─ message.content = response.content
           message.type = metadata.type
        ↓
ChatContainer renderiza nuevo mensaje
        │
        ├─ Si type === 'diagnosis_ready'
        │  └─ Usa dangerouslySetInnerHTML
        └─ Si no
           └─ Usa ReactMarkdown
        ↓
setIsProcessing(false)
        ↓
USUARIO VE RESPUESTA DE CLARA
```

### 8.2 Detectores de Diagnóstico (en backend)

**En `conversational-assistant.service.ts` (línea 224-246):**

```typescript
private shouldGenerateDiagnosis(
  message: string,
  turnCount: number,
  hasRealProblem?: boolean
): boolean {
  // No generar si no hay problema real
  if (!hasRealProblem) return false;
  
  // Si ya hay 12+ turnos
  if (turnCount >= 12) return true;
  
  // Si el mensaje contiene señales de diagnóstico
  const diagnosisSignals = [
    'basándome en lo que me has contado',
    'hola ' + '\\w+, ',
    'puntos clave',
    'necesitas enfoque integral'
  ];
  
  return diagnosisSignals.some(signal =>
    new RegExp(signal, 'i').test(message)
  );
}
```

**Señales de diagnóstico:**
1. Turno 12+ con problema real confirmado
2. Palabras clave en el mensaje que indican resumen

### 8.3 En ChatContainer - Renderización Final

```typescript
{/* Render with ReactMarkdown for mejor formatting */}
{message.type === 'diagnosis_ready' ? (
  <div
    className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
    dangerouslySetInnerHTML={{ __html: message.content }}
  />
) : (
  <div className="text-[15px] leading-relaxed">
    <ReactMarkdown components={{...}}>
      {message.content}
    </ReactMarkdown>
  </div>
)}

{/* Si es diagnóstico, mostrar botones */}
{message.type === 'diagnosis_ready' && state.diagnosisContent && (
  <div className="mt-6 flex flex-col gap-3">
    <button onClick={handleDownloadPDF}>
      <Download /> Descargar mi diagnóstico
    </button>
    <a href="https://objetivovientreplano.com/suscripcion/" target="_blank">
      ✨ Descubrir el Método Completo →
    </a>
  </div>
)}
```

---

## 9. TIPOS DE DATOS PRINCIPALES

### 9.1 SessionData
```typescript
interface SessionData {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  language: 'es' | 'en';
  diagnosticType?: 'chat' | 'quiz';
  step: 'intro' | 'choice' | 'questions' | 'diagnosis';
  imageAnalysisText?: string;
  assistantId?: string;
  threadId?: string;
  startTime: Date;
  completionTime?: Date;
  expiresAt: Date;
}
```

### 9.2 ChatMessage
```typescript
interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}
```

### 9.3 FlowMessage (Frontend)
```typescript
export interface FlowMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'welcome' | 'greeting' | 'question' | 'comment' | 'diagnosis_ready' | 'validation_error' | 'completed';
  question?: DiagnosticQuestion;
  timestamp?: string;
}
```

### 9.4 DiagnosticState (Frontend)
```typescript
export interface DiagnosticState {
  step: FlowStep;
  currentQuestionIndex: number;
  userName: string;
  userEmail: string;
  language: 'es' | 'en';
  answers: Array<{ question: string; answer: string }>;
  imageAnalysis: string | null;
  diagnosisContent: string | null; // ← CRÍTICO
}
```

---

## 10. ARQUITECTURA DE BASE DE DATOS

### 10.1 Tablas Principales (Prisma Schema)

```prisma
model Session {
  id                String      @id @default(cuid())
  userId            String?
  userName          String?
  userEmail         String?
  language          String      @default("es")
  step              String      @default("intro")
  flowState         Json?       // { threadId, mainProblem, hasRealProblem, ... }
  currentQuestionIndex Int?
  startTime         DateTime    @default(now())
  completionTime    DateTime?
  expiresAt         DateTime
  completedDiagnosis Boolean?
  wordpress_lead_id String?
  
  messages          Message[]
  diagnosis         Diagnosis?
  
  @@index([userId])
  @@index([wordpress_lead_id])
}

model Message {
  id        String   @id @default(cuid())
  sessionId String
  role      String   // 'user' | 'assistant'
  content   String   @db.Text
  metadata  Json?
  createdAt DateTime @default(now())
  
  session   Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@index([sessionId])
}

model Diagnosis {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  userId          String?
  content         String   @db.Text
  questionsAsked  Int?
  totalScore      Int?
  scorePercentage Float?
  pdfGenerated    Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  session         Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model DiscountCode {
  id          String   @id @default(cuid())
  code        String   @unique
  percentage  Int
  sessionId   String
  used        Boolean  @default(false)
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  @@index([sessionId])
  @@index([code])
}
```

### 10.2 FlowState JSON Structure

```typescript
// Guardado en Session.flowState como JSON
{
  threadId: string;              // ID del thread en OpenAI Assistants API
  mainProblem?: string;          // Problema principal identificado
  hasRealProblem: boolean;       // Si usuario tiene problema real confirmado
  duration?: string;             // Cuánto tiempo lleva
  triggers?: string[];           // Factores que lo triggers
  patterns?: string[];           // Patrones observados
  // ... otros datos de contexto
}
```

---

## 11. CONFIGURACIÓN CRITICA PARA ERRORES

### 11.1 Checklist de Configuración

Para que funcione correctamente necesitas:

**Backend (.env):**
```env
CLARA_ASSISTANT_ID=asst_pmSpGqn4zfnk1tEXICepkALE
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
```

### 11.2 Errores Comunes y Soluciones

**Error: "Thread no inicializado"**
- Causa: No se llamó POST /api/chat/init antes de enviar mensajes
- Solución: Asegurar que `initialize()` se llama antes de `processMessage()`

**Error: "Session expirada"**
- Causa: Sesión expiró (24 horas por defecto)
- Solución: Crear nueva sesión

**Mensajes vacíos o incompletos**
- Causa: OpenAI run no completó en tiempo (>30 segundos)
- Solución: Aumentar timeout en `waitForCompletion()`

**Diagnóstico no se renderiza**
- Causa: `message.type !== 'diagnosis_ready'` o `diagnosisContent` no se guardó en state
- Solución: Verificar que backend envíe metadata correctamente

**Negritas no aparecen en diagnóstico**
- Causa: Usando dangerouslySetInnerHTML pero HTML no tiene `<strong>` tags
- Solución: Asegurar que diagnóstico generado por OpenAI incluye HTML formatting

---

## 12. PUNTOS DE INTEGRACIÓN CLAVE

### 12.1 WordPress Integration
- **Endpoint:** POST /api/webhooks/lead-submitted
- **Parámetros URL:** `?nombre=...&email=...&lead_id=...`
- **Sincronización:** `wordPressSyncService.syncDiagnosisCompletion(sessionId)`

### 12.2 OpenAI Integration
- **Modelo:** gpt-4o
- **API:** Assistants API (no completions)
- **Assistant ID:** asst_pmSpGqn4zfnk1tEXICepkALE
- **Thread Management:** Uno por sesión

### 12.3 Discount System
- **Generación:** `discountService.createDiscountForSession()`
- **Estructura:** Código único + porcentaje + expiración
- **Uso:** Se retorna al frontend en metadata

---

## RESUMEN EJECUTIVO

Este es un chatbot conversacional single-flow que:

1. **Captura datos** via URL params desde WordPress
2. **Crea sesión** en backend con datos del usuario
3. **Inicia conversación** natural con Clara (OpenAI Assistant)
4. **Mantiene contexto** a través de Assistants API threads
5. **Detecta diagnóstico** cuando hay información suficiente (12+ turnos o señales)
6. **Genera diagnóstico personalizado** con estructura HTML
7. **Ofrece descuento** y enlace a producto completo
8. **Sincroniza con WordPress** para tracking de leads

**Stack:** React + Express + OpenAI API + Prisma + PostgreSQL + Tailwind

**Flujo visual:** URL → App validation → WelcomeAnimation → ChatContainer → Conversación → Diagnóstico → PDF + Subscription link

