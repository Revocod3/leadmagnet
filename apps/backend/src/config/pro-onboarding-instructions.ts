/**
 * PRO Onboarding Instructions
 * 
 * 55 preguntas en 11 bloques para el onboarding premium.
 * Sigue la misma arquitectura que assistant-instructions.ts del chat gratuito.
 */

// ============================================================================
// MENSAJE DE BIENVENIDA
// ============================================================================

export const PRO_WELCOME_MESSAGE = `{nombre}, bienvenido/a a Objetivo Vientre Plano 🌿

Antes de preparar tu plan personalizado necesito conocerte de verdad.
Vamos a recorrer juntos un análisis completo: digestivo, emocional, físico, alimentario, social y de hábitos.

Nos tomamos muy en serio todo este proceso, y por eso es importante recopilar información detallada.
Cuanto más precisa sea tu respuesta, más exactas serán mis recomendaciones a diario.

No hay prisa.
No tienes que contestar todo seguido. Puedes avanzar a tu ritmo, detenerte cuando lo necesites y volver más tarde.

En cada pregunta verás sugerencias para ayudarte, pero si lo prefieres,
puedes responder con tus propias palabras en cualquier momento.

Y recuerda: si te surge alguna duda, también puedes preguntarme. Estoy aquí contigo para acompañarte paso a paso.

Cuando estés listo/a, empezamos.`;

// ============================================================================
// CUÑAS INFORMATIVAS (aparecen ANTES de la primera pregunta de cada bloque)
// ============================================================================

export const INFO_WEDGES = {
  digestivo: `Antes de empezar, quiero explicarte algo importante.
La digestión nunca falla: siempre deja señales.

Los horarios, la intensidad de tus síntomas, cómo reaccionas a ciertos alimentos y cuánto duran las molestias…
todo esto forma un mapa muy claro sobre qué está ocurriendo en tu sistema digestivo.

Por eso este primer bloque es tan importante.
Aquí vamos a identificar patrones que muchas veces pasan desapercibidos, pero que explican por qué tu barriga reacciona como reacciona.

No tengas prisa: responde con calma y recuerda que puedes escribir tus respuestas con tus propias palabras siempre que quieras.`,

  emocional: `Ahora vamos a profundizar en la parte emocional.
La barriga y las emociones están totalmente conectadas:
el estrés, la presión mental y la ansiedad pueden inflamar tanto como un alimento.

Muchas personas viven meses o años con molestias digestivas sin darse cuenta de que su estado emocional es uno de los factores más importantes.

No buscamos juzgarte ni analizar tu vida.
Solo necesito entender cómo te sientes por dentro para ajustar tu acompañamiento de una forma realista y humana.

Recuerda que puedes responder con calma, y si lo prefieres, puedes escribir tus respuestas con tus propias palabras.`,

  fisico: `El estado físico influye directamente en cómo digieres.
Cuando duermes poco, cuando estás cansado/a o cuando el cuerpo acumula tensión, la digestión se vuelve más lenta y más sensible.

Por eso ahora vamos a ver cómo está respondiendo tu cuerpo en general: energía, descanso y ritmo diario.
Esta parte nos ayuda a ajustar tus recomendaciones para que no te sientas forzado/a ni agotado/a.`,

  alimentacion: `La forma en la que comes influye tanto como lo que comes.
No se trata solo de alimentos "buenos o malos", sino de horarios, cantidades, velocidad al comer, tipo de dieta y cómo te sientes antes y después de cada comida.

Este bloque nos ayuda a identificar qué patrones alimentarios pueden estar favoreciendo o empeorando tus digestiones.
No busco que cambies tu forma de comer ahora mismo, solo quiero entender cómo es tu alimentación en la vida real.`,

  social: `La vida social influye muchísimo en la digestión y en los hábitos.
Cenas fuera, eventos, fines de semana y el ambiente familiar pueden cambiar por completo cómo comes y cómo te sientes.

No se trata de evitar tu vida social, sino de entenderla para que tu acompañamiento sea realista, flexible y adaptado a tu día a día.

No tienes que justificar nada. Solo comparte lo que encaje con tu vida real.`,

  laboral: `Tu trabajo y tu ritmo de vida influyen directamente en tu digestión y en tu forma de comer.
No es lo mismo tener jornadas largas, turnos cambiantes, mucho estrés o poco tiempo para cocinar, que tener un horario más estable.

Aquí no buscamos cambiar tu forma de trabajar, sino adaptar tu plan a tu vida real, para que no te resulte imposible mantenerlo.`,

  bienestar: `El cuerpo no solo digiere comida: también digiere emociones, pensamientos y experiencias.
Cuando no tenemos espacios de calma, el sistema nervioso se mantiene en alerta y la digestión se vuelve más sensible.

Este bloque nos ayuda a entender tu nivel de bienestar interno, tu capacidad de desconectar y cómo se relaciona todo esto con tu digestión.`,

  objetivos: `Para acompañarte de verdad necesito saber cuál es tu objetivo.
No todos buscamos lo mismo: algunas personas quieren reducir hinchazón, otras mejorar energía, otras regular su tránsito, otras recuperar confianza en su cuerpo.

Entender qué es lo que tú quieres lograr me permite adaptar tu acompañamiento y marcar el ritmo adecuado para ti.`,

  habitos: `Tus resultados no dependen solo de lo que comas, sino de los hábitos que puedas mantener en tu día a día.
Cada persona tiene un nivel distinto de constancia, y eso es totalmente normal.

Este bloque me ayuda a adaptar tu acompañamiento a tu ritmo real, para evitar frustraciones y crear un progreso estable y sostenible.`,

  identidad: `Para acompañarte bien necesito situarme en tu contexto: tu momento vital, cómo te ves a ti mismo/a y cómo es tu estilo de vida general.
No se trata de datos técnicos, sino de comprender en qué punto estás para adaptar el tono, el ritmo y la dirección del acompañamiento.`,

  historial: `Algunos medicamentos y diagnósticos previos pueden influir muchísimo en la digestión:
antiácidos, ansiolíticos, antibióticos recientes, tratamientos hormonales, intolerancias, operaciones…

No buscamos hacer un diagnóstico médico, sino adaptar tu acompañamiento para que encaje con tu realidad física y con tu historial.

Comparte solo lo que te apetezca, pero recuerda que esta parte ayuda a que todo sea mucho más preciso.`,
};

