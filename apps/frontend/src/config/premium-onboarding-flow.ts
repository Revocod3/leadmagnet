/**
 * Premium Onboarding Flow - 11 bloques, 55 preguntas
 * Reutiliza FlowOption de diagnostic-flow-config
 */

import type { FlowOption } from './diagnostic-flow-config';

export interface PremiumQuestion {
  id: string;
  text: string;
  options: FlowOption[];
}

export interface PremiumBlock {
  id: string;
  name: string;
  emoji: string;
  color: string;
  infoWedge: string;
  questions: PremiumQuestion[];
}

export const PREMIUM_WELCOME = `{userName}, bienvenida a objetivo vientre plano 🌿

Antes de preparar tu plan personalizado necesito conocerte de verdad.
Vamos a recorrer juntos un análisis completo: digestivo, emocional, físico, alimentario, social y de hábitos.

No hay prisa. Puedes avanzar a tu ritmo, detenerte cuando lo necesites y volver más tarde.

En cada pregunta verás sugerencias para ayudarte, pero si lo prefieres, puedes responder con tus propias palabras.

¿Empezamos?`;

export const PREMIUM_COMPLETION = `✨ Gracias por abrirte y compartir todo esto conmigo.

Ya tengo una visión completa de tu digestión, tus emociones, tu energía, tu entorno y tu estilo de vida.

Voy a utilizar toda esta información para adaptarme a ti: a tus horarios, tu nivel de energía, tu alimentación, tu ritmo emocional y tu objetivo principal.

No tengo prisa. Vamos paso a paso. Yo te acompaño, tú marcas el ritmo.

Cuando quieras, dime cómo te gustaría empezar:
👉 con un consejo digestivo,
👉 una sugerencia de menú,
👉 un hábito sencillo para hoy,
👉 o simplemente cuéntame cómo te estás sintiendo ahora mismo.

Estoy contigo 24/7. Vamos a hacerlo juntos.`;

