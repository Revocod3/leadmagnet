/**
 * PRO Onboarding Config - Frontend
 * 
 * Configuración para detectar el bloque actual del onboarding
 * y mostrar ProgressChip + InfoWedge en el chat.
 */

// ============================================================================
// BLOQUES DEL ONBOARDING
// ============================================================================

export interface OnboardingBlockConfig {
  id: string;
  name: string;           // Nombre corto para ProgressChip (una palabra)
  questionsCount: number; // Número de preguntas en este bloque
  color: string;          // Color para el ProgressChip
  colorDark: string;      // Color para modo oscuro
  bgColor: string;        // Background color para el chip
  bgColorDark: string;    // Background color para modo oscuro
  infoWedge: string;      // Texto informativo mostrado DESPUÉS de completar el bloque anterior
}

export const ONBOARDING_BLOCKS: OnboardingBlockConfig[] = [
  {
    id: 'digestivo',
    name: 'Digestivo',
    questionsCount: 5,
    color: '#059669',        // emerald-600
    colorDark: '#34D399',    // emerald-400
    bgColor: '#D1FAE5',      // emerald-100
    bgColorDark: 'rgba(52, 211, 153, 0.15)',
    infoWedge: `Antes de empezar, quiero explicarte algo importante.
La digestión nunca falla: siempre deja señales.

Los horarios, la intensidad de tus síntomas, cómo reaccionas a ciertos alimentos y cuánto duran las molestias…
todo esto forma un mapa muy claro sobre qué está ocurriendo en tu sistema digestivo.

Por eso este primer bloque es tan importante.
Aquí vamos a identificar patrones que muchas veces pasan desapercibidos, pero que explican por qué tu barriga reacciona como reacciona.

No tengas prisa: responde con calma y recuerda que puedes escribir tus respuestas con tus propias palabras siempre que quieras.`,
  },
  {
    id: 'emocional',
    name: 'Emocional',
    questionsCount: 5,
    color: '#7C3AED',        // violet-600
    colorDark: '#A78BFA',    // violet-400
    bgColor: '#EDE9FE',      // violet-100
    bgColorDark: 'rgba(167, 139, 250, 0.15)',
    infoWedge: `Ahora vamos a profundizar en la parte emocional.
La barriga y las emociones están totalmente conectadas:
el estrés, la presión mental y la ansiedad pueden inflamar tanto como un alimento.

Muchas personas viven meses o años con molestias digestivas sin darse cuenta de que su estado emocional es uno de los factores más importantes.

No buscamos juzgarte ni analizar tu vida.
Solo necesito entender cómo te sientes por dentro para ajustar tu acompañamiento de una forma realista y humana.

Recuerda que puedes responder con calma, y si lo prefieres, puedes escribir tus respuestas con tus propias palabras.`,
  },
  {
    id: 'fisico',
    name: 'Físico',
    questionsCount: 5,
    color: '#DC2626',        // red-600
    colorDark: '#F87171',    // red-400
    bgColor: '#FEE2E2',      // red-100
    bgColorDark: 'rgba(248, 113, 113, 0.15)',
    infoWedge: `El estado físico influye directamente en cómo digieres.
Cuando duermes poco, cuando estás cansado/a o cuando el cuerpo acumula tensión, la digestión se vuelve más lenta y más sensible.

Por eso ahora vamos a ver cómo está respondiendo tu cuerpo en general: energía, descanso y ritmo diario.
Esta parte nos ayuda a ajustar tus recomendaciones para que no te sientas forzado/a ni agotado/a.`,
  },
  {
    id: 'alimentacion',
    name: 'Alimentación',
    questionsCount: 5,
    color: '#EA580C',        // orange-600
    colorDark: '#FB923C',    // orange-400
    bgColor: '#FFEDD5',      // orange-100
    bgColorDark: 'rgba(251, 146, 60, 0.15)',
    infoWedge: `La forma en la que comes influye tanto como lo que comes.
No se trata solo de alimentos "buenos o malos", sino de horarios, cantidades, velocidad al comer, tipo de dieta y cómo te sientes antes y después de cada comida.

Este bloque nos ayuda a identificar qué patrones alimentarios pueden estar favoreciendo o empeorando tus digestiones.
No busco que cambies tu forma de comer ahora mismo, solo quiero entender cómo es tu alimentación en la vida real.`,
  },
  {
    id: 'social',
    name: 'Social',
    questionsCount: 5,
    color: '#2563EB',        // blue-600
    colorDark: '#60A5FA',    // blue-400
    bgColor: '#DBEAFE',      // blue-100
    bgColorDark: 'rgba(96, 165, 250, 0.15)',
    infoWedge: `La vida social influye muchísimo en la digestión y en los hábitos.
Cenas fuera, eventos, fines de semana y el ambiente familiar pueden cambiar por completo cómo comes y cómo te sientes.

No se trata de evitar tu vida social, sino de entenderla para que tu acompañamiento sea realista, flexible y adaptado a tu día a día.

No tienes que justificar nada. Solo comparte lo que encaje con tu vida real.`,
  },
  {
    id: 'laboral',
    name: 'Laboral',
    questionsCount: 5,
    color: '#4F46E5',        // indigo-600
    colorDark: '#818CF8',    // indigo-400
    bgColor: '#E0E7FF',      // indigo-100
    bgColorDark: 'rgba(129, 140, 248, 0.15)',
    infoWedge: `Tu trabajo y tu ritmo de vida influyen directamente en tu digestión y en tu forma de comer.
No es lo mismo tener jornadas largas, turnos cambiantes, mucho estrés o poco tiempo para cocinar, que tener un horario más estable.

Aquí no buscamos cambiar tu forma de trabajar, sino adaptar tu plan a tu vida real, para que no te resulte imposible mantenerlo.`,
  },
  {
    id: 'bienestar',
    name: 'Bienestar',
    questionsCount: 5,
    color: '#0D9488',        // teal-600
    colorDark: '#2DD4BF',    // teal-400
    bgColor: '#CCFBF1',      // teal-100
    bgColorDark: 'rgba(45, 212, 191, 0.15)',
    infoWedge: `El cuerpo no solo digiere comida: también digiere emociones, pensamientos y experiencias.
Cuando no tenemos espacios de calma, el sistema nervioso se mantiene en alerta y la digestión se vuelve más sensible.

Este bloque nos ayuda a entender tu nivel de bienestar interno, tu capacidad de desconectar y cómo se relaciona todo esto con tu digestión.`,
  },
  {
    id: 'objetivos',
    name: 'Objetivos',
    questionsCount: 5,
    color: '#CA8A04',        // yellow-600
    colorDark: '#FACC15',    // yellow-400
    bgColor: '#FEF9C3',      // yellow-100
    bgColorDark: 'rgba(250, 204, 21, 0.15)',
    infoWedge: `Para acompañarte de verdad necesito saber cuál es tu objetivo.
No todos buscamos lo mismo: algunas personas quieren reducir hinchazón, otras mejorar energía, otras regular su tránsito, otras recuperar confianza en su cuerpo.

Entender qué es lo que tú quieres lograr me permite adaptar tu acompañamiento y marcar el ritmo adecuado para ti.`,
  },
  {
    id: 'habitos',
    name: 'Hábitos',
    questionsCount: 5,
    color: '#0284C7',        // sky-600
    colorDark: '#38BDF8',    // sky-400
    bgColor: '#E0F2FE',      // sky-100
    bgColorDark: 'rgba(56, 189, 248, 0.15)',
    infoWedge: `Tus resultados no dependen solo de lo que comas, sino de los hábitos que puedas mantener en tu día a día.
Cada persona tiene un nivel distinto de constancia, y eso es totalmente normal.

Este bloque me ayuda a adaptar tu acompañamiento a tu ritmo real, para evitar frustraciones y crear un progreso estable y sostenible.`,
  },
  {
    id: 'identidad',
    name: 'Identidad',
    questionsCount: 5,
    color: '#DB2777',        // pink-600
    colorDark: '#F472B6',    // pink-400
    bgColor: '#FCE7F3',      // pink-100
    bgColorDark: 'rgba(244, 114, 182, 0.15)',
    infoWedge: `Para acompañarte bien necesito situarme en tu contexto: tu momento vital, cómo te ves a ti mismo/a y cómo es tu estilo de vida general.
No se trata de datos técnicos, sino de comprender en qué punto estás para adaptar el tono, el ritmo y la dirección del acompañamiento.`,
  },
  {
    id: 'historial',
    name: 'Historial',
    questionsCount: 5,
    color: '#64748B',        // slate-500
    colorDark: '#94A3B8',    // slate-400
    bgColor: '#F1F5F9',      // slate-100
    bgColorDark: 'rgba(148, 163, 184, 0.15)',
    infoWedge: `Algunos medicamentos y diagnósticos previos pueden influir muchísimo en la digestión:
antiácidos, ansiolíticos, antibióticos recientes, tratamientos hormonales, intolerancias, operaciones…

No buscamos hacer un diagnóstico médico, sino adaptar tu acompañamiento para que encaje con tu realidad física y con tu historial.

Comparte solo lo que te apetezca, pero recuerda que esta parte ayuda a que todo sea mucho más preciso.`,
  },
];

