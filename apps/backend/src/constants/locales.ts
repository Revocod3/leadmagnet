export const LOCALES = {
  es: {
    // UI Messages
    welcome: 'Bienvenido a Objetivo Vientre Plano',
    startQuiz: 'Comenzar Cuestionario',
    startChat: 'Iniciar Chat con IA',
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Enviar',
    loading: 'Cargando...',
    error: 'Ha ocurrido un error',
    success: '¡Éxito!',

    // Quiz
    quizTitle: 'Cuestionario de Salud Digestiva',
    quizDescription: 'Responde estas 17 preguntas para obtener un diagnóstico personalizado',
    question: 'Pregunta',
    of: 'de',
    selectAnswer: 'Selecciona una respuesta',

    // Chat
    chatTitle: 'Chat con Asistente IA',
    typeMessage: 'Escribe tu mensaje...',
    send: 'Enviar',

    // Diagnosis
    diagnosisTitle: 'Tu Diagnóstico Personalizado',
    diagnosisDescription: 'Basado en tus respuestas, aquí tienes un análisis completo',
    downloadPdf: 'Descargar PDF',

    // Image Upload
    uploadImage: 'Subir Imagen Abdominal',
    imageDescription: 'Sube una foto de tu abdomen para análisis adicional',
    selectImage: 'Seleccionar Imagen',
    analyzing: 'Analizando imagen...',

    // Errors
    sessionExpired: 'La sesión ha expirado',
    invalidSession: 'Sesión inválida',
    networkError: 'Error de conexión',
    serverError: 'Error del servidor',

    // Validation
    requiredField: 'Este campo es obligatorio',
    invalidEmail: 'Email inválido',
    invalidName: 'Nombre inválido',
  },

  en: {
    // UI Messages
    welcome: 'Welcome to Objetivo Vientre Plano',
    startQuiz: 'Start Quiz',
    startChat: 'Start Chat with AI',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success!',

    // Quiz
    quizTitle: 'Digestive Health Questionnaire',
    quizDescription: 'Answer these 17 questions to get a personalized diagnosis',
    question: 'Question',
    of: 'of',
    selectAnswer: 'Select an answer',

    // Chat
    chatTitle: 'Chat with AI Assistant',
    typeMessage: 'Type your message...',
    send: 'Send',

    // Diagnosis
    diagnosisTitle: 'Your Personalized Diagnosis',
    diagnosisDescription: 'Based on your answers, here is a complete analysis',
    downloadPdf: 'Download PDF',

    // Image Upload
    uploadImage: 'Upload Abdominal Image',
    imageDescription: 'Upload a photo of your abdomen for additional analysis',
    selectImage: 'Select Image',
    analyzing: 'Analyzing image...',

    // Errors
    sessionExpired: 'Session has expired',
    invalidSession: 'Invalid session',
    networkError: 'Network error',
    serverError: 'Server error',

    // Validation
    requiredField: 'This field is required',
    invalidEmail: 'Invalid email',
    invalidName: 'Invalid name',
  },
};

export const getLocaleText = (key: string, language: 'es' | 'en' = 'es'): string => {
  return LOCALES[language][key as keyof typeof LOCALES['es']] || key;
};