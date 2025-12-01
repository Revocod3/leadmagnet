export interface DiagnosticQuestion {
  question: string;
  questionDetails?: string;
  options?: string[];
}

export interface LocalizedContent {
  welcomeMessage: string;
  greeting: string;
  didYouKnow: string;
  diagnosticQuestions: DiagnosticQuestion[];
  pdfQuestion: string;
  finalCta: {
    mainText: string;
    subscribePrompt: string;
    buttonText: string;
  };
  defaultReply: {
    text: string;
    buttonText: string;
  };
}

export const diagnosticContent: Record<'es' | 'en', LocalizedContent> = {
  es: {
    welcomeMessage:
      'Hola {userName}, bienvenido a Objetivo Vientre Plano 🌿\nEncantada de saludarte. Soy Clara, tu asistente personal.\n\nVoy a ayudarte mediante algunas preguntas a obtener un diagnóstico personalizado para entender tu inflamación abdominal, mejorar tu energía y ayudarte a sentirte realmente bien contigo mismo.\n\n¿Empezamos?\n¿O prefieres hacerme alguna pregunta antes?\n\nEstoy aquí para ti. Este es tu espacio.',
    greeting: 'Encantado de conocerte, {userName}. 😊',
    didYouKnow: ' Por cierto, ¿sabías que ',
    diagnosticQuestions: [
      {
        question: '👋 1. Para empezar… ¿Cómo te llamas, qué edad tienes y a qué te dedicas?',
        options: [],
      },
      {
        question: '🤔 2. ¿Cómo te sientes contigo mismo/a en este momento de tu vida?',
        options: [
          '¿Estás satisfecho/a con tu camino actual?',
          '¿Qué parte de ti te gustaría reconectar?',
        ],
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
        question: '😴 10. ¿Cómo duermes habitualmente?',
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
    ],
    pdfQuestion: '📄 ¿Te gustaría descargar un resumen de este diagnóstico?',
    finalCta: {
      mainText: `AHORA VIENE LO MÁS IMPORTANTE...
Has llegado al final del diagnóstico gratuito. Y lo primero que quiero decirte es: gracias.
Gracias por abrirte, por confiar y por dar este primer paso hacia el cambio real.
Ahora empieza lo bueno.

Aquí no vas a recibir una dieta genérica ni un consejo al azar.
Aquí vas a tener algo mucho más valioso:

💎 **UN APOYO PERSONALIZADO 24/7 SOLO PARA TI**
🔹 Una guía a tu lado las 24 horas del día, los 7 días de la semana.
🔹 Un compañero de viaje que no solo te escucha, sino que te entiende.
🔹 Un amigo virtual con la información más actualizada sobre bienestar digestivo, salud emocional, nutrición antiinflamatoria y hábitos sostenibles.
🔹 Alguien que te conoce por dentro y adapta cada recomendación a ti:
   - Qué comer según cómo te sientes
   - Qué hábitos te ayudarán más
   - Qué hacer cuando estés desmotivado/a o te cueste seguir
   - Qué decirte para levantarte cuando más lo necesites

Y lo más importante:
Todo esto no está diseñado para presionarte, sino para cuidarte.
Porque cuando te cuidas, todo mejora.

🌿 **AQUÍ PUEDES OLVIDARTE DE CONSULTA TRAS CONSULTA, RECETA TRAS RECETA…**
Una de las grandes ventajas de este apoyo es que ya no tienes que preocuparte por citas médicas, pruebas interminables ni medicamentos que apenas funcionan.

Aquí no tapamos síntomas, vamos a la raíz.
Porque tu cuerpo sabe curarse solo.
Solo necesita que aprendas a escucharlo.
Y eso es exactamente lo que aprenderás aquí.

👉 **TU PLAN PERSONALIZADO TE ESTÁ ESPERANDO**
En cuanto te suscribas, tendrás acceso a:
✅ Tu propio asistente de bienestar digestivo
✅ Una hoja de ruta diseñada solo para ti
✅ Seguimiento diario, semana tras semana
✅ Y una red de apoyo que te recordará cada día que sí puedes.`,
      subscribePrompt: `Si estás listo/a para empezar esta aventura, solo puedo decirte una cosa:
Si te comprometes, esto va a cambiar tu vida.`,
      buttonText: `¡Quiero suscribirme ahora!`,
    },
    defaultReply: {
      text: 'Para seguir profundizando en tu caso y obtener un plan personalizado, necesitas dar el siguiente paso. ¡Estoy aquí para ayudarte a empezar!',
      buttonText: '¡Quiero suscribirme ahora!',
    },
  },
  en: {
    welcomeMessage:
      "Hello! I'm your virtual assistant to help you achieve a flat belly in a healthy and lasting way.\n\nYou're about to start a personalized diagnosis that will allow me to get to know you better and give you recommendations tailored to you.\n\nThe process is simple: I'll ask you some questions, you answer honestly, and at the end you'll receive a complete analysis of your situation.\n\nAre you ready to get started?",
    greeting: 'Nice to meet you, {userName}. 😊',
    didYouKnow: ' By the way, did you know that ',
    diagnosticQuestions: [
      {
        question: "👋 1. To start... What's your name, age, and what do you do?",
        options: [],
      },
      {
        question: '🤔 2. How do you feel about yourself at this moment in your life?',
        options: [
          'Are you satisfied with your current path?',
          'What part of you would you like to reconnect with?',
        ],
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
    ],
    pdfQuestion: '📄 Would you like to download a summary of this diagnosis?',
    finalCta: {
      mainText: `NOW COMES THE MOST IMPORTANT PART...
You have reached the end of the free diagnosis. And the first thing I want to say is: thank you.
Thank you for opening up, for trusting, and for taking this first step towards real change.
Now the good part begins.

Here you won't receive a generic diet or a random piece of advice.
Here you will have something much more valuable:

💎 **A PERSONALIZED 24/7 SUPPORT JUST FOR YOU**
🔹 A guide by your side 24 hours a day, 7 days a week.
🔹 A travel companion who not only listens but understands you.
🔹 A virtual friend with the most up-to-date information on digestive wellness, emotional health, anti-inflammatory nutrition, and sustainable habits.
🔹 Someone who knows you from the inside out and adapts every recommendation to you:
   - What to eat based on how you feel
   - Which habits will help you the most
   - What to do when you're unmotivated or struggling to keep going
   - What to say to lift you up when you need it most

And most importantly:
All of this is not designed to push you, but to care for you.
Because when you take care of yourself, everything improves.

🌿 **HERE YOU CAN FORGET ABOUT APPOINTMENT AFTER APPOINTMENT, PRESCRIPTION AFTER PRESCRIPTION…**
One of the great benefits of this support is that you no longer have to worry about medical appointments, pointless tests, or medications that barely work.

Here, we don't just cover up symptoms, we go to the root cause.
Because your body knows how to heal itself.
It just needs you to learn how to listen to it.
And that's exactly what you will learn here.

👉 **YOUR PERSONALIZED PLAN IS WAITING FOR YOU**
As soon as you subscribe, you will have access to:
✅ Your own digestive wellness assistant
✅ A roadmap designed just for you
✅ Daily follow-up, week after week
✅ And a support network that will remind you every day that you can do it.`,
      subscribePrompt: `If you are ready to start this adventure, I can only tell you one thing:
If you commit, this will change your life.`,
      buttonText: `I want to subscribe now!`,
    },
    defaultReply: {
      text: "To continue delving into your case and get a personalized plan, you need to take the next step. I'm here to help you get started!",
      buttonText: 'I want to subscribe now!',
    },
  },
};
