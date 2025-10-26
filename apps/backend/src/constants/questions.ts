import type { Language } from '../types';

export interface DiagnosticQuestion {
  id: number;
  blockId: 1 | 2 | 3 | 4 | 5;
  blockName: string;
  question: string;
  questionDetails?: string;
  isConditional?: boolean;
  conditionCheck?: (info: CollectedInfo) => boolean;
  options?: string[];
}

export interface CollectedInfo {
  age?: number;
  occupation?: string;
  occupationType?: string;
  mainProblem?: string;
  duration?: string;
  diet?: string;
  badFoods?: string[];
  waterIntake?: string;
  exercise?: string;
  sleep?: string;
  stress?: string;
  medicalConditions?: string[];
  medications?: string[];
  goal?: string;
  motivation?: number;
  imageAnalysis?: string;
}

// Occupation patterns for detecting occupation types
export const OCCUPATION_PATTERNS: Record<string, RegExp> = {
  'oficina': /oficina|administrativo|escritorio|contable|contador|secretari/i,
  'salud': /enferm|médico|doctor|hospital|clínica/i,
  'creativo': /diseñ|program|desarroll|freelance|creativ|artista/i,
  'estudiante': /estudiant|universit|college/i,
  'casa': /ama de casa|casa|hogar/i,
  'profesor': /profesor|maestr|docent|enseñ/i,
  'servicio': /vended|camarer|meser|retail|atención/i,
  'físico': /construcción|obrer|mecánico|técnico/i,
  'cocina': /cocin|chef/i,
  'emprendedor': /emprendedor|empresari|negocio propio/i,
  'desempleado': /desemplead|busco trabajo|sin trabajo/i,
  'jubilado': /jubilad|pensionad|retirad/i,
};

// Occupation insights and tips
export const OCCUPATION_INSIGHTS = {
  oficina: {
    insights: [
      'Las largas horas sentado pueden ralentizar el tránsito intestinal.',
      'El estrés laboral de oficina suele manifestarse en el abdomen.',
      'Los horarios de oficina a veces dificultan comer bien.'
    ],
    tips: 'Levantarte cada hora puede marcar la diferencia.'
  },
  salud: {
    insights: [
      'Los turnos irregulares pueden descontrolar tu sistema digestivo.',
      'El estrés hospitalario puede hacer estragos en el cuerpo.',
      'Las guardias nocturnas afectan profundamente la digestión.'
    ],
    tips: 'Mantener horarios de comida regulares será clave para ti.'
  },
  creativo: {
    insights: [
      'El trabajo freelance puede generar horarios muy irregulares.',
      'La concentración intensa nos hace olvidar comer bien.',
      'Estar frente al ordenador tantas horas afecta la postura y digestión.'
    ],
    tips: 'Crear rutinas será fundamental para ti.'
  },
  estudiante: {
    insights: [
      'El estrés académico afecta directamente el estómago.',
      'Horarios irregulares + comida rápida = combinación difícil.',
      'Los exámenes y la ansiedad se reflejan en tu abdomen.'
    ],
    tips: 'Gestionar el estrés académico será esencial.'
  },
  casa: {
    insights: [
      'Cuidar de otros nos hace olvidar cuidarnos a nosotras mismas.',
      'El estrés silencioso del hogar también cuenta.',
      'Es fácil picotear mientras cocinas para la familia.'
    ],
    tips: 'Priorizarte a ti misma no es egoísmo, es necesario.'
  },
  profesor: {
    insights: [
      'La enseñanza es demandante física y emocionalmente.',
      'Los horarios escolares a veces impiden comer tranquilamente.',
      'El estrés de estar frente a un grupo se somatiza en el abdomen.'
    ],
    tips: 'Encontrar momentos para desconectar será clave.'
  },
  servicio: {
    insights: [
      'Estar de pie tantas horas puede causar tensión abdominal.',
      'El ritmo acelerado dificulta comer tranquilamente.',
      'Tratar con público puede generar estrés que afecta la digestión.'
    ],
    tips: 'Aprovechar los descansos para comer sentado/a es importante.'
  },
  físico: {
    insights: [
      'El trabajo físico intenso puede enmascarar problemas digestivos.',
      'Los horarios irregulares y comidas rápidas no ayudan.',
      'El esfuerzo físico constante necesita nutrición adecuada.'
    ],
    tips: 'Balancear el esfuerzo físico con buena alimentación es vital.'
  },
  cocina: {
    insights: [
      '¡Irónico trabajar con comida pero no tener tiempo de comer bien!',
      'La cocina profesional es estresante con horarios complicados.',
      'Estar rodeado de comida todo el día puede descontrolar tus hábitos.'
    ],
    tips: 'Cuidarte a ti mismo/a es tan importante como cuidar a tus comensales.'
  },
  emprendedor: {
    insights: [
      'El emprendimiento es emocionante pero estresante.',
      'Las preocupaciones constantes se reflejan en el cuerpo.',
      'Los horarios irregulares del emprendedor afectan todo.'
    ],
    tips: 'Tu salud es tu mejor inversión empresarial.'
  },
  desempleado: {
    insights: [
      'La incertidumbre laboral genera ansiedad que impacta la digestión.',
      'El estrés emocional también se refleja físicamente.',
      'Esta etapa es temporal, pero cuidarte ahora es importante.'
    ],
    tips: 'Mantener rutinas saludables te ayudará en este proceso.'
  },
  jubilado: {
    insights: [
      'La jubilación es un cambio grande que puede afectar rutinas.',
      'Más tiempo libre puede significar hábitos más saludables.',
      'O puede llevar al sedentarismo si no tenemos cuidado.'
    ],
    tips: 'Esta etapa es perfecta para enfocarte en tu bienestar.'
  },
  default: {
    insights: [
      'Tu trabajo seguramente tiene sus propios desafíos para mantener hábitos saludables.',
      'Cada profesión tiene su forma de afectar nuestro bienestar digestivo.',
      'El equilibrio entre vida laboral y personal siempre es un reto.'
    ],
    tips: 'Vamos a encontrar soluciones que se adapten a tu rutina.'
  }
};