export const PREMIUM_BLOCKS: PremiumBlock[] = [
  // BLOQUE 1: DIGESTIVO
  {
    id: 'digestivo',
    name: 'Digestivo',
    emoji: '🔥',
    color: '#EF4444',
    infoWedge: `**La digestión nunca falla: siempre deja señales.**

Los horarios, la intensidad de tus síntomas, cómo reaccionas a ciertos alimentos y cuánto duran las molestias… todo esto forma un mapa muy claro sobre qué está ocurriendo en tu sistema digestivo.

Por eso este primer bloque es tan importante.`,
    questions: [
      {
        id: 'dig_1',
        text: '¿Cuál es el síntoma digestivo que más te está afectando estos días?',
        options: [
          { value: 'hinchazon', label: 'Hinchazón constante en la zona abdominal' },
          { value: 'gases', label: 'Muchos gases y digestiones demasiado lentas' },
          { value: 'dolor', label: 'Dolor o presión justo después de las comidas' },
          { value: 'alterno', label: 'Alterno estreñimiento y diarrea varias veces' },
        ],
      },
      {
        id: 'dig_2',
        text: '¿En qué momento del día suelen aparecer tus molestias digestivas con más intensidad?',
        options: [
          { value: 'manana', label: 'Por la mañana después de desayunar' },
          { value: 'mediodia', label: 'A mitad del día o tras la comida principal' },
          { value: 'tarde', label: 'Por la tarde cuando llevo varias horas activo/a' },
          { value: 'noche', label: 'Por la noche o al acostarme' },
        ],
      },
      {
        id: 'dig_3',
        text: '¿Qué alimentos sospechas que te provocan peor digestión o inflamación?',
        options: [
          { value: 'lacteos', label: 'Lácteos como queso, yogur, leche' },
          { value: 'harinas', label: 'Harinas, pan, pasta o alimentos con gluten' },
          { value: 'frutas', label: 'Frutas o verduras que me generan gases' },
          { value: 'legumbres', label: 'Legumbres, fritos o comidas muy pesadas' },
        ],
      },
      {
        id: 'dig_4',
        text: '¿Cómo describirías tus digestiones en general durante la última semana?',
        options: [
          { value: 'pesadas', label: 'Muy pesadas y lentas' },
          { value: 'irregulares', label: 'Irregulares: algunos días bien y otros muy mal' },
          { value: 'normales', label: 'Normales pero con molestia tras ciertas comidas' },
          { value: 'rapidas', label: 'Demasiado rápidas, casi sin digerir bien' },
        ],
      },
      {
        id: 'dig_5',
        text: 'Cuando tienes un episodio fuerte de molestias, ¿cuánto suele durar?',
        options: [
          { value: '30min', label: 'Entre 30 minutos y una hora' },
          { value: 'horas', label: 'Varias horas, hasta media tarde o noche' },
          { value: 'todo_dia', label: 'Me dura prácticamente todo el día' },
          { value: 'depende', label: 'Depende del día' },
        ],
      },
    ],
  },

  // BLOQUE 2: EMOCIONAL
  {
    id: 'emocional',
    name: 'Emocional',
    emoji: '💭',
    color: '#8B5CF6',
    infoWedge: `**La barriga y las emociones están totalmente conectadas.**

El estrés, la presión mental y la ansiedad pueden inflamar tanto como un alimento.

No buscamos juzgarte ni analizar tu vida. Solo necesito entender cómo te sientes por dentro para ajustar tu acompañamiento de una forma realista y humana.`,
    questions: [
      {
        id: 'emo_1',
        text: '¿Cómo describirías tu nivel de estrés en las últimas dos semanas?',
        options: [
          { value: 'alto', label: 'Estrés alto casi todos los días' },
          { value: 'moderado', label: 'Estrés moderado pero constante' },
          { value: 'puntual', label: 'Momentos puntuales que puedo controlar' },
          { value: 'bajo', label: 'Muy poco estrés o tranquilidad general' },
        ],
      },
      {
        id: 'emo_2',
        text: '¿Sientes que tus emociones afectan a tu barriga o a tus digestiones?',
        options: [
          { value: 'si_mucho', label: 'Sí, noto inflamación en días de tensión' },
          { value: 'a_veces', label: 'A veces, con preocupaciones fuertes' },
          { value: 'poco', label: 'Muy pocas veces siento conexión directa' },
          { value: 'no', label: 'No noto relación entre ambas' },
        ],
      },
      {
        id: 'emo_3',
        text: '¿Cómo te sientes contigo mismo/a cuando tu digestión no va bien?',
        options: [
          { value: 'frustrado', label: 'Frustrado/a y con poca paciencia' },
          { value: 'desanimado', label: 'Desanimado/a, sin control del cuerpo' },
          { value: 'afecta_poco', label: 'Me afecta un poco pero lo llevo con calma' },
          { value: 'bien', label: 'Casi no me afecta emocionalmente' },
        ],
      },
      {
        id: 'emo_4',
        text: '¿Cómo han sido tus niveles de ansiedad últimamente?',
        options: [
          { value: 'alta', label: 'Ansiedad alta, especialmente bajo presión' },
          { value: 'moderada', label: 'Ansiedad moderada de vez en cuando' },
          { value: 'baja', label: 'Ansiedad baja o casi inexistente' },
          { value: 'altibajos', label: 'Depende de la semana, tengo altibajos' },
        ],
      },
      {
        id: 'emo_5',
        text: '¿Sueles notar tensión en el cuerpo cuando algo te preocupa?',
        options: [
          { value: 'abdomen', label: 'Sí, mucha tensión en el abdomen' },
          { value: 'pecho', label: 'Presión en el pecho o estómago' },
          { value: 'puntual', label: 'Solo en momentos de estrés fuerte' },
          { value: 'no', label: 'No suelo sentir tensión física' },
        ],
      },
    ],
  },

  // BLOQUE 3: FÍSICO / ENERGÍA
  {
    id: 'fisico',
    name: 'Físico / Energía',
    emoji: '⚡',
    color: '#F59E0B',
    infoWedge: `**El estado físico influye directamente en cómo digieres.**

Cuando duermes poco, cuando estás cansado/a o cuando el cuerpo acumula tensión, la digestión se vuelve más lenta y más sensible.

Esta parte nos ayuda a ajustar tus recomendaciones para que no te sientas forzado/a ni agotado/a.`,
    questions: [
      {
        id: 'fis_1',
        text: '¿Cómo describirías tu nivel de energía a lo largo del día?',
        options: [
          { value: 'baja', label: 'Energía baja casi todo el día' },
          { value: 'irregular', label: 'Irregular: subidas y bajadas marcadas' },
          { value: 'buena_manana', label: 'Buena por la mañana, más cansancio por la tarde' },
          { value: 'estable', label: 'Energía estable durante todo el día' },
        ],
      },
      {
        id: 'fis_2',
        text: '¿Cómo está siendo tu descanso nocturno últimamente?',
        options: [
          { value: 'mal', label: 'Me cuesta dormir y me despierto varias veces' },
          { value: 'cansado', label: 'Duermo pero me levanto cansado/a' },
          { value: 'irregular', label: 'Algunos días bien, otros muy mal' },
          { value: 'bien', label: 'Estable y me levanto con buena energía' },
        ],
      },
      {
        id: 'fis_3',
        text: '¿Sueles sentir tensión física en alguna parte del cuerpo?',
        options: [
          { value: 'abdomen', label: 'Sí, constante en el abdomen o estómago' },
          { value: 'cuello', label: 'Mucha tensión en cuello y espalda' },
          { value: 'puntual', label: 'Puntual cuando estoy estresado/a' },
          { value: 'no', label: 'Casi nunca siento tensión física' },
        ],
      },
      {
        id: 'fis_4',
        text: '¿Qué nivel de movimiento tienes en un día normal?',
        options: [
          { value: 'poco', label: 'Muy poco, paso muchas horas sentado/a' },
          { value: 'moderado', label: 'Moderado: camino algo pero no ejercicio' },
          { value: 'regular', label: 'Actividad física regular varias veces/semana' },
          { value: 'activo', label: 'Trabajo físico o movimiento constante' },
        ],
      },
      {
        id: 'fis_5',
        text: '¿Sientes que tu cuerpo retiene líquidos o se inflama más de lo normal?',
        options: [
          { value: 'si', label: 'Sí, retención en piernas, abdomen o manos' },
          { value: 'a_veces', label: 'A veces pero no es constante' },
          { value: 'poco', label: 'Muy poca, solo en días específicos' },
          { value: 'no', label: 'No suelo tener retención' },
        ],
      },
    ],
  },

  // BLOQUE 4: ALIMENTACIÓN
  {
    id: 'alimentacion',
    name: 'Alimentación',
    emoji: '🍽️',
    color: '#10B981',
    infoWedge: `**La forma en la que comes influye tanto como lo que comes.**

No se trata solo de alimentos "buenos o malos", sino de horarios, cantidades, velocidad al comer y cómo te sientes antes y después de cada comida.

No busco que cambies tu forma de comer ahora mismo, solo quiero entender cómo es tu alimentación en la vida real.`,
    questions: [
      {
        id: 'ali_1',
        text: '¿Cuál describirías como tu estilo de alimentación habitual?',
        options: [
          { value: 'variada', label: 'Comida variada intentando equilibrar' },
          { value: 'proteinas', label: 'Alta en proteínas estilo fitness' },
          { value: 'veggie', label: 'Vegetariana o vegana' },
          { value: 'sin_reglas', label: 'Como de todo sin restricciones' },
        ],
      },
      {
        id: 'ali_2',
        text: '¿Cómo suelen ser tus horarios de comida a lo largo del día?',
        options: [
          { value: 'irregular', label: 'Irregulares según el día' },
          { value: 'fijos', label: 'Horarios fijos para desayuno, comida y cena' },
          { value: 'tarde', label: 'Suelo comer tarde o a deshora' },
          { value: 'ayuno', label: 'Hago ayuno intermitente' },
        ],
      },
      {
        id: 'ali_3',
        text: '¿Tiendes a comer rápido, despacio o depende?',
        options: [
          { value: 'rapido', label: 'Como muy rápido casi siempre' },
          { value: 'normal', label: 'A un ritmo normal, sin mucha prisa' },
          { value: 'despacio', label: 'Despacio y mastico bien' },
          { value: 'depende', label: 'Depende del día' },
        ],
      },
      {
        id: 'ali_4',
        text: '¿Con qué frecuencia recurres a alimentos procesados o fritos?',
        options: [
          { value: 'mucho', label: 'Muy a menudo, por comodidad' },
          { value: 'algunas', label: 'Algunas veces por semana' },
          { value: 'finde', label: 'Solo en fines de semana' },
          { value: 'rara', label: 'Rara vez' },
        ],
      },
      {
        id: 'ali_5',
        text: '¿Sueles repetir mucho los mismos alimentos durante la semana?',
        options: [
          { value: 'si', label: 'Sí, como siempre lo mismo' },
          { value: 'bastante', label: 'Repito bastantes alimentos' },
          { value: 'intento', label: 'Intento variar pero a veces repito' },
          { value: 'vario', label: 'Varío bastante' },
        ],
      },
    ],
  },

  // BLOQUE 5: SOCIAL
  {
    id: 'social',
    name: 'Social',
    emoji: '👥',
    color: '#EC4899',
    infoWedge: `**La vida social influye muchísimo en la digestión y en los hábitos.**

Cenas fuera, eventos, fines de semana y el ambiente familiar pueden cambiar por completo cómo comes y cómo te sientes.

No se trata de evitar tu vida social, sino de entenderla para que tu acompañamiento sea realista y flexible.`,
    questions: [
      {
        id: 'soc_1',
        text: '¿Con qué frecuencia sueles comer fuera de casa?',
        options: [
          { value: 'mucho', label: 'Varias veces por semana' },
          { value: 'algunas', label: 'Una o dos veces por semana' },
          { value: 'finde', label: 'Solo en fines de semana' },
          { value: 'casi_nunca', label: 'Casi nunca como fuera' },
        ],
      },
      {
        id: 'soc_2',
        text: '¿Cómo son normalmente tus fines de semana en cuanto a comida?',
        options: [
          { value: 'desordenados', label: 'Más desordenados que entre semana' },
          { value: 'similares', label: 'Bastante similares a los días normales' },
          { value: 'salgo', label: 'Salgo a comer o cenar y cambio la rutina' },
          { value: 'depende', label: 'Depende mucho del plan' },
        ],
      },
      {
        id: 'soc_3',
        text: '¿Sientes que tu entorno influye en cómo comes?',
        options: [
          { value: 'si_mucho', label: 'Sí, mi entorno influye mucho' },
          { value: 'a_veces', label: 'A veces me dejo llevar' },
          { value: 'poco', label: 'Muy poco, mantengo mis decisiones' },
          { value: 'depende', label: 'Depende de la situación' },
        ],
      },
      {
        id: 'soc_4',
        text: '¿Te sientes presionado/a socialmente a comer cosas que no te sientan bien?',
        options: [
          { value: 'si', label: 'Sí, me cuesta decir que no' },
          { value: 'a_veces', label: 'A veces, según la compañía' },
          { value: 'poco', label: 'Muy pocas veces' },
          { value: 'no', label: 'No, nunca me siento presionado/a' },
        ],
      },
      {
        id: 'soc_5',
        text: '¿Te sientes diferente o incómodo/a por tus hábitos cuando estás con otros?',
        options: [
          { value: 'si', label: 'Sí, me siento diferente' },
          { value: 'a_veces', label: 'A veces, según el grupo' },
          { value: 'poco', label: 'Muy pocas veces' },
          { value: 'no', label: 'No me afecta en absoluto' },
        ],
      },
    ],
  },

  // BLOQUE 6: LABORAL
  {
    id: 'laboral',
    name: 'Laboral',
    emoji: '💼',
    color: '#6366F1',
    infoWedge: `**Tu trabajo y tu ritmo de vida influyen directamente en tu digestión.**

No es lo mismo tener jornadas largas, turnos cambiantes, mucho estrés o poco tiempo para cocinar, que tener un horario más estable.

Aquí no buscamos cambiar tu forma de trabajar, sino adaptar tu plan a tu vida real.`,
    questions: [
      {
        id: 'lab_1',
        text: '¿Cómo describirías tu tipo de trabajo o actividad diaria?',
        options: [
          { value: 'sedentario', label: 'Sedentario, muchas horas sentado/a' },
          { value: 'activo', label: 'Activo con bastante movimiento físico' },
          { value: 'mixto', label: 'Mixto: parte sentado/a y parte en movimiento' },
          { value: 'variable', label: 'Horarios muy cambiantes o irregulares' },
        ],
      },
      {
        id: 'lab_2',
        text: '¿Cómo son tus niveles de estrés durante tu jornada laboral?',
        options: [
          { value: 'alto', label: 'Estrés alto casi todos los días' },
          { value: 'moderado', label: 'Moderado pero manejable' },
          { value: 'bajo', label: 'Bajo o solo puntual' },
          { value: 'depende', label: 'Depende de la carga laboral' },
        ],
      },
      {
        id: 'lab_3',
        text: '¿Tienes tiempo para comer con calma durante tu día laboral?',
        options: [
          { value: 'no', label: 'No, como rápido por falta de tiempo' },
          { value: 'a_veces', label: 'A veces puedo, pero no siempre' },
          { value: 'si', label: 'Sí, tengo tiempo suficiente' },
          { value: 'depende', label: 'Depende del día' },
        ],
      },
      {
        id: 'lab_4',
        text: '¿Puedes mantener horarios estables para comer durante la semana?',
        options: [
          { value: 'no', label: 'No, mis horarios cambian mucho' },
          { value: 'mas_menos', label: 'Más o menos, a veces se descolocan' },
          { value: 'si', label: 'Sí, son bastante estables' },
          { value: 'depende', label: 'Dependen del ritmo laboral' },
        ],
      },
      {
        id: 'lab_5',
        text: '¿Cómo te sientes físicamente al final de tu jornada laboral?',
        options: [
          { value: 'agotado', label: 'Muy cansado/a, agotamiento físico y mental' },
          { value: 'moderado', label: 'Moderadamente cansado/a' },
          { value: 'energia', label: 'Con bastante energía incluso después' },
          { value: 'depende', label: 'Depende del día' },
        ],
      },
    ],
  },

  // BLOQUE 7: BIENESTAR
  {
    id: 'bienestar',
    name: 'Bienestar',
    emoji: '🧘',
    color: '#14B8A6',
    infoWedge: `**El cuerpo no solo digiere comida: también digiere emociones, pensamientos y experiencias.**

Cuando no tenemos espacios de calma, el sistema nervioso se mantiene en alerta y la digestión se vuelve más sensible.

Este bloque nos ayuda a entender tu nivel de bienestar interno y tu capacidad de desconectar.`,
    questions: [
      {
        id: 'bie_1',
        text: '¿Cómo describirías tu nivel de calma o equilibrio interior en el día a día?',
        options: [
          { value: 'mal', label: 'Me cuesta encontrar momentos de calma' },
          { value: 'algo', label: 'Tengo algo de calma pero mi mente va acelerada' },
          { value: 'cierta', label: 'Consigo cierta tranquilidad según el día' },
          { value: 'bien', label: 'Me siento bastante equilibrado/a' },
        ],
      },
      {
        id: 'bie_2',
        text: '¿Practicas alguna actividad que te ayude a relajarte?',
        options: [
          { value: 'meditacion', label: 'Sí, respiración, meditación o técnicas' },
          { value: 'caminar', label: 'Camino o salgo a despejarme' },
          { value: 'a_veces', label: 'A veces hago algo pero no es constante' },
          { value: 'no', label: 'No practico nada concreto' },
        ],
      },
      {
        id: 'bie_3',
        text: '¿Te resulta fácil desconectar mentalmente al final del día?',
        options: [
          { value: 'no', label: 'Me cuesta mucho, sigo pensando en todo' },
          { value: 'a_veces', label: 'A veces lo consigo según el día' },
          { value: 'si', label: 'Lo logro sin dificultad la mayoría de días' },
          { value: 'muy_bien', label: 'Desconecto muy bien' },
        ],
      },
      {
        id: 'bie_4',
        text: '¿Sueles sentirte conectado/a contigo mismo/a, con tus emociones y tu cuerpo?',
        options: [
          { value: 'no', label: 'Me cuesta conectar y entender cómo me siento' },
          { value: 'a_veces', label: 'A veces conecto en momentos puntuales' },
          { value: 'consciente', label: 'Suelo estar consciente de mis emociones' },
          { value: 'si', label: 'Sí, tengo bastante conexión' },
        ],
      },
      {
        id: 'bie_5',
        text: '¿Dirías que necesitas más momentos de paz o descanso mental?',
        options: [
          { value: 'urgente', label: 'Sí, necesito urgentemente más paz' },
          { value: 'si', label: 'Creo que sí, me vendría bien' },
          { value: 'a_veces', label: 'A veces, pero lo gestiono bien' },
          { value: 'no', label: 'No lo veo necesario' },
        ],
      },
    ],
  },

  // BLOQUE 8: OBJETIVOS
  {
    id: 'objetivos',
    name: 'Objetivos',
    emoji: '🎯',
    color: '#F97316',
    infoWedge: `**Para acompañarte de verdad necesito saber cuál es tu objetivo.**

No todos buscamos lo mismo: algunas personas quieren reducir hinchazón, otras mejorar energía, otras regular su tránsito.

Entender qué es lo que tú quieres lograr me permite adaptar tu acompañamiento y marcar el ritmo adecuado para ti.`,
    questions: [
      {
        id: 'obj_1',
        text: '¿Cuál es tu objetivo principal al estar aquí conmigo?',
        options: [
          { value: 'hinchazon', label: 'Reducir hinchazón y sentirme más ligero/a' },
          { value: 'digestiones', label: 'Mejorar digestiones y evitar molestias' },
          { value: 'transito', label: 'Regular mi tránsito intestinal' },
          { value: 'energia', label: 'Ganar energía y sentirme mejor' },
        ],
      },
      {
        id: 'obj_2',
        text: '¿Qué tan urgente sientes que es para ti conseguir este objetivo?',
        options: [
          { value: 'muy', label: 'Muy urgente, necesito un cambio ya' },
          { value: 'bastante', label: 'Bastante importante' },
          { value: 'tranquilo', label: 'Importante pero a ritmo tranquilo' },
          { value: 'no_urgente', label: 'No es urgente, paso a paso' },
        ],
      },
      {
        id: 'obj_3',
        text: '¿Qué es lo que más te frustra de tu situación actual?',
        options: [
          { value: 'hinchazon', label: 'La hinchazón constante que no controlo' },
          { value: 'incertidumbre', label: 'Comer algo y no saber si me sentará bien' },
          { value: 'energia', label: 'La falta de energía y agotamiento' },
          { value: 'sin_resultados', label: 'Haber probado cosas sin resultados' },
        ],
      },
      {
        id: 'obj_4',
        text: '¿Qué te haría sentir que realmente estás avanzando?',
        options: [
          { value: 'menos_inflamacion', label: 'Notar menos inflamación al final del día' },
          { value: 'comer_sin_miedo', label: 'Poder comer sin miedo ni molestias' },
          { value: 'mas_energia', label: 'Tener más energía para mis actividades' },
          { value: 'ligero', label: 'Sentirme más ligero/a y con bienestar' },
        ],
      },
      {
        id: 'obj_5',
        text: '¿Cuánto compromiso estás dispuesto/a a poner en este proceso?',
        options: [
          { value: 'total', label: 'Totalmente comprometido/a' },
          { value: 'cambios', label: 'Dispuesto/a a cambios importantes si son realistas' },
          { value: 'pequenos', label: 'Quiero avanzar con pasos pequeños' },
          { value: 'costoso', label: 'Quiero mejorar pero me cuesta la constancia' },
        ],
      },
    ],
  },

  // BLOQUE 9: HÁBITOS
  {
    id: 'habitos',
    name: 'Hábitos',
    emoji: '⏰',
    color: '#84CC16',
    infoWedge: `**Tus resultados no dependen solo de lo que comas, sino de los hábitos que puedas mantener.**

Cada persona tiene un nivel distinto de constancia, y eso es totalmente normal.

Este bloque me ayuda a adaptar tu acompañamiento a tu ritmo real, para evitar frustraciones.`,
    questions: [
      {
        id: 'hab_1',
        text: '¿Cómo describirías tu nivel de constancia cuando intentas cambiar algún hábito?',
        options: [
          { value: 'bajo', label: 'Me cuesta mantener cambios, abandono fácil' },
          { value: 'temporal', label: 'Puedo un tiempo, pero luego me cuesta seguir' },
          { value: 'con_apoyo', label: 'Soy constante si tengo apoyo' },
          { value: 'alto', label: 'Soy bastante constante' },
        ],
      },
      {
        id: 'hab_2',
        text: '¿Tienes alguna rutina diaria establecida?',
        options: [
          { value: 'no', label: 'No tengo rutinas, cada día es distinto' },
          { value: 'algunas', label: 'Tengo algunas pero no siempre las cumplo' },
          { value: 'basicas', label: 'Sí, rutinas básicas que suelo mantener' },
          { value: 'organizadas', label: 'Rutinas muy establecidas y organizadas' },
        ],
      },
      {
        id: 'hab_3',
        text: '¿Qué hábitos saludables ya has intentado en el pasado?',
        options: [
          { value: 'alimentacion', label: 'Llevar alimentación más ordenada' },
          { value: 'ejercicio', label: 'Hacer ejercicio o caminar con regularidad' },
          { value: 'sueno', label: 'Mejorar sueño o horarios' },
          { value: 'muchos', label: 'He probado muchos pero ninguno me duró' },
        ],
      },
      {
        id: 'hab_4',
        text: '¿Qué es lo que más te cuesta mantener cuando intentas mejorar tu bienestar?',
        options: [
          { value: 'constancia', label: 'Ser constante cuando no veo resultados' },
          { value: 'organizarme', label: 'Organizarme con comidas y horarios' },
          { value: 'motivacion', label: 'Mantener motivación en días de estrés' },
          { value: 'recordar', label: 'Recordar los pequeños hábitos' },
        ],
      },
      {
        id: 'hab_5',
        text: '¿Cuánto tiempo real al día crees que puedes dedicar a mejorar tu bienestar?',
        options: [
          { value: 'muy_poco', label: 'Muy poco tiempo, días complicados' },
          { value: 'minutos', label: 'Unos minutos al día, constante' },
          { value: '10_20', label: 'Entre 10 y 20 minutos sin problema' },
          { value: 'mas', label: 'Puedo dedicar más tiempo si lo necesito' },
        ],
      },
    ],
  },

  // BLOQUE 10: IDENTIDAD
  {
    id: 'identidad',
    name: 'Identidad',
    emoji: '💫',
    color: '#A855F7',
    infoWedge: `**Para acompañarte bien necesito situarme en tu contexto.**

Tu momento vital, cómo te ves a ti mismo/a y cómo es tu estilo de vida general.

No se trata de datos técnicos, sino de comprender en qué punto estás para adaptar el tono y la dirección del acompañamiento.`,
    questions: [
      {
        id: 'ide_1',
        text: '¿En qué etapa de tu vida sientes que te encuentras ahora mismo?',
        options: [
          { value: 'cambio', label: 'En un momento de cambio y necesidad de mejorar' },
          { value: 'estable', label: 'Etapa estable pero con ganas de avanzar' },
          { value: 'complicado', label: 'Periodo complicado a nivel personal' },
          { value: 'crecimiento', label: 'Etapa de crecimiento personal y enfoque en mí' },
        ],
      },
      {
        id: 'ide_2',
        text: '¿Cómo describirías tu estilo de vida actual en general?',
        options: [
          { value: 'acelerado', label: 'Bastante acelerado, poco tiempo para mí' },
          { value: 'activo', label: 'Activo pero con algunos momentos de calma' },
          { value: 'tranquilo', label: 'Relativamente tranquilo, rutina estable' },
          { value: 'variable', label: 'Muy variable, mis días cambian mucho' },
        ],
      },
      {
        id: 'ide_3',
        text: '¿Cómo te ves a ti mismo/a en cuanto a salud y bienestar?',
        options: [
          { value: 'desalineado', label: 'Bastante desalineado/a, quiero mejorar' },
          { value: 'motivado', label: 'Tengo cosas por mejorar pero estoy motivado/a' },
          { value: 'saludable', label: 'Me considero bastante saludable' },
          { value: 'no_claro', label: 'No lo tengo claro, cambia según el día' },
        ],
      },
      {
        id: 'ide_4',
        text: '¿Cómo describirías tu relación contigo mismo/a en este momento?',
        options: [
          { value: 'mal', label: 'Me cuesta cuidarme y priorizarme' },
          { value: 'intento', label: 'Intento cuidarme pero me dejo en segundo plano' },
          { value: 'buena', label: 'Tengo una relación bastante buena' },
          { value: 'altibajos', label: 'Depende del momento, tengo altibajos' },
        ],
      },
      {
        id: 'ide_5',
        text: '¿Hay algo en tu vida personal que esté influyendo en tu bienestar?',
        options: [
          { value: 'si', label: 'Sí, estoy pasando por cambios o situaciones difíciles' },
          { value: 'algunas', label: 'Algunas cosas me influyen pero las gestiono' },
          { value: 'pocas', label: 'Pocas cosas afectan mi bienestar' },
          { value: 'no', label: 'No siento que haya algo afectándome' },
        ],
      },
    ],
  },

  // BLOQUE 11: MÉDICO
  {
    id: 'medico',
    name: 'Historial Médico',
    emoji: '🏥',
    color: '#DC2626',
    infoWedge: `**Algunos medicamentos y diagnósticos previos pueden influir muchísimo en la digestión.**

Antiácidos, ansiolíticos, antibióticos recientes, tratamientos hormonales, intolerancias, operaciones…

No buscamos hacer un diagnóstico médico, sino adaptar tu acompañamiento para que sea coherente con tu situación física.`,
    questions: [
      {
        id: 'med_1',
        text: '¿Tienes algún diagnóstico digestivo previo?',
        options: [
          { value: 'sii', label: 'Sí, colon irritable o SII' },
          { value: 'gastritis', label: 'Gastritis, reflujo o problemas estomacales' },
          { value: 'intolerancias', label: 'Intolerancias o sospechas de intolerancias' },
          { value: 'no', label: 'No tengo diagnósticos digestivos conocidos' },
        ],
      },
      {
        id: 'med_2',
        text: '¿Actualmente tomas algún medicamento de forma frecuente?',
        options: [
          { value: 'antiacidos', label: 'Antiácidos o protectores gástricos' },
          { value: 'ansioliticos', label: 'Ansiolíticos o antidepresivos' },
          { value: 'hormonales', label: 'Anticonceptivos o tratamientos hormonales' },
          { value: 'no', label: 'No tomo ningún medicamento regular' },
        ],
      },
      {
        id: 'med_3',
        text: '¿Has tomado antibióticos en los últimos meses?',
        options: [
          { value: 'reciente', label: 'Sí, en los últimos 30 días' },
          { value: '2_3_meses', label: 'Sí, hace 2-3 meses' },
          { value: 'hace_tiempo', label: 'Hace bastante tiempo' },
          { value: 'no_recuerdo', label: 'No recuerdo haber tomado recientemente' },
        ],
      },
      {
        id: 'med_4',
        text: '¿Has tenido alguna operación que pueda influir en tu digestión?',
        options: [
          { value: 'si', label: 'Sí, operaciones abdominales o digestivas' },
          { value: 'no_afecto', label: 'Intervenciones pero sin afectar digestión' },
          { value: 'ninguna', label: 'Ninguna operación que haya influido' },
          { value: 'hace_anos', label: 'Tuve operaciones hace años sin cambios' },
        ],
      },
      {
        id: 'med_5',
        text: '¿Tienes alguna alergia, intolerancia o sensibilidad alimentaria conocida?',
        options: [
          { value: 'si', label: 'Sí, alergias o intolerancias diagnosticadas' },
          { value: 'sospecho', label: 'Sensibilidades que sospecho pero no confirmadas' },
          { value: 'no', label: 'No tengo alergias ni intolerancias conocidas' },
          { value: 'proceso', label: 'Estoy en proceso de averiguarlo' },
        ],
      },
    ],
  },
];

// Helpers
export const TOTAL_PREMIUM_QUESTIONS = PREMIUM_BLOCKS.reduce((acc, b) => acc + b.questions.length, 0);
export const TOTAL_PREMIUM_BLOCKS = PREMIUM_BLOCKS.length;

export const getPremiumBlockByIndex = (blockIndex: number) => PREMIUM_BLOCKS[blockIndex];
export const getPremiumQuestionByStep = (step: number) => {
  let count = 0;
  for (const block of PREMIUM_BLOCKS) {
    for (const question of block.questions) {
      if (count === step) return { block, question };
      count++;
    }
  }
  return null;
};
