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

  // EMOCIONAL
  emo_1: [
    { text: 'Estrés alto casi todos los días recientemente', shortText: 'Alto' },
    { text: 'Estrés moderado pero constante a lo largo del día', shortText: 'Moderado' },
    { text: 'Momentos puntuales de estrés que puedo controlar', shortText: 'Puntual' },
    { text: 'Muy poco estrés o sensación general de tranquilidad', shortText: 'Bajo' },
  ],
  emo_2: [
    { text: 'Sí, noto inflamación en días de mucha tensión emocional', shortText: 'Sí, mucha' },
    { text: 'A veces, sobre todo cuando tengo preocupaciones fuertes', shortText: 'A veces' },
    { text: 'Muy pocas veces siento una conexión directa entre ambas', shortText: 'Pocas veces' },
    { text: 'No noto relación, mis emociones no afectan tanto mi cuerpo', shortText: 'No' },
  ],
  emo_3: [
    { text: 'Me siento frustrado/a y con poca paciencia conmigo mismo/a', shortText: 'Frustrado/a' },
    { text: 'Me desanimo porque siento que no tengo control del cuerpo', shortText: 'Desanimado/a' },
    { text: 'Me afecta un poco, pero intento llevarlo con calma', shortText: 'Me afecta poco' },
    { text: 'Casi no me afecta emocionalmente, lo gestiono bien', shortText: 'No me afecta' },
  ],
  emo_4: [
    { text: 'Ansiedad alta, especialmente en momentos de presión', shortText: 'Alta' },
    { text: 'Ansiedad moderada que aparece de vez en cuando', shortText: 'Moderada' },
    { text: 'Ansiedad baja o casi inexistente en general', shortText: 'Baja' },
    { text: 'Depende de la semana, tengo altibajos marcados', shortText: 'Variable' },
  ],
  emo_5: [
    { text: 'Sí, noto mucha tensión en el abdomen cuando me preocupo', shortText: 'Sí, abdomen' },
    { text: 'Siento presión en el pecho o en el estómago frecuentemente', shortText: 'Pecho/estómago' },
    { text: 'Solo en momentos muy concretos de estrés fuerte', shortText: 'Puntual' },
    { text: 'No suelo sentir tensión física cuando estoy preocupado/a', shortText: 'No' },
  ],

  // FÍSICO
  fis_1: [
    { text: 'Energía baja casi todo el día, me cuesta activar el cuerpo', shortText: 'Baja' },
    { text: 'Energía irregular: tengo subidas y bajadas marcadas', shortText: 'Irregular' },
    { text: 'Buena energía por la mañana y más cansancio por la tarde', shortText: 'Bien mañana' },
    { text: 'Energía estable durante todo el día en general', shortText: 'Estable' },
  ],
  fis_2: [
    { text: 'Me cuesta dormir y me despierto varias veces por la noche', shortText: 'Mal sueño' },
    { text: 'Duermo pero me levanto cansado/a, sin sensación de descanso', shortText: 'Cansado/a' },
    { text: 'Duermo bien algunos días, pero otros descanso muy mal', shortText: 'Irregular' },
    { text: 'Mi sueño es estable y me levanto con buena energía', shortText: 'Buen sueño' },
  ],
  fis_3: [
    { text: 'Sí, tensión constante en el abdomen o la zona del estómago', shortText: 'Abdomen' },
    { text: 'Siento mucha tensión en cuello y espalda durante el día', shortText: 'Cuello/espalda' },
    { text: 'Tensión puntual cuando estoy estresado/a o preocupado/a', shortText: 'Puntual' },
    { text: 'Casi nunca siento tensión física general en el cuerpo', shortText: 'No' },
  ],
  fis_4: [
    { text: 'Muy poco movimiento, paso muchas horas sentado/a', shortText: 'Sedentario' },
    { text: 'Movimiento moderado: camino algo pero no hago ejercicio', shortText: 'Moderado' },
    { text: 'Actividad física regular varias veces por semana', shortText: 'Activo' },
    { text: 'Trabajo físico o movimiento constante durante todo el día', shortText: 'Muy activo' },
  ],
  fis_5: [
    { text: 'Sí, noto retención e inflamación en piernas, abdomen o manos', shortText: 'Sí' },
    { text: 'A veces siento retención pero no es constante', shortText: 'A veces' },
    { text: 'Muy poca retención, solo en días específicos', shortText: 'Poca' },
    { text: 'No suelo tener retención ni inflamación corporal general', shortText: 'No' },
  ],

  // ALIMENTACIÓN
  ali_1: [
    { text: 'Comida variada intentando mantener una alimentación equilibrada', shortText: 'Equilibrada' },
    { text: 'Alimentación alta en proteínas al estilo fitness o similar', shortText: 'Proteica' },
    { text: 'Alimentación vegetariana o vegana en el día a día', shortText: 'Veggie' },
    { text: 'Como de todo sin restricciones ni reglas definidas', shortText: 'De todo' },
  ],
  ali_2: [
    { text: 'Hago comidas irregulares según el día y cómo vaya de tiempo', shortText: 'Irregulares' },
    { text: 'Mantengo horarios fijos para desayunar, comer y cenar', shortText: 'Fijos' },
    { text: 'Suelo comer tarde o a deshora por mi ritmo de vida', shortText: 'Tarde' },
    { text: 'Hago ayuno intermitente o una ventana de alimentación corta', shortText: 'Ayuno' },
  ],
  ali_3: [
    { text: 'Como muy rápido casi siempre, especialmente entre semana', shortText: 'Rápido' },
    { text: 'Suelo comer a un ritmo normal, sin mucha prisa', shortText: 'Normal' },
    { text: 'Como despacio y trato de masticar bien los alimentos', shortText: 'Despacio' },
    { text: 'Depende del día, a veces con calma y a veces con prisa', shortText: 'Variable' },
  ],
  ali_4: [
    { text: 'Muy a menudo, por comodidad o falta de tiempo para cocinar', shortText: 'A menudo' },
    { text: 'Algunas veces por semana dependiendo de mi rutina diaria', shortText: 'A veces' },
    { text: 'Solo en fines de semana o momentos puntuales', shortText: 'Fines de semana' },
    { text: 'Rara vez, prácticamente no consumo alimentos pesados', shortText: 'Rara vez' },
  ],
  ali_5: [
    { text: 'Sí, suelo comer siempre lo mismo por comodidad o costumbre', shortText: 'Sí' },
    { text: 'Repito bastantes alimentos durante la semana', shortText: 'Bastante' },
    { text: 'Intento variar pero a veces termino comiendo cosas similares', shortText: 'Intento variar' },
    { text: 'Varío bastante, me gusta cambiar mis comidas a menudo', shortText: 'Varío' },
  ],

  // SOCIAL
  soc_1: [
    { text: 'Varias veces por semana debido a mi trabajo o rutina diaria', shortText: 'Varias veces' },
    { text: 'Una o dos veces por semana como parte de mi vida social', shortText: '1-2 veces' },
    { text: 'Solo en fines de semana o momentos puntuales', shortText: 'Fines de semana' },
    { text: 'Casi nunca como fuera, la mayoría de comidas son en casa', shortText: 'Casi nunca' },
  ],
  soc_2: [
    { text: 'Más desordenados: suelo cambiar horarios y tipos de comida', shortText: 'Desordenados' },
    { text: 'Bastante similares a los días entre semana', shortText: 'Similares' },
    { text: 'Salgo a comer o cenar y cambio completamente la rutina', shortText: 'Cambio rutina' },
    { text: 'Depende mucho del plan que tenga cada fin de semana', shortText: 'Depende' },
  ],
  soc_3: [
    { text: 'Sí, mi entorno influye mucho en mis decisiones al comer', shortText: 'Sí, mucho' },
    { text: 'A veces me dejo llevar por lo que comen los demás', shortText: 'A veces' },
    { text: 'Muy poco, suelo mantener mis decisiones sin problema', shortText: 'Poco' },
    { text: 'Depende de la situación, pero a veces sí me afecta', shortText: 'Depende' },
  ],
  soc_4: [
    { text: 'Sí, me cuesta decir que no en reuniones sociales', shortText: 'Sí' },
    { text: 'A veces, dependiendo de la situación o la compañía', shortText: 'A veces' },
    { text: 'Muy pocas veces, suelo manejarlo bien', shortText: 'Pocas veces' },
    { text: 'No, nunca me siento presionado/a en lo social', shortText: 'No' },
  ],
  soc_5: [
    { text: 'Sí, me siento diferente y a veces me da vergüenza', shortText: 'Sí' },
    { text: 'A veces, dependiendo del grupo o la situación', shortText: 'A veces' },
    { text: 'Muy pocas veces, lo llevo bastante bien', shortText: 'Pocas veces' },
    { text: 'No, no me afecta en absoluto estar con otras personas', shortText: 'No' },
  ],

  // LABORAL
  lab_1: [
    { text: 'Trabajo sedentario, paso muchas horas sentado/a', shortText: 'Sedentario' },
    { text: 'Trabajo activo con bastante movimiento físico diario', shortText: 'Activo' },
    { text: 'Jornada mixta: parte sentado/a y parte en movimiento', shortText: 'Mixto' },
    { text: 'Trabajo con horarios muy cambiantes o irregulares', shortText: 'Irregular' },
  ],
  lab_2: [
    { text: 'Estrés alto casi todos los días en el trabajo', shortText: 'Alto' },
    { text: 'Estrés moderado que puedo manejar la mayoría de días', shortText: 'Moderado' },
    { text: 'Estrés bajo o solo en momentos puntuales', shortText: 'Bajo' },
    { text: 'Depende mucho de la carga laboral de cada día', shortText: 'Variable' },
  ],
  lab_3: [
    { text: 'No, suelo comer rápido por falta de tiempo', shortText: 'No' },
    { text: 'A veces puedo comer tranquilo/a, pero no siempre', shortText: 'A veces' },
    { text: 'Sí, tengo tiempo suficiente para comer sin prisa', shortText: 'Sí' },
    { text: 'Depende del día, hay jornadas muy impredecibles', shortText: 'Depende' },
  ],
  lab_4: [
    { text: 'No, mis horarios cambian mucho cada día', shortText: 'No' },
    { text: 'Más o menos, aunque a veces se descolocan', shortText: 'Más o menos' },
    { text: 'Sí, mis horarios son bastante estables entre semana', shortText: 'Sí' },
    { text: 'Mis comidas dependen totalmente del ritmo laboral', shortText: 'Depende' },
  ],
  lab_5: [
    { text: 'Muy cansado/a, siento agotamiento físico y mental', shortText: 'Muy cansado/a' },
    { text: 'Moderadamente cansado/a, pero lo llevo bien', shortText: 'Moderado' },
    { text: 'Con bastante energía incluso después de trabajar', shortText: 'Con energía' },
    { text: 'Depende mucho del día y de la carga de trabajo', shortText: 'Depende' },
  ],

  // BIENESTAR
  bie_1: [
    { text: 'Me cuesta mucho encontrar momentos de calma real', shortText: 'Me cuesta' },
    { text: 'Tengo algo de calma, pero mi mente va muy acelerada', shortText: 'Mente acelerada' },
    { text: 'Consigo cierta tranquilidad, aunque depende del día', shortText: 'Tranquilidad' },
    { text: 'Me siento bastante equilibrado/a en general', shortText: 'Equilibrado/a' },
  ],
  bie_2: [
    { text: 'Sí, practico respiración, meditación o técnicas de calma', shortText: 'Sí' },
    { text: 'Camino o salgo a despejarme cuando lo necesito', shortText: 'Camino' },
    { text: 'A veces hago algo para relajarme, pero no es constante', shortText: 'A veces' },
    { text: 'No practico nada concreto para relajarme', shortText: 'No' },
  ],
  bie_3: [
    { text: 'Me cuesta mucho desconectar, sigo pensando en todo', shortText: 'Me cuesta' },
    { text: 'A veces lo consigo, pero depende del día', shortText: 'A veces' },
    { text: 'Lo logro sin demasiada dificultad la mayoría de días', shortText: 'Lo logro' },
    { text: 'Desconecto muy bien, no suelo darle vueltas a las cosas', shortText: 'Bien' },
  ],
  bie_4: [
    { text: 'Me cuesta mucho conectar conmigo y entender cómo me siento', shortText: 'Me cuesta' },
    { text: 'A veces conecto, pero suele ser en momentos puntuales', shortText: 'A veces' },
    { text: 'Suelo estar consciente de mis emociones y sensaciones', shortText: 'Consciente' },
    { text: 'Sí, tengo bastante conexión con lo que siento y necesito', shortText: 'Sí' },
  ],
  bie_5: [
    { text: 'Sí, necesito urgentemente más paz y desconexión', shortText: 'Sí, urgente' },
    { text: 'Creo que sí, me vendría bien tener más momentos para mí', shortText: 'Sí' },
    { text: 'A veces, pero lo gestiono relativamente bien', shortText: 'A veces' },
    { text: 'No lo veo necesario, ya tengo suficiente calma interna', shortText: 'No' },
  ],

  // OBJETIVOS
  obj_1: [
    { text: 'Reducir mi hinchazón y sentirme más ligero/a cada día', shortText: 'Hinchazón' },
    { text: 'Mejorar mis digestiones y evitar molestias después de comer', shortText: 'Digestiones' },
    { text: 'Regular mi tránsito y tener una digestión más estable', shortText: 'Tránsito' },
    { text: 'Ganar energía y sentirme mejor físicamente en general', shortText: 'Energía' },
  ],
  obj_2: [
    { text: 'Muy urgente, necesito un cambio cuanto antes', shortText: 'Muy urgente' },
    { text: 'Bastante importante, quiero mejorar lo antes posible', shortText: 'Importante' },
    { text: 'Importante, pero puedo avanzar a un ritmo tranquilo', shortText: 'Tranquilo' },
    { text: 'No es urgente, quiero mejorar paso a paso', shortText: 'Paso a paso' },
  ],
  obj_3: [
    { text: 'La sensación de hinchazón constante que no puedo controlar', shortText: 'Hinchazón' },
    { text: 'Comer algo y no saber si me va a sentar bien o mal', shortText: 'Incertidumbre' },
    { text: 'La falta de energía y la sensación de agotamiento', shortText: 'Falta energía' },
    { text: 'Haber probado cosas y no ver resultados duraderos', shortText: 'Sin resultados' },
  ],
  obj_4: [
    { text: 'Notar menos inflamación al final del día', shortText: 'Menos inflamación' },
    { text: 'Poder comer sin miedo ni molestias digestivas fuertes', shortText: 'Comer sin miedo' },
    { text: 'Tener más energía para hacer mis actividades diarias', shortText: 'Más energía' },
    { text: 'Sentirme más ligero/a y con mejor bienestar general', shortText: 'Bienestar' },
  ],
  obj_5: [
    { text: 'Estoy totalmente comprometido/a, quiero mejorar de verdad', shortText: 'Totalmente' },
    { text: 'Estoy dispuesto/a a hacer cambios importantes si son realistas', shortText: 'Dispuesto/a' },
    { text: 'Quiero avanzar, pero con pasos pequeños y sostenibles', shortText: 'Pasos pequeños' },
    { text: 'Quiero mejorar, pero me cuesta mantener la constancia', shortText: 'Me cuesta' },
  ],

  // HÁBITOS
  hab_1: [
    { text: 'Me cuesta mantener cambios, suelo abandonar fácilmente', shortText: 'Me cuesta' },
    { text: 'Puedo mantener hábitos un tiempo, pero luego me cuesta seguir', shortText: 'Un tiempo' },
    { text: 'Soy constante si tengo apoyo o seguimiento', shortText: 'Con apoyo' },
    { text: 'Soy bastante constante, mantengo lo que me propongo', shortText: 'Constante' },
  ],
  hab_2: [
    { text: 'No tengo rutinas, cada día es distinto y caótico', shortText: 'Sin rutinas' },
    { text: 'Tengo algunas rutinas pero no siempre las cumplo', shortText: 'A veces' },
    { text: 'Sí, tengo rutinas básicas que suelo mantener', shortText: 'Básicas' },
    { text: 'Tengo rutinas muy establecidas y organizadas', shortText: 'Establecidas' },
  ],
  hab_3: [
    { text: 'He intentado llevar una alimentación más ordenada', shortText: 'Alimentación' },
    { text: 'He probado hacer ejercicio o caminar con regularidad', shortText: 'Ejercicio' },
    { text: 'He intentado mejorar mi sueño o mis horarios', shortText: 'Sueño/horarios' },
    { text: 'He probado muchos hábitos pero ninguno me duró mucho', shortText: 'Muchos' },
  ],
  hab_4: [
    { text: 'Ser constante cuando no veo resultados rápidos', shortText: 'Constancia' },
    { text: 'Organizarme con comidas y horarios durante la semana', shortText: 'Organización' },
    { text: 'Mantener la motivación en días de estrés o cansancio', shortText: 'Motivación' },
    { text: 'Recordar los pequeños hábitos que debo aplicar', shortText: 'Recordar' },
  ],
  hab_5: [
    { text: 'Muy poco tiempo, días bastante complicados', shortText: 'Poco tiempo' },
    { text: 'Unos minutos al día, pero de forma constante', shortText: 'Unos minutos' },
    { text: 'Entre 10 y 20 minutos diarios sin problema', shortText: '10-20 min' },
    { text: 'Puedo dedicar más tiempo si lo necesito realmente', shortText: 'Más tiempo' },
  ],

  // IDENTIDAD
  ide_1: [
    { text: 'En un momento de cambio y necesidad de mejorar mi salud', shortText: 'Cambio' },
    { text: 'En una etapa estable pero con ganas de avanzar más', shortText: 'Estable' },
    { text: 'En un periodo complicado a nivel personal o emocional', shortText: 'Complicado' },
    { text: 'En una etapa de crecimiento personal y enfoque en mí', shortText: 'Crecimiento' },
  ],
  ide_2: [
    { text: 'Bastante acelerado, con muy poco tiempo para mí', shortText: 'Acelerado' },
    { text: 'Activo pero con algunos momentos de calma y descanso', shortText: 'Activo' },
    { text: 'Relativamente tranquilo, con una rutina estable', shortText: 'Tranquilo' },
    { text: 'Muy variable, mis días cambian mucho de un día a otro', shortText: 'Variable' },
  ],
  ide_3: [
    { text: 'Me veo bastante desalineado/a y quiero mejorar', shortText: 'Desalineado/a' },
    { text: 'Siento que tengo cosas por mejorar pero estoy motivado/a', shortText: 'Motivado/a' },
    { text: 'Me considero una persona bastante saludable en general', shortText: 'Saludable' },
    { text: 'No lo tengo claro, mi percepción cambia según el día', shortText: 'No claro' },
  ],
  ide_4: [
    { text: 'Me cuesta cuidarme y priorizarme en mi día a día', shortText: 'Me cuesta' },
    { text: 'Intento cuidarme, pero a veces me dejo en segundo plano', shortText: 'A veces' },
    { text: 'Tengo una relación bastante buena conmigo mismo/a', shortText: 'Buena' },
    { text: 'Depende del momento, tengo altibajos frecuentes', shortText: 'Altibajos' },
  ],
  ide_5: [
    { text: 'Sí, estoy pasando por cambios o situaciones difíciles', shortText: 'Sí' },
    { text: 'Algunas cosas me influyen, pero intento gestionarlas', shortText: 'Algunas' },
    { text: 'Pocas cosas afectan mi bienestar actualmente', shortText: 'Pocas' },
    { text: 'No siento que haya algo personal afectándome ahora mismo', shortText: 'No' },
  ],

  // HISTORIAL
  his_1: [
    { text: 'Sí, tengo diagnóstico de colon irritable o SII', shortText: 'SII' },
    { text: 'Gastritis, reflujo o problemas estomacales recurrentes', shortText: 'Gastritis/reflujo' },
    { text: 'Intolerancias o sospechas de intolerancias alimentarias', shortText: 'Intolerancias' },
    { text: 'No tengo diagnósticos digestivos conocidos', shortText: 'No' },
  ],
  his_2: [
    { text: 'Antiácidos, protectores gástricos o medicación digestiva', shortText: 'Digestiva' },
    { text: 'Ansiolíticos, antidepresivos o reguladores del ánimo', shortText: 'Ansiolíticos' },
    { text: 'Anticonceptivos, tratamientos hormonales o similares', shortText: 'Hormonales' },
    { text: 'No tomo ningún medicamento de forma regular', shortText: 'No' },
  ],
  his_3: [
    { text: 'Sí, he tomado antibióticos en los últimos treinta días', shortText: 'Últimos 30 días' },
    { text: 'Sí, tomé antibióticos hace dos o tres meses', shortText: 'Hace 2-3 meses' },
    { text: 'Hace bastante tiempo que no tomo antibióticos', shortText: 'Hace tiempo' },
    { text: 'No recuerdo haber tomado antibióticos recientemente', shortText: 'No' },
  ],
  his_4: [
    { text: 'Sí, he tenido operaciones abdominales o digestivas', shortText: 'Sí' },
    { text: 'He tenido intervenciones pero no afectaron mi digestión', shortText: 'No afectaron' },
    { text: 'Ninguna operación que haya influido en mi sistema digestivo', shortText: 'Ninguna' },
    { text: 'Tuve operaciones hace años pero sin cambios digestivos', shortText: 'Hace años' },
  ],
  his_5: [
    { text: 'Sí, alergias o intolerancias diagnosticadas por un profesional', shortText: 'Diagnosticadas' },
    { text: 'Sensibilidades que sospecho pero no están confirmadas', shortText: 'Sospechas' },
    { text: 'No tengo alergias ni intolerancias conocidas', shortText: 'No' },
    { text: 'Estoy en proceso de averiguarlo o haciendo pruebas', shortText: 'En proceso' },
  ],
};

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

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
 * Determina si se debe mostrar el InfoWedge para un bloque dado.
 * El wedge se muestra ANTES de la primera pregunta de cada bloque.
 * (Mantenida por compatibilidad, pero los InfoWedges vienen del backend)
 */
