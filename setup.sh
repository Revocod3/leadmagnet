#!/bin/bash

# Script de setup inicial para Objetivo Vientre Plano V2

echo "🚀 Iniciando configuración del proyecto..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js >= 20.x"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Se requiere Node.js >= 20.x. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm no está instalado. Instalando..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v)"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
pnpm install

# Configurar variables de entorno
echo ""
echo "🔐 Configurando variables de entorno..."

if [ ! -f "apps/backend/.env" ]; then
    echo "⚠️  Creando archivo .env del backend..."
    cp apps/backend/.env.example apps/backend/.env
    echo "⚠️  Por favor, edita apps/backend/.env con tus credenciales"
fi

if [ ! -f "apps/frontend/.env" ]; then
    echo "⚠️  Creando archivo .env del frontend..."
    cp apps/frontend/.env.example apps/frontend/.env
fi

# Verificar PostgreSQL
echo ""
echo "🗄️  Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL está instalado"
else
    echo "⚠️  PostgreSQL no detectado. Asegúrate de tenerlo instalado y corriendo"
fi

# Setup de base de datos
echo ""
echo "🗄️  Configurando base de datos..."
read -p "¿Deseas crear la base de datos ahora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    createdb vientre_plano_dev 2>/dev/null || echo "⚠️  La base de datos ya existe o no se pudo crear"
    pnpm --filter @ovp/backend db:push
    echo "✅ Base de datos configurada"
fi

# Verificar OpenAI API Key
echo ""
echo "🤖 Verificando configuración de OpenAI..."
if grep -q "sk-proj-TU_API_KEY_AQUI" apps/backend/.env; then
    echo "⚠️  IMPORTANTE: Debes configurar tu OPENAI_API_KEY en apps/backend/.env"
else
    echo "✅ API Key de OpenAI configurada"
fi

echo ""
echo "✅ Setup completado!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Edita apps/backend/.env con tus credenciales"
echo "   2. Ejecuta 'pnpm dev' para iniciar el proyecto"
echo "   3. El backend estará en http://localhost:3000"
echo "   4. El frontend estará en http://localhost:5173"
echo ""