export const PRO_MAINTENANCE_MODE = true;

export const PRO_MAINTENANCE_MESSAGE = `Debido a la alta demanda registrada en los últimos días, estamos realizando una ampliación de la capacidad de nuestros servidores para garantizar una experiencia óptima y estable en el Chat 24/7.

Todo el equipo de Objetivo Vientre Plano está trabajando activamente en este ajuste, que quedará completamente resuelto a lo largo del día de hoy.

Si tienes cualquier consulta urgente, puedes escribirnos a:
info@objetivovientreplano.com

Gracias por tu confianza y por acompañarnos en esta nueva etapa.`;

// Emails que pueden bypasear el modo mantenimiento
export const MAINTENANCE_BYPASS_EMAILS: string[] = [
  'test@pro.com',
  // Agregar más emails aquí
];

/**
 * Verifica si un email puede bypasear el modo mantenimiento
 */
export function canBypassMaintenance(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return MAINTENANCE_BYPASS_EMAILS.some(
    (bypassEmail) => bypassEmail.toLowerCase().trim() === normalizedEmail
  );
}