// 13 preguntas de diagnóstico personalizado organizadas en 5 bloques
export const DIAGNOSTIC_QUESTIONS_ES: DiagnosticQuestion[] = [
  // BLOQUE 1: Conocerte Mejor
  {
    id: 1,
    blockId: 1,
    blockName: 'Conocerte Mejor',
    question: '¿Qué edad tienes y a qué te dedicas?',
    questionDetails: 'Cuéntame un poco sobre ti',
    isConditional: false,
    options: [],
  },
  // BLOQUE 2: El Problema Principal
  {
    id: 2,
    blockId: 2,
    blockName: 'El Problema Principal',
    question: '¿Qué es lo que más te molesta de tu abdomen o digestión ahora mismo?',
    questionDetails: 'Puede ser hinchazón, gases, pesadez, estreñimiento, digestiones lentas...\n\nNo te preocupes si no sabes el término exacto. Dímelo con tus propias palabras.',
    isConditional: false,
    options: [],
  },
  {
    id: 3,
    blockId: 2,
    blockName: 'El Problema Principal',
    question: '¿Cuánto tiempo llevas sintiendo esto?',
    questionDetails: 'Semanas, meses, años...',
    isConditional: false,
    options: [],
  },

  // BLOQUE 3: Estilo de Vida
  {
    id: 4,
    blockId: 3,
    blockName: 'Estilo de Vida',
    question: '¿Cómo describirías tu alimentación en general?',
    questionDetails: '¿Es equilibrada? ¿Comes muchos procesados? ¿Saltas comidas?',
    isConditional: false,
    options: [],
  },
  {
    id: 5,
    blockId: 3,
    blockName: 'Estilo de Vida',
    question: '¿Hay algún alimento que notes que te sienta mal?',
    questionDetails: 'Lácteos, gluten, legumbres, picantes, fritos...',
    isConditional: true,
    conditionCheck: (info) => !info.badFoods || info.badFoods.length === 0,
    options: [],
  },
  {
    id: 6,
    blockId: 3,
    blockName: 'Estilo de Vida',
    question: '¿Cuánta agua sueles beber al día?',
    questionDetails: 'Una estimación aproximada es suficiente',
    isConditional: false,
    options: [],
  },
  {
    id: 7,
    blockId: 3,
    blockName: 'Estilo de Vida',
    question: '¿Haces ejercicio regularmente?',
    questionDetails: 'Si no haces nada, también puedes decírmelo sin problema. Estoy aquí para ayudarte, no para juzgarte.',
    isConditional: true,
    conditionCheck: (info) => !info.exercise,
    options: [],
  },

  // BLOQUE 4: Salud & Bienestar
  {
    id: 8,
    blockId: 4,
    blockName: 'Salud & Bienestar',
    question: '¿Cómo duermes habitualmente?',
    questionDetails: '¿Bien? ¿Poco? ¿Te cuesta conciliar el sueño?',
    isConditional: true,
    conditionCheck: (info) => !info.sleep,
    options: [],
  },
  {
    id: 9,
    blockId: 4,
    blockName: 'Salud & Bienestar',
    question: '¿Sientes que el estrés o la ansiedad afectan tu cuerpo?',
    questionDetails: '¿Notas tensión, malestar digestivo o cambios cuando estás nervioso/a?',
    isConditional: false,
    options: [],
  },
  {
    id: 10,
    blockId: 4,
    blockName: 'Salud & Bienestar',
    question: '¿Tienes alguna condición médica o tomas medicamentos regularmente?',
    questionDetails: 'Hipotiroidismo, SII, intolerancias, suplementos...\n\nSi no tienes nada, simplemente dímelo.',
    isConditional: false,
    options: [],
  },

  // BLOQUE 5: Motivación
  {
    id: 11,
    blockId: 5,
    blockName: 'Motivación',
    question: '¿Qué te gustaría cambiar de tu salud o tu cuerpo en los próximos 3 meses?',
    questionDetails: 'Puede ser algo físico, emocional, de energía... lo que sea más importante para ti.',
    isConditional: false,
    options: [],
  },
  {
    id: 12,
    blockId: 5,
    blockName: 'Motivación',
    question: 'Del 1 al 10, ¿qué tan motivado/a estás para hacer cambios reales ahora?',
    questionDetails: 'Siendo 1 = "casi nada" y 10 = "totalmente comprometido/a".\n\nRecuerda: no hay respuestas malas.',
    isConditional: false,
    options: [],
  },
  {
    id: 13,
    blockId: 5,
    blockName: 'Motivación',
    question: '(Opcional) ¿Te gustaría compartir una foto de tu abdomen para completar el diagnóstico?',
    questionDetails: 'Puede ser útil para detectar inflamación visible.\n\n🔸 Tu privacidad es sagrada. Solo si te sientes cómodo/a.',
    isConditional: false,
    options: [],
  },
];

