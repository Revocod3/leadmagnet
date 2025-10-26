# 🤖 Sistema Conversacional Human-Like

## 📋 Resumen

Este documento describe el nuevo sistema conversacional implementado para transformar el diagnóstico de un flujo rígido y predecible a una experiencia genuina y human-like.

## 🎯 Objetivo

Crear un diagnóstico que se sienta como una **conversación real con un experto**, no como un formulario automatizado.

## 🏗️ Arquitectura

### Componentes Principales

```
┌────────────────────────────────────────────────────────────┐
│                    CAPA DE CONTROLADOR                      │
│                  (chat.controller.ts)                       │
│                                                              │
│  • Recibe mensaje del usuario                               │
│  • Valida sesión                                            │
│  • Llama a ConversationalAssistant                          │
│  • Retorna respuesta + metadata                             │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│         CONVERSATIONAL ASSISTANT (Orquestador)              │
│      (conversational-assistant.service.ts)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ConversationalMemory (Prisma DB)                      │ │
│  │ • factualInfo, emotionalMarkers, keyMoments          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ KeyMomentDetector                                     │ │
│  │ • Detecta repetición, contradicción, breakthrough    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ DecisionEngine                                        │ │
│  │ • follow-up, pivot, clarify, callback, conclude      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ InstructionsBuilder                                   │ │
│  │ • Crea instrucciones dinámicas por turno             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ DiagnosisBuilder                                      │ │
│  │ • Construye hipótesis progresivamente                │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│              OPENAI ASSISTANTS API                          │
│              (assistant-api.service.ts)                     │
│                                                              │
│  • Thread Management (automático)                           │
│  • Message History (automático)                             │
│  • Streaming (opcional)                                     │
└────────────────────────────────────────────────────────────┘
```

## 🔧 Configuración

### 1. Variables de Entorno

Agregar en `.env`:

```bash
# Feature Flag - Activar/desactivar nuevo sistema
USE_NEW_CONVERSATIONAL_SYSTEM=false

# OpenAI Assistant ID (se genera automáticamente si no existe)
OPENAI_ASSISTANT_ID=asst_xxxxx
```

### 2. Migración de Base de Datos

Ya aplicada:

```bash
npx prisma migrate dev --name add_conversational_memory
```

### 3. Activar el Sistema

Cambiar en `.env`:

```bash
USE_NEW_CONVERSATIONAL_SYSTEM=true
```

## 📊 Flujo de Conversación

### Turno 1: Inicialización

```
Usuario inicia sesión
       ↓
ConversationalAssistant.initialize()
       ↓
- Crea Thread en OpenAI
- Crea ConversationalMemory en DB
- Envía mensaje de bienvenida
```

### Turnos 2-N: Conversación

```
Usuario envía mensaje
       ↓
1. Cargar memoria de conversación
       ↓
2. Extraer información factual (edad, síntomas, etc.)
       ↓
3. Detectar tono emocional
       ↓
4. KeyMomentDetector: ¿Es momento importante?
   - Repetición
   - Contradicción
   - Breakthrough
   - Vulnerabilidad
       ↓
5. DiagnosisBuilder: Actualizar hipótesis
   - Confianza 0-100%
   - Evidencia
   - Qué falta confirmar
       ↓
6. DecisionEngine: ¿Qué hacer?
   - follow-up: Profundizar en lo que dijo
   - pivot: Cambiar a tema esencial
   - clarify: Pedir más detalles
   - callback: Volver a tema anterior
   - conclude: Suficiente info
       ↓
7. InstructionsBuilder: Crear instrucciones dinámicas
   - Contexto actual
   - Decisión del engine
   - Estilo del usuario
   - Fase conversacional
       ↓
8. AssistantAPI: Enviar a OpenAI con instrucciones
       ↓
9. Guardar respuesta y actualizar memoria
       ↓
10. ¿Concluir? → Generar diagnóstico final
```

## 🎨 Características Clave

### 1. Memoria Conversacional

