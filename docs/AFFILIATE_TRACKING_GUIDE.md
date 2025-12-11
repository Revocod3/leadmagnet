# Guía de Tracking de Afiliados - Objetivo Vientre Plano

## Problema Resuelto

**Antes:** Los links de afiliados `www.objetivovientreplano.com/?afi=11` perdían el parámetro al redirigir a `chat.objetivovientreplano.com`, resultando en pérdida de comisiones.

**Ahora:** Sistema completo de tracking multi-capa que preserva el ID de afiliado a través de redirecciones y subdominios.

## Arquitectura de la Solución

### 1. WordPress Must-Use Plugin (`affiliate-cookie-handler.php`)

**Ubicación:** `/var/www/objetivovientreplano/wp-content/mu-plugins/affiliate-cookie-handler.php`

**Funciones:**

#### Captura de Cookie
- Hook: `template_redirect` (prioridad 1)
- Detecta parámetro `?afi=X` en la URL
- Crea cookie `uap_referral_id` con:
  - **Dominio:** `.objetivovientreplano.com` (accesible en todos los subdominios)
  - **Expiración:** 30 días
  - **Path:** `/`
  - **Secure:** true (solo HTTPS)
  - **HttpOnly:** false (JavaScript puede leer)
  - **SameSite:** Lax

#### Preservación en Redirects
- Hook: `wp_redirect` filter
- Detecta redirects a `chat.objetivovientreplano.com`
- Añade `?afi=X` al URL de destino si existe en cookie o parámetro

### 2. Frontend (React/TypeScript)

**Archivo:** `/var/www/leadmagnet/apps/frontend/src/pages/PricingPage.tsx`

**Función:** `getAffiliateId()`

Sistema de múltiples capas en orden de prioridad:

```typescript
1. URL Parameter (?afi=11)
   ↓
2. Cookie (uap_referral_id) ← NUEVA CAPA
   ↓
3. LocalStorage (affiliate_id)
   ↓
4. UAP Complex Cookie (uap_referral)
```

**Comportamiento:**
- Al encontrar un ID en cualquier capa, lo guarda en `localStorage` para persistencia
- Formato en Stripe: `client_reference_id=aff_X`

### 3. Backend (Node.js/TypeScript)

**Archivo:** `/var/www/leadmagnet/apps/backend/src/services/affiliate.service.ts`

**Proceso:**

1. **Webhook de Stripe:** Recibe `client_reference_id=aff_X`
2. **Parsing:** Extrae número de afiliado con regex `^aff_(\d+)$`
3. **Verificación:** Consulta MySQL WordPress para verificar afiliado activo
4. **Cálculo:** Aplica comisión del 30% según plan
5. **Registro:** Inserta en tabla `wp_uap_referrals`

**Base de datos WordPress:**
- Host: localhost (o configurado en env)
- Tablas: `wp_uap_affiliates`, `wp_uap_referrals`

## Flujo Completo

```
Usuario recibe link → www.objetivovientreplano.com/?afi=11
                                 ↓
                      WordPress captura parámetro
                                 ↓
                      Crea cookie uap_referral_id=11
                      (dominio: .objetivovientreplano.com)
                                 ↓
                      Redirect a chat.objetivovientreplano.com?afi=11
                                 ↓
                      Frontend React lee:
                      - URL param (?afi=11) ✓
                      - Cookie (uap_referral_id=11) ✓
                      - LocalStorage ✓
                                 ↓
                      Usuario hace clic en "Consigue mi plan"
                                 ↓
                      Stripe recibe client_reference_id=aff_11
                                 ↓
                      Usuario completa pago
                                 ↓
                      Stripe Webhook → Backend
                                 ↓
                      Backend procesa afiliado:
                      - Extrae ID: 11
                      - Verifica en wp_uap_affiliates
                      - Calcula comisión (30%)
                      - Crea registro en wp_uap_referrals
                                 ↓
                      ✅ Afiliado recibe crédito de comisión
```

## Testing

### Probar Tracking de Cookie

```bash
# 1. Visitar con parámetro
curl -I "https://www.objetivovientreplano.com/?afi=11"

# Buscar en headers:
# Set-Cookie: uap_referral_id=11; expires=...; domain=.objetivovientreplano.com

# 2. Verificar logs de WordPress
ssh root@91.99.20.86
tail -f /var/www/objetivovientreplano/wp-content/debug.log
# Buscar: "Affiliate cookie set: ID=11"
```

### Probar Frontend

```javascript
// Abrir chat.objetivovientreplano.com/?afi=11
// En consola del navegador:
console.log(document.cookie); // Debería mostrar uap_referral_id=11
console.log(localStorage.getItem('affiliate_id')); // Debería mostrar 11

// Al hacer clic en plan, el link debe incluir:
// ?client_reference_id=aff_11
```

### Probar Backend

```bash
# Ver logs del backend
ssh root@91.99.20.86
pm2 logs leadmagnet-backend --lines 100 | grep -i affiliate
```

## Planes y Comisiones

| Plan     | Precio  | Comisión (30%) |
|----------|---------|----------------|
| Monthly  | €29.99  | €8.997         |
| Yearly   | €220    | €66            |
| Lifetime | €399.99 | €119.997       |

## Mantenimiento

### Verificar Plugin Activo
```bash
ls -la /var/www/objetivovientreplano/wp-content/mu-plugins/affiliate-cookie-handler.php
```

### Ver Afiliados Activos (WordPress DB)
```sql
SELECT id, status FROM wp_uap_affiliates WHERE status = 1;
```

### Ver Referrals Recientes
```sql
SELECT * FROM wp_uap_referrals ORDER BY date DESC LIMIT 10;
```

### Rebuild Frontend (después de cambios)
```bash
cd /var/www/leadmagnet
pnpm --filter frontend build
```

## Variables de Entorno (Backend)

```bash
WORDPRESS_DB_HOST=localhost
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=***
WORDPRESS_DB_NAME=wordpress_prod
WORDPRESS_DB_PORT=3306
```

## Problemas Comunes

### Cookie no se establece
- Verificar que el dominio sea `.objetivovientreplano.com` (con punto inicial)
- Verificar que el sitio use HTTPS
- Verificar permisos del archivo mu-plugin

### Afiliado no recibe comisión
- Verificar que el afiliado esté activo en WordPress (status=1)
- Verificar logs del backend: `pm2 logs leadmagnet-backend`
- Verificar que Stripe envíe el `client_reference_id`

### Frontend no lee la cookie
- Verificar en DevTools > Application > Cookies
- Verificar que la cookie no sea HttpOnly
- Verificar que el dominio sea correcto

## Archivos Modificados

1. ✅ `/var/www/objetivovientreplano/wp-content/mu-plugins/affiliate-cookie-handler.php` (NUEVO)
2. ✅ `/var/www/leadmagnet/apps/frontend/src/pages/PricingPage.tsx` (ACTUALIZADO)
3. ✅ `/var/www/leadmagnet/apps/backend/src/services/affiliate.service.ts` (YA EXISTÍA)

## Backup

Backup del archivo original:
```bash
/var/www/leadmagnet/apps/frontend/src/pages/PricingPage.tsx.backup
```
