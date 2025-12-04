/**
 * Configuración del Flujo de Diagnóstico Estructurado
 *
 * Este archivo contiene toda la configuración del flujo de diagnóstico gratuito:
 * - Mensaje de bienvenida
 * - 3 bloques de preguntas (Digestivo, Energía, Emocional)
 * - Cuñas informativas después de cada bloque
 * - CTA final
 */

export interface FlowOption {
  value: string;
  label: string;
}

export interface FlowQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'open_ended';
  options?: FlowOption[];
}

export interface FlowBlock {
  id: string;
  name: string;
  emoji: string;
  color: string;
  colorLight: string;
  questions: FlowQuestion[];
  infoWedge: string;
}

export interface DiagnosticFlowConfig {
  welcome: {
    message: string;
    buttonText: string;
  };
  blocks: FlowBlock[];
  transitions: {
    toEnergy: string;
    toEmotional: string;
    toDiagnosis: string;
  };
  closingCTA: {
    message: string;
    buttonText: string;
  };
}

export const DIAGNOSTIC_FLOW: DiagnosticFlowConfig = {
  welcome: {
    message: `Hola {userName}, bienvenido a Objetivo Vientre Plano.

Soy Clara, tu asistente personal en este camino hacia una salud más ligera, más equilibrada y más tuya.

Antes de avanzar, voy a hacerte unas preguntas muy sencillas para prepararte un diagnóstico personalizado basado en tres pilares: tu digestión, tu energía y tu equilibrio emocional.

Cuando tú me digas, empezamos.`,
    buttonText: "Empezamos"
  },

  blocks: [
    // ═══════════════════════════════════════════════════════════════
    // BLOQUE DIGESTIVO 🔵
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'digestive',
      name: 'Digestivo',
      emoji: '🔵',
      color: '#3B82F6',      // blue-500
      colorLight: '#DBEAFE', // blue-100
      questions: [
        {
          id: 'dig_1',
          text: '¿En qué momento del día sientes tu barriga más inflamada o molesta?',
          type: 'multiple_choice',
          options: [
            { value: 'morning', label: 'Por la mañana (al despertar)' },
            { value: 'after_lunch', label: 'Después de comer (post comida)' },
            { value: 'afternoon', label: 'Por la tarde (a mitad del día)' },
            { value: 'night', label: 'Por la noche (antes de dormir)' }
          ]
        },
        {
          id: 'dig_2',
          text: '¿Sueles tener gases, pesadez o digestiones lentas después de comer?',
          type: 'multiple_choice',
          options: [
            { value: 'always', label: 'Sí, casi siempre (me ocurre con frecuencia)' },
            { value: 'sometimes', label: 'A veces (depende del día)' },
            { value: 'rarely', label: 'No mucho (solo en ocasiones puntuales)' }
          ]
        },
        {
          id: 'dig_3',
          text: '¿Notas que te hinchas incluso con comidas ligeras?\n\nSiente la libertad de explicarlo con tus palabras, como te resulte más cómodo.',
          type: 'open_ended'
        },
        {
          id: 'dig_4',
          text: '¿Cuando te inflamas, esa sensación tarda mucho en bajar?',
          type: 'multiple_choice',
          options: [
            { value: 'long', label: 'Sí, tarda bastante (puede durar horas)' },
            { value: 'depends', label: 'Depende del día (no siempre es igual)' },
            { value: 'quick', label: 'No, baja rápido (suele mejorar pronto)' }
          ]
        }
      ],
      infoWedge: `No es normal vivir con la barriga inflamada.

La inflamación siempre tiene una raíz, y cuando se identifica y se corrige de la manera adecuada, el cuerpo responde mucho más rápido de lo que la mayoría imagina.

Eso es lo que trabajamos en el Método Objetivo Vientre Plano: ir al origen para que el cambio sea real y duradero.`
    },

    // ═══════════════════════════════════════════════════════════════
    // BLOQUE ENERGÍA 🟣
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'energy',
      name: 'Energía',
      emoji: '🟣',
      color: '#8B5CF6',      // purple-500
      colorLight: '#EDE9FE', // purple-100
      questions: [
        {
          id: 'ene_1',
          text: '¿Cómo sientes tu energía después de comer?',
          type: 'multiple_choice',
          options: [
            { value: 'low', label: 'Me baja bastante (me entra cansancio o sueño)' },
            { value: 'same', label: 'Me quedo igual (no noto cambios)' },
            { value: 'better', label: 'Me siento mejor (me activa o me estabiliza)' }
          ]
        },
        {
          id: 'ene_2',
          text: '¿Dependes de café, azúcar o snacks para rendir durante el día?',
          type: 'multiple_choice',
          options: [
            { value: 'yes', label: 'Sí (lo necesito a diario)' },
            { value: 'sometimes', label: 'A veces (cuando estoy más cansado)' },
            { value: 'no', label: 'No (no suelo depender de eso)' }
          ]
        },
        {
          id: 'ene_3',
          text: '¿En qué momento del día te sientes más activo y en cuál más cansado?\n\nPuedes contármelo como tú te sientas más cómodo, sin necesidad de resumirlo demasiado.',
          type: 'open_ended'
        },
        {
          id: 'ene_4',
          text: '¿Cómo te afecta la falta de energía en tu día a día?\n\nSi quieres, descríbelo con tus palabras para entenderlo mejor.',
          type: 'open_ended'
        }
      ],
      infoWedge: `No es normal vivir con la energía por los suelos.

La falta de vitalidad siempre tiene una raíz, y cuando se identifica y se corrige desde dentro, el cuerpo recupera su fuerza mucho antes de lo que imaginas.

Eso es lo que trabajamos en el Método Objetivo Vientre Plano: restaurar tu energía desde el origen para que vuelvas a sentirte tú.`
    },

    // ═══════════════════════════════════════════════════════════════
    // BLOQUE EMOCIONAL 🟡
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'emotional',
      name: 'Emocional',
      emoji: '🟡',
      color: '#EAB308',      // yellow-500
      colorLight: '#FEF9C3', // yellow-100
      questions: [
        {
          id: 'emo_1',
          text: '¿Sientes que el estrés está más presente en tu vida últimamente?',
          type: 'multiple_choice',
          options: [
            { value: 'high', label: 'Sí, bastante (está muy presente)' },
            { value: 'moderate', label: 'Algo (pero lo manejo)' },
            { value: 'low', label: 'No demasiado (no me afecta mucho)' }
          ]
        },
        {
          id: 'emo_2',
          text: '¿Notas que tienes menos motivación o te cuesta mantener la constancia?\n\nComparte lo que sientas, sin prisa y con tus palabras.',
          type: 'open_ended'
        },
        {
          id: 'emo_3',
          text: '¿Sientes que las preocupaciones o la ansiedad te afectan por dentro?\n\nPuedes expresarlo libremente, de la forma que te sea más natural.',
          type: 'open_ended'
        },
        {
          id: 'emo_4',
          text: '¿En qué aspecto emocional sientes que te gustaría mejorar más ahora mismo?\n\nCuéntamelo con tus palabras, desde lo que tú sientes.',
          type: 'open_ended'
        }
      ],
      infoWedge: `La parte emocional tampoco es algo aislado.

El estrés, la preocupación o la ansiedad siempre tienen una raíz, y cuando se trabajan de forma adecuada, tu cuerpo responde mucho más rápido de lo que imaginas.

Eso es lo que hacemos en el Método Objetivo Vientre Plano: equilibrar cuerpo y mente desde el origen para que el cambio sea real y duradero.`
    }
  ],

  // Transiciones entre bloques
  transitions: {
    toEnergy: 'Perfecto. Ahora vamos a hablar de tu energía.',
    toEmotional: 'Muy bien. Por último, hablemos de cómo te sientes emocionalmente.',
    toDiagnosis: '¡Perfecto! Ya tengo toda la información que necesito. Dame un momento para preparar tu diagnóstico personalizado...'
  },

  closingCTA: {
    message: `{userName}, tú y yo ya hemos completado tu diagnóstico.

Ya sabemos qué te pasa.
Ya sabemos dónde está el origen.
Y también sabemos el camino para solucionarlo.

Ahora solo falta lo más importante: pasar a la acción.

Con el Plan Pro tendrás acceso a tu propio chat privado 24/7.
Un acompañamiento real, continuo y diseñado para ayudarte cada día a desinflamar tu abdomen, recuperar tu energía y sentirte bien contigo mismo.

Un sistema que se adapta por completo a ti: a tus horarios, a tus gustos, a tu alimentación y a tu estilo real de vida.

Y te puedo asegurar que, si decides acceder al Método Objetivo Vientre Plano, te va a cambiar la vida.

No estás aquí por casualidad.
Estás aquí porque buscas un cambio real.
Y ese cambio empieza ahora mismo.`,
    buttonText: "Quiero Empezar Mi Nueva Etapa"
  }
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene el bloque actual basado en el índice
 */
