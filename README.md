# 🚀 Objetivo Vientre Plano V2

Sistema de diagnóstico de bienestar digestivo con IA utilizando OpenAI GPT-4o y Assistants API.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Deployment](#deployment)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Documentation](#api-documentation)

## ✨ Características

- 🤖 **Diagnóstico con IA**: Integración completa con OpenAI Assistants API
- 💬 **Modo Chat**: Conversación natural con el asistente de IA
- 📋 **Modo Quiz**: 17 preguntas estructuradas para diagnóstico detallado
- 🖼️ **Análisis de Imágenes**: Evaluación de imágenes abdominales con GPT-4o Vision
- 🌐 **Multiidioma**: Soporte completo para español e inglés
- 📊 **Reportes PDF**: Generación de diagnósticos descargables
- 🔒 **Seguro**: Implementación de rate limiting, validación y seguridad
- 📱 **Responsive**: Diseño adaptativo para todos los dispositivos

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express + TypeScript
- **Base de Datos**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache**: Redis (opcional)
- **IA**: OpenAI API (GPT-4o)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router 6
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

```bash
- Node.js >= 20.x
- pnpm >= 8.x
- PostgreSQL >= 15.x
- Redis >= 7.x (opcional)
- OpenAI API Key
```

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd objetivo-vientre-plano-v2
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

**Backend** (`apps/backend/.env`):
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vientre_plano_dev
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_ASSISTANT_ID=asst_YOUR_ASSISTANT_ID
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=your-secret-key-min-32-chars
```

**Frontend** (`apps/frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_DEFAULT_LANGUAGE=es
```

### 4. Configurar base de datos

```bash
# Crear base de datos
createdb vientre_plano_dev

# Ejecutar migraciones
pnpm --filter @ovp/backend db:push

# (Opcional) Abrir Prisma Studio
pnpm --filter @ovp/backend db:studio
```

## 🔧 Configuración

### OpenAI Assistant

Puedes crear un nuevo assistant o usar uno existente:

```bash
# El sistema creará automáticamente un assistant si no existe
# O puedes especificar un OPENAI_ASSISTANT_ID en .env
```

### Docker (Opcional)

```bash
# Iniciar todos los servicios con Docker
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## 💻 Desarrollo

### Iniciar el proyecto completo

```bash
# Iniciar backend y frontend en paralelo
pnpm dev
```

### Iniciar servicios individuales

```bash
# Solo backend
pnpm dev:backend

# Solo frontend
pnpm dev:frontend
```

### Otros comandos útiles

```bash
# Build para producción
pnpm build

# Ejecutar tests
pnpm test

# Linting
pnpm lint

# Format código
pnpm format

# Type checking
pnpm type-check
```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Prisma Studio**: http://localhost:5555 (cuando esté corriendo)

## 📁 Estructura del Proyecto

```
objetivo-vientre-plano-v2/
├── apps/
│   ├── backend/          # API REST con Express + TypeScript
│   │   ├── prisma/       # Schema y migraciones
│   │   ├── src/
│   │   │   ├── config/   # Configuración (DB, OpenAI, etc.)
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── tests/
│   │
│   └── frontend/         # React + Vite + TypeScript
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── stores/
│       │   ├── types/
│       │   └── utils/
│       └── tests/
│
└── packages/
    └── shared/           # Tipos compartidos
        └── src/types/
```

## 🔌 API Documentation

### Endpoints Principales

#### Sessions
- `POST /api/sessions` - Crear nueva sesión
- `GET /api/sessions/:id` - Obtener sesión
- `PUT /api/sessions/:id` - Actualizar sesión

#### Chat
- `POST /api/chat` - Enviar mensaje
- `GET /api/chat/:sessionId` - Obtener historial

#### Quiz
- `POST /api/quiz` - Enviar respuesta
- `GET /api/quiz/:sessionId` - Obtener respuestas
- `POST /api/quiz/:sessionId/diagnosis` - Generar diagnóstico
- `GET /api/quiz/:sessionId/diagnosis` - Obtener diagnóstico

#### Images
- `POST /api/images` - Subir imagen
- `GET /api/images/:sessionId` - Obtener análisis

## 🚢 Deployment

### Producción con Docker

```bash
# Build y deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Entorno de Producción

Asegúrate de configurar:
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL en producción)
- `REDIS_URL` (Redis en producción)
- `OPENAI_API_KEY`
- `SESSION_SECRET` (secreto fuerte)
- `CORS_ORIGIN` (dominio de producción)

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests E2E
pnpm test:e2e
```

## 📝 Licencia

Privado - Todos los derechos reservados

## 👥 Contribución

Este es un proyecto privado. Para contribuir, contacta al equipo.

## 📧 Soporte

Para preguntas o soporte, contacta a: [email]

---

Desarrollado con ❤️ por el equipo de Objetivo Vientre Plano