// Total de preguntas
export const TOTAL_ONBOARDING_QUESTIONS = ONBOARDING_BLOCKS.reduce(
  (total, block) => total + block.questionsCount,
  0
);

// ============================================================================
// PATRONES DE DETECCIÓN
// ============================================================================

// Patrones para detectar las preguntas de cada bloque
export const QUESTION_PATTERNS: Record<string, RegExp[]> = {
  digestivo: [
    /síntoma digestivo.*afectando/i,
    /momento del día.*molestias digestivas/i,
    /alimentos sospechas.*peor digestión/i,
    /digestiones en general.*última semana/i,
    /episodio fuerte.*molestias.*cuánto.*dura/i,
  ],
  emocional: [
    /nivel de estrés.*últimas dos semanas/i,
    /emociones afectan.*barriga.*digestiones/i,
    /sientes contigo mismo.*digestión no va bien/i,
    /niveles de ansiedad últimamente/i,
    /tensión en el cuerpo.*algo te preocupa/i,
  ],
  fisico: [
    /nivel de energía.*largo del día/i,
    /descanso nocturno últimamente/i,
    /tensión física.*cuello.*espalda.*pecho.*abdomen/i,
    /nivel de movimiento.*día normal/i,
    /cuerpo retiene líquidos.*inflama/i,
  ],
  alimentacion: [
    /estilo de alimentación habitual/i,
    /horarios de comida.*largo del día/i,
    /comer rápido.*despacio.*depende/i,
    /frecuencia.*alimentos procesados.*fritos/i,
    /repetir.*mismos alimentos.*semana/i,
  ],
  social: [
    /frecuencia.*comer fuera de casa/i,
    /fines de semana.*comida.*horarios/i,
    /entorno.*pareja.*familia.*amigos.*influye/i,
    /presionado.*socialmente.*comer.*beber/i,
    /diferente.*incómodo.*hábitos.*otras personas/i,
  ],
  laboral: [
    /tipo de trabajo.*actividad diaria principal/i,
    /niveles de estrés.*jornada laboral/i,
    /tiempo para comer con calma.*día laboral/i,
    /horarios.*estables.*comer.*semana/i,
    /físicamente.*final.*jornada laboral/i,
  ],
  bienestar: [
    /nivel de calma.*equilibrio interior/i,
    /actividad.*ayude a relajarte.*respiración/i,
    /fácil desconectar mentalmente.*final del día/i,
    /conectado.*contigo mismo.*emociones.*cuerpo/i,
    /necesitas más momentos de paz.*descanso mental/i,
  ],
  objetivos: [
    /objetivo principal.*estar aquí conmigo/i,
    /urgente sientes.*conseguir este objetivo/i,
    /más te frustra.*situación actual/i,
    /haría sentir.*realmente.*avanzando/i,
    /compromiso.*dispuesto.*este proceso/i,
  ],
  habitos: [
    /nivel de constancia.*cambiar.*hábito/i,
    /rutina diaria establecida.*mañana.*tarde.*noche/i,
    /hábitos saludables.*intentado.*pasado/i,
    /más te cuesta mantener.*mejorar tu bienestar/i,
    /tiempo real al día.*dedicar.*mejorar tu bienestar/i,
  ],
  identidad: [
    /etapa de tu vida.*encuentras ahora mismo/i,
    /estilo de vida actual en general/i,
    /ves a ti mismo.*salud y bienestar/i,
    /relación contigo mismo.*este momento/i,
    /vida personal.*influyendo.*bienestar/i,
  ],
  historial: [
    /diagnóstico digestivo previo/i,
    /tomas algún medicamento.*frecuente/i,
    /antibióticos.*últimos meses/i,
    /operación.*intervención.*influir.*digestión/i,
    /alergia.*intolerancia.*sensibilidad alimentaria/i,
  ],
};

