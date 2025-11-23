# 🎉 STAGING CONFIGURADO Y FUNCIONANDO!
## Objetivo Vientre Plano - Ambiente de Pruebas

**Fecha:** 2025-11-23
**Servidor:** Hetzner 91.99.20.86
**Branch:** `feat/pro-version`

---

## ✅ Lo que está funcionando AHORA:

### **Backend Staging**
- ✅ PostgreSQL database: `leadmagnet_staging`
- ✅ Backend corriendo en PM2
- ✅ Puerto 3004 abierto
- ✅ CORS configurado
- ✅ Prisma schema aplicado

### **Frontend Staging**
- ✅ Build compilado
- ✅ Vite preview corriendo en PM2
- ✅ Puerto 5174 abierto
- ✅ Conectado al backend staging

---

## 🌐 URLs de Acceso (SIN DNS - Temporales)

### **Frontend (para Ulises testear)**
```
http://91.99.20.86:5174
```
👆 **Abrir esta URL en el navegador para usar la app**

### **Backend API**
```
http://91.99.20.86:3004
```

#### **Endpoints útiles:**

**Health Check:**
```bash
curl http://91.99.20.86:3004/api/health
```

**Crear sesión:**
```bash
curl -X POST http://91.99.20.86:3004/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userName":"Test Staging","language":"es"}'
```

---

## 📊 Estado de Servicios

En el servidor (SSH):
```bash
pm2 list
```

Deberías ver:
```
│ leadmagnet-backend             (PROD - Puerto 3003)
│ leadmagnet-backend-staging     (STAGING - Puerto 3004) ✅
│ leadmagnet-frontend-staging    (STAGING - Puerto 5174) ✅
```

---

## 🔄 Cómo Deployar Cambios a Staging

### **Opción 1: Auto-deploy (Recomendado)**

Cada vez que hagas push a `feat/pro-version`, ejecuta en el servidor:

```bash
ssh root@91.99.20.86 '/var/www/deploy-staging.sh'
```

Esto automáticamente:
1. Hace pull de los últimos cambios
2. Instala dependencias
3. Aplica migraciones de DB
4. Compila frontend
5. Reinicia servicios

### **Opción 2: Manual**

```bash
ssh root@91.99.20.86

cd /var/www/leadmagnet-staging
git pull origin feat/pro-version
pnpm install

cd apps/backend
pnpm prisma db push
cd ../..

cd apps/frontend
pnpm build
cd ../..

pm2 restart leadmagnet-backend-staging
pm2 restart leadmagnet-frontend-staging
```

---

## 🐛 Ver Logs (Debugging)

### **Logs del backend:**
```bash
ssh root@91.99.20.86 'pm2 logs leadmagnet-backend-staging --lines 50'
```

### **Logs del frontend:**
```bash
ssh root@91.99.20.86 'pm2 logs leadmagnet-frontend-staging --lines 50'
```

### **Ver logs en tiempo real:**
```bash
ssh root@91.99.20.86 'pm2 logs leadmagnet-backend-staging'
# Ctrl+C para salir
```

---

## 🗄️ Base de Datos Staging

**Conexión:**
```
Host: localhost (desde el servidor)
Port: 5432
Database: leadmagnet_staging
User: leadmagnet_staging_user
Password: StagingPass2025
```

**Ver datos con Prisma Studio:**
```bash
ssh root@91.99.20.86
cd /var/www/leadmagnet-staging/apps/backend
pnpm prisma studio
```
Luego abre: http://91.99.20.86:5555

---

## 🔧 Comandos Útiles

### **Reiniciar servicios:**
```bash
ssh root@91.99.20.86 'pm2 restart leadmagnet-backend-staging'
ssh root@91.99.20.86 'pm2 restart leadmagnet-frontend-staging'
```

### **Detener staging (mantenimiento):**
```bash
ssh root@91.99.20.86 'pm2 stop leadmagnet-backend-staging leadmagnet-frontend-staging'
```