export function shouldShowInfoWedge(
  blockId: string,
  questionInBlock: number
): { show: boolean; wedgeBlock: OnboardingBlockConfig | null } {
  const blockIndex = ONBOARDING_BLOCKS.findIndex(b => b.id === blockId);

  // Si no encontramos el bloque, no mostrar nada
  if (blockIndex === -1) {
    return { show: false, wedgeBlock: null };
  }

  const currentBlock = ONBOARDING_BLOCKS[blockIndex];

  // Mostrar wedge antes de la primera pregunta de CADA bloque
  if (questionInBlock === 1 && currentBlock) {
    return { show: true, wedgeBlock: currentBlock };
  }

  return { show: false, wedgeBlock: null };
}

/**
 * FUNCIÓN PRINCIPAL: Calcula bloque y pregunta a partir del turno de onboarding.
 * El turno viene del backend y es 100% confiable - no depende de regex.
 * 
 * Turno 1: Bienvenida (no cuenta como pregunta)
 * Turnos 2-6: Bloque 0 (digestivo), preguntas 0-4
 * Turnos 7-11: Bloque 1 (emocional), preguntas 0-4
 * Turnos 12-16: Bloque 2 (físico), preguntas 0-4
 * ... y así sucesivamente para los 11 bloques
 * 
 * @param turn - El turno de onboarding (1-56)
 * @returns Objeto con blockIndex, questionIndex, questionId, block, options o null si turno <= 1
 */
