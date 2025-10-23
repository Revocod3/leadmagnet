import type { Language } from '../types';

export interface DiagnosticQuestion {
  question: string;
  questionDetails?: string;
  options?: string[];
}

// 17 preguntas de diagnóstico personalizado
export const DIAGNOSTIC_QUESTIONS_ES: DiagnosticQuestion[] = [
  {
    question: '👋 1. Para empezar… ¿Cómo te llamas, qué edad tienes y a qué te dedicas?',
    options: [],
  },
  {
    question: '🤔 2. ¿Cómo te sientes contigo mismo/a en este momento de tu vida?',
    questionDetails: '¿Estás satisfecho/a con tu camino actual? ¿Qué parte de ti te gustaría reconectar?',
  },
  {
    question: '🎯 3. ¿Qué es lo que más te molesta de tu abdomen o digestión ahora mismo?',
    questionDetails:
      'Puede ser hinchazón, gases, pesadez, estreñimiento, digestiones lentas, retención de líquidos…\n\nNo te preocupes si no sabes el término exacto. Dímelo con tus propias palabras.',
    options: [],
  },
  {
    question: '⏰ 4. ¿Cuánto tiempo llevas sintiendo esto?',
    questionDetails: 'Semanas, meses, años…',
    options: [],
  },
  {
    question:
      '💊 5. ¿Has probado algún método antes para solucionarlo? ¿Qué tal te fue?',
    questionDetails:
      'Por ejemplo: dietas, ejercicios, productos…\nO quizá no has probado nada todavía, y está bien también.',
    options: [],
  },
  {
    question: '🍽️ 6. ¿Cómo describirías tu alimentación en general?',
    questionDetails:
      '¿Es equilibrada? ¿Comes muchos procesados? ¿Saltas comidas? ¿Comes rápido?',
    options: [],
  },
  {
    question: '😣 7. ¿Tienes algún alimento que notes que te sienta mal?',
    questionDetails: 'Lácteos, gluten, legumbres, picantes, fritos...',
    options: [],
  },
  {
    question: '💧 8. ¿Cuánta agua sueles beber al día?',
    questionDetails:
      'Una estimación aproximada es suficiente (en vasos, litros o botellas).',
    options: [],
  },
  {
    question: '🏃 9. ¿Haces ejercicio regularmente? Si es así, ¿qué tipo y con qué frecuencia?',
    questionDetails:
      'Si no haces nada, también puedes decírmelo sin problema. Estoy aquí para ayudarte, no para juzgarte.',
    options: [],
  },
  {
    question: '� 10. ¿Cómo duermes habitualmente?',
    questionDetails: '¿Bien? ¿Poco? ¿Te cuesta conciliar el sueño o te despiertas mucho?',
    options: [],
  },
  {
    question: '😰 11. ¿Sientes que el estrés o la ansiedad afectan tu cuerpo?',
    questionDetails: '¿Notas tensión, malestar digestivo o cambios cuando estás nervioso/a?',
    options: [],
  },
  {
    question: '🩺 12. ¿Tienes alguna condición médica diagnosticada?',
    questionDetails:
      'Hipotiroidismo, SII, intolerancias, resistencia a la insulina, problemas hormonales…\nSi no tienes nada diagnosticado, simplemente dímelo.',
    options: [],
  },
  {
    question: '💊 13. ¿Tomas algún medicamento o suplemento con regularidad?',
    questionDetails: 'Si es así, ¿cuáles?',
    options: [],
  },
  {
    question: '🚻 14. (Solo para mujeres) ¿Tienes ciclos menstruales regulares?',
    questionDetails:
      '¿Notas hinchazón o cambios en tu abdomen dependiendo del momento del ciclo?\nSi eres hombre, simplemente escribe "N/A" o "No aplica".',
    options: [],
  },
  {
    question: '🌟 15. Si pudieras cambiar algo de tu salud o tu cuerpo en 3 meses, ¿qué sería?',
    questionDetails:
      'Puede ser algo físico, emocional, de energía, de bienestar… lo que sea más importante para ti.',
    options: [],
  },
  {
    question: '🔥 16. Del 1 al 10, ¿qué tan motivado/a estás para hacer cambios reales ahora?',
    questionDetails:
      'Siendo 1 = "casi nada" y 10 = "totalmente comprometido/a".\n\nRecuerda: no hay respuestas malas. Solo quiero saber dónde estás hoy.',
    options: [],
  },
  {
    question:
      '💬 17. (Opcional) ¿Te gustaría compartir una foto de tu abdomen para completar el diagnóstico?',
    questionDetails:
      'Puede ser útil para detectar inflamación visible y darte orientación más visual.\nNo es obligatorio, pero si te sientes cómodo/a, me encantaría analizarla contigo.\n\n🔸 Tu privacidad es sagrada. Solo compartes lo que tú decidas. Estamos aquí para ayudar, sin presión.',
    options: [],
  },
];

