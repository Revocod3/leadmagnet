/**
 * Feature Flags Configuration
 *
 * Emails que pueden acceder al flujo PRO sin suscripción activa.
 * Útil para testing, demos, y usuarios especiales.
 */

// Emails que pueden bypasear la verificación de suscripción PRO
export const PRO_BYPASS_EMAILS: string[] = [
  // Agregar emails aquí para dar acceso PRO sin suscripción
  // Ejemplo: 'test@example.com',
  // 'demo@objetivovientrieplano.com',
  'test@pro.com',
  'objetivovientreplano@gmail.com',
  'perfecthomespain@gmail.com',
  'revocode222@gmail.com'

];

/**
 * Verifica si un email puede bypasear la verificación de suscripción PRO
 */
export function canBypassProSubscription(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return PRO_BYPASS_EMAILS.some(
    (bypassEmail) => bypassEmail.toLowerCase().trim() === normalizedEmail
  );
}
