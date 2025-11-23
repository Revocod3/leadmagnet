# 🚀 Setup de Staging en Servidor Existente
## Usando el servidor DigitalOcean 139.59.152.82

---

## 📋 Arquitectura Propuesta

**Servidor: 139.59.152.82** (Frankfurt)

```
┌─────────────────────────────────────────┐
│      DigitalOcean Server (8GB RAM)      │
├─────────────────────────────────────────┤
│                                         │
│  PRODUCCIÓN (branch: main)              │
│  ├─ Backend:  Puerto 3003               │
│  ├─ Frontend: Puerto 5173               │
│  ├─ DB: leadmagnet_prod                 │
│  └─ URL: chat.objetivovientreplano.com  │
│                                         │
│  STAGING (branch: feat/pro-version)     │
│  ├─ Backend:  Puerto 3004 ⭐ NUEVO      │
│  ├─ Frontend: Puerto 5174 ⭐ NUEVO      │
│  ├─ DB: leadmagnet_staging ⭐ NUEVO     │
│  └─ URL: staging.chat.ovp.com ⭐ NUEVO  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 Setup Paso a Paso

### **Paso 1: SSH al Servidor**

```bash
ssh root@139.59.152.82
```

(Usa la SSH key que ya tienes configurada)

---

### **Paso 2: Crear Base de Datos Staging**

```bash
# En el servidor
sudo -u postgres psql

# En PostgreSQL:
CREATE DATABASE leadmagnet_staging;
CREATE USER leadmagnet_staging_user WITH PASSWORD 'StagingPass2025!';
GRANT ALL PRIVILEGES ON DATABASE leadmagnet_staging TO leadmagnet_staging_user;

# Dar permisos al schema public (PostgreSQL 15+)
\c leadmagnet_staging
GRANT ALL ON SCHEMA public TO leadmagnet_staging_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO leadmagnet_staging_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO leadmagnet_staging_user;

\q
```

---

### **Paso 3: Crear Directorio para Staging**

```bash
cd /var/www
mkdir -p leadmagnet-staging
cd leadmagnet-staging

# Clonar repo en branch feat/pro-version
git clone -b feat/pro-version git@github.com:Revocod3/leadmagnet.git .

# Instalar dependencias
pnpm install
```

---

### **Paso 4: Configurar Variables de Entorno Staging**

#### **Backend (.env)**

```bash
cd /var/www/leadmagnet-staging/apps/backend

cat > .env << 'EOF'
# Server
NODE_ENV=staging
PORT=3004
API_URL=https://staging-chat.objetivovientreplano.com

# OpenAI (usar MISMO assistant o crear uno nuevo para staging)
OPENAI_API_KEY=sk-proj-[COPIAR DE PRODUCCIÓN]
OPENAI_ASSISTANT_ID=asst_pmSpGqn4zfnk1tEXICepkALE
OPENAI_MODEL=gpt-4o

# Feature Flags
USE_NEW_CONVERSATIONAL_SYSTEM=false

# Database
DATABASE_URL=postgresql://leadmagnet_staging_user:StagingPass2025!@localhost:5432/leadmagnet_staging
REDIS_URL=redis://localhost:6379

# Security
CORS_ORIGIN=https://staging-chat.objetivovientreplano.com
SESSION_SECRET=$(openssl rand -hex 32)

# WordPress Integration (opcional - usar staging de WP si existe)
WORDPRESS_WEBHOOK_URL=https://staging.objetivovientreplano.com/wp-json/ovp/v1/diagnosis-complete
WORDPRESS_API_KEY=staging_key

# Storage
UPLOAD_MAX_SIZE=50MB
ALLOWED_ORIGINS=https://staging-chat.objetivovientreplano.com
EOF

chmod 600 .env
```

#### **Frontend (.env)**

```bash
cd /var/www/leadmagnet-staging/apps/frontend

cat > .env << 'EOF'
VITE_API_URL=https://staging-chat.objetivovientreplano.com
VITE_DEFAULT_LANGUAGE=es
VITE_ENVIRONMENT=staging
EOF

chmod 600 .env
```

---

### **Paso 5: Aplicar Schema a DB Staging**

```bash
cd /var/www/leadmagnet-staging/apps/backend

# Aplicar schema
pnpm prisma db push

# Verificar
pnpm prisma studio
# Abrir http://139.59.152.82:5555 en navegador
```

---

### **Paso 6: Build del Frontend Staging**

```bash
cd /var/www/leadmagnet-staging/apps/frontend
pnpm build
```

---

### **Paso 7: Configurar PM2 para Staging**

```bash
# Backend staging
pm2 start /var/www/leadmagnet-staging/apps/backend/dist/server.js \
  --name leadmagnet-backend-staging \
  --cwd /var/www/leadmagnet-staging/apps/backend

# Frontend staging
pm2 start pnpm --name leadmagnet-frontend-staging \
  --cwd /var/www/leadmagnet-staging/apps/frontend \
  -- run preview -- --port 5174

# Guardar configuración PM2
pm2 save

