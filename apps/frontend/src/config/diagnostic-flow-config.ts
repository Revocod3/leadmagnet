/**
 * Configuración del Flujo de Diagnóstico Estructurado
 *
 * Este archivo contiene toda la configuración del flujo de diagnóstico gratuito:
 * - Mensaje de bienvenida
 * - 4 bloques de preguntas (Personal, Digestivo, Energía, Emocional)
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
    toDigestive: string;
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

Soy Clara, tu asistente personal.

Voy a hacerte unas preguntas muy sencillas para prepararte un diagnóstico personalizado basado en tres pilares:

• 🌿 Tu digestión
• ⚡ Tu energía
• 💜 Tu equilibrio emocional

empezamos.`,
    buttonText: "Empezamos"
  },

  blocks: [
    // ═══════════════════════════════════════════════════════════════
    // BLOQUE PERSONAL 🔘
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'personal',
      name: 'Personal',
      emoji: '🔘',
      color: '#6B7280',      // gray-500
      colorLight: '#F3F4F6', // gray-100
      questions: [
        {
          id: 'pers_1',
          text: '¿Qué edad tienes?',
          type: 'multiple_choice',
          options: [
            { value: '18-30', label: 'Entre 18 y 30 años' },
            { value: '31-45', label: 'Entre 31 y 45 años' },
            { value: '45+', label: 'Más de 45 años' }
          ]
        },
        {
          id: 'pers_2',
          text: '¿Cuál dirías que es tu objetivo principal ahora mismo?',
          type: 'multiple_choice',
          options: [
            { value: 'deflate', label: 'Desinflamar mi abdomen' },
            { value: 'energy', label: 'Recuperar mi energía vital' },
            { value: 'emotional', label: 'Mejorar mi bienestar emocional' },
            { value: 'all', label: 'Quiero mejorar todo lo anterior' }
          ]
        },
        {
          id: 'pers_3',
          text: '¿En qué punto sientes que estás ahora mismo con tu bienestar?',
          type: 'multiple_choice',
          options: [
            { value: 'starting', label: 'Estoy empezando desde cero' },
            { value: 'stuck', label: 'He probado cosas pero no avanzo' },
            { value: 'very_stuck', label: 'Me siento bastante estancado/a' }
          ]
        }
      ],
      infoWedge: `**Antes de nada, quiero que sepas algo importante: cada persona llega aquí con una historia distinta, pero todas tienen algo en común—buscan recuperar su bienestar desde la raíz.**

Por eso, en Objetivo Vientre Plano personalizamos cada paso según tu contexto, tu estilo de vida y tu punto de partida.`
    },

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
            { value: 'morning', label: 'Por la mañana al despertar' },
            { value: 'after_lunch', label: 'Después de comer la comida' },
            { value: 'afternoon', label: 'Por la tarde a mitad del día' },
            { value: 'night', label: 'Por la noche antes de dormir' }
          ]
        },
        {
          id: 'dig_2',
          text: '¿Sueles tener gases, pesadez o digestiones lentas después de comer?',
          type: 'multiple_choice',
          options: [
            { value: 'always', label: 'Sí, me pasa casi siempre' },
            { value: 'sometimes', label: 'A veces, depende del día' },
            { value: 'rarely', label: 'No mucho, solo ocasionalmente' }
          ]
        },
        {
          id: 'dig_3',
          text: '¿Notas que te hinchas incluso con comidas ligeras?',
          type: 'multiple_choice',
          options: [
            { value: 'yes_always', label: 'Sí, incluso con comidas suaves' },
            { value: 'heavy_only', label: 'Solo con comidas más pesadas' },
            { value: 'depends', label: 'Depende bastante del día' }
          ]
        },
        {
          id: 'dig_4',
          text: 'Cuando te inflamas, ¿esa sensación tarda mucho en bajar?',
          type: 'multiple_choice',
          options: [
            { value: 'long', label: 'Sí, tarda bastante en bajar' },
            { value: 'depends', label: 'Depende mucho del día' },
            { value: 'quick', label: 'No, mejora relativamente rápido' }
          ]
        },
        {
          id: 'dig_5',
          text: '¿Cuántos días a la semana dirías que tienes molestias digestivas?',
          type: 'multiple_choice',
          options: [
            { value: '1-2', label: 'Uno o dos días por semana' },
            { value: '3-4', label: 'Tres o cuatro días por semana' },
            { value: '5-7', label: 'Entre cinco y siete días por semana' }
          ]
        },
        {
          id: 'dig_6',
          text: '¿Tu digestión afecta a tu comodidad diaria (ropa, postura, movimiento)?',
          type: 'multiple_choice',
          options: [
            { value: 'a_lot', label: 'Sí, afecta bastante a diario' },
            { value: 'sometimes', label: 'Algo, depende del día' },
            { value: 'not_much', label: 'No demasiado, lo llevo bien' }
          ]
        }
      ],
      infoWedge: `**No es normal vivir con la barriga inflamada.**

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
            { value: 'low', label: 'Me baja bastante la energía' },
            { value: 'same', label: 'Me quedo prácticamente igual' },
            { value: 'better', label: 'Me siento mejor y más activo/a' }
          ]
        },
        {
          id: 'ene_2',
          text: '¿Dependes de café, azúcar o snacks para rendir durante el día?',
          type: 'multiple_choice',
          options: [
            { value: 'yes', label: 'Sí, lo necesito casi a diario' },
            { value: 'sometimes', label: 'A veces, solo algunos días' },
            { value: 'no', label: 'No, no suelo depender de eso' }
          ]
        },
        {
          id: 'ene_3',
          text: '¿En qué momento del día te sientes más activo y en cuál más cansado?',
          type: 'multiple_choice',
          options: [
            { value: 'morning', label: 'Tengo más energía por la mañana' },
            { value: 'afternoon', label: 'Rindo mejor por la tarde' },
            { value: 'irregular', label: 'Mi energía es muy irregular' }
          ]
        },
        {
          id: 'ene_4',
          text: '¿Cómo te afecta la falta de energía en tu día a día?',
          type: 'multiple_choice',
          options: [
            { value: 'a_lot', label: 'Me limita bastante a diario' },
            { value: 'manageable', label: 'Lo noto pero puedo gestionarlo' },
            { value: 'not_much', label: 'No me afecta demasiado' }
          ]
        },
        {
          id: 'ene_5',
          text: '¿Cómo te levantas normalmente por las mañanas?',
          type: 'multiple_choice',
          options: [
            { value: 'tired', label: 'Me levanto bastante cansado/a' },
            { value: 'normal', label: 'Me levanto con energía normal' },
            { value: 'good', label: 'Me levanto con buena energía' }
          ]
        },
        {
          id: 'ene_6',
          text: '¿Tienes bajones fuertes de energía a alguna hora del día?',
          type: 'multiple_choice',
          options: [
            { value: 'after_lunch', label: 'Sí, sobre todo después de comer' },
            { value: 'afternoon', label: 'Sí, especialmente por la tarde' },
            { value: 'sometimes', label: 'A veces, depende del día' },
            { value: 'no', label: 'No, no tengo bajones fuertes' }
          ]
        }
      ],
      infoWedge: `**No es normal vivir con la energía por los suelos.**

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
            { value: 'high', label: 'Sí, está muy presente ahora mismo' },
            { value: 'moderate', label: 'Algo, pero lo voy gestionando' },
            { value: 'low', label: 'No demasiado, lo llevo bien' }
          ]
        },
        {
          id: 'emo_2',
          text: '¿Notas que tienes menos motivación o te cuesta mantener la constancia?',
          type: 'multiple_choice',
          options: [
            { value: 'yes', label: 'Sí, me falta bastante motivación' },
            { value: 'depends', label: 'Depende del día y de mi ánimo' },
            { value: 'no', label: 'No mucho, lo llevo bastante bien' }
          ]
        },
        {
          id: 'emo_3',
          text: '¿Sientes que las preocupaciones o la ansiedad te afectan por dentro?',
          type: 'multiple_choice',
          options: [
            { value: 'yes', label: 'Sí, me afectan bastante' },
            { value: 'sometimes', label: 'A veces, depende del día' },
            { value: 'no', label: 'No demasiado en mi caso' }
          ]
        },
        {
          id: 'emo_4',
          text: '¿En qué aspecto emocional sientes que te gustaría mejorar más ahora mismo?',
          type: 'multiple_choice',
          options: [
            { value: 'motivation', label: 'Mejorar mi motivación personal' },
            { value: 'stress', label: 'Reducir mi nivel de estrés diario' },
            { value: 'anxiety', label: 'Gestionar mejor mi ansiedad' },
            { value: 'self_esteem', label: 'Trabajar mi autoestima interna' }
          ]
        },
        {
          id: 'emo_5',
          text: '¿Cómo te afecta emocionalmente sentirte inflamado/a o con poca energía?',
          type: 'multiple_choice',
          options: [
            { value: 'a_lot', label: 'Me afecta bastante a nivel emocional' },
            { value: 'manageable', label: 'Algo, pero lo gestiono bien' },
            { value: 'not_much', label: 'No me afecta demasiado' }
          ]
        },
        {
          id: 'emo_6',
          text: 'En general, ¿cómo te sientes contigo mismo estos últimos meses?',
          type: 'multiple_choice',
          options: [
            { value: 'unmotivated', label: 'Me siento desmotivado/a últimamente' },
            { value: 'irregular', label: 'He estado un poco irregular' },
            { value: 'good', label: 'Me siento bastante bien conmigo' }
          ]
        }
      ],
      infoWedge: `**La parte emocional tampoco es algo aislado.**

El estrés, la preocupación o la ansiedad siempre tienen una raíz, y cuando se trabajan de forma adecuada, tu cuerpo responde mucho más rápido de lo que imaginas.

Eso es lo que hacemos en el Método Objetivo Vientre Plano: equilibrar cuerpo y mente desde el origen para que el cambio sea real y duradero.`
    }
  ],

  // Transiciones entre bloques
  transitions: {
    toDigestive: 'Perfecto. Ahora vamos a hablar de tu digestión.',
    toEnergy: 'Perfecto. Ahora vamos a hablar de tu energía.',
    toEmotional: 'Muy bien. Por último, hablemos de cómo te sientes emocionalmente.',
    toDiagnosis: '¡Perfecto! Ya tengo toda la información que necesito. Dame un momento para preparar tu diagnóstico personalizado...'
  },

  closingCTA: {
    message: `**Has completado tu diagnóstico** y ahora ya tenemos una visión clara de tu situación.

---

### El siguiente paso

Te da acceso directo a nuestro **Chat Inteligente totalmente personalizado**, la fusión de la ciencia más actualizada en:

- Digestión y bienestar abdominal
- Nutrición adaptada a tu cuerpo
- Descanso y recuperación
- Gestión emocional y estrés
- Hábitos reales del día a día
Todo está integrado en una sola herramienta que **se adapta a tu estilo de vida en tiempo real**.

---

### Por qué existe este chat

Durante años hemos visto cómo millones de personas sufrían el mismo problema: **hinchazón constante, digestiones lentas, cansancio, estrés acumulado** y la frustración de no encontrar una solución real.

Tras años de investigación, y entendiendo a fondo cómo afectan estas molestias al día a día de las personas, decidimos crear algo que hasta ahora no existía: **un chat inteligente capaz de acompañarte 24 horas al día, 7 días a la semana**.

---

### Una herramienta única

Puede que al principio te suene demasiado adelantado a su tiempo, o incluso que pienses que esto no es para ti… pero es justo lo contrario.

Esta es una herramienta **única y sencilla**, integrada en un chat que **te conoce, te acompaña y te guía** hacia tu mejor versión.

**No es una dieta ni un programa puntual.**
Está diseñada para convertirse en tu estilo de vida, ayudándote a mejorar desde dentro y a recuperar tu bienestar general.

Su finalidad es que disfrutes de la vida en tu máximo esplendor, con:

- Un cuerpo más ligero
- Una mente tranquila
- Una digestión que responde

---

**Esto no es solo tecnología.**
**Es innovación, es progreso.**

Es un cambio real, construido contigo y para ti.`,
    buttonText: "Comienza ahora"
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
 * Encuentra una pregunta por su id estable (ej: pers_1, dig_2, ene_4).
 * Útil cuando el backend incluye metadata tipo [PREGUNTA_ACTUAL: pers_1].
 */
export const findQuestionById = (questionId: string): {
  blockIndex: number;
  questionIndex: number;
  block: FlowBlock;
  question: FlowQuestion;
} | null => {
  if (!questionId) return null;

  for (let blockIndex = 0; blockIndex < DIAGNOSTIC_FLOW.blocks.length; blockIndex++) {
    const block = DIAGNOSTIC_FLOW.blocks[blockIndex];
    if (!block) continue;

    const questionIndex = block.questions.findIndex((q) => q.id === questionId);
    if (questionIndex !== -1) {
      const question = block.questions[questionIndex];
      if (question) {
        return { blockIndex, questionIndex, block, question };
      }
    }
  }

  return null;
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
    case 'digestive':
      return DIAGNOSTIC_FLOW.transitions.toDigestive;
    case 'energy':
      return DIAGNOSTIC_FLOW.transitions.toEnergy;
    case 'emotional':
      return DIAGNOSTIC_FLOW.transitions.toEmotional;
    default:
      return DIAGNOSTIC_FLOW.transitions.toDiagnosis;
  }
};