// ============================================================================
// MENSAJE FINAL (después de las 55 preguntas)
// ============================================================================

export const PRO_COMPLETION_MESSAGE = `Gracias por abrirte y compartir todo esto conmigo.
Ya tengo una visión completa de tu digestión, tus emociones, tu energía, tu entorno y tu estilo de vida.

Todo lo que me has contado es importante. Cada detalle suma.
A partir de este momento, tu acompañamiento empieza de verdad.

Voy a utilizar toda esta información para adaptarme a ti:
a tus horarios, tu nivel de energía, tu alimentación, tu ritmo emocional y tu objetivo principal.

No tengo prisa. Vamos paso a paso.
Yo te acompaño, tú marcas el ritmo.

Cuando quieras, dime cómo te gustaría empezar:
👉 con un consejo digestivo,
👉 una sugerencia de menú,
👉 un hábito sencillo para hoy,
👉 o simplemente cuéntame cómo te estás sintiendo ahora mismo.

Estoy contigo 24/7. Vamos a hacerlo juntos.`;

// ============================================================================
// ESTRUCTURA DE BLOQUES Y PREGUNTAS
// ============================================================================

export interface OnboardingQuestion {
  id: string;
  text: string;
  suggestions: string[];
  transition: string;
}

export interface OnboardingBlock {
  id: string;
  name: string;
  questions: OnboardingQuestion[];
}

