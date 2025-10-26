# Diagramas de Arquitectura - Proyecto Clara

## 1. FLUJO DE USUARIO COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│                      WORDPRESS LANDING PAGE                     │
│                                                                   │
│  Usuario llena formulario: Nombre, Email, Lead ID                │
│  [Botón] "Iniciar Diagnóstico Gratuito"                          │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Redirige a:
             │ https://app.com/?nombre=Juan&email=juan@mail.com&lead_id=123
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                        REACT APP.TSX                            │
│                                                                   │
│  1. useEffect detecta URL params                                 │
│  2. Valida nombre && email                                       │
│  3. Llama handleIntroComplete()                                  │
│     ├─ Guarda en sessionStorage                                  │
│     ├─ POST /api/sessions (crea sesión backend)                  │
│     └─ Zustand sessionStore.setSession()                         │
│  4. setShowWelcome(true)                                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WELCOMEANIMATION COMPONENT                   │
│                                                                   │
│  ┌─────────────────────────────────────┐                        │
│  │  Logo Circular (OVP Favicon)        │                        │
│  │  "Diagnóstico Gratuito"             │                        │
│  │  "Preparando tu experiencia..."     │                        │
│  │  [Loading Spinner]                  │                        │
│  │                                      │                        │
│  │  2-3 segundo delay                  │                        │
│  └─────────────────────────────────────┘                        │
│                                                                   │
│  onAnimationComplete() → setShowWelcome(false)                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CHATCONTAINER COMPONENT                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  HEADER: "Diagnóstico En Línea" | Dark Mode Toggle  │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │                                                        │       │
│  │  MAIN: Empty State + Messages                        │       │
│  │                                                        │       │
│  │  [Empty State - solo si sin mensajes]                │       │
│  │  Logo OVP                                             │       │
│  │  "Comencemos tu diagnóstico"                         │       │
│  │  "Estoy aquí para ayudarte..."                       │       │
│  │                                                        │       │
│  │  [Messages Loop - mensaje a mensaje]                 │       │
│  │  Para cada mensaje:                                  │       │
│  │  ├─ Avatar (OVP si assistant, inicial si user)      │       │
│  │  ├─ Message Bubble                                   │       │
│  │  │  ├─ Si type='diagnosis_ready'                     │       │
│  │  │  │  └─ dangerouslySetInnerHTML (HTML crudo)      │       │
│  │  │  │     Con botones PDF + Suscripción              │       │
│  │  │  └─ Si type='question' o 'comment'                │       │
│  │  │     └─ ReactMarkdown                              │       │
│  │  │        Detecta ? al final → font-semibold         │       │
│  │  └─ MessageActions (Copy, Thumbs Up/Down)            │       │
│  │                                                        │       │
│  │  [Typing Indicator - si isProcessing=true]           │       │
│  │  Avatar + 3 dots animados                            │       │
│  │                                                        │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │  FOOTER: Input Area                                  │       │
│  │  ├─ Image Preview (si selectedImage)                 │       │
│  │  ├─ Textarea (auto-resize)                           │       │
│  │  ├─ Plus Menu                                        │       │
│  │  │  ├─ Upload Image                                  │       │
│  │  │  └─ Take Photo (Camera)                           │       │
│  │  ├─ Voice Button (si speech supported)               │       │
│  │  └─ Send Button (disabled si vacío o processing)     │       │
│  │  "ChatOVP puede cometer errores..."                  │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## 2. FLUJO DE MENSAJE (Turno por Turno)