export const DIAGNOSTIC_QUESTIONS_EN: DiagnosticQuestion[] = [
  // BLOQUE 1: Conocerte Mejor
  {
    id: 1,
    blockId: 1,
    blockName: 'Get to Know You',
    question: 'How old are you and what do you do?',
    questionDetails: 'Tell me a bit about yourself',
    isConditional: false,
    options: [],
  },

  // BLOQUE 2: El Problema Principal
  {
    id: 2,
    blockId: 2,
    blockName: 'The Main Problem',
    question: 'What bothers you most about your abdomen or digestion right now?',
    questionDetails: 'It could be bloating, gas, heaviness, constipation, slow digestion...\n\nDon\'t worry if you don\'t know the exact term. Tell me in your own words.',
    isConditional: false,
    options: [],
  },
  {
    id: 3,
    blockId: 2,
    blockName: 'The Main Problem',
    question: 'How long have you been feeling this?',
    questionDetails: 'Weeks, months, years...',
    isConditional: false,
    options: [],
  },

  // BLOQUE 3: Estilo de Vida
  {
    id: 4,
    blockId: 3,
    blockName: 'Lifestyle',
    question: 'How would you describe your diet in general?',
    questionDetails: 'Is it balanced? Do you eat a lot of processed foods? Do you skip meals?',
    isConditional: false,
    options: [],
  },
  {
    id: 5,
    blockId: 3,
    blockName: 'Lifestyle',
    question: 'Are there any foods that you notice make you feel bad?',
    questionDetails: 'Dairy, gluten, legumes, spicy foods, fried foods...',
    isConditional: true,
    conditionCheck: (info) => !info.badFoods || info.badFoods.length === 0,
    options: [],
  },
  {
    id: 6,
    blockId: 3,
    blockName: 'Lifestyle',
    question: 'How much water do you usually drink per day?',
    questionDetails: 'An approximate estimate is enough',
    isConditional: false,
    options: [],
  },
  {
    id: 7,
    blockId: 3,
    blockName: 'Lifestyle',
    question: 'Do you exercise regularly?',
    questionDetails: 'If you don\'t do anything, you can also tell me without a problem. I\'m here to help you, not to judge you.',
    isConditional: true,
    conditionCheck: (info) => !info.exercise,
    options: [],
  },

  // BLOQUE 4: Salud & Bienestar
  {
    id: 8,
    blockId: 4,
    blockName: 'Health & Wellness',
    question: 'How do you usually sleep?',
    questionDetails: 'Well? Little? Do you have trouble falling asleep?',
    isConditional: true,
    conditionCheck: (info) => !info.sleep,
    options: [],
  },
  {
    id: 9,
    blockId: 4,
    blockName: 'Health & Wellness',
    question: 'Do you feel that stress or anxiety affects your body?',
    questionDetails: 'Do you notice tension, digestive discomfort or changes when you are nervous?',
    isConditional: false,
    options: [],
  },
  {
    id: 10,
    blockId: 4,
    blockName: 'Health & Wellness',
    question: 'Do you have any medical conditions or take medications regularly?',
    questionDetails: 'Hypothyroidism, IBS, intolerances, supplements...\n\nIf you don\'t have anything, just tell me.',
    isConditional: false,
    options: [],
  },

  // BLOQUE 5: Motivación
  {
    id: 11,
    blockId: 5,
    blockName: 'Motivation',
    question: 'What would you like to change about your health or body in the next 3 months?',
    questionDetails: 'It can be something physical, emotional, energy... whatever is most important to you.',
    isConditional: false,
    options: [],
  },
  {
    id: 12,
    blockId: 5,
    blockName: 'Motivation',
    question: 'From 1 to 10, how motivated are you to make real changes now?',
    questionDetails: 'Being 1 = "almost nothing" and 10 = "totally committed".\n\nRemember: there are no wrong answers.',
    isConditional: false,
    options: [],
  },
  {
    id: 13,
    blockId: 5,
    blockName: 'Motivation',
    question: '(Optional) Would you like to share a picture of your abdomen to complete the diagnosis?',
    questionDetails: 'It can be useful to detect visible inflammation.\n\n🔸 Your privacy is sacred. Only if you feel comfortable.',
    isConditional: false,
    options: [],
  },
];

