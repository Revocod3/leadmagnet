import { openai } from '../../config/openai';
import { MODELS } from '../../config/openai';
import type {
  DiagnosisHypothesis,
  ConversationalMemory,
  KeyMoment,
  Language,
} from '../../types';

/**
 * DiagnosisBuilderService
 * 
 * Builds diagnosis PROGRESSIVELY throughout the conversation, not just at the end.
 * 
 * Responsibilities:
 * - Update hypothesis after each user response
 * - Track confidence level
 * - Identify evidence and gaps
 * - Generate final diagnosis using accumulated context
 */
export class DiagnosisBuilderService {
  /**
   * Update diagnosis hypothesis based on new information
   */
  async updateHypothesis(
    userMessage: string,
    memory: ConversationalMemory,
    turnNumber: number
  ): Promise<DiagnosisHypothesis> {
    const currentHypothesis = memory.currentHypothesis;

    try {
      const prompt = `Eres un experto en salud digestiva. Actualiza la hipótesis diagnóstica basándote en la nueva información.

HIPÓTESIS ACTUAL:
${currentHypothesis.primary || 'No establecida'}
Confianza: ${currentHypothesis.confidence || 0}%
Evidencia: ${currentHypothesis.evidence?.join(', ') || 'Ninguna'}

INFORMACIÓN RECOPILADA:
- Problema: ${memory.factualInfo.health?.mainProblem || 'No especificado'}
- Duración: ${memory.factualInfo.health?.duration || 'No especificada'}
- Síntomas: ${memory.factualInfo.health?.symptoms?.join(', ') || 'Ninguno'}
- Triggers: ${memory.factualInfo.health?.triggers?.join(', ') || 'Ninguno'}
- Estilo de vida: Estrés: ${memory.factualInfo.lifestyle?.stress || 'N/A'}, Sueño: ${memory.factualInfo.lifestyle?.sleep || 'N/A'}

NUEVA INFORMACIÓN (Turno ${turnNumber}):
"${userMessage}"

MOMENTOS CLAVE:
${memory.keyMoments.map(m => `- [${m.type}] ${m.content.substring(0, 100)}`).join('\n')}

Genera una hipótesis diagnóstica actualizada en formato JSON:
{
  "primary": "Hipótesis principal (ej: 'SIBO + IBS relacionado con estrés')",
  "confidence": 0-100,
  "evidence": ["Evidencia 1", "Evidencia 2", ...],
  "needsConfirmation": ["Qué falta confirmar 1", "Qué falta confirmar 2", ...],
  "alternativeHypotheses": [
    {"hypothesis": "Alternativa 1", "confidence": 0-100, "reason": "Por qué es posible"}
  ]
}

IMPORTANTE:
- La hipótesis debe ser sobre PROBLEMAS DIGESTIVOS (SIBO, IBS, intolerancias, disbiosis, etc.)
- La confianza debe aumentar solo si hay evidencia clara
- Sé específico en la evidencia
- Identifica claramente qué falta confirmar`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return currentHypothesis;
      }

      const updatedHypothesis = JSON.parse(content) as DiagnosisHypothesis;

      console.log(`📊 Hypothesis updated: ${updatedHypothesis.primary} (${updatedHypothesis.confidence}% confidence)`);

      return updatedHypothesis;
    } catch (error) {
      console.error('Error updating hypothesis:', error);
      return currentHypothesis;
    }
  }

  /**
   * Generate final diagnosis using all accumulated context
   */
  async generateFinalDiagnosis(
    userName: string,
    memory: ConversationalMemory,
    language: Language,
    allMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const firstName = userName.split(' ')[0] || userName;

    try {
      const prompt =
        language === 'es'
          ? this.buildSpanishDiagnosisPrompt(firstName, memory, allMessages)
          : this.buildEnglishDiagnosisPrompt(firstName, memory, allMessages);

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          {
            role: 'system',
            content: `Eres Clara, experta en salud digestiva del Método Objetivo Vientre Plano. Generas diagnósticos personalizados y empáticos.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating final diagnosis:', error);
      return language === 'es'
        ? 'Lo siento, hubo un error al generar tu diagnóstico. Por favor, intenta nuevamente.'
        : 'Sorry, there was an error generating your diagnosis. Please try again.';
    }
  }

  /**
   * Build Spanish diagnosis prompt
   */
  private buildSpanishDiagnosisPrompt(
    firstName: string,
    memory: ConversationalMemory,
    allMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    const keyMomentsText = memory.keyMoments.length > 0
      ? `\n\nMOMENTOS CLAVE DE LA CONVERSACIÓN:
${memory.keyMoments.map(m => `- [Turno ${m.turn}, ${m.type}] ${m.significance}`).join('\n')}`
      : '';

    const emotionalContext = memory.emotionalMarkers.length > 0
      ? `\n\nCONTEXTO EMOCIONAL:
${memory.emotionalMarkers.map(m => `- [Turno ${m.turn}] ${m.emotion} (intensidad ${m.intensity}/10)${m.quote ? `: "${m.quote}"` : ''}`).join('\n')}`
      : '';

    return `Genera un diagnóstico PERSONALIZADO para ${firstName} basado en nuestra conversación completa.

HIPÓTESIS DIAGNÓSTICA CONSTRUIDA PROGRESIVAMENTE:
- Hipótesis principal: ${memory.currentHypothesis.primary || 'Múltiples factores digestivos'}
- Nivel de confianza: ${memory.currentHypothesis.confidence || 0}%
- Evidencia encontrada: ${memory.currentHypothesis.evidence?.join(', ') || 'Ver información recopilada'}

INFORMACIÓN RECOPILADA:
Demografía:
- Edad: ${memory.factualInfo.demographics?.age || 'No especificada'}
- Ocupación: ${memory.factualInfo.demographics?.occupation || 'No especificada'} (tipo: ${memory.factualInfo.demographics?.occupationType || 'general'})

Salud:
- Problema principal: ${memory.factualInfo.health?.mainProblem || 'No especificado'}
- Duración: ${memory.factualInfo.health?.duration || 'No especificada'}
- Síntomas: ${memory.factualInfo.health?.symptoms?.join(', ') || 'No especificados'}
- Triggers identificados: ${memory.factualInfo.health?.triggers?.join(', ') || 'Ninguno'}
- Condiciones médicas: ${memory.factualInfo.health?.medicalConditions?.join(', ') || 'Ninguna'}

Estilo de vida:
- Alimentación: ${memory.factualInfo.lifestyle?.diet || 'No especificada'}
- Ejercicio: ${memory.factualInfo.lifestyle?.exercise || 'No especificado'}
- Sueño: ${memory.factualInfo.lifestyle?.sleep || 'No especificado'}
- Estrés: ${memory.factualInfo.lifestyle?.stress || 'No especificado'}
- Hidratación: ${memory.factualInfo.lifestyle?.waterIntake || 'No especificada'}

Objetivos:
- Meta principal: ${memory.factualInfo.goals?.primary || 'No especificada'}
- Nivel de motivación: ${memory.factualInfo.goals?.motivation || 'N/A'}/10
${keyMomentsText}${emotionalContext}

ESTILO COMUNICATIVO DE ${firstName}:
- Formalidad: ${memory.userStyle.formality}/10 (${memory.userStyle.formality > 6 ? 'formal' : 'casual'})
- Detalle en respuestas: ${memory.userStyle.verbosity}/10
- Nivel emocional: ${memory.userStyle.emotionLevel}/10

CONVERSACIÓN COMPLETA (${allMessages.length} mensajes):
${allMessages.slice(0, 10).map((msg, i) => `${i % 2 === 0 ? 'Clara' : firstName}: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}`).join('\n\n')}
${allMessages.length > 10 ? `\n...[${allMessages.length - 10} mensajes adicionales]` : ''}

INSTRUCCIONES PARA EL DIAGNÓSTICO:

1. **Saludo personalizado**: Usa el nombre y referencia algo específico que ${firstName} compartió durante la conversación

2. **3-4 puntos clave** (TODOS sobre salud digestiva):
   - Cada punto: emoji + título en negrita + explicación
   - Conecta CON EVIDENCIA ESPECÍFICA de la conversación (no genérico)
   - Si hubo momentos clave emocionales, incorpóralos con sensibilidad
   - Ejemplos de títulos: "🦠 Sobrecrecimiento Bacteriano (SIBO)", "🌾 Sensibilidad al Gluten", "🧠 Eje Intestino-Cerebro", "⏰ Disrupción del Ritmo Digestivo"

3. **Conexión integradora**: Une todos los puntos mostrando cómo están relacionados

4. **Por qué necesita el Método**: Explica por qué su caso específico necesita un enfoque integral (basado en SU situación, no genérico)

5. **Cierre motivador**: 
   - Si ${firstName} mostró vulnerabilidad o frustración, valida eso
   - Da esperanza específica basada en SU evidencia (ej: "notaste que mejoras en vacaciones - eso es una buena señal")
   - Conecta con su motivación/objetivo

REQUISITOS CRÍTICOS:
- NO uses plantillas genéricas - cada frase debe conectar con LO QUE ${firstName} DIJO
- Si hay un momento clave, DEBES mencionarlo (ej: "Durante nuestra conversación dijiste algo importante: '...'")
- Adapta el tono al estilo de ${firstName} (formal ${memory.userStyle.formality}/10, emocional ${memory.userStyle.emotionLevel}/10)
- 350-500 palabras
- Lenguaje empático pero experto
- NO dar planes de acción detallados
- NO mencionar medicamentos específicos
- ENFOQUE 100% EN SALUD DIGESTIVA

Genera el diagnóstico ahora:`;
  }

  /**
   * Build English diagnosis prompt (similar structure)
   */
  private buildEnglishDiagnosisPrompt(
    firstName: string,
    memory: ConversationalMemory,
    allMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    const keyMomentsText = memory.keyMoments.length > 0
      ? `\n\nKEY MOMENTS FROM CONVERSATION:
${memory.keyMoments.map(m => `- [Turn ${m.turn}, ${m.type}] ${m.significance}`).join('\n')}`
      : '';

    return `Generate a PERSONALIZED diagnosis for ${firstName} based on our complete conversation.

PROGRESSIVE DIAGNOSIS HYPOTHESIS:
- Primary hypothesis: ${memory.currentHypothesis.primary || 'Multiple digestive factors'}
- Confidence level: ${memory.currentHypothesis.confidence || 0}%
- Evidence found: ${memory.currentHypothesis.evidence?.join(', ') || 'See collected information'}

COLLECTED INFORMATION:
Demographics:
- Age: ${memory.factualInfo.demographics?.age || 'Not specified'}
- Occupation: ${memory.factualInfo.demographics?.occupation || 'Not specified'}

Health:
- Main problem: ${memory.factualInfo.health?.mainProblem || 'Not specified'}
- Duration: ${memory.factualInfo.health?.duration || 'Not specified'}
- Symptoms: ${memory.factualInfo.health?.symptoms?.join(', ') || 'None specified'}
- Triggers: ${memory.factualInfo.health?.triggers?.join(', ') || 'None'}

Lifestyle:
- Diet: ${memory.factualInfo.lifestyle?.diet || 'Not specified'}
- Exercise: ${memory.factualInfo.lifestyle?.exercise || 'Not specified'}
- Sleep: ${memory.factualInfo.lifestyle?.sleep || 'Not specified'}
- Stress: ${memory.factualInfo.lifestyle?.stress || 'Not specified'}
${keyMomentsText}

Generate personalized diagnosis following the same structure as Spanish version.
350-500 words, empathetic but expert tone, focused on DIGESTIVE HEALTH.`;
  }
}