export const DIAGNOSTIC_QUESTIONS_EN: DiagnosticQuestion[] = [
  {
    question: "👋 1. To start... What's your name, age, and what do you do?",
    options: [],
  },
  {
    question: '🤔 2. How do you feel about yourself at this moment in your life?',
    questionDetails: 'Are you satisfied with your current path? What part of you would you like to reconnect with?',
  },
  {
    question: '🎯 3. What bothers you most about your abdomen or digestion right now?',
    questionDetails:
      "It could be bloating, gas, heaviness, constipation, slow digestion, water retention...\n\nDon't worry if you don't know the exact term. Tell me in your own words.",
    options: [],
  },
  {
    question: '⏰ 4. How long have you been feeling this?',
    questionDetails: 'Weeks, months, years...',
    options: [],
  },
  {
    question: '💊 5. Have you tried any method before to solve it? How did it go?',
    questionDetails:
      "For example: diets, exercises, products...\nOr maybe you haven't tried anything yet, and that's okay too.",
    options: [],
  },
  {
    question: '🍽️ 6. How would you describe your diet in general?',
    questionDetails:
      'Is it balanced? Do you eat a lot of processed foods? Do you skip meals? Do you eat fast?',
    options: [],
  },
  {
    question: '😣 7. Do you have any food that you notice makes you feel bad?',
    questionDetails: 'Dairy, gluten, legumes, spicy foods, fried foods...',
    options: [],
  },
  {
    question: '💧 8. How much water do you usually drink per day?',
    questionDetails: 'An approximate estimate is enough (in glasses, liters, or bottles).',
    options: [],
  },
  {
    question: '🏃 9. Do you exercise regularly? If so, what type and how often?',
    questionDetails:
      "If you don't do anything, you can also tell me without a problem. I'm here to help you, not to judge you.",
    options: [],
  },
  {
    question: '😴 10. How do you usually sleep?',
    questionDetails:
      'Well? Little? Do you have trouble falling asleep or do you wake up a lot?',
    options: [],
  },
  {
    question: '😰 11. Do you feel that stress or anxiety affects your body?',
    questionDetails:
      'Do you notice tension, digestive discomfort or changes when you are nervous?',
    options: [],
  },
  {
    question: '🩺 12. Do you have any diagnosed medical condition?',
    questionDetails:
      "Hypothyroidism, IBS, intolerances, insulin resistance, hormonal problems...\nIf you don't have anything diagnosed, just tell me.",
    options: [],
  },
  {
    question: '💊 13. Do you take any medication or supplement regularly?',
    questionDetails: 'If so, which ones?',
    options: [],
  },
  {
    question: '🚻 14. (For women only) Do you have regular menstrual cycles?',
    questionDetails:
      'Do you notice bloating or changes in your abdomen depending on the moment of the cycle?\nIf you are male, simply write "N/A" or "Not applicable".',
    options: [],
  },
  {
    question:
      '🌟 15. If you could change something about your health or your body in 3 months, what would it be?',
    questionDetails:
      'It can be something physical, emotional, energy, wellness... whatever is most important to you.',
    options: [],
  },
  {
    question: '🔥 16. From 1 to 10, how motivated are you to make real changes now?',
    questionDetails:
      'Being 1 = "almost nothing" and 10 = "totally committed".\n\nRemember: there are no wrong answers. I just want to know where you are today.',
    options: [],
  },
  {
    question:
      '💬 17. (Optional) Would you like to share a picture of your abdomen to complete the diagnosis?',
    questionDetails:
      "It can be useful to detect visible inflammation and give you more visual guidance.\nIt's not mandatory, but if you feel comfortable, I'd be happy to analyze it with you.\n\n🔸 Your privacy is sacred. Only share what you decide. We're here to help, no pressure.",
    options: [],
  },
];

export const getDiagnosticQuestions = (language: Language): DiagnosticQuestion[] => {
  return language === 'en' ? DIAGNOSTIC_QUESTIONS_EN : DIAGNOSTIC_QUESTIONS_ES;
};

export const WELCOME_MESSAGES = {
  es: '¡Hola {userName}! Soy tu asistente virtual para ayudarte a conseguir un vientre plano de forma saludable y duradera.\n\nEstás a punto de empezar un diagnóstico personalizado que me permitirá conocerte mejor y darte recomendaciones adaptadas a ti.\n\nEl proceso es sencillo: yo te haré unas preguntas, tú me respondes con sinceridad, y al final recibirás un análisis completo de tu situación.\n\n¿Estás listo/a para empezar?',
  en: "Hello {userName}! I'm your virtual assistant to help you achieve a flat belly in a healthy and lasting way.\n\nYou're about to start a personalized diagnosis that will allow me to get to know you better and give you recommendations tailored to you.\n\nThe process is simple: I'll ask you some questions, you answer honestly, and at the end you'll receive a complete analysis of your situation.\n\nAre you ready to get started?",
};

export const GREETING_MESSAGES = {
  es: 'Encantado de conocerte, {userName}. 😊',
  en: 'Nice to meet you, {userName}. 😊',
};

export const DID_YOU_KNOW = {
  es: ' Por cierto, ¿sabías que ',
  en: ' By the way, did you know that ',
};

export const PDF_QUESTION = {
  es: '📄 ¿Te gustaría descargar un resumen de este diagnóstico?',
  en: '📄 Would you like to download a summary of this diagnosis?',
};

export const FINAL_CTA = {
  es: {
    mainText: `AHORA VIENE LO MÁS IMPORTANTE...
Has llegado al final del diagnóstico gratuito. Y lo primero que quiero decirte es: gracias.
Gracias por abrirte, por confiar y por dar este primer paso hacia el cambio real.
Ahora empieza lo bueno.`,
    subscribePrompt: `Si estás listo/a para empezar esta aventura, solo puedo decirte una cosa:
Si te comprometes, esto va a cambiar tu vida.`,
    buttonText: `¡Quiero suscribirme ahora!`,
  },
  en: {
    mainText: `NOW COMES THE MOST IMPORTANT PART...
You have reached the end of the free diagnosis. And the first thing I want to say is: thank you.
Thank you for opening up, for trusting, and for taking this first step towards real change.
Now the good part begins.`,
    subscribePrompt: `If you are ready to start this adventure, I can only tell you one thing:
If you commit, this will change your life.`,
    buttonText: `I want to subscribe now!`,
  },
};