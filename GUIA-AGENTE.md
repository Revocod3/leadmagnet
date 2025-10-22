# 🤖 GUÍA COMPLETA PARA AGENTE IA - IMPLEMENTACIÓN AUTOMÁTICA

## 🎯 OBJETIVO
Crear el proyecto completo "Objetivo Vientre Plano V2" con TypeScript, React, Vite y OpenAI Assistants API.

## ⚡ INICIO RÁPIDO

**Este documento contiene TODOS los comandos y archivos necesarios para que un agente de IA implemente el proyecto completo de forma autónoma.**

---

## 📋 PRERREQUISITOS

Antes de comenzar, asegúrate de tener instalado:

- ✅ Node.js >= 20.x
- ✅ pnpm >= 8.x (instalar con: `npm install -g pnpm`)
- ✅ PostgreSQL >= 15.x
- ✅ Redis >= 7.x (opcional)
- ✅ OpenAI API Key

---

## 🚀 INSTALACIÓN COMPLETA

### Comandos de Inicialización

```bash
# 1. Crear directorio del proyecto
mkdir objetivo-vientre-plano-v2
cd objetivo-vientre-plano-v2

# 2. Inicializar git
git init

# 3. Crear estructura completa de carpetas
mkdir -p apps/backend/src/{config,controllers,services/openai,routes,middleware,types,utils,constants,tests}
mkdir -p apps/backend/prisma
mkdir -p apps/frontend/src/{components/{ui,chat,quiz,screens,forms,layout},hooks,services,stores,types,utils,styles}
mkdir -p apps/frontend/public/{assets/images,locales}
mkdir -p packages/shared/src/types

# 4. Crear archivos de configuración raíz
touch package.json pnpm-workspace.yaml tsconfig.base.json .eslintrc.js .prettierrc .gitignore README.md

# 5. Crear archivos del backend
touch apps/backend/package.json apps/backend/tsconfig.json apps/backend/.env.example
touch apps/backend/src/server.ts
touch apps/backend/prisma/schema.prisma

# 6. Crear archivos del frontend
touch apps/frontend/package.json apps/frontend/tsconfig.json apps/frontend/vite.config.ts
touch apps/frontend/index.html apps/frontend/src/main.tsx apps/frontend/src/App.tsx

echo "✅ Estructura creada"
```

---

## 📦 ARCHIVOS DE CONFIGURACIÓN

### 1. `package.json` (raíz)

```json
{
  "name": "objetivo-vientre-plano-v2",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "setup": "pnpm install && pnpm db:setup",
    "dev": "pnpm --parallel run dev",
    "dev:backend": "pnpm --filter @ovp/backend dev",
    "dev:frontend": "pnpm --filter @ovp/frontend dev",
    "build": "pnpm --recursive run build",
    "test": "pnpm --recursive run test",
    "lint": "pnpm --recursive run lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "db:setup": "pnpm --filter @ovp/backend db:push",
    "db:studio": "pnpm --filter @ovp/backend db:studio"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.20.0",
    "@typescript-eslint/parser": "^6.20.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.2.4",
    "typescript": "^5.3.3"
  }
}
```

### 2. `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 3. `.gitignore`

```gitignore
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
.vscode/
.idea/
coverage/
```

### 4. Instalar dependencias base

```bash
pnpm install
```

---

## 🔧 BACKEND

### Backend package.json

**Copiar este contenido en `apps/backend/package.json`:**

```json
{
  "name": "@ovp/backend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1",
    "openai": "^4.28.0",
    "zod": "^3.22.4",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "multer": "^1.4.5-lts.1",
    "@prisma/client": "^5.9.1",
    "nanoid": "^5.0.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11",
    "@types/compression": "^1.7.5",
    "@types/node": "^20.11.16",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "prisma": "^5.9.1"
  }
}
```

### Instalar dependencias del backend

```bash
cd apps/backend
pnpm install
cd ../..
```

---

## 📚 ARCHIVOS CLAVE

Por favor, consulta el archivo "DOCUMENTACION_COMPLETA.md" para obtener todos los archivos TypeScript necesarios con su código completo.

---

## 🎨 FRONTEND

### Frontend package.json

**Copiar este contenido en `apps/frontend/package.json`:**