### **Iniciar de nuevo:**
```bash
ssh root@91.99.20.86 'pm2 start leadmagnet-backend-staging leadmagnet-frontend-staging'
```

### **Ver uso de recursos:**
```bash
ssh root@91.99.20.86 'pm2 monit'
```

---

## 📝 Variables de Entorno

### **Backend** (`/var/www/leadmagnet-staging/apps/backend/.env`)
```env
NODE_ENV=development
PORT=3004
DATABASE_URL=postgresql://leadmagnet_staging_user:StagingPass2025@localhost:5432/leadmagnet_staging
OPENAI_API_KEY=[misma que producción]
OPENAI_ASSISTANT_ID=[mismo que producción]
CORS_ORIGIN=http://91.99.20.86:5174
```

### **Frontend** (`/var/www/leadmagnet-staging/apps/frontend/.env`)
```env
VITE_API_URL=http://91.99.20.86:3004
VITE_DEFAULT_LANGUAGE=es
VITE_ENVIRONMENT=staging
```

---

## 🌐 Configurar DNS (Cuando quieras)

Para usar un dominio bonito en lugar de IP:puerto, configura:

**DNS Record:**
```
Tipo: A
Nombre: dev
Valor: 91.99.20.86
TTL: 300
```

Esto creará: `dev.objetivovientreplano.com`

Luego avísame y configuro Nginx + SSL (5 minutos).

---

## ⚠️ Importante

### **Staging vs Producción**

| Ambiente | Branch | Backend | Frontend | Base de Datos |
|----------|--------|---------|----------|---------------|
| **Producción** | `main` | Puerto 3003 | chat.objetivovientreplano.com | `leadmagnet_prod` |
| **Staging** | `feat/pro-version` | Puerto 3004 | http://91.99.20.86:5174 | `leadmagnet_staging` |

**NUNCA tocar producción directamente.**
Todo cambio va primero a staging → testing → merge a main → deploy a prod.

---

## ✅ Workflow de Desarrollo

```
1. Kevin desarrolla en local (branch: feat/pro-version)
2. Kevin hace push a GitHub
3. Kevin ejecuta: ssh root@91.99.20.86 '/var/www/deploy-staging.sh'
4. Ulises testea en http://91.99.20.86:5174
5. Si todo OK → merge a main → auto-deploy a producción
```

---

## 🎯 Próximos Pasos

Ahora que staging está listo, Kevin puede empezar a desarrollar:

**Fase 1: Autenticación + Memoria Persistente**
- Sistema de login/registro
- JWT tokens
- Memoria persistente de conversaciones
- Dashboard básico

**Timeline:** ~7 días
**Testing:** Todo en staging primero

---

## 🆘 Troubleshooting

### Frontend no carga
```bash
ssh root@91.99.20.86 'pm2 logs leadmagnet-frontend-staging'
# Verificar que no haya errores
```

### Backend no responde
```bash
# Verificar que esté corriendo
ssh root@91.99.20.86 'pm2 list | grep staging'

# Ver logs
ssh root@91.99.20.86 'pm2 logs leadmagnet-backend-staging'
```

### Error de CORS
```bash
# Verificar CORS_ORIGIN en backend .env
ssh root@91.99.20.86 'grep CORS /var/www/leadmagnet-staging/apps/backend/.env'

# Debe ser: CORS_ORIGIN=http://91.99.20.86:5174
```

### Base de datos no conecta
```bash
# Test connection
ssh root@91.99.20.86 'PGPASSWORD="StagingPass2025" psql -U leadmagnet_staging_user -d leadmagnet_staging -h localhost -c "SELECT 1;"'
```

---

## 📞 Contacto

**Kevin** - Developer
**Método de deploy:** SSH al servidor
**Servidor:** Hetzner 91.99.20.86

---

## 🎉 ¡Todo Listo!

El ambiente de staging está 100% funcional y listo para recibir el desarrollo de features PRO.

**Ulises puede testear ahora mismo en:**
👉 http://91.99.20.86:5174

---

**Creado:** 2025-11-23
**Última actualización:** 2025-11-23
**Versión:** 1.0