```
┌─────────────────────────────────┐
│  USUARIO TIPEA MENSAJE           │
│  (textarea onChange event)       │
│  setInputMessage(e.target.value) │
└──────────────┬──────────────────┘
               │
               ↓
        ┌──────────────────┐
        │ ENTER o Click    │
        │ handleSendMessage│
        └────────┬─────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: useDiagnosticFlow.processMessage()                │
│                                                              │
│ 1. setIsProcessing(true)                                    │
│ 2. Obtiene sessionId de sessionStore                        │
│ 3. setMessages([...prev, { role:'user', content:msg }])    │
│    ↓ [USUARIO VE SU MENSAJE INMEDIATAMENTE]                │
│ 4. apiClient.sendMessage({sessionId, message, language})   │
│    POST /api/chat                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ HTTP POST
         ┌────────────────────────────┐
         │ NETWORK REQUEST (300-1000ms)│
         └────────────┬───────────────┘
                      │
                      ↓
┌───────────────────────────────────────────────────────────┐
│ BACKEND: chat.controller.ts sendMessage()                 │
│                                                            │
│ 1. Validar sessionId (ValidationService)                  │
│ 2. Validar message (ValidationService)                    │
│ 3. Obtener sesión: prisma.session.findUnique(sessionId)  │
│ 4. Verificar expiración                                   │
│ 5. Obtener threadId del flowState JSON                    │
│                                                            │
│ 6. Contar turnos de usuario                               │
│    const turnCount = prisma.message.count({...})          │
│                                                            │
│ 7. Preparar CONTEXT:                                      │
│    {                                                       │
│      userName?: 'Juan'                                    │
│      mainProblem?: 'Hinchazón'                            │
│      turnCount: 3                                         │
│      hasRealProblem: true                                 │
│    }                                                       │
│                                                            │
│ 8. LLAMAR conversationalAssistant.processMessage()         │
│    (ver flujo siguiente)                                  │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────────────┐
│ BACKEND: conversational-assistant.service.ts processMessage()│
│                                                               │
│ 1. openai.beta.threads.messages.create(threadId, {          │
│      role: 'user',                                           │
│      content: userMessage                                    │
│    })                                                        │
│                                                               │
│ 2. buildDynamicInstructions(context)                         │
│    ├─ Ajusta instrucciones según turno actual              │
│    ├─ Turnos 1-3: "Identifica problema"                     │
│    ├─ Turnos 4-8: "Explora patrones"                        │
│    └─ Turnos 13+: "Diagóstico listo"                        │
│    RETORNA: instrucciones personalizadas (string)            │
│                                                               │
│ 3. openai.beta.threads.runs.create(threadId, {              │
│      assistant_id: 'asst_pmSpGqn4zfnk1tEXICepkALE'          │
│      additional_instructions: instrucciones                  │
│    })                                                        │
│    RETORNA: { id, status: 'queued' }                         │
│                                                               │
│ 4. waitForCompletion(threadId, runId, maxAttempts=30)       │
│    ├─ Loop: cada 1 segundo                                  │
│    ├─ openai.beta.threads.runs.retrieve(threadId, runId)    │
│    ├─ Si status === 'completed' → BREAK                     │
│    └─ Si 30 intentos → TIMEOUT ERROR                        │
│                                                               │
│ 5. openai.beta.threads.messages.list(threadId, {limit:1})   │
│    RETORNA: { data: [{ content: [{type, text.value}] }] }   │
│    Extrae: messageText = firstMessage.text.value             │
│                                                               │
│ 6. Detectar DIAGNÓSTICO:                                     │
│    ├─ shouldGenerateDiagnosis(msg, turnCount, hasProblem)   │
│    ├─ Si NO hasRealProblem → false                           │
│    ├─ Si turnCount >= 12 → true                             │
│    └─ Si mensaje contiene señales → true                    │
│                                                               │
│ 7. RETORNA:                                                  │
│    {                                                         │
│      message: messageText,                                  │
│      isDiagnosisReady: boolean,                             │
│      shouldEndConversation: boolean                         │
│    }                                                         │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ↓
┌────────────────────────────────────────────────────────────┐
│ BACKEND: chat.controller.ts (continuación)                 │
│                                                             │
│ 9. Guardar MENSAJES en BD:                                 │
│    ├─ prisma.message.create({                              │
│    │    sessionId,                                         │
│    │    role: 'user',                                      │
│    │    content: userMessage                               │
│    │  })                                                   │
│    └─ prisma.message.create({                              │
│         sessionId,                                         │
│         role: 'assistant',                                 │
│         content: response.message                          │
│       })                                                   │
│                                                             │
│ 10. Actualizar FLOWSTATE:                                   │
│     prisma.session.update({                                │
│       where: { id: sessionId },                            │
│       data: {                                              │
│         flowState: {                                       │
│           ...flowState,                                    │
│           hasRealProblem: ...                              │
│         },                                                 │
│         currentQuestionIndex: turnCount + 1                │
│       }                                                    │
│     })                                                     │
│                                                             │
│ 11. SI response.isDiagnosisReady:                          │
│     ├─ conversationalAssistant.generateDiagnosis()        │
│     │  └─ Crea mensaje "Genera mi diagnóstico"            │
│     │  └─ Ejecuta run con DIAGNOSIS_INSTRUCTIONS          │
│     │  └─ Retorna diagnosisContent (HTML)                 │
│     │                                                      │
│     ├─ prisma.diagnosis.create({...})                      │
│     │                                                      │
│     ├─ discountService.createDiscountForSession()         │
│     │  └─ Retorna { code, percentage }                    │
│     │                                                      │
│     ├─ wordPressSyncService.syncDiagnosisCompletion()      │
│     │                                                      │
│     └─ Incluir en respuesta:                               │
│        metadata: {                                         │
│          type: 'diagnosis',                                │
│          diagnosisContent: HTML,                           │
│          discountCode: '...',                              │
│          discountPercentage: 30                            │
│        }                                                   │
│                                                             │
│ 12. RETORNA response:                                       │
│     {                                                      │
│       success: true,                                       │
│       data: {                                              │
│         role: 'assistant',                                 │
│         content: response.message,                         │
│         metadata: {...}                                    │
│       }                                                    │
│     }                                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ HTTP Response
          ┌───────────────────────┐
          │ NETWORK (50-100ms)     │
          └──────────┬─────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│ FRONTEND: useDiagnosticFlow (captura respuesta)          │
│                                                           │
│ 1. Extrae: { success, data: {...}, metadata: {...} }    │
│                                                           │
│ 2. setState(prevState => {                              │
│      return {                                            │
│        ...prevState,                                     │
│        step: metadata.step || prevState.step,            │
│        currentQuestionIndex: metadata.currentQuestionIdx │
│        diagnosisContent: metadata.diagnosisContent       │
│      }                                                   │
│    })                                                    │
│                                                           │
│ 3. setTimeout(800ms) {                                  │
│      Agrega assistantMsg a messages:                     │
│      setMessages(prev => [...prev, {                     │
│        role: 'assistant',                                │
│        content: response.content,                        │
│        type: metadata.type, // 'question' o 'diagnosis'  │
│        timestamp: new Date()                             │
│      }])                                                 │
│    }                                                     │
│                                                           │
│ 4. setIsProcessing(false)                                │
│                                                           │
│ 5. ¡MENSAJE RENDERIZADO!                                │
└──────────────────────────────────────────────────────────┘
```