// ============================================================================
// QUICK REPLIES (sugerencias para cada pregunta)
// ============================================================================

export interface QuickReplyOption {
  text: string;
  shortText?: string; // Versión corta para chips
}

// Mapeo de ID de pregunta a opciones de respuesta rápida
export const QUICK_REPLIES: Record<string, QuickReplyOption[]> = {
  // DIGESTIVO
  dig_1: [
    { text: 'Hinchazón constante en la zona abdominal', shortText: 'Hinchazón' },
    { text: 'Muchos gases y digestiones demasiado lentas', shortText: 'Gases' },
    { text: 'Dolor o presión justo después de las comidas', shortText: 'Dolor' },
    { text: 'Alterno estreñimiento y diarrea varias veces', shortText: 'Alterno' },
  ],
  dig_2: [
    { text: 'Por la mañana después de tomar algo o desayunar', shortText: 'Mañana' },
    { text: 'A mitad del día o justo al terminar la comida principal', shortText: 'Mediodía' },
    { text: 'Por la tarde cuando llevo varias horas activo/a', shortText: 'Tarde' },
    { text: 'Por la noche o al acostarme, cuando intento relajarme', shortText: 'Noche' },
  ],
  dig_3: [
    { text: 'Lácteos como queso, yogur, leche o derivados', shortText: 'Lácteos' },
    { text: 'Harinas, pan, pasta o alimentos con gluten', shortText: 'Gluten' },
    { text: 'Frutas o verduras que me generan gases fácilmente', shortText: 'Frutas/verduras' },
    { text: 'Legumbres, fritos o comidas muy grasas y pesadas', shortText: 'Grasas' },
  ],
  dig_4: [
    { text: 'Muy pesadas y lentas, tardo horas en sentir alivio', shortText: 'Muy pesadas' },
    { text: 'Irregulares: algunos días bien y otros muy mal', shortText: 'Irregulares' },
    { text: 'Normales pero con molestia después de ciertas comidas', shortText: 'Normales' },
    { text: 'Demasiado rápidas, casi sin llegar a digerir bien', shortText: 'Muy rápidas' },
  ],
  dig_5: [
    { text: 'Entre 30 minutos y una hora aproximadamente', shortText: '30min-1h' },
    { text: 'Varias horas, a veces hasta media tarde o noche', shortText: 'Varias horas' },
    { text: 'Me dura prácticamente todo el día completo', shortText: 'Todo el día' },
    { text: 'Depende del día: a veces poco y otras muchísimo', shortText: 'Variable' },
  ],
  // ... El resto de las QuickReplies se pueden añadir progresivamente
};