export const getDiagnosticQuestions = (language: Language): DiagnosticQuestion[] => {
  return language === 'en' ? DIAGNOSTIC_QUESTIONS_EN : DIAGNOSTIC_QUESTIONS_ES;
};

export const WELCOME_MESSAGES = {
  es: '¡Hola {userName}! Soy Clara una IA que va ayudarte a conseguir un vientre plano de forma saludable y duradera.\n\nEstás a punto de empezar un diagnóstico personalizado que me permitirá conocerte mejor y darte recomendaciones adaptadas a ti.\n\nEl proceso es sencillo: yo te haré unas preguntas, tú me respondes con sinceridad, y al final recibirás un análisis completo de tu situación.\n\n¿Estás listo/a para empezar?',
  en: "Hello {userName}! I'm Clara an AI here to help you achieve a flat belly in a healthy and lasting way.\n\nYou're about to start a personalized diagnosis that will allow me to get to know you better and give you recommendations tailored to you.\n\nThe process is simple: I'll ask you some questions, you answer honestly, and at the end you'll receive a complete analysis of your situation.\n\nAre you ready to get started?",
};

export const GREETING_MESSAGES = {
  es: 'Encantado de conocerte, {userName}.',
  en: 'Nice to meet you, {userName}.',
};

export const DID_YOU_KNOW = {
  es: ' Por cierto, ¿sabías que ',
  en: ' By the way, did you know that ',
};

