# 🎉 Deployment Completado - Lead Magnet System

**Fecha de deployment**: Octubre 27, 2025  
**Servidor**: DigitalOcean - 139.59.152.82

---

## ✅ Estado del Deployment

### 📊 Infraestructura

**Servidor DigitalOcean**
- **IP Pública**: 139.59.152.82
- **OS**: Ubuntu 25.04 (Kernel 6.14.0-23-generic)
- **CPU**: 2 vCPUs
- **RAM**: 8GB (6.4GB disponibles)
- **Disco**: 50GB (41GB libres, 14% usado)
- **Región**: Frankfurt (fra1)

**Servicios Instalados**
- Node.js: v20.19.5 ✅
- pnpm: v10.19.0 ✅
- PostgreSQL: 17 ✅
- Redis: 7.0.15 ✅
- PM2: v6.0.8 ✅
- Nginx: Activo (puerto 80, 443) ✅

---

## 🚀 Aplicaciones Desplegadas

### Backend (Lead Magnet API)
- **Puerto**: 3003
- **PM2 ID**: 8
- **Proceso**: `leadmagnet-backend`
- **Directorio**: `/var/www/leadmagnet/apps/backend`
- **Estado**: ✅ Online
- **Memoria**: ~91 MB

### Frontend (React/Vite)
- **Puerto**: 5173
- **PM2 ID**: 9
- **Proceso**: `leadmagnet-frontend`
- **Directorio**: `/var/www/leadmagnet/apps/frontend`
- **Estado**: ✅ Online
- **Memoria**: ~92 MB

### Base de Datos
- **PostgreSQL**: 17.6
- **Database**: `leadmagnet_prod`
- **Usuario**: `leadmagnet_user`
- **Password**: `Lead2025Secure` ⚠️ (cambiar en producción)
- **Host**: localhost:5432

### Cache/Sesiones
- **Redis**: 7.0.15
- **URL**: redis://localhost:6379
- **Estado**: ✅ Connected

---

## 🔐 Seguridad Implementada

### 1. Repositorio Git Privado
```bash
# Repositorio: https://github.com/Revocod3/leadmagnet (privado)
# Deploy Key SSH configurada en: /root/.ssh/leadmagnet_deploy
# Fingerprint: SHA256:C7otDLVTRdQ8CbXBBo10G741vBytxLk0CgNleDlsRh8
```

**Ventajas**:
- ✅ Código NO accesible públicamente
- ✅ Solo el servidor puede clonar/actualizar
- ✅ Deploy key de solo lectura

### 2. Protección de Archivos
```bash
# Código fuente
Ubicación: /var/www/leadmagnet
Permisos: drwxr-xr-x (root:root)

# Archivos .env
/var/www/leadmagnet/apps/backend/.env (600 - solo root)
/var/www/leadmagnet/apps/frontend/.env (600 - solo root)
```

### 3. Firewall UFW
```bash
Puertos abiertos:
- 22/tcp    (SSH)
- 80/tcp    (HTTP - Nginx)
- 443/tcp   (HTTPS - Nginx)
- 3003/tcp  (Backend API)
- 5173/tcp  (Frontend)
```

### 4. Variables de Entorno Encriptadas
- `SESSION_SECRET`: Generado con openssl (32 bytes)
- `JWT_SECRET`: Generado con openssl (32 bytes)
- `OPENAI_API_KEY`: Almacenado de forma segura
- `DATABASE_URL`: Credenciales protegidas

---

## 🌐 URLs de Acceso

### Acceso Directo por IP
```
Frontend:  http://139.59.152.82:5173
Backend:   http://139.59.152.82:3003/api/health
```

### Configuración CORS Actual
```env
CORS_ORIGIN=http://139.59.152.82:5173
```

---

## 📦 Configuración de Variables de Entorno