# Verificar
pm2 list
```

Deberías ver:
```
leadmagnet-backend         (puerto 3003) ✅ PROD
leadmagnet-frontend        (puerto 5173) ✅ PROD
leadmagnet-backend-staging (puerto 3004) ✅ STAGING
leadmagnet-frontend-staging(puerto 5174) ✅ STAGING
```

---

### **Paso 8: Configurar Nginx para Subdominios**

#### **A. Configurar DNS primero**

En tu proveedor de DNS (Cloudflare, etc.):
```
A record: staging-chat.objetivovientreplano.com → 139.59.152.82
```

#### **B. Crear config de Nginx para Staging**

```bash
cat > /etc/nginx/sites-available/staging-leadmagnet << 'EOF'
# Staging - Backend API
server {
    listen 80;
    server_name staging-chat.objetivovientreplano.com;

    # Redirect API calls to backend
    location /api {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Activar sitio
ln -s /etc/nginx/sites-available/staging-leadmagnet /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

### **Paso 9: Configurar SSL (Let's Encrypt)**

```bash
# Instalar certbot si no está
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL para staging
certbot --nginx -d staging-chat.objetivovientreplano.com

# Certbot auto-configura HTTPS redirect
```

---

### **Paso 10: Abrir Puertos en Firewall**

```bash
# Permitir puerto 3004 (backend staging)
ufw allow 3004/tcp

# Permitir puerto 5174 (frontend staging)
ufw allow 5174/tcp

# Recargar firewall
ufw reload

# Verificar
ufw status
```

---

## ✅ Verificación

Una vez todo configurado:

```bash
# 1. Health check staging backend
curl https://staging-chat.objetivovientreplano.com/api/health

# 2. Verificar PM2
pm2 list

# 3. Ver logs staging
pm2 logs leadmagnet-backend-staging --lines 50

# 4. Test frontend
# Abrir https://staging-chat.objetivovientreplano.com en navegador
```

---

## 🔄 Script de Deploy Automático para Staging

Crear script para deployar staging:

```bash
cat > /var/www/deploy-staging.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying staging from feat/pro-version..."

cd /var/www/leadmagnet-staging

echo "📥 Pulling latest changes..."
git fetch origin feat/pro-version
git reset --hard origin/feat/pro-version

echo "📦 Installing dependencies..."
pnpm install

echo "🗄️ Running migrations..."
cd apps/backend
pnpm prisma db push
cd ../..

echo "🏗️ Building frontend..."
cd apps/frontend
pnpm build
cd ../..

echo "🔄 Restarting services..."
pm2 restart leadmagnet-backend-staging
pm2 restart leadmagnet-frontend-staging

echo "✅ Deployment complete!"
pm2 list | grep staging
EOF

chmod +x /var/www/deploy-staging.sh
```

**Usar con:**
```bash
/var/www/deploy-staging.sh
```

---

## 🤖 GitHub Actions para Auto-Deploy

Actualizar `.github/workflows/staging-deploy.yml`:

```yaml
name: Deploy to Staging Server

on:
  push:
    branches:
      - feat/pro-version

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: 🚀 Deploy via SSH
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          /var/www/deploy-staging.sh
```

---

## 📊 URLs Finales

**Producción:**
- URL: https://chat.objetivovientreplano.com
- Backend: Puerto 3003
- DB: leadmagnet_prod
- Branch: main

**Staging:**
- URL: https://staging-chat.objetivovientreplano.com
- Backend: Puerto 3004
- DB: leadmagnet_staging
- Branch: feat/pro-version

---

## 💰 Costos

**Total adicional:** $0/mes
- Usa el mismo servidor
- Mismo PostgreSQL
- Mismo Redis
- Solo consume ~200MB RAM adicional

---

## 🔧 Comandos Útiles

```bash
# Ver logs staging
pm2 logs leadmagnet-backend-staging
pm2 logs leadmagnet-frontend-staging

# Restart staging
pm2 restart leadmagnet-backend-staging
pm2 restart leadmagnet-frontend-staging

# Stop staging (para mantenimiento)
pm2 stop leadmagnet-backend-staging
pm2 stop leadmagnet-frontend-staging

# Deploy manual staging
/var/www/deploy-staging.sh

# Ver uso de recursos
pm2 monit
```

---

## 🆘 Troubleshooting

### Puerto ya en uso
```bash
# Ver qué usa el puerto 3004
lsof -i :3004

# Matar proceso si es necesario
pm2 delete leadmagnet-backend-staging
```

### DB connection error
```bash
# Verificar PostgreSQL
systemctl status postgresql

# Test connection
psql -U leadmagnet_staging_user -d leadmagnet_staging -h localhost
```

### Nginx error
```bash
# Ver logs
tail -f /var/log/nginx/error.log

# Test config
nginx -t
```

---

**¿Listo para configurar staging en el servidor?**

Puedo conectarme vía SSH y hacerlo todo en ~15 minutos. ¿Tengo acceso SSH al servidor o necesitas las credenciales?
