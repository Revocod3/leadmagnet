import type { Language } from '../types';

/**
 * Initial instructions shown to the user before starting the diagnostic
 * Emphasizes two key points:
 * 1. Quality of diagnosis depends on quality of answers
 * 2. Free diagnostic worth 30€+ and exclusive discount for completion
 * 
 * Variations to make it more dynamic
 */
const INITIAL_INSTRUCTIONS_VARIANTS = {
  es: [
    {
      greeting: '¡Hola, {userName}! Me alegra verte por aquí.',
      intro: 'Voy a hacerte algunas preguntas para entender tu situación digestiva. Tu diagnóstico será tan completo como tú lo hagas — la honestidad es clave.',
      value: '**Valorado en más de 30 €**, 100% **gratis**. Al completarlo, recibirás **30% de descuento** en nuestro programa.',
      time: 'Solo te tomará **5-7 minutos**.',
      cta: '¿Listo/a para empezar? Escribe "sí".'
    },
    {
      greeting: '{userName}, ¡bienvenido/a!',
      intro: 'Este diagnóstico personalizado depende completamente de tus respuestas. Cuanto más me cuentes, mejores serán las recomendaciones que recibirás.',
      value: 'Es un análisis **valorado en más de 30 €** que te ofrezco gratis, más un **30% OFF** exclusivo.',
      time: '**5-7 minutos** de tu tiempo que pueden marcar la diferencia.',
      cta: 'Escribe "sí" cuando estés listo/a para comenzar.'
    },
    {
      greeting: '¡Hola, {userName}! Encantado/a de conocerte.',
      intro: 'Vamos a descubrir qué está pasando con tu sistema digestivo. La calidad de tu diagnóstico dependerá de tus respuestas — sé sincero/a conmigo.',
      value: 'Es **completamente gratis** (valor 30€+) y si lo completas, te llevas **30% de descuento** en tu programa.',
      time: 'Solo necesito **5-7 minutos** de tu atención.',
      cta: '¿Empezamos? Escribe "sí".'
    }
  ],
  en: [
    {
      greeting: 'Hi, {userName}! Glad to have you here.',
      intro: "I'm going to ask you some questions to understand your digestive situation. Your diagnosis will be as complete as you make it — honesty is key.",
      value: '**Valued at over €30**, 100% **free**. When you complete it, you\'ll get **30% off** our program.',
      time: 'It will only take **5-7 minutes**.',
      cta: 'Ready to start? Type "yes".'
    },
    {
      greeting: '{userName}, welcome!',
      intro: 'This personalized diagnosis completely depends on your answers. The more you tell me, the better the recommendations you\'ll receive.',
      value: 'It\'s an analysis **valued at over €30** that I offer you for free, plus an exclusive **30% OFF**.',
      time: '**5-7 minutes** of your time that can make the difference.',
      cta: 'Type "yes" when you\'re ready to begin.'
    },
    {
      greeting: 'Hi, {userName}! Nice to meet you.',
      intro: "Let's find out what's going on with your digestive system. The quality of your diagnosis will depend on your answers — be honest with me.",
      value: 'It\'s **completely free** (€30+ value) and if you complete it, you get **30% off** your program.',
      time: 'I just need **5-7 minutes** of your attention.',
      cta: 'Shall we start? Type "yes".'
    }
  ]
};

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
 * Formats the initial instructions with user name (now with variations)
 */
export function formatInitialInstructions(
  language: Language,
  userName: string
): string {
  // Get time-based variation
  const hour = new Date().getHours();
  const variantIndex = getTimeBasedVariantIndex(hour);

  const variants = INITIAL_INSTRUCTIONS_VARIANTS[language as 'es' | 'en'];
  const variant = variants[variantIndex % variants.length]!;

  // Format with user name
  const greeting = variant.greeting.replace('{userName}', userName);

  return `**${greeting}**

${variant.intro}

${variant.value}

${variant.time}

**${variant.cta}**`;
}

/**
 * Get variant index based on time of day
 */
function getTimeBasedVariantIndex(hour: number): number {
  if (hour >= 6 && hour < 12) {
    return 0; // Morning variant
  } else if (hour >= 12 && hour < 18) {
    return 1; // Afternoon variant
  } else {
    return 2; // Evening/night variant
  }
}