export const getBlock = (blockIndex: number): FlowBlock | undefined => {
  return DIAGNOSTIC_FLOW.blocks[blockIndex];
};

/**
 * Obtiene la pregunta actual basado en los índices
 */
export const getQuestion = (blockIndex: number, questionIndex: number): FlowQuestion | undefined => {
  const block = getBlock(blockIndex);
  return block?.questions[questionIndex];
};

/**
 * Calcula el progreso total del flujo (0-100)
 */
export const calculateTotalProgress = (blockIndex: number, questionIndex: number): number => {
  const totalQuestions = DIAGNOSTIC_FLOW.blocks.reduce((acc, block) => acc + block.questions.length, 0);
  const completedQuestions = DIAGNOSTIC_FLOW.blocks
    .slice(0, blockIndex)
    .reduce((acc, block) => acc + block.questions.length, 0) + questionIndex;

  return Math.round((completedQuestions / totalQuestions) * 100);
};

/**
 * Verifica si es la última pregunta del bloque actual
 */
export const isLastQuestionOfBlock = (blockIndex: number, questionIndex: number): boolean => {
  const block = getBlock(blockIndex);
  if (!block) return false;
  return questionIndex >= block.questions.length - 1;
};

/**
 * Verifica si es el último bloque
 */
export const isLastBlock = (blockIndex: number): boolean => {
  return blockIndex >= DIAGNOSTIC_FLOW.blocks.length - 1;
};

/**
 * Obtiene el mensaje de transición al siguiente bloque
 */
export const getTransitionMessage = (nextBlockId: string): string => {
  switch (nextBlockId) {
    case 'energy':
      return DIAGNOSTIC_FLOW.transitions.toEnergy;
    case 'emotional':
      return DIAGNOSTIC_FLOW.transitions.toEmotional;
    default:
      return DIAGNOSTIC_FLOW.transitions.toDiagnosis;
  }
};
