/**
 * Temporal Context Service
 *
 * Manages time-based context and triggers for Clara Premium.
 * Generates dynamic instructions based on time elapsed since last interaction.
 */

import { logger } from '../utils/logger';

export class TemporalContextService {

  /**
   * Calculate days since a given date
   */
  private calculateDaysSince(date: Date | null): number {
    if (!date) return -1;

    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Get current time of day for appropriate greetings
   */
  private getTimeOfDay(): number {
    return new Date().getHours();
  }

  /**
   * Get appropriate greeting based on time of day
   */
  private getGreetingByTime(hour: number): string {
    if (hour >= 6 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  /**
   * Build temporal triggers to inject into system prompt
   * Based on time elapsed since last interaction
   */
  buildTemporalTriggers(
    lastCheckInDate: Date | null,
    userName: string,
    consecutiveDays: number
  ): string {
    if (!lastCheckInDate) {
      // First time user or no previous interaction
      return `
═══════════════════════════════════════════════════════════════
⏰ CONTEXTO TEMPORAL: PRIMERA VEZ
═══════════════════════════════════════════════════════════════

Este es el primer contacto con ${userName}. No hay historial previo de interacciones.
- Usa un saludo cálido de bienvenida
- Establece conexión emocional desde el inicio
- No asumas nada sobre su día o estado previo
`;
    }

    const daysSince = this.calculateDaysSince(lastCheckInDate);
    const timeOfDay = this.getTimeOfDay();
    const greeting = this.getGreetingByTime(timeOfDay);

    let triggers = `
═══════════════════════════════════════════════════════════════
⏰ CONTEXTO TEMPORAL
═══════════════════════════════════════════════════════════════

**Última interacción:** Hace ${daysSince} día${daysSince !== 1 ? 's' : ''}
**Días consecutivos antes:** ${consecutiveDays}
**Hora actual:** ${timeOfDay}:00 (${greeting})
`;

    // Same day return
    if (daysSince === 0) {
      triggers += `

🔄 RETORNO EL MISMO DÍA
- El usuario vuelve el mismo día
- Continuación natural de la conversación
- NO saludes de nuevo formalmente
- Usa transiciones naturales: "Cuéntame", "¿Qué necesitas?", "Estoy aquí"
- Mantén el flujo conversacional sin interrupciones
`;
    }

    // Daily check-in (1 day)
    else if (daysSince === 1) {
      triggers += `

🌞 CHECK-IN DIARIO (1 DÍA)
- Usa saludo apropiado: "${greeting}, ${userName}"
- Pregunta específicamente por AYER:
  → "¿Cómo estuvo tu barriga ayer?"
  → "¿Cómo te sentiste emocionalmente ayer?"
- Si había micro-acción pendiente, pregunta por ella
- CELEBRA que volvió: "Me alegra verte de nuevo" o "Qué bien que vuelves"
- Refuerzo positivo: reconoce su constancia
- Si consecutiveDays >= 3, menciona: "Llevas ${consecutiveDays} días seguidos, eso es increíble"
`;
    }

    // Short absence (2-6 days)
    else if (daysSince >= 2 && daysSince <= 6) {
      triggers += `

📅 AUSENCIA CORTA (${daysSince} DÍAS)
- Saludo: "${greeting}, ${userName}. ¡Qué gusto verte!"
- NO presiones ni hagas sentir mal por la ausencia
- Pregunta de forma abierta: "¿Cómo te ha ido estos días?"
- Si había un reto/plan activo, pregunta suavemente: "¿Pudiste seguir con [tema]?"
- Ofrece retomar donde quedaron
- Valida cualquier dificultad sin juicio
- Re-motiva: "Estoy aquí cuando me necesites"
`;
    }

    // Weekly review (7-13 days)
    else if (daysSince >= 7 && daysSince <= 13) {
      triggers += `

📆 REVISIÓN SEMANAL (~1 SEMANA)
- Saludo cálido: "${greeting}, ${userName}. Te extrañé un poco 💖"
- Ha pasado aproximadamente 1 semana
- Haz mini-revisión semanal:
  → "¿Cómo te fue esta última semana en general?"
  → "¿Notaste algún avance con tu barriga/digestión?"
  → "¿Qué te costó más durante estos días?"
- Pregunta si hubo algún evento/situación especial
- NO asumas que abandonó - puede haber estado ocupado/a
- Ofrece ajustar el plan: "Revisemos juntos qué podemos mejorar para esta semana"
- Refuerza motivación: "Cada día cuenta, y estoy aquí para acompañarte"
`;
    }

    // Medium absence (2-4 weeks)
    else if (daysSince >= 14 && daysSince <= 30) {
      triggers += `

💝 RE-ENGAGEMENT (2-4 SEMANAS)
- Saludo MUY cálido sin presión: "${greeting}, ${userName}. Qué alegría verte de nuevo"
- Han pasado ${daysSince} días (${Math.floor(daysSince / 7)} semanas aprox)
- NO preguntes inmediatamente por avances o progreso
- PRIMERO conecta emocionalmente:
  → "¿Cómo estás? ¿Cómo te sientes?"
  → "Cuéntame qué ha pasado en este tiempo"
- Escucha sin juicio si hubo bloqueos/dificultades
- Valida: "Es completamente normal tener pausas"
- Después de conectar, pregunta suavemente: "¿Cómo ha estado tu barriga?"
- Ofrece empezar de nuevo, ajustar ritmo, simplificar plan
- Refuerza: "Estoy aquí siempre que me necesites. Sin presión, a tu ritmo"
`;
    }

    // Long absence (1+ month)
    else {
      triggers += `

🌟 REENCUENTRO LARGO (${daysSince} DÍAS / ${Math.floor(daysSince / 30)} mes${Math.floor(daysSince / 30) > 1 ? 'es' : ''})
- Saludo de REENCUENTRO genuino: "${greeting}, ${userName}. Ha pasado tiempo, pero me alegra muchísimo verte"
- Ausencia larga de ${daysSince} días
- CERO presión o juicio
- Trata como si fuera casi una primera conversación de nuevo
- NO menciones pendientes ni planes antiguos de inmediato
- Pregunta abierto: "Cuéntame, ¿cómo estás? ¿Cómo te ha ido?"
- Escucha profundo
- Si quiere retomar: ofrece empezar prácticamente de cero
- Si solo quiere hablar: acompáñalo sin forzar acción
- Valida y normaliza: "La vida pasa, lo importante es que estás aquí ahora"
- Refuerza vínculo: "Siempre puedes volver cuando quieras. Estoy aquí para ti"
`;
    }

    // Add day-specific reminders if applicable
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1 && daysSince === 1) {
      // Monday after weekend
      triggers += `

🗓 CONTEXTO: LUNES (inicio de semana)
- Es lunes, inicio de semana
- Perfecto para: revisar cómo fue el fin de semana, establecer micro-objetivos semanales
- Tono: energía de nuevo comienzo, pero sin presión
`;
    }

    if (dayOfWeek === 5 && daysSince <= 1) {
      // Friday
      triggers += `

🗓 CONTEXTO: VIERNES (fin de semana cerca)
- Es viernes, se acerca el fin de semana
- Puedes mencionar: "El fin de semana es buen momento para descansar y practicar hábitos suaves"
- Prepara micro-acción sencilla para el fin de semana
`;
    }

    triggers += `

═══════════════════════════════════════════════════════════════
`;

    logger.info(`[TEMPORAL] Built triggers for ${userName}: ${daysSince} days since last check-in`);

    return triggers;
  }

  /**
   * Determine if user should receive a weekly review prompt
   */
  shouldTriggerWeeklyReview(lastCheckInDate: Date | null): boolean {
    if (!lastCheckInDate) return false;
    const daysSince = this.calculateDaysSince(lastCheckInDate);
    return daysSince >= 7 && daysSince <= 13;
  }

  /**
   * Determine if user needs re-engagement
   */
  needsReEngagement(lastCheckInDate: Date | null): boolean {
    if (!lastCheckInDate) return false;
    const daysSince = this.calculateDaysSince(lastCheckInDate);
    return daysSince >= 14;
  }

  /**
   * Get celebration message for consecutive days streak
   */
  getCelebrationForStreak(consecutiveDays: number): string | null {
    if (consecutiveDays === 3) {
      return "¡3 días seguidos! 🌟 Estás creando un hábito real.";
    }
    if (consecutiveDays === 7) {
      return "¡Una semana completa! 💪 Esto es compromiso de verdad.";
    }
    if (consecutiveDays === 14) {
      return "¡2 semanas consecutivas! 🎉 Tu cuerpo ya está notando los cambios.";
    }
    if (consecutiveDays === 21) {
      return "¡21 días seguidos! ✨ Se dice que a los 21 días se forma un hábito. Lo estás logrando.";
    }
    if (consecutiveDays === 30) {
      return "¡UN MES COMPLETO! 🏆 Esto es transformación real. Estoy muy orgullosa de ti.";
    }
    if (consecutiveDays % 30 === 0 && consecutiveDays > 30) {
      return `¡${consecutiveDays / 30} mes${consecutiveDays > 30 ? 'es' : ''} consecutivos! 💖 Esto es constancia genuina.`;
    }
    return null;
  }
}

// Export singleton instance
export const temporalContextService = new TemporalContextService();
