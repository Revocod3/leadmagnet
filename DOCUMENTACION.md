# 🚀 Objetivo Vientre Plano V2 - Proyecto Completo

## 📋 ÍNDICE DE DOCUMENTACIÓN

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura)
3. [Stack Tecnológico](#stack)
4. [Estructura de Carpetas](#estructura)
5. [Instalación y Configuración](#instalacion)
6. [Implementación Paso a Paso](#implementacion)
7. [Guía de Migración](#migracion)
8. [Testing y QA](#testing)
9. [Deployment](#deployment)
10. [Mantenimiento](#mantenimiento)

---

## 📊 RESUMEN EJECUTIVO

### Descripción del Proyecto
Sistema de diagnóstico de bienestar digestivo con IA que:
- Realiza diagnósticos personalizados mediante 17 preguntas
- Utiliza OpenAI GPT-4o con Assistants API
- Soporta análisis de imágenes abdominales
- Genera reportes en PDF
- Multiidioma (ES/EN)

### Objetivos de la Migración
1. ✅ Migrar de JavaScript vanilla a TypeScript
2. ✅ Modernizar frontend con React + Vite
3. ✅ Implementar OpenAI Assistants API
4. ✅ Mejorar arquitectura y escalabilidad
5. ✅ Reducir bugs y mejorar mantenibilidad
6. ✅ Implementar testing automatizado

### Alcance del Proyecto
- **Duración estimada**: 4-6 semanas
- **Complejidad**: Media-Alta
- **Prioridad**: Alta
- **Equipo**: 1 desarrollador + IA Assistant

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + Vite                       │   │
│  │  - UI Components (shadcn/ui + Tailwind)             │   │
│  │  - State Management (Zustand)                       │   │
│  │  - API Client (TanStack Query)                      │   │
│  │  - Routing (React Router)                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Node.js + Express + TypeScript                     │   │
│  │  - REST API                                          │   │
│  │  - OpenAI Assistants API Integration                │   │
│  │  - Session Management (Redis)                       │   │
│  │  - File Upload (Multer + Sharp)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     SERVICIOS EXTERNOS                       │
│  - OpenAI API (GPT-4o + Vision)                             │
│  - Redis (Cache y Sesiones)                                 │
│  - PostgreSQL (Base de datos)                               │
│  - S3/Storage (Imágenes)                                    │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Principal

```
Usuario → Frontend (React) → API REST → OpenAI Assistant → Respuesta
                                  ↓
                            Redis (Sesión)
                                  ↓
                          PostgreSQL (Persistencia)
```

---

## 🛠️ STACK TECNOLÓGICO

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20.x | Runtime |
| TypeScript | 5.3+ | Lenguaje |
| Express | 4.18+ | Framework web |
| OpenAI SDK | 4.28+ | Integración IA |
| Prisma | 5.9+ | ORM |
| PostgreSQL | 15+ | Base de datos |
| Redis | 7.x | Cache y sesiones |
| Zod | 3.22+ | Validación |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.2+ | UI Framework |
| TypeScript | 5.3+ | Lenguaje |
| Vite | 5.0+ | Build tool |
| TanStack Query | 5.x | Data fetching |
| Zustand | 4.x | State management |
| React Router | 6.x | Routing |
| Tailwind CSS | 3.x | Estilos |
| shadcn/ui | Latest | Componentes |
| Framer Motion | 11.x | Animaciones |

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- ESLint + Prettier
- Vitest + Testing Library
- Husky (Git hooks)

---

## 📁 ESTRUCTURA DE CARPETAS COMPLETA

```
objetivo-vientre-plano-v2/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── env.ts
│   │   │   │   ├── openai.ts
│   │   │   │   ├── redis.ts
│   │   │   │   └── database.ts
│   │   │   ├── controllers/
│   │   │   │   ├── chat.controller.ts
│   │   │   │   ├── quiz.controller.ts
│   │   │   │   ├── session.controller.ts
│   │   │   │   └── image.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── openai/
│   │   │   │   │   ├── assistant.service.ts
│   │   │   │   │   ├── vision.service.ts
│   │   │   │   │   ├── diagnosis.service.ts
│   │   │   │   │   └── validation.service.ts
│   │   │   │   ├── session.service.ts
│   │   │   │   ├── language.service.ts
│   │   │   │   └── pdf.service.ts
│   │   │   ├── routes/
│   │   │   │   ├── chat.routes.ts
│   │   │   │   ├── quiz.routes.ts
│   │   │   │   ├── session.routes.ts
│   │   │   │   └── index.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   ├── validation.middleware.ts
│   │   │   │   └── rateLimit.middleware.ts
│   │   │   ├── types/
│   │   │   │   ├── session.types.ts
│   │   │   │   ├── chat.types.ts
│   │   │   │   ├── quiz.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── errors.ts
│   │   │   │   └── helpers.ts
│   │   │   ├── constants/
│   │   │   │   ├── questions.ts
│   │   │   │   ├── prompts.ts
│   │   │   │   └── locales.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── Dockerfile
│   └── frontend/
│       ├── public/
│       │   ├── assets/
│       │   │   └── images/
│       │   └── locales/
│       │       ├── es.json
│       │       └── en.json
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   │   ├── button.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   └── [otros shadcn components]
│       │   │   ├── chat/
│       │   │   │   ├── ChatContainer.tsx
│       │   │   │   ├── MessageList.tsx
│       │   │   │   ├── MessageBubble.tsx
│       │   │   │   ├── InputArea.tsx
│       │   │   │   └── TypingIndicator.tsx
│       │   │   ├── quiz/
│       │   │   │   ├── QuizContainer.tsx
│       │   │   │   ├── QuestionCard.tsx
│       │   │   │   ├── ProgressBar.tsx
│       │   │   │   └── ResultsView.tsx
│       │   │   ├── screens/
│       │   │   │   ├── IntroScreen.tsx
│       │   │   │   ├── WelcomeOverlay.tsx
│       │   │   │   ├── ChoiceScreen.tsx
│       │   │   │   └── DiagnosisScreen.tsx
│       │   │   ├── forms/
│       │   │   │   ├── UserInfoForm.tsx
│       │   │   │   └── ImageUpload.tsx
│       │   │   └── layout/
│       │   │       ├── Header.tsx
│       │   │       ├── Footer.tsx
│       │   │       └── Layout.tsx
│       │   ├── hooks/
│       │   │   ├── useChat.ts
│       │   │   ├── useQuiz.ts
│       │   │   ├── useSession.ts
│       │   │   ├── useLanguage.ts
│       │   │   └── useImageUpload.ts
│       │   ├── services/
│       │   │   ├── api.ts
│       │   │   ├── chat.service.ts
│       │   │   ├── quiz.service.ts
│       │   │   └── session.service.ts
│       │   ├── stores/
│       │   │   ├── sessionStore.ts
│       │   │   ├── chatStore.ts
│       │   │   └── uiStore.ts
│       │   ├── types/
│       │   │   ├── chat.types.ts
│       │   │   ├── quiz.types.ts
│       │   │   └── session.types.ts
│       │   ├── utils/
│       │   │   ├── formatters.ts
│       │   │   ├── validators.ts
│       │   │   └── constants.ts
│       │   ├── styles/
│       │   │   ├── globals.css
│       │   │   └── variables.css
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── vite-env.d.ts
│       ├── tests/
│       │   ├── components/
│       │   └── integration/
│       ├── .env.example
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── package.json
│       └── Dockerfile
├── packages/
│   └── shared/
│       ├── src/
│       │   └── types/
│       │       ├── api.types.ts
│       │       ├── common.types.ts
│       │       └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── docker-compose.yml
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🔧 INSTALACIÓN Y CONFIGURACIÓN

### Prerrequisitos

```bash
# Versiones requeridas
- Node.js >= 20.x
- pnpm >= 8.x
- Docker >= 24.x
- PostgreSQL >= 15.x
- Redis >= 7.x
```

### Instalación Inicial

```bash
# 1. Clonar o crear el proyecto
mkdir objetivo-vientre-plano-v2
cd objetivo-vientre-plano-v2

# 2. Inicializar pnpm workspace
pnpm init

# 3. Instalar dependencias globales
pnpm add -D typescript @types/node tsx eslint prettier

# 4. Crear estructura de carpetas
mkdir -p apps/{backend,frontend}/src packages/shared/src

# 5. Inicializar backend
cd apps/backend
pnpm init
pnpm add express cors dotenv openai zod helmet compression
pnpm add -D @types/express @types/cors typescript tsx

# 6. Inicializar frontend
cd ../frontend
pnpm create vite . --template react-ts
pnpm add @tanstack/react-query zustand react-router-dom
pnpm add -D tailwindcss postcss autoprefixer

# 7. Volver a la raíz
cd ../..
```

### Variables de Entorno

#### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...
OPENAI_MODEL=gpt-4o

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vientre_plano
REDIS_URL=redis://localhost:6379

# Security
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=your-secret-key

# Storage
UPLOAD_MAX_SIZE=50MB
ALLOWED_ORIGINS=http://localhost:5173,https://objetivovientreplano.com
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Objetivo Vientre Plano
VITE_DEFAULT_LANGUAGE=es
```

---

## 📝 IMPLEMENTACIÓN PASO A PASO

### FASE 1: Configuración Base (Semana 1)

#### Paso 1.1: Configurar Monorepo

**Archivo: `pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Archivo: `package.json` (raíz)**
```json
{
  "name": "objetivo-vientre-plano-v2",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel run dev",
    "build": "pnpm --recursive run build",
    "test": "pnpm --recursive run test",
    "lint": "pnpm --recursive run lint",
    "type-check": "pnpm --recursive run type-check",
    "backend:dev": "pnpm --filter @ovp/backend dev",
    "frontend:dev": "pnpm --filter @ovp/frontend dev"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.20.0",
    "@typescript-eslint/parser": "^6.20.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "typescript": "^5.3.3"
  }
}
```

#### Paso 1.2: Configurar TypeScript

**Archivo: `tsconfig.base.json` (raíz)**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Paso 1.3: Configurar ESLint y Prettier

**Archivo: `.eslintrc.js`**
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  env: {
    node: true,
    es2022: true
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};
```

**Archivo: `.prettierrc`**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

### FASE 2: Backend Core (Semana 1-2)

#### Paso 2.1: Configurar Database (Prisma)

**Archivo: `apps/backend/prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  sessions  Session[]
  diagnoses Diagnosis[]
}

model Session {
  id                String    @id @default(cuid())
  userId            String?
  userName          String?
  userEmail         String?
  language          String    @default("es")
  diagnosticType    String?   // "chat" | "quiz"
  step              String    @default("initial")
  imageAnalysisText String?
  assistantId       String?
  threadId          String?
  startTime         DateTime  @default(now())
  completionTime    DateTime?
  expiresAt         DateTime
  
  user              User?     @relation(fields: [userId], references: [id])
  messages          Message[]
  quizAnswers       QuizAnswer[]
  diagnosis         Diagnosis?
  
  @@index([userId])
  @@index([expiresAt])
}

model Message {
  id        String   @id @default(cuid())
  sessionId String
  role      String   // "user" | "assistant"
  content   String   @db.Text
  metadata  Json?
  createdAt DateTime @default(now())
  
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId])
}

model QuizAnswer {
  id         String   @id @default(cuid())
  sessionId  String
  questionId Int
  answer     String
  points     Int
  createdAt  DateTime @default(now())
  
  session    Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId])
}

model Diagnosis {
  id               String   @id @default(cuid())
  sessionId        String   @unique
  userId           String?
  content          String   @db.Text
  totalScore       Int?
  scorePercentage  Float?
  pdfGenerated     Boolean  @default(false)
  createdAt        DateTime @default(now())
  
  session          Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user             User?    @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
```

#### Paso 2.2: Tipos TypeScript Base

**Archivo: `apps/backend/src/types/index.ts`**
```typescript
export interface SessionData {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  language: Language;
  diagnosticType?: DiagnosticType;
  step: SessionStep;
  imageAnalysisText?: string;
  assistantId?: string;
  threadId?: string;
  startTime: Date;
  completionTime?: Date;
}

export type Language = 'es' | 'en';
export type DiagnosticType = 'chat' | 'quiz';
export type SessionStep = 
  | 'initial'
  | 'name_question_sent'
  | 'asking_questions'
  | 'pdf_question_sent'
  | 'cta_sent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface QuestionData {
  id: number;
  question: string;
  emoji?: string;
  questionDetails?: string;
  options: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  emoji: string;
  type: 'single' | 'multiple';
  options: QuizOption[];
}

export interface QuizOption {
  value: string;
  label: string;
  points: number;
}

export interface DiagnosisResponse {
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
}
```

#### Paso 2.3: Configuración de OpenAI Assistant

**Archivo: `apps/backend/src/config/openai.ts`**
```typescript
import OpenAI from 'openai';
import { env } from './env';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const MODELS = {
  TEXT: 'gpt-4o',
  VISION: 'gpt-4o',
} as const;

export async function createAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: 'Objetivo Vientre Plano Assistant',
    instructions: `
Eres un asistente experto en bienestar digestivo del Método Objetivo Vientre Plano.

**Personalidad:**
- Empático, cercano y profesional
- Lenguaje claro y alentador
- Evitas jerga médica compleja
- Transmites confianza y seguridad

**Tareas:**
1. Guiar al usuario a través de 17 preguntas diagnósticas
2. Analizar respuestas de forma holística
3. Validar que las respuestas sean coherentes
4. Generar comentarios contextuales empáticos
5. Crear diagnóstico final personalizado

**Estructura de Diagnóstico:**
1. Saludo personalizado
2. 3-4 puntos clave (con emoji + título en negrita)
3. Conclusión conectando todos los puntos
4. Párrafo de solución integral
5. Cierre motivador

**Restricciones:**
- No dar planes de acción detallados
- Mantener 300-450 palabras en diagnóstico
- Siempre responder en el idioma del usuario
    `.trim(),
    model: MODELS.TEXT,
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('✅ Assistant created:', assistant.id);
  return assistant;
}

export async function getOrCreateAssistant() {
  if (env.OPENAI_ASSISTANT_ID) {
    try {
      const assistant = await openai.beta.assistants.retrieve(
        env.OPENAI_ASSISTANT_ID
      );
      return assistant;
    } catch (error) {
      console.warn('Assistant not found, creating new one...');
    }
  }
  
  return createAssistant();
}
```

#### Paso 2.4: Servicio de Assistant

**Archivo: `apps/backend/src/services/openai/assistant.service.ts`**
```typescript
import { openai } from '../../config/openai';
import type { Language } from '../../types';

export class AssistantService {
  private assistantId: string;

  constructor(assistantId: string) {
    this.assistantId = assistantId;
  }

  async createThread() {
    const thread = await openai.beta.threads.create();
    return thread.id;
  }

  async addMessage(threadId: string, content: string, role: 'user' | 'assistant' = 'user') {
    await openai.beta.threads.messages.create(threadId, {
      role,
      content,
    });
  }

  async runAssistant(threadId: string, instructions?: string) {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
      instructions,
    });

    // Esperar a que termine
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (runStatus.status === 'failed') {
      throw new Error(`Assistant run failed: ${runStatus.last_error?.message}`);
    }

    return runStatus;
  }

  async getLatestMessage(threadId: string) {
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 1,
      order: 'desc',
    });

    const latestMessage = messages.data[0];
    if (!latestMessage || latestMessage.role !== 'assistant') {
      throw new Error('No assistant message found');
    }

    const content = latestMessage.content[0];
    if (content.type !== 'text') {
      throw new Error('Message is not text');
    }

    return content.text.value;
  }

  async chat(threadId: string, userMessage: string, language: Language) {
    await this.addMessage(threadId, userMessage);
    
    const instructions = `Responde en ${language === 'es' ? 'español' : 'inglés'}.`;
    await this.runAssistant(threadId, instructions);
    
    const response = await this.getLatestMessage(threadId);
    return response;
  }

  async validateResponse(question: string, answer: string, language: Language) {
    const thread = await this.createThread();
    
    const prompt = `
Valida si esta respuesta es coherente para la pregunta.

Pregunta: "${question}"
Respuesta: "${answer}"

Responde en formato JSON:
{
  "isValid": boolean,
  "feedback": "mensaje solo si es inválida"
}
    `.trim();

    await this.addMessage(thread, prompt);
    await this.runAssistant(thread);
    
    const response = await this.getLatestMessage(thread);
    
    try {
      const parsed = JSON.parse(response);
      return parsed as { isValid: boolean; feedback: string };
    } catch {
      return { isValid: true, feedback: '' };
    }
  }

  async generateContextualComment(
    question: string,
    answer: string,
    language: Language
  ) {
    const thread = await this.createThread();
    
    const prompt = `
Genera un comentario corto y empático basado en esta respuesta.

Pregunta: "${question}"
Respuesta: "${answer}"

Requisitos:
- 1-2 frases máximo
- Comienza con emoji relevante
- No hagas preguntas
- Responde en ${language === 'es' ? 'español' : 'inglés'}
    `.trim();

    await this.addMessage(thread, prompt);
    await this.runAssistant(thread);
    
    return this.getLatestMessage(thread);
  }

  async generateDiagnosis(
    answers: Array<{ question: string; answer: string }>,
    userName: string,
    language: Language,
    imageAnalysis?: string
  ) {
    const thread = await this.createThread();
    
    const answersText = answers
      .map((a, i) => `P${i + 1}: "${a.question}"\nR: "${a.answer}"`)
      .join('\n\n');

    const imageSection = imageAnalysis 
      ? `\n\nAnálisis de imagen: "${imageAnalysis}"`
      : '';

    const prompt = `
Genera un diagnóstico para ${userName} basado en:

${answersText}${imageSection}

Recuerda seguir la estructura exacta del diagnóstico.
Responde en ${language === 'es' ? 'español' : 'inglés'}.
    `.trim();

    await this.addMessage(thread, prompt);
    await this.runAssistant(thread);
    
    return this.getLatestMessage(thread);
  }
}
```

---

*Este es el inicio de la documentación. ¿Quieres que continúe con las siguientes fases?*

Incluiré:
- ✅ FASE 3: Frontend React + TypeScript
- ✅ FASE 4: Integración OpenAI Assistants API
- ✅ FASE 5: Testing
- ✅ FASE 6: Deployment
- ✅ Guía de migración detallada
- ✅ Scripts de automatización

¿Continúo con la documentación completa?