export function getQuestionByTurn(turn: number): {
  blockIndex: number;
  questionIndex: number;
  questionId: string;
  block: OnboardingBlockConfig;
  options: Array<{ value: string; label: string }>;
} | null {
  // Turno 1 es bienvenida, no tiene pregunta
  if (turn <= 1) return null;

  // El turno 2 corresponde a la pregunta 1 (índice 0)
  const questionNumber = turn - 1; // 1-indexed

  // Cada bloque tiene 5 preguntas
  const QUESTIONS_PER_BLOCK = 5;

  // Calcular blockIndex (0-indexed): pregunta 1-5 = bloque 0, 6-10 = bloque 1, etc.
  const blockIndex = Math.floor((questionNumber - 1) / QUESTIONS_PER_BLOCK);

  // Calcular questionIndex dentro del bloque (0-indexed)
  const questionIndex = (questionNumber - 1) % QUESTIONS_PER_BLOCK;

  // Validar que el bloque existe
  if (blockIndex >= ONBOARDING_BLOCKS.length) return null;

  const block = ONBOARDING_BLOCKS[blockIndex];
  if (!block) return null;

  // Mapeo de block.id a prefijo de questionId
  const blockIdPrefixes: Record<string, string> = {
    digestivo: 'dig',
    emocional: 'emo',
    fisico: 'fis',
    alimentacion: 'ali',
    social: 'soc',
    laboral: 'lab',
    bienestar: 'bie',
    objetivos: 'obj',
    habitos: 'hab',
    identidad: 'ide',
    historial: 'his',
  };

  const prefix = blockIdPrefixes[block.id] || block.id.substring(0, 3);

  // Construir questionId (ej: dig_1, emo_2, fis_3)
  const questionId = `${prefix}_${questionIndex + 1}`;

  // Obtener las opciones de respuesta rápida por questionId
  const rawOptions = QUICK_REPLIES[questionId];
  if (!rawOptions || !Array.isArray(rawOptions)) return null;

  // Formatear opciones
  const options = rawOptions.map((opt: QuickReplyOption) => ({
    value: opt.text,
    label: opt.shortText || opt.text
  }));

  return { blockIndex, questionIndex, questionId, block, options };
}