// ============================================================================
// FUNCIONES DE DETECCIÓN
// ============================================================================

/**
 * Detecta el bloque actual basado en el contenido del mensaje de Clara
 */
export function detectCurrentBlock(message: string): OnboardingBlockConfig | null {
  for (const block of ONBOARDING_BLOCKS) {
    const patterns = QUESTION_PATTERNS[block.id];
    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          return block;
        }
      }
    }
  }
  return null;
}

/**
 * Detecta el número de pregunta dentro del bloque actual
 */
export function detectQuestionInBlock(message: string, blockId: string): number {
  const patterns = QUESTION_PATTERNS[blockId];
  if (!patterns) return 1;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    if (pattern && pattern.test(message)) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Calcula el progreso global del onboarding
 * @returns { blockIndex, questionInBlock, totalProgress }
 */
export function calculateOnboardingProgress(
  blockId: string,
  questionInBlock: number
): {
  blockIndex: number;
  questionInBlock: number;
  totalQuestions: number;
  questionsCompleted: number;
  percentComplete: number;
} {
  const blockIndex = ONBOARDING_BLOCKS.findIndex(b => b.id === blockId);
  if (blockIndex === -1) {
    return {
      blockIndex: 0,
      questionInBlock: 1,
      totalQuestions: TOTAL_ONBOARDING_QUESTIONS,
      questionsCompleted: 0,
      percentComplete: 0,
    };
  }

  // Calcular preguntas completadas antes de este bloque
  let questionsCompleted = 0;
  for (let i = 0; i < blockIndex; i++) {
    const block = ONBOARDING_BLOCKS[i];
    if (block) {
      questionsCompleted += block.questionsCount;
    }
  }
  // Añadir preguntas completadas en el bloque actual (menos la actual)
  questionsCompleted += Math.max(0, questionInBlock - 1);

  return {
    blockIndex,
    questionInBlock,
    totalQuestions: TOTAL_ONBOARDING_QUESTIONS,
    questionsCompleted,
    percentComplete: Math.round((questionsCompleted / TOTAL_ONBOARDING_QUESTIONS) * 100),
  };
}

/**
 * Detecta si el mensaje es una cuña informativa (inicio de bloque)
 */
export function detectInfoWedge(message: string): OnboardingBlockConfig | null {
  for (const block of ONBOARDING_BLOCKS) {
    // Buscar frases características de cada cuña
    const wedgeSnippet = block.infoWedge.substring(0, 100);
    if (message.includes(wedgeSnippet.substring(0, 50))) {
      return block;
    }
  }
  return null;
}

/**
 * Verifica si el onboarding está completado basado en el mensaje
 */
export function isOnboardingComplete(message: string): boolean {
  return (
    message.includes('Ya tengo una visión completa de tu digestión') ||
    message.includes('tu acompañamiento empieza de verdad') ||
    message.includes('Yo te acompaño, tú marcas el ritmo')
  );
}
