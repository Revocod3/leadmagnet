# Sistema de Suscripciones - Guía de Configuración

Este documento explica cómo configurar el sistema de suscripciones que integra WordPress/WooCommerce con Stripe y el backend de Clara Pro.

## 📋 Resumen

El sistema permite que:
1. Usuario compra suscripción en WordPress (WooCommerce + Stripe)
2. Stripe envía webhook a tu backend
3. Backend crea/actualiza usuario automáticamente con rol PRO
4. Usuario puede entrar a Clara Pro con email/password o OAuth (Google/Facebook)
5. Backend verifica estado de suscripción en cada login

---

## 🔧 Configuración

### 1. Variables de Entorno

Agrega estas variables a tu `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_live_secret_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here  # Obtener de Stripe Dashboard
```

### 2. Obtener Stripe Price IDs

Necesitas mapear los Price IDs de Stripe a los nombres de planes:

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navega a **Products**
3. Para cada producto (Plan Mensual, Plan Anual, Plan Vitalicio):
   - Click en el producto
   - Copia el **Price ID** (empieza con `price_`)

4. Actualiza el archivo `apps/backend/src/controllers/stripe-webhook.controller.ts`:

```typescript
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  'price_1XXXXXXXXX': 'monthly',    // Reemplaza con tu Price ID real
  'price_2XXXXXXXXX': 'yearly',     // Reemplaza con tu Price ID real
  'price_3XXXXXXXXX': 'lifetime',   // Reemplaza con tu Price ID real
};
```

### 3. Configurar Webhook en Stripe

1. Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click en **Add endpoint**
3. Configura:
   - **Endpoint URL**: `https://tu-dominio.com/api/webhooks/stripe`
   - **Events to send**: Selecciona estos eventos:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Click en **Add endpoint**
5. Copia el **Signing secret** (empieza con `whsec_`)
6. Agrégalo a tu `.env` como `STRIPE_WEBHOOK_SECRET`

### 4. Aplicar Migración de Base de Datos

Si aún no has aplicado la migración:

```bash
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma generate
```

---

## 📧 Configurar Email de Bienvenida en WooCommerce

### Opción A: Template Personalizado (Recomendado)