## 3. ARQUITECTURA DE DATOS

```
┌──────────────────────────────────────────────────────────┐
│              OPENAI ASSISTANTS API                       │
│                                                           │
│  Assistant: asst_pmSpGqn4zfnk1tEXICepkALE                │
│  ├─ Model: gpt-4o                                        │
│  ├─ Name: "Clara - Experta en Salud Digestiva"          │
│  └─ Instructions: CLARA_INSTRUCTIONS (430 líneas)        │
│                                                           │
│  Para cada sesión:                                       │
│  └─ Thread: thread_xxx                                   │
│     ├─ Messages: user → assistant → user → ...           │
│     └─ Runs: ejecuta assistant con instrucciones         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│             POSTGRESQL DATABASE                          │
│                                                           │
│  Sessions table                                          │
│  ├─ id (PK)                                              │
│  ├─ userId (FK) [nullable]                               │
│  ├─ userName                                             │
│  ├─ userEmail                                            │
│  ├─ language: 'es' | 'en'                               │
│  ├─ step: 'intro' | 'choice' | 'questions' | 'diagnosis'│
│  ├─ flowState: JSON {                                    │
│  │   threadId,                                           │
│  │   mainProblem,                                        │
│  │   hasRealProblem,                                     │
│  │   duration,                                           │
│  │   triggers[],                                         │
│  │   patterns[]                                          │
│  │ }                                                     │
│  ├─ currentQuestionIndex                                 │
│  ├─ startTime                                            │
│  ├─ completionTime [nullable]                            │
│  ├─ expiresAt (24h por defecto)                          │
│  ├─ completedDiagnosis                                   │
│  └─ wordpress_lead_id [nullable]                         │
│                                                           │
│  Messages table                                          │
│  ├─ id (PK)                                              │
│  ├─ sessionId (FK)                                       │
│  ├─ role: 'user' | 'assistant'                          │
│  ├─ content: TEXT                                        │
│  ├─ metadata: JSON [nullable]                            │
│  └─ createdAt                                            │
│                                                           │
│  Diagnosis table                                         │
│  ├─ id (PK)                                              │
│  ├─ sessionId (FK, UNIQUE)                               │
│  ├─ userId (FK) [nullable]                               │
│  ├─ content: TEXT (300-450 palabras, HTML)              │
│  ├─ questionsAsked                                       │
│  ├─ totalScore [nullable]                                │
│  ├─ scorePercentage [nullable]                           │
│  ├─ pdfGenerated: boolean                                │
│  └─ createdAt                                            │
│                                                           │
│  DiscountCode table                                      │
│  ├─ id (PK)                                              │
│  ├─ code: string (UNIQUE)                                │
│  ├─ percentage: int                                      │
│  ├─ sessionId (FK)                                       │
│  ├─ used: boolean                                        │
│  ├─ usedAt [nullable]                                    │
│  ├─ expiresAt                                            │
│  └─ createdAt                                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│          FRONTEND STATE MANAGEMENT                       │
│                                                           │
│  Zustand Stores:                                         │
│  ├─ useSessionStore (persisted)                         │
│  │  └─ { session, language, setSession, clearSession }  │
│  │                                                       │
│  └─ useChatStore                                         │
│     └─ { messages, isTyping, addMessage, setMessages }  │
│                                                           │
│  React Hook State:                                       │
│  └─ useDiagnosticFlow()                                  │
│     ├─ messages: FlowMessage[]                           │
│     ├─ state: DiagnosticState {                          │
│     │   step, currentQuestionIndex, userName,             │
│     │   diagnosisContent  ← CRÍTICO                      │
│     │ }                                                   │
│     ├─ isProcessing                                      │
│     └─ initialize, processMessage, reset                 │
│                                                           │
│  Local Storage:                                          │
│  ├─ sessionStorage.userData = { name, email, leadId }   │
│  ├─ localStorage.ovp-session-storage (Zustand persist)   │
│  └─ localStorage (sessionStorage backup)                 │
└──────────────────────────────────────────────────────────┘
```