export const ONBOARDING_BLOCKS: OnboardingBlock[] = [
  // ========== BLOQUE 1: DIGESTIVO ==========
  {
    id: 'digestivo',
    name: 'Digestivo',
    questions: [
      {
        id: 'dig_1',
        text: '¿Cuál es el síntoma digestivo que más te está afectando estos días?',
        suggestions: [
          'Hinchazón constante en la zona abdominal',
          'Muchos gases y digestiones demasiado lentas',
          'Dolor o presión justo después de las comidas',
          'Alterno estreñimiento y diarrea varias veces',
        ],
        transition: 'Gracias por contármelo. Esta información es fundamental para entender por dónde empezar contigo.',
      },
      {
        id: 'dig_2',
        text: '¿En qué momento del día suelen aparecer tus molestias digestivas con más intensidad?',
        suggestions: [
          'Por la mañana después de tomar algo o desayunar',
          'A mitad del día o justo al terminar la comida principal',
          'Por la tarde cuando llevo varias horas activo/a',
          'Por la noche o al acostarme, cuando intento relajarme',
        ],
        transition: 'Perfecto, ya voy identificando patrones importantes en tu digestión.',
      },
      {
        id: 'dig_3',
        text: '¿Qué alimentos sospechas que te provocan peor digestión o inflamación?',
        suggestions: [
          'Lácteos como queso, yogur, leche o derivados',
          'Harinas, pan, pasta o alimentos con gluten',
          'Frutas o verduras que me generan gases fácilmente',
          'Legumbres, fritos o comidas muy grasas y pesadas',
        ],
        transition: 'Gracias, esta parte es clave para ajustar tu alimentación sin agobios.',
      },
      {
        id: 'dig_4',
        text: '¿Cómo describirías tus digestiones en general durante la última semana?',
        suggestions: [
          'Muy pesadas y lentas, tardo horas en sentir alivio',
          'Irregulares: algunos días bien y otros muy mal',
          'Normales pero con molestia después de ciertas comidas',
          'Demasiado rápidas, casi sin llegar a digerir bien',
        ],
        transition: 'Entiendo. Esto me ayuda a medir cómo está funcionando tu sistema digestivo últimamente.',
      },
      {
        id: 'dig_5',
        text: 'Cuando tienes un episodio fuerte de molestias (hinchazón, dolor, gases…), ¿cuánto suele durar?',
        suggestions: [
          'Entre 30 minutos y una hora aproximadamente',
          'Varias horas, a veces hasta media tarde o noche',
          'Me dura prácticamente todo el día completo',
          'Depende del día: a veces poco y otras muchísimo',
        ],
        transition: 'Gracias por compartir todo esto conmigo. Con esta información ya puedo empezar a entender cómo responde tu digestión y qué patrones influyen más en tus molestias.',
      },
    ],
  },

  // ========== BLOQUE 2: EMOCIONAL ==========
  {
    id: 'emocional',
    name: 'Emocional',
    questions: [
      {
        id: 'emo_1',
        text: '¿Cómo describirías tu nivel de estrés en las últimas dos semanas?',
        suggestions: [
          'Estrés alto casi todos los días recientemente',
          'Estrés moderado pero constante a lo largo del día',
          'Momentos puntuales de estrés que puedo controlar',
          'Muy poco estrés o sensación general de tranquilidad',
        ],
        transition: 'Gracias. El nivel de estrés suele influir directamente en la digestión.',
      },
      {
        id: 'emo_2',
        text: '¿Sientes que tus emociones afectan a tu barriga o a tus digestiones?',
        suggestions: [
          'Sí, noto inflamación en días de mucha tensión emocional',
          'A veces, sobre todo cuando tengo preocupaciones fuertes',
          'Muy pocas veces siento una conexión directa entre ambas',
          'No noto relación, mis emociones no afectan tanto mi cuerpo',
        ],
        transition: 'Entiendo, esto me ayuda a ver cómo reacciona tu cuerpo frente a tus emociones.',
      },
      {
        id: 'emo_3',
        text: '¿Cómo te sientes contigo mismo/a cuando tu digestión no va bien?',
        suggestions: [
          'Me siento frustrado/a y con poca paciencia conmigo mismo/a',
          'Me desanimo porque siento que no tengo control del cuerpo',
          'Me afecta un poco, pero intento llevarlo con calma',
          'Casi no me afecta emocionalmente, lo gestiono bien',
        ],
        transition: 'Gracias por compartirlo. Entender tu vivencia emocional es clave.',
      },
      {
        id: 'emo_4',
        text: '¿Cómo han sido tus niveles de ansiedad últimamente?',
        suggestions: [
          'Ansiedad alta, especialmente en momentos de presión',
          'Ansiedad moderada que aparece de vez en cuando',
          'Ansiedad baja o casi inexistente en general',
          'Depende de la semana, tengo altibajos marcados',
        ],
        transition: 'Perfecto, ya voy viendo cómo se mueve tu estado interno.',
      },
      {
        id: 'emo_5',
        text: '¿Sueles notar tensión en el cuerpo (pecho, abdomen, cuello) cuando algo te preocupa?',
        suggestions: [
          'Sí, noto mucha tensión en el abdomen cuando me preocupo',
          'Siento presión en el pecho o en el estómago frecuentemente',
          'Solo en momentos muy concretos de estrés fuerte',
          'No suelo sentir tensión física cuando estoy preocupado/a',
        ],
        transition: 'Gracias por abrirte y compartir todo esto conmigo. Ya tengo una visión clara de cómo influyen tus emociones en tu digestión y en tu bienestar general.',
      },
    ],
  },

  // ========== BLOQUE 3: FÍSICO ==========
  {
    id: 'fisico',
    name: 'Físico',
    questions: [
      {
        id: 'fis_1',
        text: '¿Cómo describirías tu nivel de energía a lo largo del día?',
        suggestions: [
          'Energía baja casi todo el día, me cuesta activar el cuerpo',
          'Energía irregular: tengo subidas y bajadas marcadas',
          'Buena energía por la mañana y más cansancio por la tarde',
          'Energía estable durante todo el día en general',
        ],
        transition: 'Gracias. Tu nivel de energía me ayuda a entender cómo responde tu cuerpo a tu ritmo diario.',
      },
      {
        id: 'fis_2',
        text: '¿Cómo está siendo tu descanso nocturno últimamente?',
        suggestions: [
          'Me cuesta dormir y me despierto varias veces por la noche',
          'Duermo pero me levanto cansado/a, sin sensación de descanso',
          'Duermo bien algunos días, pero otros descanso muy mal',
          'Mi sueño es estable y me levanto con buena energía',
        ],
        transition: 'Perfecto. El descanso influye directamente en tu digestión y en tu estado emocional.',
      },
      {
        id: 'fis_3',
        text: '¿Sueles sentir tensión física en alguna parte del cuerpo? (cuello, espalda, pecho o abdomen)',
        suggestions: [
          'Sí, tensión constante en el abdomen o la zona del estómago',
          'Siento mucha tensión en cuello y espalda durante el día',
          'Tensión puntual cuando estoy estresado/a o preocupado/a',
          'Casi nunca siento tensión física general en el cuerpo',
        ],
        transition: 'Entendido. La tensión corporal puede influir en la inflamación y en la digestión.',
      },
      {
        id: 'fis_4',
        text: '¿Qué nivel de movimiento tienes en un día normal?',
        suggestions: [
          'Muy poco movimiento, paso muchas horas sentado/a',
          'Movimiento moderado: camino algo pero no hago ejercicio',
          'Actividad física regular varias veces por semana',
          'Trabajo físico o movimiento constante durante todo el día',
        ],
        transition: 'Perfecto, esto me ayuda a ajustar tus hábitos sin sobrecargar tu cuerpo.',
      },
      {
        id: 'fis_5',
        text: '¿Sientes que tu cuerpo retiene líquidos o se inflama más de lo normal?',
        suggestions: [
          'Sí, noto retención e inflamación en piernas, abdomen o manos',
          'A veces siento retención pero no es constante',
          'Muy poca retención, solo en días específicos',
          'No suelo tener retención ni inflamación corporal general',
        ],
        transition: 'Gracias por compartir todo esto. Con este bloque ya puedo entender mejor cómo responde tu cuerpo a tu ritmo diario y a tus niveles de energía.',
      },
    ],
  },

  // ========== BLOQUE 4: ALIMENTACIÓN ==========
  {
    id: 'alimentacion',
    name: 'Alimentación',
    questions: [
      {
        id: 'ali_1',
        text: '¿Cuál describirías como tu estilo de alimentación habitual?',
        suggestions: [
          'Comida variada intentando mantener una alimentación equilibrada',
          'Alimentación alta en proteínas al estilo fitness o similar',
          'Alimentación vegetariana o vegana en el día a día',
          'Como de todo sin restricciones ni reglas definidas',
        ],
        transition: 'Genial, esto me ayuda a adaptar tus menús sin cambiar tu estilo de vida.',
      },
      {
        id: 'ali_2',
        text: '¿Cómo suelen ser tus horarios de comida a lo largo del día?',
        suggestions: [
          'Hago comidas irregulares según el día y cómo vaya de tiempo',
          'Mantengo horarios fijos para desayunar, comer y cenar',
          'Suelo comer tarde o a deshora por mi ritmo de vida',
          'Hago ayuno intermitente o una ventana de alimentación corta',
        ],
        transition: 'Perfecto. Los horarios son clave para estabilizar tus digestiones.',
      },
      {
        id: 'ali_3',
        text: '¿Tiendes a comer rápido, despacio o depende del momento?',
        suggestions: [
          'Como muy rápido casi siempre, especialmente entre semana',
          'Suelo comer a un ritmo normal, sin mucha prisa',
          'Como despacio y trato de masticar bien los alimentos',
          'Depende del día, a veces con calma y a veces con prisa',
        ],
        transition: 'Gracias. La velocidad al comer afecta directamente la hinchazón.',
      },
      {
        id: 'ali_4',
        text: '¿Con qué frecuencia recurres a alimentos procesados, fritos o comidas muy pesadas?',
        suggestions: [
          'Muy a menudo, por comodidad o falta de tiempo para cocinar',
          'Algunas veces por semana dependiendo de mi rutina diaria',
          'Solo en fines de semana o momentos puntuales',
          'Rara vez, prácticamente no consumo alimentos pesados',
        ],
        transition: 'Perfecto. Esto me ayuda a ver qué tipo de comidas pueden estar influyendo más en tu digestión.',
      },
      {
        id: 'ali_5',
        text: '¿Sueles repetir mucho los mismos alimentos durante la semana?',
        suggestions: [
          'Sí, suelo comer siempre lo mismo por comodidad o costumbre',
          'Repito bastantes alimentos durante la semana',
          'Intento variar pero a veces termino comiendo cosas similares',
          'Varío bastante, me gusta cambiar mis comidas a menudo',
        ],
        transition: 'Gracias por compartirlo. Con este bloque ya puedo empezar a ver qué tipo de alimentación encaja mejor contigo sin presión ni restricciones.',
      },
    ],
  },

  // ========== BLOQUE 5: SOCIAL ==========
  {
    id: 'social',
    name: 'Social',
    questions: [
      {
        id: 'soc_1',
        text: '¿Con qué frecuencia sueles comer fuera de casa (bares, restaurantes, comida rápida, pedidos)?',
        suggestions: [
          'Varias veces por semana debido a mi trabajo o rutina diaria',
          'Una o dos veces por semana como parte de mi vida social',
          'Solo en fines de semana o momentos puntuales',
          'Casi nunca como fuera, la mayoría de comidas son en casa',
        ],
        transition: 'Perfecto. Esto me ayuda a ajustar tus recomendaciones sin limitar tu vida social.',
      },
      {
        id: 'soc_2',
        text: '¿Cómo son normalmente tus fines de semana en cuanto a comida y horarios?',
        suggestions: [
          'Más desordenados: suelo cambiar horarios y tipos de comida',
          'Bastante similares a los días entre semana',
          'Salgo a comer o cenar y cambio completamente la rutina',
          'Depende mucho del plan que tenga cada fin de semana',
        ],
        transition: 'Gracias. Los fines de semana suelen marcar muchos patrones digestivos.',
      },
      {
        id: 'soc_3',
        text: '¿Sientes que tu entorno (pareja, familia, amigos) influye en cómo comes?',
        suggestions: [
          'Sí, mi entorno influye mucho en mis decisiones al comer',
          'A veces me dejo llevar por lo que comen los demás',
          'Muy poco, suelo mantener mis decisiones sin problema',
          'Depende de la situación, pero a veces sí me afecta',
        ],
        transition: 'Entiendo. El entorno es un factor clave para evitar recaídas.',
      },
      {
        id: 'soc_4',
        text: '¿Te sientes presionado/a socialmente a comer o beber cosas que no te sientan bien?',
        suggestions: [
          'Sí, me cuesta decir que no en reuniones sociales',
          'A veces, dependiendo de la situación o la compañía',
          'Muy pocas veces, suelo manejarlo bien',
          'No, nunca me siento presionado/a en lo social',
        ],
        transition: 'Perfecto. Esto nos ayudará a planificar estrategias para que no te afecte tanto.',
      },
      {
        id: 'soc_5',
        text: '¿Sueles sentirte diferente o incómodo/a por tus hábitos cuando estás con otras personas?',
        suggestions: [
          'Sí, me siento diferente y a veces me da vergüenza',
          'A veces, dependiendo del grupo o la situación',
          'Muy pocas veces, lo llevo bastante bien',
          'No, no me afecta en absoluto estar con otras personas',
        ],
        transition: 'Gracias por ser tan claro/a en este bloque. Con esta información puedo adaptar tu acompañamiento a tu vida social sin limitarte ni hacerte sentir fuera de lugar.',
      },
    ],
  },

  // ========== BLOQUE 6: LABORAL ==========
  {
    id: 'laboral',
    name: 'Laboral',
    questions: [
      {
        id: 'lab_1',
        text: '¿Cómo describirías tu tipo de trabajo o actividad diaria principal?',
        suggestions: [
          'Trabajo sedentario, paso muchas horas sentado/a',
          'Trabajo activo con bastante movimiento físico diario',
          'Jornada mixta: parte sentado/a y parte en movimiento',
          'Trabajo con horarios muy cambiantes o irregulares',
        ],
        transition: 'Perfecto, esto me ayuda a ver cómo responde tu cuerpo a tu tipo de actividad.',
      },
      {
        id: 'lab_2',
        text: '¿Cómo son tus niveles de estrés durante tu jornada laboral?',
        suggestions: [
          'Estrés alto casi todos los días en el trabajo',
          'Estrés moderado que puedo manejar la mayoría de días',
          'Estrés bajo o solo en momentos puntuales',
          'Depende mucho de la carga laboral de cada día',
        ],
        transition: 'Gracias. El estrés laboral suele ser uno de los mayores detonantes digestivos.',
      },
      {
        id: 'lab_3',
        text: '¿Tienes tiempo para comer con calma durante tu día laboral?',
        suggestions: [
          'No, suelo comer rápido por falta de tiempo',
          'A veces puedo comer tranquilo/a, pero no siempre',
          'Sí, tengo tiempo suficiente para comer sin prisa',
          'Depende del día, hay jornadas muy impredecibles',
        ],
        transition: 'Entendido. Esto influye muchísimo en tu hinchazón y en tu digestión.',
      },
      {
        id: 'lab_4',
        text: '¿Puedes mantener horarios más o menos estables para comer durante la semana?',
        suggestions: [
          'No, mis horarios cambian mucho cada día',
          'Más o menos, aunque a veces se descolocan',
          'Sí, mis horarios son bastante estables entre semana',
          'Mis comidas dependen totalmente del ritmo laboral',
        ],
        transition: 'Perfecto. Esto me ayuda a ajustar tus recomendaciones sin que supongan un esfuerzo extra.',
      },
      {
        id: 'lab_5',
        text: '¿Cómo te sientes físicamente al final de tu jornada laboral?',
        suggestions: [
          'Muy cansado/a, siento agotamiento físico y mental',
          'Moderadamente cansado/a, pero lo llevo bien',
          'Con bastante energía incluso después de trabajar',
          'Depende mucho del día y de la carga de trabajo',
        ],
        transition: 'Gracias por compartirlo. Con este bloque puedo ajustar tu plan a tu realidad diaria, evitando exigencias que no encajarían con tu ritmo de vida.',
      },
    ],
  },

  // ========== BLOQUE 7: BIENESTAR ==========
  {
    id: 'bienestar',
    name: 'Bienestar',
    questions: [
      {
        id: 'bie_1',
        text: '¿Cómo describirías tu nivel de calma o equilibrio interior en el día a día?',
        suggestions: [
          'Me cuesta mucho encontrar momentos de calma real',
          'Tengo algo de calma, pero mi mente va muy acelerada',
          'Consigo cierta tranquilidad, aunque depende del día',
          'Me siento bastante equilibrado/a en general',
        ],
        transition: 'Gracias, esto me ayuda a entender cómo se mueve tu estado interno.',
      },
      {
        id: 'bie_2',
        text: '¿Sueles practicar alguna actividad que te ayude a relajarte? (respiración, caminar, meditar, etc.)',
        suggestions: [
          'Sí, practico respiración, meditación o técnicas de calma',
          'Camino o salgo a despejarme cuando lo necesito',
          'A veces hago algo para relajarme, pero no es constante',
          'No practico nada concreto para relajarme',
        ],
        transition: 'Perfecto. Esto influye mucho en tu digestión y en tu energía.',
      },
      {
        id: 'bie_3',
        text: '¿Te resulta fácil desconectar mentalmente al final del día?',
        suggestions: [
          'Me cuesta mucho desconectar, sigo pensando en todo',
          'A veces lo consigo, pero depende del día',
          'Lo logro sin demasiada dificultad la mayoría de días',
          'Desconecto muy bien, no suelo darle vueltas a las cosas',
        ],
        transition: 'Entiendo. Esto afecta directamente al estado del sistema nervioso.',
      },
      {
        id: 'bie_4',
        text: '¿Sueles sentirte conectado/a contigo mismo/a, con tus emociones y con tu cuerpo?',
        suggestions: [
          'Me cuesta mucho conectar conmigo y entender cómo me siento',
          'A veces conecto, pero suele ser en momentos puntuales',
          'Suelo estar consciente de mis emociones y sensaciones',
          'Sí, tengo bastante conexión con lo que siento y necesito',
        ],
        transition: 'Gracias. Esto me ayuda a calibrar qué tipo de apoyo te funcionará mejor.',
      },
      {
        id: 'bie_5',
        text: '¿Dirías que necesitas más momentos de paz o de descanso mental en tu vida?',
        suggestions: [
          'Sí, necesito urgentemente más paz y desconexión',
          'Creo que sí, me vendría bien tener más momentos para mí',
          'A veces, pero lo gestiono relativamente bien',
          'No lo veo necesario, ya tengo suficiente calma interna',
        ],
        transition: 'Gracias por abrirte en este bloque. Con esto puedo adaptar tu acompañamiento también a tu bienestar interno, no solo a tu digestión.',
      },
    ],
  },

  // ========== BLOQUE 8: OBJETIVOS ==========
  {
    id: 'objetivos',
    name: 'Objetivos',
    questions: [
      {
        id: 'obj_1',
        text: '¿Cuál es tu objetivo principal al estar aquí conmigo?',
        suggestions: [
          'Reducir mi hinchazón y sentirme más ligero/a cada día',
          'Mejorar mis digestiones y evitar molestias después de comer',
          'Regular mi tránsito y tener una digestión más estable',
          'Ganar energía y sentirme mejor físicamente en general',
        ],
        transition: 'Perfecto. Esto define la dirección principal de tu acompañamiento.',
      },
      {
        id: 'obj_2',
        text: '¿Qué tan urgente sientes que es para ti conseguir este objetivo?',
        suggestions: [
          'Muy urgente, necesito un cambio cuanto antes',
          'Bastante importante, quiero mejorar lo antes posible',
          'Importante, pero puedo avanzar a un ritmo tranquilo',
          'No es urgente, quiero mejorar paso a paso',
        ],
        transition: 'Gracias. Esto me ayuda a ajustar el ritmo del proceso a tu necesidad real.',
      },
      {
        id: 'obj_3',
        text: '¿Qué es lo que más te frustra de tu situación actual?',
        suggestions: [
          'La sensación de hinchazón constante que no puedo controlar',
          'Comer algo y no saber si me va a sentar bien o mal',
          'La falta de energía y la sensación de agotamiento',
          'Haber probado cosas y no ver resultados duraderos',
        ],
        transition: 'Gracias por compartirlo. Esto ayuda a encontrar soluciones más específicas para ti.',
      },
      {
        id: 'obj_4',
        text: '¿Qué te haría sentir que realmente estás avanzando?',
        suggestions: [
          'Notar menos inflamación al final del día',
          'Poder comer sin miedo ni molestias digestivas fuertes',
          'Tener más energía para hacer mis actividades diarias',
          'Sentirme más ligero/a y con mejor bienestar general',
        ],
        transition: 'Perfecto. Esto me permite entender qué señales de progreso son importantes para ti.',
      },
      {
        id: 'obj_5',
        text: '¿Cuánto compromiso estás dispuesto/a a poner en este proceso?',
        suggestions: [
          'Estoy totalmente comprometido/a, quiero mejorar de verdad',
          'Estoy dispuesto/a a hacer cambios importantes si son realistas',
          'Quiero avanzar, pero con pasos pequeños y sostenibles',
          'Quiero mejorar, pero me cuesta mantener la constancia',
        ],
        transition: 'Gracias. Con este bloque ya puedo adaptar tu acompañamiento al ritmo, la motivación y el objetivo que tienes en mente.',
      },
    ],
  },

  // ========== BLOQUE 9: HÁBITOS ==========
  {
    id: 'habitos',
    name: 'Hábitos',
    questions: [
      {
        id: 'hab_1',
        text: '¿Cómo describirías tu nivel de constancia cuando intentas cambiar algún hábito?',
        suggestions: [
          'Me cuesta mantener cambios, suelo abandonar fácilmente',
          'Puedo mantener hábitos un tiempo, pero luego me cuesta seguir',
          'Soy constante si tengo apoyo o seguimiento',
          'Soy bastante constante, mantengo lo que me propongo',
        ],
        transition: 'Gracias. Esto me ayuda a ajustar el tipo de apoyo que te daré cada día.',
      },
      {
        id: 'hab_2',
        text: '¿Tienes alguna rutina diaria establecida (mañana, tarde o noche)?',
        suggestions: [
          'No tengo rutinas, cada día es distinto y caótico',
          'Tengo algunas rutinas pero no siempre las cumplo',
          'Sí, tengo rutinas básicas que suelo mantener',
          'Tengo rutinas muy establecidas y organizadas',
        ],
        transition: 'Perfecto. Esto me ayuda a ver dónde integrar pequeños hábitos sin presionarte.',
      },
      {
        id: 'hab_3',
        text: '¿Qué hábitos saludables ya has intentado en el pasado?',
        suggestions: [
          'He intentado llevar una alimentación más ordenada',
          'He probado hacer ejercicio o caminar con regularidad',
          'He intentado mejorar mi sueño o mis horarios',
          'He probado muchos hábitos pero ninguno me duró mucho',
        ],
        transition: 'Entiendo. Con esto evito repetir cosas que ya no te funcionaron.',
      },
      {
        id: 'hab_4',
        text: '¿Qué es lo que más te cuesta mantener cuando intentas mejorar tu bienestar?',
        suggestions: [
          'Ser constante cuando no veo resultados rápidos',
          'Organizarme con comidas y horarios durante la semana',
          'Mantener la motivación en días de estrés o cansancio',
          'Recordar los pequeños hábitos que debo aplicar',
        ],
        transition: 'Gracias. Esto me permite diseñar recordatorios y hábitos adaptados a ti.',
      },
      {
        id: 'hab_5',
        text: '¿Cuánto tiempo real al día crees que puedes dedicar a mejorar tu bienestar?',
        suggestions: [
          'Muy poco tiempo, días bastante complicados',
          'Unos minutos al día, pero de forma constante',
          'Entre 10 y 20 minutos diarios sin problema',
          'Puedo dedicar más tiempo si lo necesito realmente',
        ],
        transition: 'Perfecto. Con este bloque puedo adaptar tus hábitos y recordatorios a tu ritmo real, sin exigirte más de lo que puedes dar.',
      },
    ],
  },

  // ========== BLOQUE 10: IDENTIDAD ==========
  {
    id: 'identidad',
    name: 'Identidad',
    questions: [
      {
        id: 'ide_1',
        text: '¿En qué etapa de tu vida sientes que te encuentras ahora mismo?',
        suggestions: [
          'En un momento de cambio y necesidad de mejorar mi salud',
          'En una etapa estable pero con ganas de avanzar más',
          'En un periodo complicado a nivel personal o emocional',
          'En una etapa de crecimiento personal y enfoque en mí',
        ],
        transition: 'Gracias, esto me ayuda a entender desde dónde estás empezando.',
      },
      {
        id: 'ide_2',
        text: '¿Cómo describirías tu estilo de vida actual en general?',
        suggestions: [
          'Bastante acelerado, con muy poco tiempo para mí',
          'Activo pero con algunos momentos de calma y descanso',
          'Relativamente tranquilo, con una rutina estable',
          'Muy variable, mis días cambian mucho de un día a otro',
        ],
        transition: 'Perfecto. Esto influye en cómo adaptaremos tus objetivos y hábitos diarios.',
      },
      {
        id: 'ide_3',
        text: '¿Cómo te ves a ti mismo/a en cuanto a salud y bienestar?',
        suggestions: [
          'Me veo bastante desalineado/a y quiero mejorar',
          'Siento que tengo cosas por mejorar pero estoy motivado/a',
          'Me considero una persona bastante saludable en general',
          'No lo tengo claro, mi percepción cambia según el día',
        ],
        transition: 'Entiendo. Esto me ayuda a conocer tu punto de partida interno.',
      },
      {
        id: 'ide_4',
        text: '¿Cómo describirías tu relación contigo mismo/a en este momento?',
        suggestions: [
          'Me cuesta cuidarme y priorizarme en mi día a día',
          'Intento cuidarme, pero a veces me dejo en segundo plano',
          'Tengo una relación bastante buena conmigo mismo/a',
          'Depende del momento, tengo altibajos frecuentes',
        ],
        transition: 'Gracias por compartirlo. Esta parte es clave para el acompañamiento emocional.',
      },
      {
        id: 'ide_5',
        text: '¿Hay algo en tu vida personal que esté influyendo en tu bienestar en este momento?',
        suggestions: [
          'Sí, estoy pasando por cambios o situaciones difíciles',
          'Algunas cosas me influyen, pero intento gestionarlas',
          'Pocas cosas afectan mi bienestar actualmente',
          'No siento que haya algo personal afectándome ahora mismo',
        ],
        transition: 'Perfecto. Con este bloque ya tengo una visión clara de tu contexto vital y cómo acompañarte de la forma más humana posible.',
      },
    ],
  },

  // ========== BLOQUE 11: HISTORIAL ==========
  {
    id: 'historial',
    name: 'Historial',
    questions: [
      {
        id: 'his_1',
        text: '¿Tienes algún diagnóstico digestivo previo que debamos tener en cuenta?',
        suggestions: [
          'Sí, tengo diagnóstico de colon irritable o SII',
          'Gastritis, reflujo o problemas estomacales recurrentes',
          'Intolerancias o sospechas de intolerancias alimentarias',
          'No tengo diagnósticos digestivos conocidos',
        ],
        transition: 'Perfecto, esta información es muy importante para personalizar tu acompañamiento.',
      },
      {
        id: 'his_2',
        text: '¿Actualmente tomas algún medicamento de forma frecuente?',
        suggestions: [
          'Antiácidos, protectores gástricos o medicación digestiva',
          'Ansiolíticos, antidepresivos o reguladores del ánimo',
          'Anticonceptivos, tratamientos hormonales o similares',
          'No tomo ningún medicamento de forma regular',
        ],
        transition: 'Gracias. Muchos medicamentos pueden influir en la digestión y en la energía diaria.',
      },
      {
        id: 'his_3',
        text: '¿Has tomado antibióticos en los últimos meses?',
        suggestions: [
          'Sí, he tomado antibióticos en los últimos treinta días',
          'Sí, tomé antibióticos hace dos o tres meses',
          'Hace bastante tiempo que no tomo antibióticos',
          'No recuerdo haber tomado antibióticos recientemente',
        ],
        transition: 'Perfecto. Esto ayuda a entender cambios en tu flora intestinal.',
      },
      {
        id: 'his_4',
        text: '¿Has tenido alguna operación o intervención que pueda influir en tu digestión?',
        suggestions: [
          'Sí, he tenido operaciones abdominales o digestivas',
          'He tenido intervenciones pero no afectaron mi digestión',
          'Ninguna operación que haya influido en mi sistema digestivo',
          'Tuve operaciones hace años pero sin cambios digestivos',
        ],
        transition: 'Gracias por compartirlo. Esto me permite ajustar recomendaciones con más precisión.',
      },
      {
        id: 'his_5',
        text: '¿Tienes alguna alergia, intolerancia o sensibilidad alimentaria conocida?',
        suggestions: [
          'Sí, alergias o intolerancias diagnosticadas por un profesional',
          'Sensibilidades que sospecho pero no están confirmadas',
          'No tengo alergias ni intolerancias conocidas',
          'Estoy en proceso de averiguarlo o haciendo pruebas',
        ],
        transition: 'Gracias. Con esta información puedo asegurarme de que tu acompañamiento sea seguro, adaptado y coherente con tu situación física.',
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Total de preguntas del onboarding
 */
export const TOTAL_ONBOARDING_QUESTIONS = ONBOARDING_BLOCKS.reduce(
  (total, block) => total + block.questions.length,
  0
);

/**
 * Obtiene el bloque y pregunta dado un número de turno (1-indexed)
 * Turno 1 = Bienvenida
 * Turno 2 = Pregunta 1 del bloque 1
 * ...
 */
export function getQuestionByTurn(turn: number): {
  blockIndex: number;
  questionIndex: number;
  block: OnboardingBlock;
  question: OnboardingQuestion;
  isFirstOfBlock: boolean;
  isLastOfBlock: boolean;
} | null {
  if (turn < 2) return null; // Turno 1 es bienvenida

  const questionNumber = turn - 1; // Turno 2 = pregunta 1, etc.
  let count = 0;

  for (let blockIndex = 0; blockIndex < ONBOARDING_BLOCKS.length; blockIndex++) {
    const block = ONBOARDING_BLOCKS[blockIndex]!;
    for (let questionIndex = 0; questionIndex < block.questions.length; questionIndex++) {
      count++;
      if (count === questionNumber) {
        const question = block.questions[questionIndex]!;
        return {
          blockIndex,
          questionIndex,
          block,
          question,
          isFirstOfBlock: questionIndex === 0,
          isLastOfBlock: questionIndex === block.questions.length - 1,
        };
      }
    }
  }

  return null; // Ya terminamos todas las preguntas
}

/**
 * Obtiene la cuña informativa del bloque
 */
export function getInfoWedge(blockId: string): string | null {
  return INFO_WEDGES[blockId as keyof typeof INFO_WEDGES] || null;
}

/**
 * Construye las instrucciones dinámicas para el onboarding según el turno
 */
export function buildOnboardingInstructions(turn: number, userName: string): string {
  let instructions = `
# CONTEXTO DEL ONBOARDING
Estás realizando el onboarding inicial con ${userName}. 
Este es un cuestionario de 55 preguntas dividido en 11 bloques temáticos.
Tu objetivo es recopilar información detallada para personalizar el acompañamiento.

# REGLAS IMPORTANTES
1. SOLO haz UNA pregunta por mensaje
2. Usa las transiciones entre preguntas para que fluya naturalmente
3. Si el usuario responde con sus propias palabras, acéptalo y continúa
4. Si el usuario pregunta algo, responde brevemente y vuelve al cuestionario
5. Mantén un tono cálido, profesional y empático

`;

  if (turn === 1) {
    // Mensaje de bienvenida
    instructions += `
# TURNO 1: BIENVENIDA
Envía EXACTAMENTE este mensaje de bienvenida (reemplazando {nombre} por "${userName}"):

${PRO_WELCOME_MESSAGE.replace('{nombre}', userName)}
`;
    return instructions;
  }

  const questionInfo = getQuestionByTurn(turn);

  if (!questionInfo) {
    // Ya terminamos todas las preguntas
    instructions += `
# ONBOARDING COMPLETADO
El usuario ha completado todas las 55 preguntas.
Envía el mensaje de cierre y transición al chat 24/7:

${PRO_COMPLETION_MESSAGE}
`;
    return instructions;
  }

  const { block, question, isFirstOfBlock, isLastOfBlock, questionIndex } = questionInfo;

  // Si es la primera pregunta del bloque, añadir cuña informativa
  if (isFirstOfBlock) {
    // const wedge = getInfoWedge(block.id); // REMOVED: Frontend handles the wedge
    instructions += `
# INICIO DE BLOQUE: ${block.name.toUpperCase()}
Haz esta pregunta:
`;
  } else {
    // Obtener la transición de la pregunta anterior (safe access)
    const prevQuestion = block.questions[questionIndex - 1];
    if (prevQuestion) {
      instructions += `
# TURNO ${turn}: PREGUNTA ${questionIndex + 1} DE BLOQUE ${block.name.toUpperCase()}
Primero usa esta transición de la respuesta anterior:

"${prevQuestion.transition}"

Luego haz esta pregunta:
`;
    }
  }

  instructions += `
**PREGUNTA:**
"${question.text}"

(El usuario verá opciones rápidas en su pantalla, tú solo haz la pregunta)
`;

  if (isLastOfBlock) {
    instructions += `
**NOTA:** Esta es la ÚLTIMA pregunta del bloque "${block.name}".
Después de que responda, usa la transición final antes de pasar al siguiente bloque.
`;
  }

  return instructions;
}