// Mensaje que se muestra después de la última pregunta (en lugar de mostrar el diagnóstico)
export const DIAGNOSIS_READY_MESSAGE = {
  es: `✨ Perfecto, {userName}. He analizado toda la información que me has compartido.

<strong>Tu diagnóstico digestivo personalizado está listo.</strong>

Basándome en tus respuestas, he identificado:
• Patrones específicos en tu digestión
• Posibles causas de tu malestar
• Recomendaciones personalizadas para ti

📄 <strong>Todo esto está en tu diagnóstico completo en PDF</strong> - un análisis profesional que puedes guardar y consultar cuando quieras.

<strong>Pero déjame contarte algo importante...</strong>

Este diagnóstico es solo el <em>primer paso</em>. Es el mapa que te muestra dónde estás.

<strong>El Método Objetivo Vientre Plano</strong> es el <em>camino completo</em>: un sistema paso a paso, diseñado específicamente para transformar tu salud digestiva de raíz.

No es teoría. No son consejos genéricos. Es un protocolo probado que ha ayudado a cientos de personas a:

✨ Eliminar la hinchazón persistente (incluso esa que llevas años sintiendo)
🎯 Descubrir exactamente qué alimentos te inflaman y cuáles te sanan
💪 Recuperar tu energía y bienestar digestivo real
🌟 Volver a sentirte cómodo/a y seguro/a en tu propio cuerpo

Vi en tus respuestas que tu motivación es alta. Tu situación está clara en el diagnóstico. <strong>Solo te falta el sistema correcto para lograrlo.</strong>

<strong>¿Qué quieres hacer?</strong>`,

  en: `✨ Perfect, {userName}. I've analyzed all the information you've shared.

<strong>Your personalized digestive diagnosis is ready.</strong>

Based on your answers, I've identified:
• Specific patterns in your digestion
• Possible causes of your discomfort
• Personalized recommendations for you

📄 <strong>All of this is in your complete PDF diagnosis</strong> - a professional analysis you can save and consult whenever you want.

<strong>But let me tell you something important...</strong>

This diagnosis is just the <em>first step</em>. It's the map showing you where you are.

<strong>The Flat Belly Method</strong> is the <em>complete path</em>: a step-by-step system, specifically designed to transform your digestive health from the root.

It's not theory. It's not generic advice. It's a proven protocol that has helped hundreds of people to:

✨ Eliminate persistent bloating (even the one you've been feeling for years)
🎯 Discover exactly which foods inflame you and which ones heal you
💪 Recover your energy and real digestive wellness
🌟 Feel comfortable and confident in your own body again

I saw in your answers that your motivation is high. Your situation is clear in the diagnosis. <strong>You just need the right system to achieve it.</strong>

<strong>What do you want to do?</strong>`,
};

export const DIAGNOSIS_INTRO = {
  es: '✨ Perfecto, {userName}. Déjame un momento para analizar toda la información que me has compartido y preparar tu diagnóstico digestivo personalizado...',
  en: '✨ Perfect, {userName}. Give me a moment to analyze all the information you\'ve shared and prepare your personalized digestive diagnosis...',
};


export const PDF_QUESTION = {
  es: '\n\n---\n\n📄 **¿Quieres descargar este análisis en PDF?**\n\nTe lo puedo generar ahora mismo con un diseño profesional para que lo guardes y consultes cuando quieras.',
  en: '\n\n---\n\n📄 **Want to download this analysis as a PDF?**\n\nI can generate it for you right now with a professional design so you can save it and consult it whenever you want.',
};