## 4. RENDERIZACIÓN DE MENSAJES

```
┌─────────────────────────────────────────────────────────┐
│  FlowMessage objeto en memory                            │
│  {                                                       │
│    role: 'assistant' | 'user'                            │
│    content: string                                       │
│    type?: 'welcome' | 'greeting' | 'question' |         │
│            'comment' | 'diagnosis_ready'                 │
│    timestamp?: string                                    │
│  }                                                       │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  ChatContainer.tsx renderiza en loop:                    │
│                                                          │
│  {messages.map((message, index) => (                     │
│    <motion.div key={index}>                              │
│                                                          │
│      {/* Avatar */}                                      │
│      {message.role === 'assistant' && <img... />}        │
│      {message.role === 'user' && <div className.../>}    │
│                                                          │
│      {/* Message Bubble */}                              │
│      <div className={...}>                               │
│                                                          │
│        {/* ¿QUÉ RENDERIZAR? */}                          │
│                                                          │
│        {message.type === 'diagnosis_ready' ? (           │
│                                                          │
│          /* OPCIÓN 1: dangerouslySetInnerHTML */         │
│          <div                                            │
│            dangerouslySetInnerHTML={{                    │
│              __html: message.content                     │
│            }}                                            │
│            className="text-[15px] leading-relaxed..."    │
│          />                                              │
│          /* HTML CRUDO:                                 │
│             <strong>Diagnóstico Personalizado</strong>   │
│             <p>Basándome en lo que me contaste...</p>   │
│             <p><strong>🦠 SIBO</strong></p>             │
│             etc.                                         │
│          */                                              │
│                                                          │
│          /* Botones */                                   │
│          <button>Descargar PDF</button>                  │
│          <a href="suscripcion">Método Completo</a>       │
│                                                          │
│        ) : (                                             │
│                                                          │
│          /* OPCIÓN 2: ReactMarkdown */                   │
│          <ReactMarkdown                                  │
│            components={{                                 │
│              p: ({ children }) => {                       │
│                /* DETECCIÓN AUTOMÁTICA DE PREGUNTAS */   │
│                const text = String(children);            │
│                const isQuestion = text.endsWith('?');    │
│                                                          │
│                return (                                  │
│                  <p className={                          │
│                    `... ${isQuestion ? 'font-semibold'   │
│                    : ''}`                                │
│                  }>                                      │
│                    {children}                            │
│                  </p>                                    │
│                );                                        │
│              },                                          │
│              strong: ({ children }) => (                │
│                <strong className="font-semibold...">    │
│                  {children}                              │
│                </strong>                                 │
│              ),                                          │
│              em: ({ children }) => (                    │
│                <em className="italic">{children}</em>    │
│              ),                                          │
│            }}                                            │
│          >                                               │
│            {message.content}                             │
│          </ReactMarkdown>                                │
│          /* MARKDOWN PARSEDO:                           │
│             **texto negrita** → <strong>                │
│             *itálica* → <em>                            │
│             ¿pregunta? → automáticamente negrita         │
│          */                                              │
│        )}                                                │
│                                                          │
│        {/* Question Details (si existe) */}             │
│        {message.question?.questionDetails && (          │
│          <p className="mt-2 text-sm opacity-80">        │
│            {message.question.questionDetails}           │
│          </p>                                            │
│        )}                                                │
│                                                          │
│      </div>                                              │
│                                                          │
│      {/* Message Actions */}                             │
│      <MessageActions messageText={...} />                │
│                                                          │
│    </motion.div>                                         │
│  ))}                                                     │
└─────────────────────────────────────────────────────────┘
```