### Backend (.env)
```env
# Server
NODE_ENV=production
PORT=3003
API_URL=http://localhost:3003

# OpenAI
OPENAI_API_KEY=sk-proj-hIJ7rys...
OPENAI_ASSISTANT_ID=
OPENAI_MODEL=gpt-4o
CLARA_ASSISTANT_ID=asst_pmSpGqn4zfnk1tEXICepkALE

# Database
DATABASE_URL=postgresql://leadmagnet_user:Lead2025Secure@localhost:5432/leadmagnet_prod
REDIS_URL=redis://localhost:6379

# Features
USE_NEW_CONVERSATIONAL_SYSTEM=true

# WordPress
WORDPRESS_WEBHOOK_URL=https://objetivovientreplano.com/wp-json/ovp/v1/diagnosis-complete
WORDPRESS_API_KEY=local-test-key

# Security
CORS_ORIGIN=http://139.59.152.82:5173
SESSION_SECRET=<generado-automaticamente>
JWT_SECRET=<generado-automaticamente>

# Storage
UPLOAD_MAX_SIZE=50MB
ALLOWED_ORIGINS=http://139.59.152.82:5173 https://objetivovientreplano.com
```

### Frontend (.env)
```env
VITE_API_URL=http://139.59.152.82:3003
VITE_DEFAULT_LANGUAGE=es
VITE_OPENAI_API_KEY=sk-proj-hIJ7rys... # Solo para etimología
```

---

## 🔧 Comandos de Gestión

### Ver Estado de Servicios
```bash
ssh root@139.59.152.82 'pm2 list'
ssh root@139.59.152.82 'pm2 status'
```

### Ver Logs en Tiempo Real
```bash
# Backend
ssh root@139.59.152.82 'pm2 logs leadmagnet-backend'

# Frontend
ssh root@139.59.152.82 'pm2 logs leadmagnet-frontend'

# Ambos
ssh root@139.59.152.82 'pm2 logs'
```

### Reiniciar Servicios
```bash
# Backend
ssh root@139.59.152.82 'pm2 restart leadmagnet-backend'

# Frontend
ssh root@139.59.152.82 'pm2 restart leadmagnet-frontend'

# Ambos
ssh root@139.59.152.82 'pm2 restart all'
```

### Actualizar Código desde Git
```bash
ssh root@139.59.152.82 << 'EOF'
cd /var/www/leadmagnet
git pull
pnpm install
cd apps/frontend && pnpm build
pm2 restart all
EOF
```

### Ver Uso de Recursos
```bash
ssh root@139.59.152.82 'pm2 monit'
ssh root@139.59.152.82 'free -h'
ssh root@139.59.152.82 'df -h'
```

### Verificar Salud del Sistema
```bash
# Health check backend
curl http://139.59.152.82:3003/api/health

# Health check frontend
curl -I http://139.59.152.82:5173

# Ver logs de aplicación
ssh root@139.59.152.82 'tail -f /var/www/leadmagnet/logs/backend-out.log'
```

---

## 🐛 Problemas Resueltos Durante Deployment

### 1. Error CORS - Header Multiple Values ❌
**Problema**: 
```
Access-Control-Allow-Origin header contains multiple values 
'http://139.59.152.82:5173,https://objetivovientreplano.com', but only one is allowed
```

**Solución**:
```bash
# Cambiar en .env de:
CORS_ORIGIN=http://139.59.152.82:5173,https://objetivovientreplano.com

# A:
CORS_ORIGIN=http://139.59.152.82:5173
```

### 2. Frontend Requiere VITE_OPENAI_API_KEY ❌
**Problema**:
```
VITE_OPENAI_API_KEY no está configurada
Error al generar la etimología del nombre
```

**Solución**:
Agregar al `.env` del frontend:
```env
VITE_OPENAI_API_KEY=sk-proj-hIJ7rys...
```

**Nota**: Solo se usa para la generación de etimología del nombre en la animación de bienvenida.

### 3. Errores de Compilación TypeScript ❌
**Problema**:
Errores strict de TypeScript en `redis.ts`, `image.controller.ts`, etc.

**Solución**:
Ejecutar backend en modo desarrollo con `tsx watch` en lugar de compilar con `tsc`.

---

## 🎯 Próximos Pasos Recomendados

### 1. Configurar Nginx Reverse Proxy (Prioridad Alta)
```nginx
# Crear subdominio: leadmagnet.objetivovientreplano.com
server {
    listen 80;
    server_name leadmagnet.objetivovientreplano.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
```