export const FINAL_CTA = {
  es: {
    withPdf: `✅ ¡Perfecto! Tu PDF está listo para descargar.

---

**Ahora, hablemos de lo realmente importante...**

Este diagnóstico que acabas de recibir es solo el *mapa*. Pero el verdadero viaje comienza cuando tienes la *brújula* y el *camino trazado*.

**El Método Objetivo Vientre Plano** es exactamente eso: un sistema completo, paso a paso, diseñado específicamente para transformar tu salud digestiva.

No es teoría. No son consejos genéricos. Es un protocolo probado que ha ayudado a cientos de personas a:

✨ Eliminar la hinchazón persistente que te hace sentir incómodo/a
🎯 Descubrir exactamente qué alimentos te inflaman (y cuáles te sanan)
💪 Recuperar tu energía y bienestar digestivo
🌟 Volver a sentirte bien en tu propio cuerpo

{userName}, tu motivación es alta. Tu diagnóstico está claro. **Solo te falta el sistema correcto para lograrlo.**

Y está a un clic de distancia.

👉 **[Descubrir el Método Completo](https://objetivovientreplano.com/suscripcion/)**`,
    withoutPdf: `Entendido, sin problema.

---

**Pero antes de que te vayas, déjame decirte algo...**

Este diagnóstico que acabas de recibir es solo el *mapa*. Pero el verdadero viaje comienza cuando tienes la *brújula* y el *camino trazado*.

**El Método Objetivo Vientre Plano** es exactamente eso: un sistema completo, paso a paso, diseñado específicamente para transformar tu salud digestiva.

No es teoría. No son consejos genéricos. Es un protocolo probado que ha ayudado a cientos de personas a:

✨ Eliminar la hinchazón persistente que te hace sentir incómodo/a
🎯 Descubrir exactamente qué alimentos te inflaman (y cuáles te sanan)
💪 Recuperar tu energía y bienestar digestivo
🌟 Volver a sentirte bien en tu propio cuerpo

{userName}, tu motivación es alta. Tu diagnóstico está claro. **Solo te falta el sistema correcto para lograrlo.**

Y está a un clic de distancia.

👉 **[Descubrir el Método Completo](https://objetivovientreplano.com/suscripcion/)**`,
    buttonText: `Descubrir el Método Completo`,
  },
  en: {
    withPdf: `✅ Perfect! Your PDF is ready to download.

---

**Now, let's talk about what really matters...**

This diagnosis you just received is only the *map*. But the real journey begins when you have the *compass* and the *path laid out*.

**The Flat Belly Method** is exactly that: a complete, step-by-step system specifically designed to transform your digestive health.

It's not theory. It's not generic advice. It's a proven protocol that has helped hundreds of people to:

✨ Eliminate persistent bloating that makes you feel uncomfortable
� Discover exactly which foods inflame you (and which ones heal you)
💪 Recover your energy and digestive wellness
🌟 Feel good in your own body again

{userName}, your motivation is high. Your diagnosis is clear. **You just need the right system to achieve it.**

And it's one click away.

👉 **[See the Complete Method](subscription_link)**`,
    withoutPdf: `Understood, no problem.

---

**But before you go, let me tell you something...**

This diagnosis you just received is only the *map*. But the real journey begins when you have the *compass* and the *path laid out*.

**The Flat Belly Method** is exactly that: a complete, step-by-step system specifically designed to transform your digestive health.

It's not theory. It's not generic advice. It's a proven protocol that has helped hundreds of people to:

✨ Eliminate persistent bloating that makes you feel uncomfortable
� Discover exactly which foods inflame you (and which ones heal you)
💪 Recover your energy and digestive wellness
🌟 Feel good in your own body again

{userName}, your motivation is high. Your diagnosis is clear. **You just need the right system to achieve it.**

And it's one click away.

👉 **[Discover the Complete Method](https://objetivovientreplano.com/suscripcion/)**`,
    buttonText: `Discover the Complete Method`,
  },
};