## 5. COMPONENTES VISUALES

```
┌─────────────────────────────────────────────────────────┐
│              CHATCONTAINER LAYOUT                        │
│                                                          │
│ ╔═══════════════════════════════════════════════════════╗
│ ║ HEADER (sticky top-0)                                 ║
│ ║ ┌─────────────────────────────────────────────────┐   ║
│ ║ │ [spacer] │ Diagnóstico 🟢En Línea │ [DarkMode]  │   ║
│ ║ └─────────────────────────────────────────────────┘   ║
│ ╠═══════════════════════════════════════════════════════╣
│ ║ MAIN (flex-1 overflow-y-auto)                         ║
│ ║                                                        ║
│ ║ [EMPTY STATE - mientras no haya mensajes]             ║
│ ║  ┌────────────────────────────────────────────────┐   ║
│ ║  │        ┌──────────────────────┐               │   ║
│ ║  │        │   [OVP Logo]          │               │   ║
│ ║  │        └──────────────────────┘               │   ║
│ ║  │                                                 │   ║
│ ║  │      Comencemos tu diagnóstico                │   ║
│ ║  │      Estoy aquí para ayudarte...              │   ║
│ ║  └────────────────────────────────────────────────┘   ║
│ ║                                                        ║
│ ║ [MESSAGES AREA - una vez haya mensajes]               ║
│ ║                                                        ║
│ ║ Mensaje 1: [Avatar OVP] "Hola Juan, ¿qué..."        ║
│ ║            [Copy] [👍] [👎]                          ║
│ ║                                                        ║
│ ║ Mensaje 2: [Avatar User] "Tengo hinchazón"          ║
│ ║            [Copy] [👍] [👎]                          ║
│ ║                                                        ║
│ ║ Mensaje 3: [Avatar OVP] "¿Cuánto tiempo..."         │
│ ║            [Copy] [👍] [👎]                          ║
│ ║                                                        ║
│ ║ [DIAGNOSIS MESSAGE - cuando type='diagnosis_ready']   ║
│ ║ [Avatar OVP] Hola Juan, basándome...                │
│ ║              🦠 **SIBO**                             ║
│ ║              Párrafo de explicación...               ║
│ ║              🧠 **Eje Intestino-Cerebro**           ║
│ ║              Párrafo...                              ║
│ ║              ───────────────────────                 ║
│ ║              [Descargar PDF] [Método Completo ✨→]   ║
│ ║                                                        ║
│ ║ [TYPING INDICATOR - si isProcessing=true]            ║
│ ║ [Avatar OVP] ● ● ●                                   ║
│ ║              (animado)                                ║
│ ║                                                        ║
│ ╠═══════════════════════════════════════════════════════╣
│ ║ FOOTER (sticky bottom-0)                              ║
│ ║                                                        ║
│ ║ [IMAGE PREVIEW - si selectedImage]                   ║
│ ║ ┌────────────────────────────────────────────────┐   ║
│ ║ │ [img] "Imagen seleccionada" [X] Se enviará...  │   ║
│ ║ └────────────────────────────────────────────────┘   ║
│ ║                                                        ║
│ ║ [INPUT FORM]                                         ║
│ ║ ┌────────────────────────────────────────────────┐   ║
│ ║ │ [+] │ Escribe tu mensaje... │ [🎤] [➤] │      │   ║
│ ║ │     ├─ 📸 Upload                               │   ║
│ ║ │     └─ 📷 Camera                               │   ║
│ ║ └────────────────────────────────────────────────┘   ║
│ ║                                                        ║
│ ║ ChatOVP puede cometer errores...                      ║
│ ║                                                        ║
│ ╚═══════════════════════════════════════════════════════╝
└─────────────────────────────────────────────────────────┘
```

