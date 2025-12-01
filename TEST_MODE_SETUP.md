# 🧪 Modo TEST - Configuración Completa

Todo está configurado en modo TEST para que puedas probar el flujo completo de suscripciones sin cobros reales.

## ✅ Lo que ya está configurado

### 1. **Productos de Stripe (TEST Mode)**
Ya creados en https://dashboard.stripe.com/test/products:

| Producto | Product ID | Price ID | Precio |
|----------|------------|----------|--------|
| Plan Mensual | `prod_TWNexoaDUfOUY6` | `price_1SZKswAleRjmLgERGqm3mSsV` | 30€/mes |
| Plan Anual | `prod_TWNexnxBbGdeRE` | `price_1SZKswAleRjmLgER9GBCPrJV` | 220€/año |
| Plan Vitalicio | `prod_TWNe4XvmbX9fQX` | `price_1SZKsxAleRjmLgERQ8iHe6NC` | 400€ |

### 2. **WooCommerce - Modo TEST** ✅
- ✅ Test mode: **ACTIVADO**
- ✅ Test Publishable Key: Configurada
- ✅ Test Secret Key: Configurada
- ✅ Productos vinculados con Stripe Test Products

### 3. **Backend - Configurado para TEST** ✅
- ✅ `STRIPE_SECRET_KEY`: Usando test key (`sk_test_...`)
- ✅ Price IDs de TEST en webhook controller
- ✅ Webhook handler listo

---

## 🚀 Próximos Pasos para Probar

### PASO 1: Configurar Webhook de TEST en Stripe