1. **Instalar plugin**: [Kadence WooCommerce Email Designer](https://wordpress.org/plugins/kadence-woocommerce-email-designer/) (ya lo tienes instalado)

2. **Editar email de Suscripción Completada**:
   - WordPress Admin → WooCommerce → Configuración → Emails
   - Click en "Suscripción Completada"
   - Personaliza el template con este contenido:

```html
<h2>¡Bienvenido a Clara Pro! 🎉</h2>

<p>Hola {customer_name},</p>

<p>Gracias por suscribirte a Clara Pro. Tu suscripción está activa y lista para usar.</p>

<h3>🔐 Accede a tu cuenta</h3>

<p>Tu email de acceso es: <strong>{customer_email}</strong></p>

<p>Puedes acceder de dos formas:</p>

<ol>
  <li><strong>Con Google/Facebook:</strong> Usa el botón de login social con este email</li>
  <li><strong>Con contraseña:</strong> <a href="https://chat.objetivovientreplano.com/set-password?email={customer_email}">Establece tu contraseña aquí</a></li>
</ol>

<p style="text-align: center; margin: 30px 0;">
  <a href="https://chat.objetivovientreplano.com"
     style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
    Acceder a Clara Pro
  </a>
</p>

<h3>📋 Detalles de tu suscripción</h3>
<p>Plan: {subscription_name}<br>
Precio: {subscription_price}<br>
Próximo pago: {subscription_next_payment_date}</p>

<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

<p>¡Gracias!<br>El equipo de Objetivo Vientre Plano</p>
```

### Opción B: Hook de PHP (Más avanzado)

Agregar a `wp-content/themes/kadence/functions.php` o crear un plugin custom:

```php
<?php
// Send custom welcome email with Clara Pro access info
add_action('woocommerce_subscription_status_active', 'send_clara_pro_welcome_email', 10, 1);

function send_clara_pro_welcome_email($subscription) {
    $customer_email = $subscription->get_billing_email();
    $customer_name = $subscription->get_billing_first_name();

    // Generate password reset token via API
    $reset_token_response = wp_remote_post('https://tu-backend.com/api/auth/request-password-reset', [
        'body' => json_encode(['email' => $customer_email]),
        'headers' => ['Content-Type' => 'application/json'],
    ]);

    $reset_data = json_decode(wp_remote_retrieve_body($reset_token_response), true);
    $reset_token = $reset_data['resetToken'] ?? '';

    $subject = '¡Bienvenido a Clara Pro!';
    $message = "
        <h2>¡Hola {$customer_name}!</h2>
        <p>Tu suscripción a Clara Pro está activa.</p>
        <p><strong>Tu email de acceso:</strong> {$customer_email}</p>
        <p><a href='https://chat.objetivovientreplano.com/set-password?token={$reset_token}&email={$customer_email}'>
            Establece tu contraseña aquí
        </a></p>
        <p>O entra con Google/Facebook usando tu email: {$customer_email}</p>
        <p><a href='https://chat.objetivovientreplano.com'>Acceder a Clara Pro →</a></p>
    ";

    wp_mail($customer_email, $subject, $message, ['Content-Type: text/html; charset=UTF-8']);
}
```

---

## 🧪 Probar el Sistema

### 1. Prueba de Webhook

```bash
# Test que el webhook está accesible
curl -X POST https://tu-dominio.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Deberías recibir error de firma inválida (esto es correcto)
```

### 2. Prueba de Compra Real

1. En WordPress, agrega un producto al carrito
2. Completa el checkout con una tarjeta de prueba de Stripe:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos

3. Revisa los logs del backend:
```bash
cd apps/backend
pnpm logs  # o consulta tus logs
```

Deberías ver:
```
[Stripe Webhook] Event received: customer.subscription.created
[Stripe Webhook] Processing subscription: sub_xxxxx
[Stripe Webhook] Creating new user for: email@test.com
[Stripe Webhook] ✅ Subscription synced
```

4. Intenta hacer login en Clara Pro con el email de compra:
   - Debería tener rol "PRO"
   - Puede establecer contraseña o usar OAuth

### 3. Verificar en Base de Datos

```sql
-- Ver usuarios con suscripción
SELECT u.email, u.role, s.plan, s.status, s."currentPeriodEnd"
FROM users u
LEFT JOIN subscriptions s ON s."userId" = u.id
WHERE u.role = 'PRO';
```

---

## 🔒 Proteger Rutas PRO

Para proteger endpoints que solo pueden usar usuarios PRO:

```typescript
import { requireProSubscription } from '../middleware/subscription.middleware';

// En tus rutas:
router.post('/pro-feature',
  authenticateJWT,           // Verifica que esté logueado
  requireProSubscription,     // Verifica que tenga suscripción activa
  (req, res) => {
    // Tu lógica aquí
  }
);
```

---

## 📊 Monitoreo

### Ver Suscripciones Activas

```sql
SELECT
  u.email,
  s.plan,
  s.status,
  s."currentPeriodEnd",
  s."cancelAtPeriodEnd"
FROM subscriptions s
JOIN users u ON u.id = s."userId"
WHERE s.status IN ('active', 'trialing')
ORDER BY s."createdAt" DESC;
```

### Logs de Stripe Webhooks

Todos los eventos de webhook se loguean con `console.log()`. Revisa tus logs:

```bash
# Si usas PM2
pm2 logs

# Si usas Docker
docker logs <container-name>

# Si corres con pnpm dev
# Los logs aparecerán en la terminal
```

---

## 🚨 Troubleshooting

### Problema: Webhook no se dispara

**Solución:**
1. Verifica que la URL del webhook sea accesible públicamente
2. Revisa en Stripe Dashboard > Webhooks > Logs
3. Asegúrate que `STRIPE_WEBHOOK_SECRET` sea correcto

### Problema: Usuario se crea pero queda como FREE

**Solución:**
1. Revisa que los Price IDs en `PRICE_TO_PLAN_MAP` sean correctos
2. Verifica logs del webhook para ver qué plan detectó
3. Asegúrate que el webhook `customer.subscription.created` se esté procesando

### Problema: Usuario no puede establecer contraseña

**Solución:**
1. Verifica que el endpoint `/api/auth/set-password` esté accesible
2. Revisa que el `resetToken` sea válido y no haya expirado (1 hora)
3. Prueba generando un nuevo token con `/api/auth/request-password-reset`

### Problema: Suscripción cancelada no baja a FREE

**Solución:**
1. Verifica que el webhook `customer.subscription.deleted` esté configurado
2. Revisa logs del webhook
3. Manualmente actualiza:
```sql
UPDATE users SET role = 'FREE' WHERE email = 'email@usuario.com';
```

---

## 📝 Próximos Pasos

- [ ] Configurar Stripe Price IDs en `stripe-webhook.controller.ts`
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Personalizar email de bienvenida en WooCommerce
- [ ] Probar compra con tarjeta de prueba
- [ ] Proteger rutas PRO con `requireProSubscription`
- [ ] Configurar frontend para mostrar plan del usuario
- [ ] Agregar página de gestión de suscripción

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Revisa Stripe Dashboard > Webhooks > Logs
3. Revisa los logs de WooCommerce (WordPress Admin > WooCommerce > Estado > Logs)

¿Preguntas? Contacta al equipo de desarrollo.
