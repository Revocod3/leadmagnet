# RESUMEN EJECUTIVO - Proyecto LeadMagnet Clara

## Visión General
Chatbot conversacional de diagnóstico de salud digestiva que captura leads de WordPress y genera diagnósticos personalizados usando OpenAI Assistants API.

## Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** PostgreSQL + Prisma ORM
- **IA:** OpenAI Assistants API (gpt-4o)
- **Estado:** Zustand (frontend), Prisma (backend)
- **Animaciones:** Framer Motion

## Flujo Principal (User Journey)

```
WordPress              →     URL con params     →    React App
(nombre, email)              (?nombre=...)        (valida params)
                                ↓
                         WelcomeAnimation
                         (2-3 segundos)
                                ↓
                         ChatContainer
                         (inicia convo)
                                ↓
                         Conversación Natural
                         (12-15 turnos típicos)
                                ↓
                         Diagnóstico Generado
                                ↓
                         PDF + Suscripción Link
```

## Arquitectura de Conversación

### Clara (OpenAI Assistant)
- **ID:** `asst_pmSpGqn4zfnk1tEXICepkALE`
- **Modelo:** gpt-4o
- **Especialidad:** Salud digestiva (SIBO, disbiosis, intolerancias)
- **Personalidad:** Firme, empática, directa, cálida

### Instrucciones Principales
Ubicadas en: `/apps/backend/src/config/assistant-instructions.ts`

**Reglas Críticas:**
1. MANTÉN FOCO EN DIGESTIÓN SIEMPRE
2. NO ASUMAS PROBLEMAS (respeta negativas)
3. UNA PREGUNTA A LA VEZ
4. SÉ DIRECTA, NO INDIRECTA
5. SI USUARIO PIDE DIAGNÓSTICO → VE AL GRANO
6. NUNCA USES FRASES DÉBILES DE CHATBOT
7. RESPETA RESISTENCIA LEGÍTIMA

### Fases de Conversación
- **Turnos 1-3:** Identificar SI HAY PROBLEMA
- **Turnos 4-8:** Explorar PATRONES y TRIGGERS
- **Turnos 9-12:** Profundizar en lo relevante
- **Turno 13+:** Generar DIAGNÓSTICO

## Flujo Técnico de un Mensaje

```
Usuario tipea → handleSendMessage()
                        ↓
             setMessages(userMsg)  [UI immediata]
                        ↓
             apiClient.sendMessage(POST /api/chat)
                        ↓
             [Backend: chat.controller.ts]
             ├─ Obtiene threadId
             ├─ buildDynamicInstructions()
             ├─ conversationalAssistant.processMessage()
             │  ├─ Agrega msg al thread OpenAI
             │  ├─ Ejecuta run con instrucciones
             │  ├─ waitForCompletion() [max 30s]
             │  └─ Extrae respuesta
             ├─ Guarda en BD
             ├─ Detecta si diagnóstico listo
             │  └─ Si SÍ: generateDiagnosis()
             └─ Retorna response + metadata
                        ↓
             [Frontend: actualiza state]
             ├─ setState(diagnosisContent?)
             ├─ Agrega assistantMsg
             └─ ChatContainer renderiza
```

## Componentes Clave

### Frontend
- **ChatContainer.tsx** (520 líneas)
  - Header: Título + Dark mode toggle
  - Main: Mensajes con ReactMarkdown
  - Footer: Textarea + Botones (voice, camera, send)

- **Renderización de Mensajes:**
  - Si `type === 'diagnosis_ready'` → `dangerouslySetInnerHTML` (HTML crudo)
  - Si no → `ReactMarkdown` (parsea markdown)
  - Preguntas (terminan con `?`) → Automáticamente **negrita** (`font-semibold`)

- **MessageActions.tsx**
  - Copy, Thumbs Up, Thumbs Down debajo de cada mensaje

### Backend
- **chat.controller.ts** (332 líneas)
  - `initializeDiagnostic()` - POST /api/chat/init
  - `sendMessage()` - POST /api/chat
  - `getChatHistory()` - GET /api/chat/:sessionId

- **conversational-assistant.service.ts** (270 líneas)
  - Orquestación con OpenAI Assistants API
  - `startConversation()` - Crea thread
  - `processMessage()` - Procesa msg del usuario
  - `generateDiagnosis()` - Genera diagnóstico final

## Sistema de Estilos

### Colores
- **Brand Green:** `#97AA79` (principal)
- **Neutral:** Escala de grises
- **Semánticos:** success, error, warning, info

### Negritas en Mensajes
1. **Preguntas automáticas:** Detecta `?` → aplica `font-semibold`
2. **Markdown:** `**texto**` → `<strong className="font-semibold">`
3. **HTML directo:** En diagnóstico usa `<strong>` tags

### Animaciones
- `fade-in`, `fade-in-up`, `slide-in-right`, `scale-in`
- Typing indicator con 3 dots pulsantes
- Transiciones suaves de tema (light/dark)

## Base de Datos (Prisma)

### Tablas Principales
```
Sessions
├─ id, userId, userName, userEmail
├─ language, step, flowState (JSON)
├─ startTime, completionTime, expiresAt
└─ [relations] Messages, Diagnosis

Messages
├─ id, sessionId, role, content
├─ metadata (JSON)
└─ createdAt

Diagnosis
├─ id, sessionId, content
├─ questionsAsked, totalScore, scorePercentage
└─ createdAt

DiscountCodes
├─ code, percentage, sessionId
├─ used, usedAt, expiresAt
└─ createdAt
```