## 6. FLUJO DE ESTILOS

```
TAILWIND CONFIG
    ↓
┌────────────────────────────────────────┐
│ tailwind.config.js                     │
│ ├─ colors:                             │
│ │  ├─ brand.green (#97AA79)           │
│ │  ├─ neutral (grises)                 │
│ │  └─ semantic (success, error, etc)  │
│ ├─ fonts:                              │
│ │  └─ Inter var                        │
│ └─ animations:                         │
│    ├─ fade-in                          │
│    ├─ scale-in                         │
│    └─ pulse-soft                       │
└────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────┐
│ globals.css (@layer base, components)  │
│ ├─ CSS Variables (:root, .dark)       │
│ ├─ Message Bubbles:                    │
│ │  ├─ .message-bubble                  │
│ │  ├─ .message-bubble-user             │
│ │  └─ .message-bubble-assistant        │
│ ├─ Typing Indicator:                   │
│ │  ├─ .typing-indicator                │
│ │  └─ .typing-dot                      │
│ ├─ Glass Effect:                       │
│ │  └─ .glass (backdrop-blur)           │
│ └─ Chat Lighting:                      │
│    └─ .bg-chat-lighting (gradients)    │
└────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────┐
│ Component Styling                      │
│ ├─ ChatContainer.tsx:                  │
│ │  ├─ className="text-sm font-semibold"│
│ │  ├─ className="font-bold text-base"  │
│ │  └─ styles="darkMode ? '...' : '...'"│
│ ├─ MessageActions.tsx:                 │
│ │  ├─ color-brand-green-500 (liked)   │
│ │  └─ color-red-500 (disliked)         │
│ └─ Button.tsx (CVA):                   │
│    ├─ variant: primary|secondary|ghost │
│    └─ size: sm|md|lg|xl                │
└────────────────────────────────────────┘

RESULTADO EN BROWSER:
├─ Preguntas terminadas en ? → negrita
├─ User messages → verde (brand-green-500)
├─ Assistant messages → gris (neutral)
├─ Diagnóstico → HTML con emojis y negrita
└─ Dark mode → CSS variables en .dark
```

## 7. CICLO DE VIDA DE COMPONENTES

```
APP.TSX MOUNT
    ↓
    ├─ useEffect [location.pathname]
    │  ├─ Detecta URL params
    │  └─ Llama handleIntroComplete()
    │     ├─ apiClient.createSession()
    │     └─ setShowWelcome(true)
    │
    ├─ RENDER 1: WelcomeAnimation visible
    │  └─ Animación 2-3s
    │
    ├─ WelcomeAnimation completes
    │  └─ onComplete → setShowWelcome(false)
    │
    ├─ RENDER 2: ChatContainer monta
    │  └─ useEffect [session?.id]
    │     └─ useDiagnosticFlow.initialize()
    │        ├─ GET /api/chat/:sessionId (histórico?)
    │        ├─ Si no existe histórico:
    │        │  └─ POST /api/chat/init
    │        └─ setMessages([welcomeMessage])
    │
    ├─ RENDER 3: Primer mensaje visible
    │  └─ Usuario ve pregunta de Clara
    │
    └─ USER INTERACTION LOOP
       ├─ Usuario tipea
       ├─ Usuario presiona ENTER
       ├─ handleSendMessage()
       ├─ processMessage()
       ├─ POST /api/chat
       ├─ setMessages([...prev, userMsg, assistantMsg])
       ├─ RENDER: Nuevo mensaje visible
       └─ Loop nuevamente...

AL LLEGAR A DIAGNÓSTICO:
├─ isDiagnosisReady en respuesta
├─ generateDiagnosis() en backend
├─ Retorna diagnosisContent (HTML)
├─ setState({ diagnosisContent })
├─ Renderiza con dangerouslySetInnerHTML
└─ Muestra botones PDF + Suscripción
```