```json
{
  "name": "@ovp/frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.3",
    "@tanstack/react-query": "^5.17.19",
    "zustand": "^4.5.0",
    "axios": "^1.6.5",
    "framer-motion": "^11.0.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

### Instalar dependencias del frontend

```bash
cd apps/frontend
pnpm install
pnpm create vite . --template react-ts
cd ../..
```

---

## 🗄️ BASE DE DATOS

### Schema de Prisma

El schema completo está en "DOCUMENTACION_COMPLETA.md".

### Comandos de base de datos

```bash
# Crear la base de datos
createdb vientre_plano_dev

# Pushear el schema
pnpm --filter @ovp/backend db:push

# Abrir Prisma Studio
pnpm --filter @ovp/backend db:studio
```

---

## 🔑 VARIABLES DE ENTORNO

### Backend `.env`

Crear `apps/backend/.env` con:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vientre_plano_dev
OPENAI_API_KEY=sk-proj-TU_API_KEY_AQUI
OPENAI_ASSISTANT_ID=asst_...
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=cambiar-por-secreto-real-de-32-caracteres-minimo
```

### Frontend `.env`

Crear `apps/frontend/.env` con:

```env
VITE_API_URL=http://localhost:3000
```

---

## 🚀 EJECUTAR EL PROYECTO

```bash
# Terminal 1: Backend
pnpm dev:backend

# Terminal 2: Frontend
pnpm dev:frontend

# O ambos en paralelo:
pnpm dev
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup (30 min)
- [ ] Crear estructura de carpetas
- [ ] Configurar package.json y workspace
- [ ] Instalar dependencias
- [ ] Configurar TypeScript, ESLint, Prettier

### Fase 2: Backend (2-3 horas)
- [ ] Configurar Prisma y base de datos
- [ ] Implementar tipos TypeScript
- [ ] Configurar OpenAI Assistant
- [ ] Crear servicios (Assistant, Vision, Language)
- [ ] Implementar controllers
- [ ] Crear rutas API
- [ ] Configurar middleware
- [ ] Implementar constantes (preguntas, prompts)

### Fase 3: Frontend (3-4 horas)
- [ ] Configurar Vite y React
- [ ] Implementar componentes UI base (shadcn/ui)
- [ ] Crear stores con Zustand
- [ ] Implementar servicios API
- [ ] Crear componentes de chat
- [ ] Crear componentes de quiz
- [ ] Implementar pantallas
- [ ] Configurar routing
- [ ] Añadir animaciones

### Fase 4: Integración (1-2 horas)
- [ ] Conectar frontend con backend
- [ ] Probar flujo completo de chat
- [ ] Probar flujo de quiz
- [ ] Validar análisis de imágenes
- [ ] Probar generación de diagnóstico
- [ ] Verificar multi-idioma

### Fase 5: Testing (1 hora)
- [ ] Tests unitarios backend
- [ ] Tests de integración
- [ ] Tests de componentes frontend
- [ ] Tests end-to-end

### Fase 6: Deployment (1 hora)
- [ ] Configurar Docker
- [ ] Configurar CI/CD
- [ ] Deployment a producción

---

## 📖 DOCUMENTACIÓN ADICIONAL

Para ver el código completo de todos los archivos TypeScript, consulta:

1. **DOCUMENTACION_COMPLETA.md** - Documentación exhaustiva
2. Carpeta `apps/backend/src` - Código fuente del backend
3. Carpeta `apps/frontend/src` - Código fuente del frontend

---

## 🆘 TROUBLESHOOTING

### Error: "Cannot find module"
```bash
pnpm install
```

### Error de base de datos
```bash
# Verificar que PostgreSQL esté corriendo
pg_isready

# Recrear la base de datos
dropdb vientre_plano_dev
createdb vientre_plano_dev
pnpm db:push
```

### Error de OpenAI
- Verificar que la API key sea válida
- Verificar límites de rate limit
- Crear un nuevo assistant si es necesario

---

## 🎯 PRÓXIMOS PASOS

Una vez completada la instalación:

1. Ejecutar `pnpm dev` para iniciar el proyecto
2. Abrir http://localhost:5173
3. Probar el flujo completo
4. Revisar logs en la consola
5. Ajustar configuración según necesidades

---

**¿Listo para comenzar?** 

Ejecuta los comandos en orden y el proyecto estará funcionando en menos de 1 hora.

Para código completo y detalles adicionales, consulta **DOCUMENTACION_COMPLETA.md**.