```typescript
ConversationalMemory {
  factualInfo: {
    demographics: { age, occupation }
    health: { symptoms, triggers, duration }
    lifestyle: { diet, stress, sleep }
  }
  emotionalMarkers: [
    { turn: 3, emotion: 'frustrated', intensity: 8 }
  ]
  keyMoments: [
    { turn: 5, type: 'breakthrough', content: '...' }
  ]
  currentHypothesis: {
    primary: 'SIBO + IBS relacionado con estrés',
    confidence: 75
  }
}
```

### 2. Detección de Momentos Clave

- **Repetición**: Usuario menciona lo mismo varias veces
- **Contradicción**: Corrige algo dicho antes
- **Breakthrough**: Revela información crítica
- **Vulnerabilidad**: Muestra emoción/frustración
- **Resistencia**: Respuestas evasivas

### 3. Motor de Decisión

Cada respuesta del usuario se analiza para decidir:

```typescript
Decision {
  type: 'follow-up',
  reasoning: 'Usuario mencionó trigger alimentario importante',
  topicToExplore: 'gluten'
}
```

### 4. Diagnóstico Progresivo

No se genera al final de golpe, sino que se construye turno a turno:

```
Turno 3: Hipótesis inicial (30% confianza)
Turno 5: Hipótesis actualizada (50% confianza)
Turno 8: Hipótesis confirmada (75% confianza)
Final: Diagnóstico completo usando toda la narrativa
```

## 🚀 Uso

### Activar para Sesión Nueva

El sistema se activa automáticamente cuando `USE_NEW_CONVERSATIONAL_SYSTEM=true`.

### Comparación A/B

Puedes mantener ambos sistemas y comparar:

```typescript
// Sistema viejo: DiagnosticFlowService
// Sistema nuevo: ConversationalAssistantService

// El controlador decide cuál usar según el flag
```

## 📈 Métricas

El sistema guarda métricas para análisis:

- `turnCount`: Número de mensajes
- `conversationPhase`: introduction, exploration, deepening, conclusion
- `currentHypothesis.confidence`: 0-100%
- `keyMoments.length`: Momentos importantes detectados
- `emotionalMarkers`: Emociones del usuario

## 🐛 Debug

### Logs Útiles

```bash
# KeyMomentDetector detectó algo
🚨 Key moment detected: vulnerability

# DecisionEngine tomó decisión
📊 Decision: follow-up (Usuario mencionó trigger importante)

# DiagnosisBuilder actualizó hipótesis
📊 Hypothesis updated: SIBO + IBS (75% confidence)

# AssistantAPI enviando
🤖 Sending message to Assistant with dynamic instructions...
```

### Ver Memoria Actual

```sql
SELECT * FROM conversational_memory WHERE session_id = 'xxx';
```

## 🔄 Migración desde Sistema Viejo

1. **No rompe sesiones existentes**: El sistema viejo sigue funcionando
2. **Nuevas sesiones usan nuevo sistema**: Si el flag está activado
3. **Sin pérdida de datos**: ConversationalMemory es adicional

## 📝 Archivos Implementados

```
apps/backend/src/
├── config/
│   └── assistants.ts                     ✅ Configuración OpenAI Assistant
├── services/openai/
│   ├── assistant-api.service.ts          ✅ Wrapper Assistants API
│   ├── conversational-assistant.service.ts ✅ Orquestador principal
│   ├── decision-engine.service.ts        ✅ Motor de decisiones
│   ├── diagnosis-builder.service.ts      ✅ Constructor de diagnóstico
│   ├── instructions-builder.service.ts   ✅ Instrucciones dinámicas
│   └── key-moment-detector.service.ts    ✅ Detector de momentos
├── controllers/
│   └── chat.controller.ts                🔄 Modificado (con feature flag)
└── types/
    └── index.ts                          🔄 Tipos nuevos agregados

apps/backend/prisma/
└── schema.prisma                         🔄 Modelo ConversationalMemory
```

## 🎯 Próximos Pasos

1. **Testing**: Probar conversaciones reales
2. **Ajuste de umbrales**: Configurar detección de momentos
3. **Refinamiento de instrucciones**: Mejorar prompts
4. **Monitoreo**: Analytics de métricas
5. **A/B Testing**: Comparar con sistema viejo

## 💡 Referencias

- Plan original: `/improment.md`
- Plan extendido: `/improvement-v2.md`
- OpenAI Assistants API: https://platform.openai.com/docs/assistants/overview