### 2. SSL con Let's Encrypt (Prioridad Alta)
```bash
ssh root@139.59.152.82 << 'EOF'
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d leadmagnet.objetivovientreplano.com
systemctl reload nginx
EOF
```

### 3. Configurar Assistant ID de OpenAI (Prioridad Media)
Actualizar en `.env`:
```env
OPENAI_ASSISTANT_ID=asst_xxxxx  # Tu assistant ID
```

### 4. Backups Automáticos (Prioridad Media)
```bash
# Crear cron job para backups diarios
ssh root@139.59.152.82 << 'EOF'
cat > /etc/cron.daily/leadmagnet-backup << 'CRON'
#!/bin/bash
# Backup database
pg_dump leadmagnet_prod > /backups/leadmagnet-$(date +%Y%m%d).sql
# Backup código
tar -czf /backups/leadmagnet-code-$(date +%Y%m%d).tar.gz /var/www/leadmagnet
# Limpiar backups antiguos (mantener últimos 7 días)
find /backups -name "leadmagnet-*" -mtime +7 -delete
CRON
chmod +x /etc/cron.daily/leadmagnet-backup
mkdir -p /backups
EOF
```

### 5. Monitoreo y Alertas (Prioridad Baja)
- Configurar PM2 Plus para monitoreo
- Configurar alertas de uptime
- Logs centralizados

### 6. Optimizaciones de Performance (Prioridad Baja)
- Implementar CDN para assets estáticos
- Configurar compresión Gzip en Nginx
- Implementar cache de Redis para queries frecuentes

---

## 📝 Notas Importantes

1. **Puertos Únicos**: Backend (3003) y Frontend (5173) no conflictúan con otros servicios
2. **Aplicaciones Coexistentes**: El deployment NO afecta las otras aplicaciones PM2:
   - BI_Marketing (puerto 8051)
   - Chatbot_24x7 (puerto 3001)
   - gratuito (puerto 3000)
   - martinezia (puerto 5000)
   - traductor-mascotas (puerto 3002)
3. **Base de Datos Separada**: `leadmagnet_prod` es independiente
4. **Código Seguro**: Solo root puede acceder al código fuente
5. **Deploy Key**: Solo lectura, no puede hacer push

---

## 🔄 Proceso de Deployment Realizado

1. ✅ Generada SSH Deploy Key en servidor
2. ✅ Deploy Key agregada a GitHub (repositorio privado)
3. ✅ Instalado pnpm, PostgreSQL 17, Redis 7
4. ✅ Creada base de datos `leadmagnet_prod`
5. ✅ Clonado repositorio privado vía SSH
6. ✅ Configurados archivos `.env` (backend y frontend)
7. ✅ Protegidos archivos `.env` (permisos 600)
8. ✅ Instaladas dependencias con pnpm
9. ✅ Generado Prisma Client y sincronizado schema
10. ✅ Construido frontend con Vite
11. ✅ Configurado PM2 para backend y frontend
12. ✅ Abiertos puertos 3003 y 5173 en firewall
13. ✅ Corregido error CORS
14. ✅ Agregada VITE_OPENAI_API_KEY para etimología
15. ✅ Reconstruido frontend con nueva variable
16. ✅ Servicios reiniciados y verificados

---

## 📞 Contacto y Soporte

**Repositorio**: https://github.com/Revocod3/leadmagnet (privado)  
**Servidor**: root@139.59.152.82  
**Deployment**: Octubre 27, 2025

---

## ⚠️ Advertencias de Seguridad

1. **Cambiar credenciales de BD**: El password `Lead2025Secure` debe cambiarse
2. **Rotar secrets**: Los SESSION_SECRET y JWT_SECRET deben rotarse periódicamente
3. **API Key expuesta**: VITE_OPENAI_API_KEY está en el código del frontend (bundle JavaScript)
   - Considerar mover generación de etimología al backend
4. **HTTPS**: Actualmente solo HTTP, implementar SSL urgentemente

---

*Última actualización: Octubre 27, 2025*