### FlowState JSON
```json
{
  "threadId": "thread_xxx",
  "mainProblem": "Hinchazón crónica",
  "hasRealProblem": true,
  "duration": "3 meses",
  "triggers": ["gluten", "estrés"],
  "patterns": ["después de comer", "lunes-viernes"]
}
```

## Enrutamiento

### Backend API
```
/api/health                    GET   Health check
/api/sessions                  POST  Create session
/api/sessions/:sessionId       GET   Get session
/api/sessions/:sessionId       PUT   Update session
/api/chat/init                 POST  Initialize diagnostic
/api/chat                      POST  Send message
/api/chat/:sessionId           GET   Get history
/api/discount                  *     Discount endpoints
/api/images                    POST  Upload image
/api/images/:sessionId         GET   Get analysis
```

### Frontend Routing
```
/ (root)     →  MainFlow
             →  App.tsx valida URL params
             →  Si válido: WelcomeAnimation → ChatContainer
             →  Si no: Redirige a WordPress
```

## Configuración Crítica

### Variables de Entorno Backend
```
CLARA_ASSISTANT_ID=asst_pmSpGqn4zfnk1tEXICepkALE
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

### Variables de Entorno Frontend
```
VITE_API_URL=http://localhost:3000
```

## Detección de Diagnóstico

El diagnóstico se genera cuando:

1. **Turno 12+** con `hasRealProblem === true`
2. **Señales en el mensaje:**
   - "basándome en lo que me has contado"
   - "hola [usuario],"
   - "puntos clave"
   - "necesitas enfoque integral"

```typescript
shouldGenerateDiagnosis(message, turnCount, hasRealProblem) {
  if (!hasRealProblem) return false;
  if (turnCount >= 12) return true;
  
  const signals = [
    'basándome en lo que me has contado',
    'hola \\w+, ',
    'puntos clave',
    'necesitas enfoque integral'
  ];
  
  return signals.some(s => RegExp(s, 'i').test(message));
}
```

## Estructura de Diagnóstico

El diagnóstico generado por OpenAI sigue esta estructura:

```
1. SALUDO PERSONALIZADO
   "Hola [nombre], basándome en lo que me has contado..."

2. 3-4 PUNTOS CLAVE
   [Emoji] **Título en Negrita**
   Párrafo explicativo con sus palabras

3. CONCLUSIÓN INTEGRADORA
   Conecta los puntos anteriores

4. POR QUÉ NECESITA ENFOQUE INTEGRAL
   Explica el método completo

5. CIERRE MOTIVADOR
   Confianza y esperanza

Longitud: 300-450 palabras
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "Thread no inicializado" | No se llamó POST /api/chat/init | Asegurar initialize() antes de processMessage() |
| "Session expirada" | >24 horas | Crear nueva sesión |
| Mensajes vacíos | OpenAI run timeout | Aumentar waitForCompletion() |
| Diagnóstico no renderiza | type !== 'diagnosis_ready' | Verificar metadata del backend |
| Negritas no aparecen | Sin `<strong>` o `**` | Asegurar HTML/markdown formatting |

## Integraciones Externas

### WordPress
- Parámetros URL: `?nombre=...&email=...&lead_id=...`
- Webhook: POST /api/webhooks/lead-submitted
- Sincronización: `wordPressSyncService.syncDiagnosisCompletion()`

### OpenAI
- Modelo: gpt-4o
- API: Assistants API (no completions)
- Assistant ID: `asst_pmSpGqn4zfnk1tEXICepkALE`
- Threads: Uno por sesión

### Sistema de Descuentos
- Generación: `discountService.createDiscountForSession()`
- Estructura: Código único + porcentaje + expiración
- Retorno: En metadata de respuesta

## Archivos Principales

### Frontend
- `/apps/frontend/src/App.tsx` - Lógica principal, URL params
- `/apps/frontend/src/components/chat/ChatContainer.tsx` - UI de chat
- `/apps/frontend/src/hooks/useDiagnosticFlow.ts` - Estado y lógica
- `/apps/frontend/src/services/api.ts` - Cliente HTTP
- `/apps/frontend/src/stores/sessionStore.ts` - Estado global

### Backend
- `/apps/backend/src/server.ts` - Configuración Express
- `/apps/backend/src/routes/` - Rutas API
- `/apps/backend/src/controllers/chat.controller.ts` - Lógica de chat
- `/apps/backend/src/services/conversational-assistant.service.ts` - Orquestación
- `/apps/backend/src/config/assistant-instructions.ts` - Prompts de Clara

## Mejores Prácticas Identificadas

✅ Instrucciones detalladas y contextuadas
✅ Thread per session (aislamiento)
✅ Validación en múltiples capas
✅ Renderización condicional según tipo de mensaje
✅ Estado persistente (sessionStorage + Zustand)
✅ Error handling completo
✅ Logging estructurado

## Áreas de Mejora Observadas

⚠️ Documentación inline mínima en algunos archivos
⚠️ Tipado loose en algunos places (use `any`)
⚠️ Detección de diagnóstico podría ser más robusta
⚠️ Algunos errores no capturados en frontend
⚠️ No hay retry logic para fallos de API

---

**Análisis realizado:** 27 de Octubre de 2025
**Documentación:** 1479 líneas completas en `PROJECT_ANALYSIS_EXHAUSTIVE.md`