/**
 * Map of question IDs to turn numbers (same as backend)
 * Used for quick lookups when detecting InfoWedges
 */
export const QUESTION_ID_TO_TURN: Record<string, number> = {
  welcome: 1,
  // Bloque 1: Digestivo (turnos 2-6)
  dig_1: 2, dig_2: 3, dig_3: 4, dig_4: 5, dig_5: 6,
  // Bloque 2: Emocional (turnos 7-11)
  emo_1: 7, emo_2: 8, emo_3: 9, emo_4: 10, emo_5: 11,
  // Bloque 3: Físico (turnos 12-16)
  fis_1: 12, fis_2: 13, fis_3: 14, fis_4: 15, fis_5: 16,
  // Bloque 4: Alimentación (turnos 17-21)
  ali_1: 17, ali_2: 18, ali_3: 19, ali_4: 20, ali_5: 21,
  // Bloque 5: Social (turnos 22-26)
  soc_1: 22, soc_2: 23, soc_3: 24, soc_4: 25, soc_5: 26,
  // Bloque 6: Laboral (turnos 27-31)
  lab_1: 27, lab_2: 28, lab_3: 29, lab_4: 30, lab_5: 31,
  // Bloque 7: Bienestar (turnos 32-36)
  bie_1: 32, bie_2: 33, bie_3: 34, bie_4: 35, bie_5: 36,
  // Bloque 8: Objetivos (turnos 37-41)
  obj_1: 37, obj_2: 38, obj_3: 39, obj_4: 40, obj_5: 41,
  // Bloque 9: Hábitos (turnos 42-46)
  hab_1: 42, hab_2: 43, hab_3: 44, hab_4: 45, hab_5: 46,
  // Bloque 10: Identidad (turnos 47-51)
  ide_1: 47, ide_2: 48, ide_3: 49, ide_4: 50, ide_5: 51,
  // Bloque 11: Historial (turnos 52-56)
  his_1: 52, his_2: 53, his_3: 54, his_4: 55, his_5: 56,
  completed: 57,
};