1. Ve a: https://dashboard.stripe.com/test/webhooks
2. Click en **"Add endpoint"**
3. Configura:
   - **Endpoint URL**: `https://tu-dominio-backend.com/api/webhooks/stripe`
     - Si estás en local: Usa [ngrok](https://ngrok.com/) o similar para exponer tu localhost
   - **Events to send**: Selecciona:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
4. Click **"Add endpoint"**
5. Copia el **Signing secret** (empieza con `whsec_test_...`)
6. Actualiza tu `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_test_XXXXXXXXX
   ```

### PASO 2: Hacer una Compra de PRUEBA

1. Ve a: https://objetivovientreplano.com (WordPress)
2. Selecciona uno de los planes
3. En el checkout, usa esta **tarjeta de prueba**:
   ```
   Número: 4242 4242 4242 4242
   Fecha: 12/34 (cualquier fecha futura)
   CVC: 123
   ```
4. Completa el pago

### PASO 3: Verificar el Flujo

**Deberías ver:**

1. **En Stripe Dashboard (TEST)**:
   - Nueva suscripción creada
   - Cliente creado
   - Pago exitoso

2. **En logs de tu Backend**:
   ```
   [Stripe Webhook] Event received: customer.subscription.created
   [Stripe Webhook] Processing subscription: sub_xxxxx
   [Stripe Webhook] Creating new user for: email@test.com
   [Stripe Webhook] ✅ Subscription synced
   ```

3. **En tu Base de Datos**:
   ```sql
   SELECT u.email, u.role, s.plan, s.status
   FROM users u
   LEFT JOIN subscriptions s ON s."userId" = u.id;
   ```

   Deberías ver:
   - Usuario con `role = "PRO"`
   - Suscripción con `status = "active"`

4. **Login en tu App**:
   - Usuario puede loguearse con el email de la compra
   - Puede establecer contraseña o usar OAuth
   - Tiene acceso PRO

---

## 🔍 Verificar Configuración Actual

### WordPress - Modo TEST activo

Verifica que WordPress esté en modo test:

```bash
ssh root@91.99.20.86 'mysql -u wordpress -pe19410736f4bd4afa104bb998d5a246145a3bd952815cc4e wordpress_prod -e "SELECT option_value FROM wp_options WHERE option_name = '\''woocommerce_stripe_settings'\'' LIMIT 1;" | grep testmode'
```

Debería mostrar: `s:8:"testmode";s:3:"yes"`

### Productos vinculados

```bash
ssh root@91.99.20.86 'mysql -u wordpress -pe19410736f4bd4afa104bb998d5a246145a3bd952815cc4e wordpress_prod -e "SELECT post_id, meta_key, meta_value FROM wp_postmeta WHERE meta_key LIKE \"_stripe_test%\" ORDER BY post_id;"'
```

Deberías ver los 3 productos con sus test product/price IDs.

---

## 🐛 Troubleshooting

### Problema: Webhook no llega al backend

**Solución:**
1. Si estás en localhost, usa ngrok:
   ```bash
   ngrok http 3000
   ```
2. Usa la URL de ngrok en Stripe: `https://xxxx.ngrok.io/api/webhooks/stripe`

### Problema: Usuario se crea pero queda como FREE

**Checklist:**
- ✅ Webhook secret correcto en `.env`
- ✅ Price IDs de TEST en `stripe-webhook.controller.ts`
- ✅ Backend corriendo y escuchando en el puerto correcto
- ✅ Revisa logs del backend

### Problema: No se crea suscripción en Stripe

**Posible causa:** WooCommerce no está usando Stripe Subscriptions.

**Solución:**
Verifica que el plugin custom esté activo:
```bash
ls -la /var/www/objetivovientreplano/wp-content/mu-plugins/ovp-stripe-subscriptions.php
```

Revisa logs de WordPress:
```bash
ssh root@91.99.20.86 'tail -50 /var/www/objetivovientreplano/wp-content/debug.log'
```

---

## 📊 Tarjetas de Prueba Stripe

| Escenario | Número de Tarjeta | Resultado |
|-----------|-------------------|-----------|
| Éxito | `4242 4242 4242 4242` | Pago exitoso |
| Falla (insuficientes fondos) | `4000 0000 0000 9995` | Pago rechazado |
| Requiere autenticación 3D Secure | `4000 0025 0000 3155` | Popup de autenticación |
| Decline genérico | `4000 0000 0000 0002` | Pago rechazado |

Más tarjetas: https://docs.stripe.com/testing#cards

---

## 🔄 Cuando Funcione en TEST → Cambiar a LIVE

### 1. Actualizar Backend `.env`

```bash
# Stripe - USING LIVE MODE
STRIPE_SECRET_KEY=your_stripe_live_secret_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Actualizar `stripe-webhook.controller.ts`

Descomentar los Price IDs de LIVE:
```typescript
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  // LIVE MODE
  'price_1SZKcUAleRjmLgEROPDE357g': 'monthly',
  'price_1SZKcVAleRjmLgERXZIruikV': 'yearly',
  'price_1SZKcWAleRjmLgER8KQYCk2O': 'lifetime',
};
```

### 3. Desactivar Test Mode en WordPress

```bash
ssh root@91.99.20.86 'mysql -u wordpress -pe19410736f4bd4afa104bb998d5a246145a3bd952815cc4e wordpress_prod -e "UPDATE wp_options SET option_value = REPLACE(option_value, '\''s:8:\"testmode\";s:3:\"yes\"'\'', '\''s:8:\"testmode\";s:2:\"no\"'\'') WHERE option_name = '\''woocommerce_stripe_settings'\'';"'
```

### 4. Configurar Webhook LIVE

1. https://dashboard.stripe.com/webhooks (sin /test)
2. Mismo proceso que en TEST
3. Copiar nuevo webhook secret de LIVE

---

## 📝 Resumen del Estado Actual

✅ **COMPLETADO:**
- Productos de Stripe en TEST mode creados
- WooCommerce configurado en TEST mode
- Backend usando credenciales TEST
- Webhook controller actualizado con Price IDs de TEST
- Plugin custom de integración instalado

⏳ **PENDIENTE (TU):**
- Configurar webhook en Stripe Dashboard TEST
- Hacer compra de prueba
- Verificar que usuario se cree con rol PRO
- Probar login en la app

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs del backend
2. Revisa Stripe Dashboard > Webhooks > Logs
3. Revisa debug.log de WordPress
4. Avísame y te ayudo a debuggear

¡Suerte con las pruebas! 🚀
