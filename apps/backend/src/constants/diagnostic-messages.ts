import type { Language } from '../types';

/**
 * Initial instructions shown to the user before starting the diagnostic
 * Emphasizes two key points:
 * 1. Quality of diagnosis depends on quality of answers
 * 2. Free diagnostic worth 30€+ and exclusive discount for completion
 */
export const INITIAL_INSTRUCTIONS = {
  es: `**¡Hola, {userName}!**

Tu diagnóstico **depende** de tus respuestas — sé sincero/a para obtener recomendaciones útiles.

**Valorado en más de 30 €**, 100% **gratis**. Complétalo y recibe **30% de descuento** en el acompañamiento.

Solo **5–7 minutos**.

**¿Empezamos?** Escribe "sí" cuando estés listo/a.`,

  en: `**Hi, {userName}!**

Your diagnosis **depends** on your answers — be honest to get useful recommendations.

**Valued at over €30**, 100% **free**. Complete it and receive **30% off** the personalized program.

Just **5–7 minutes**.

**Ready to start?** Type "yes" when you're ready.`,
};

/**
 * Reminder about quality of responses (can be shown mid-diagnostic)
 */
export const QUALITY_REMINDER = {
  es: `Recuerda: cuanto más me cuentes, mejor será tu diagnóstico.`,
  en: `Remember: the more you tell me, the better your diagnosis will be.`,
};

/**
 * Message shown when diagnosis is ready with discount code
 */
export const DIAGNOSIS_READY_MESSAGE = {
  es: `¡Excelente, {userName}! Has completado tu diagnóstico.

**Aquí está tu análisis personalizado**

{diagnosisContent}

---

**TU RECOMPENSA POR COMPLETAR EL DIAGNÓSTICO:**

Como te prometí, aquí tienes tu **descuento EXCLUSIVO del 30%**:

**Código de descuento:** \`{discountCode}\`
**Válido por 7 días**

Este código te da acceso preferente a nuestro programa de acompañamiento personalizado 24/7.

**¿Qué incluye el programa?**
✅ Chat ilimitado con tu asistente de bienestar digestivo
✅ Plan alimenticio adaptado a tu situación específica
✅ Seguimiento diario de tu progreso
✅ Recetas personalizadas según tus intolerancias
✅ Soporte cuando lo necesites

**PLUS:** Puedes descargar tu diagnóstico completo en PDF (valorado en más de 30€, tuyo gratis por completar el cuestionario)

**¿Quieres dar el siguiente paso y empezar tu transformación con tu descuento exclusivo del 30%?**`,

  en: `Excellent, {userName}! You've completed your diagnosis.

**Here is your personalized analysis**

{diagnosisContent}

---

**YOUR REWARD FOR COMPLETING THE DIAGNOSIS:**

As I promised, here's your **EXCLUSIVE 30% DISCOUNT**:

**Discount code:** \`{discountCode}\`
**Valid for 7 days**

This code gives you preferred access to our 24/7 personalized support program.

**What does the program include?**
✅ Unlimited chat with your digestive wellness assistant
✅ Meal plan adapted to your specific situation
✅ Daily progress tracking
✅ Personalized recipes according to your intolerances
✅ Support when you need it

**PLUS:** You can download your complete diagnosis in PDF (valued at over €30, yours free for completing the questionnaire)

**Do you want to take the next step and start your transformation with your exclusive 30% discount?**`,
};

/**
 * Formats the diagnosis ready message with actual values
 */
export function formatDiagnosisReadyMessage(
  language: Language,
  userName: string,
  diagnosisContent: string,
  discountCode: string
): string {
  const template = DIAGNOSIS_READY_MESSAGE[language as 'es' | 'en'];

  return template
    .replace('{userName}', userName)
    .replace('{diagnosisContent}', diagnosisContent)
    .replace(/{discountCode}/g, discountCode);
}

/**
 * Formats the initial instructions with user name
 */
export function formatInitialInstructions(
  language: Language,
  userName: string
): string {
  const template = INITIAL_INSTRUCTIONS[language as 'es' | 'en'];
  return template.replace('{userName}', userName);
}
