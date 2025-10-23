import { openai, MODELS, ASSISTANT_INSTRUCTIONS } from '../../config/openai';
import { getDiagnosticQuestions, WELCOME_MESSAGES, GREETING_MESSAGES, DID_YOU_KNOW, PDF_QUESTION, FINAL_CTA, OCCUPATION_PATTERNS, OCCUPATION_INSIGHTS, type CollectedInfo } from '../../constants/questions';
import type { Language } from '../../types';
import { VisionService } from './vision.service';

export type FlowStep =
  | 'initial'
  | 'name_extracted'
  | 'greeting'
  | 'asking_questions'
  | 'diagnosis'
  | 'pdf_question'
  | 'cta'
  | 'completed';

export interface DiagnosticFlowState {
  step: FlowStep;
  currentQuestionIndex: number;
  currentBlockId: number; // NEW: Track current block
  userName: string | null;
  language: Language;
  answers: Array<{ question: string; answer: string }>;
  collectedInfo: CollectedInfo; // NEW: Collected information from answers
  imageAnalysis: string | null;
  diagnosisContent: string | null;
}

export interface FlowResponse {
  message: string;
  newState: DiagnosticFlowState;
  requiresWelcomeAnimation?: boolean;
  etymology?: string;
  nextQuestion?: string;
  questionDetails?: string | undefined;
  type?: 'welcome' | 'greeting' | 'question' | 'comment' | 'validation_error' | 'diagnosis' | 'cta' | 'completed';
}

export class DiagnosticFlowService {
  private visionService: VisionService;

  constructor() {
    this.visionService = new VisionService();
  }

  /**
   * Detects occupation type from occupation string
   */
  private detectOccupationType(occupation: string): string {
    for (const [type, pattern] of Object.entries(OCCUPATION_PATTERNS)) {
      if (pattern.test(occupation)) {
        return type;
      }
    }
    return 'default';
  }

  /**
   * Generates occupation-specific comment
   */
  private generateOccupationComment(
    age: number,
    occupation: string,
    language: Language
  ): string {
    const occupationType = this.detectOccupationType(occupation);
    const insight = OCCUPATION_INSIGHTS[occupationType as keyof typeof OCCUPATION_INSIGHTS] || OCCUPATION_INSIGHTS.default;

    // Select random insight
    const randomInsight = insight.insights[
      Math.floor(Math.random() * insight.insights.length)
    ];

    const ageText = language === 'es' ? `${age} años` : `${age} years old`;
    const workText = language === 'es' ? `trabajas como` : `you work as`;

    return `${ageText} y ${workText} ${occupation}. ${randomInsight} ${insight.tips}`;
  }

  /**
   * Extracts information from user answers
   */
  private extractInfoFromAnswer(
    questionId: number,
    answer: string,
    currentInfo: CollectedInfo
  ): Partial<CollectedInfo> {
    const info: Partial<CollectedInfo> = {};
    const lowerAnswer = answer.toLowerCase();

    // Question 1: Age and occupation
    if (questionId === 1) {
      // Extract age
      const ageMatch = answer.match(/(\d+)\s*años?|años?\s*(\d+)/i);
      if (ageMatch && (ageMatch[1] || ageMatch[2])) {
        const ageValue = ageMatch[1] || ageMatch[2];
        if (ageValue) {
          info.age = parseInt(ageValue);
        }
      }

      // Extract occupation (everything else)
      const occupationText = answer.replace(/(\d+)\s*años?|años?\s*(\d+)/gi, '').trim();
      if (occupationText) {
        info.occupation = occupationText;
        info.occupationType = this.detectOccupationType(occupationText);
      }
    }

    // Question 2: Main problem
    if (questionId === 2) {
      info.mainProblem = answer;

      // Extract problematic foods if mentioned here
      if (lowerAnswer.includes('lácteos') || lowerAnswer.includes('leche')) {
        info.badFoods = [...(info.badFoods || []), 'lácteos'];
      }
      if (lowerAnswer.includes('gluten') || lowerAnswer.includes('pan') || lowerAnswer.includes('pasta')) {
        info.badFoods = [...(info.badFoods || []), 'gluten'];
      }
    }

    // Question 3: Duration
    if (questionId === 3) {
      info.duration = answer;
    }

    // Question 4: Diet
    if (questionId === 4) {
      info.diet = answer;

      // Detect exercise mention here
      if (lowerAnswer.includes('no hago ejercicio') || lowerAnswer.includes('sedentario')) {
        info.exercise = 'sedentario';
      }
    }

    // Question 5: Bad foods
    if (questionId === 5) {
      const problematicFoods = [];
      if (lowerAnswer.includes('lácteos') || lowerAnswer.includes('leche')) {
        problematicFoods.push('lácteos');
      }
      if (lowerAnswer.includes('gluten') || lowerAnswer.includes('pan') || lowerAnswer.includes('pasta')) {
        problematicFoods.push('gluten');
      }
      if (lowerAnswer.includes('legumbres') || lowerAnswer.includes('frijoles')) {
        problematicFoods.push('legumbres');
      }
      if (problematicFoods.length > 0) {
        info.badFoods = [...(currentInfo.badFoods || []), ...problematicFoods];
      }
    }

    // Question 6: Water intake
    if (questionId === 6) {
      info.waterIntake = answer;
    }

    // Question 7: Exercise
    if (questionId === 7) {
      info.exercise = answer;
    }

    // Question 8: Sleep
    if (questionId === 8) {
      info.sleep = answer;
    }

    // Question 9: Stress
    if (questionId === 9) {
      info.stress = answer;

      // If sleep mentioned here too
      if (lowerAnswer.includes('duermo mal') || lowerAnswer.includes('insomnio')) {
        info.sleep = 'mal';
      }
    }

    // Question 10: Medical conditions
    if (questionId === 10) {
      const conditions = [];
      if (lowerAnswer.includes('hipotiroidismo')) conditions.push('hipotiroidismo');
      if (lowerAnswer.includes('sii') || lowerAnswer.includes('intestino irritable')) conditions.push('SII');
      if (lowerAnswer.includes('intolerancia')) conditions.push('intolerancias');

      if (conditions.length > 0) {
        info.medicalConditions = conditions;
      }

      // Extract medications
      if (lowerAnswer.includes('medicamento') || lowerAnswer.includes('tomo')) {
        info.medications = [answer];
      }
    }

    // Question 11: Goal
    if (questionId === 11) {
      info.goal = answer;
    }

    // Question 12: Motivation
    if (questionId === 12) {
      const motivationMatch = answer.match(/(\d+)/);
      if (motivationMatch && motivationMatch[1]) {
        info.motivation = parseInt(motivationMatch[1]);
      }
    }

    return info;
  }

  /**
   * Determines if a question should be asked based on collected info
   */
  private shouldAskQuestion(
    question: any,
    collectedInfo: CollectedInfo
  ): boolean {
    if (!question.isConditional) {
      return true; // Mandatory questions always asked
    }

    // If question has condition check, use it
    if (question.conditionCheck) {
      return question.conditionCheck(collectedInfo);
    }

    return true;
  }

  /**
   * Generates block transition messages
   */
  private generateBlockTransition(
    toBlockId: number,
    state: DiagnosticFlowState
  ): string {
    const userName = state.userName || 'amigo/a';

    switch (toBlockId) {
      case 2: // Problem
        return `Perfecto ${userName}, ahora cuéntame qué te trae aquí...`;

      case 3: // Lifestyle
        const problem = state.collectedInfo.mainProblem || 'tu molestia';
        return `Entiendo, ${problem} puede ser muy incómodo. Ahora hablemos un poco de tus hábitos diarios.`;

      case 4: // Health
        return `Gracias por compartir eso, ${userName}. Ahora, sobre tu salud en general...`;

      case 5: // Motivation
        return `${userName}, ya casi terminamos. Hablemos de tus objetivos y expectativas.`;

      default:
        return '';
    }
  }

  /**
   * Inicializa una nueva sesión de diagnóstico con el nombre del usuario
   */
  initializeFlow(language: Language = 'es', userName?: string): { message: string; state: DiagnosticFlowState } {
    const state: DiagnosticFlowState = {
      step: 'initial',
      currentQuestionIndex: 0, // Start from first question (index 0)
      currentBlockId: 1, // Start with block 1
      userName: userName || null,
      language,
      answers: [],
      collectedInfo: {}, // Initialize empty collected info
      imageAnalysis: null,
      diagnosisContent: null,
    };

    // Personalizar mensaje de bienvenida con el nombre
    const langKey = (language === 'en' ? 'en' : 'es') as 'es' | 'en';
    const welcomeTemplate = WELCOME_MESSAGES[langKey];
    let welcomeMessage: string;
    if (userName) {
      // Extraer solo el primer nombre (ignorar apellidos)
      const nameParts = userName.trim().split(' ');
      const firstName: string = nameParts[0] || userName || '';
      welcomeMessage = welcomeTemplate.replace('{userName}', firstName);
    } else {
      // Si no hay nombre, remover el placeholder
      welcomeMessage = welcomeTemplate.replace('{userName}', '');
    }

    return {
      message: welcomeMessage,
      state,
    };
  }

  /**
   * Procesa el mensaje del usuario y retorna la respuesta apropiada según el flujo
   */
  async processMessage(
    userMessage: string,
    currentState: DiagnosticFlowState,
    imageData?: { base64: string; mimeType: string }
  ): Promise<FlowResponse> {
    switch (currentState.step) {
      case 'initial':
        return this.handleInitialMessage(userMessage, currentState);

      case 'greeting':
        return this.handleGreetingAcknowledgment(currentState);

      case 'asking_questions':
        return this.handleQuestionResponse(userMessage, currentState, imageData);

      case 'pdf_question':
        return this.handlePdfResponse(userMessage, currentState);

      case 'cta':
      case 'completed':
        return this.handleCompletedFlow(currentState);

      default:
        return {
          message: 'Estado no válido',
          newState: currentState,
          type: 'validation_error',
        };
    }
  }

  /**
   * Maneja el primer mensaje del usuario (cuando ya tiene nombre, solo responde "sí" al welcome)
   */
  private async handleInitialMessage(
    userMessage: string,
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    // El usuario ya tiene nombre desde la sesión
    // Solo esperamos confirmación para empezar las preguntas

    const questions = getDiagnosticQuestions(currentState.language);
    const firstQuestion = questions[0]; // Start from first question (index 0)

    if (!firstQuestion) {
      throw new Error('No questions available');
    }

    // Preparar estado actualizado - vamos directo a hacer preguntas
    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'asking_questions',
      currentQuestionIndex: 0, // Start from first question (index 0)
      currentBlockId: firstQuestion.blockId,
    };

    // NO enviar nextQuestion aquí porque el message YA ES la pregunta
    return {
      message: firstQuestion.question,
      newState,
      questionDetails: firstQuestion.questionDetails,
      type: 'question',
    };
  }

  /**
   * Después del saludo, envía la primera pregunta
   */
  private async handleGreetingAcknowledgment(
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    const questions = getDiagnosticQuestions(currentState.language);
    const firstQuestion = questions[0]; // First question (index 0)

    if (!firstQuestion) {
      throw new Error('First question not found');
    }

    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'asking_questions',
      currentQuestionIndex: 0,
      currentBlockId: firstQuestion.blockId,
    };

    return {
      message: firstQuestion.question,
      newState,
      nextQuestion: firstQuestion.question,
      questionDetails: firstQuestion.questionDetails,
      type: 'question',
    };
  }

  /**
   * Maneja la respuesta del usuario a una pregunta diagnóstica
   */
  private async handleQuestionResponse(
    userAnswer: string,
    currentState: DiagnosticFlowState,
    imageData?: { base64: string; mimeType: string }
  ): Promise<FlowResponse> {
    const questions = getDiagnosticQuestions(currentState.language);
    const currentQuestion = questions[currentState.currentQuestionIndex];

    if (!currentQuestion) {
      return {
        message: 'Error: pregunta no encontrada',
        newState: currentState,
        type: 'validation_error',
      };
    }

    // Validar respuesta
    const validation = await this.validateAnswer(
      currentQuestion.question,
      userAnswer,
      currentState.language
    );

    if (!validation.isValid) {
      return {
        message: validation.feedback || 'Por favor, proporciona una respuesta más detallada.',
        newState: currentState,
        type: 'validation_error',
      };
    }

    // Extraer información de la respuesta
    const extractedInfo = this.extractInfoFromAnswer(
      currentQuestion.id,
      userAnswer,
      currentState.collectedInfo
    );

    // Actualizar información recopilada
    const updatedInfo = {
      ...currentState.collectedInfo,
      ...extractedInfo,
    };

    // Guardar respuesta
    const newAnswers = [
      ...currentState.answers,
      {
        question: currentQuestion.question,
        answer: userAnswer,
      },
    ];

    // CASO ESPECIAL: Pregunta 1 (edad y ocupación)
    if (currentQuestion.id === 1 && extractedInfo.age && extractedInfo.occupation) {
      const occupationComment = this.generateOccupationComment(
        extractedInfo.age!,
        extractedInfo.occupation!,
        currentState.language
      );

      const nextQuestion = questions[currentState.currentQuestionIndex + 1];
      if (!nextQuestion) {
        throw new Error('Next question not found');
      }

      const newState: DiagnosticFlowState = {
        ...currentState,
        currentQuestionIndex: currentState.currentQuestionIndex + 1,
        currentBlockId: nextQuestion.blockId,
        answers: newAnswers,
        collectedInfo: updatedInfo,
      };

      // Combinar comentario de ocupación + transición de bloque + siguiente pregunta
      const blockTransition = this.generateBlockTransition(nextQuestion.blockId, newState);
      const fullMessage = `${occupationComment}\n\n${blockTransition}\n\n${nextQuestion.question}`;

      return {
        message: fullMessage,
        newState,
        questionDetails: nextQuestion.questionDetails,
        type: 'comment',
      };
    }

    // Analizar imagen si es la pregunta 13
    let imageAnalysis = currentState.imageAnalysis;
    if (currentQuestion.id === 13 && imageData) {
      try {
        const imageBuffer = Buffer.from(imageData.base64, 'base64');
        imageAnalysis = await this.visionService.analyzeImage(
          imageBuffer,
          currentState.language
        );
        updatedInfo.imageAnalysis = imageAnalysis;
      } catch (error) {
        console.error('Error analyzing image:', error);
        imageAnalysis = null;
      }
    }

    // Generar comentario empático
    const comment = await this.generateEmpathicComment(
      currentQuestion.question,
      userAnswer,
      currentState.language
    );

    // Buscar la SIGUIENTE pregunta NO condicional o que cumpla su condición
    let nextIndex = currentState.currentQuestionIndex + 1;
    let nextQuestion = questions[nextIndex];

    while (nextQuestion && !this.shouldAskQuestion(nextQuestion, updatedInfo)) {
      nextIndex++;
      nextQuestion = questions[nextIndex];
    }

    if (nextQuestion) {
      // Hay más preguntas
      const newState: DiagnosticFlowState = {
        ...currentState,
        currentQuestionIndex: nextIndex,
        currentBlockId: nextQuestion.blockId,
        answers: newAnswers,
        collectedInfo: updatedInfo,
        imageAnalysis,
      };

      // Verificar si cambió de bloque
      let fullMessage = comment;
      if (nextQuestion.blockId !== currentQuestion.blockId) {
        const blockTransition = this.generateBlockTransition(nextQuestion.blockId, newState);
        fullMessage += `\n\n${blockTransition}`;
      }
      fullMessage += `\n\n${nextQuestion.question}`;

      return {
        message: fullMessage,
        newState,
        questionDetails: nextQuestion.questionDetails,
        type: 'comment',
      };
    } else {
      // Todas las preguntas respondidas - generar diagnóstico
      const diagnosis = await this.generateDiagnosis(
        currentState.userName!,
        newAnswers,
        imageAnalysis,
        currentState.language,
        updatedInfo
      );

      const newState: DiagnosticFlowState = {
        ...currentState,
        step: 'pdf_question',
        answers: newAnswers,
        collectedInfo: updatedInfo,
        imageAnalysis,
        diagnosisContent: diagnosis,
      };

      const fullMessage = `${comment}\n\n${diagnosis}\n\n${PDF_QUESTION[currentState.language as 'es' | 'en']}`;

      return {
        message: fullMessage,
        newState,
        type: 'diagnosis',
      };
    }
  }

  /**
   * Maneja la respuesta a la pregunta del PDF
   */
  private async handlePdfResponse(
    userAnswer: string,
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'cta',
    };

    const cta = FINAL_CTA[currentState.language as 'es' | 'en'];
    const fullMessage = `${cta.mainText}\n\n${cta.subscribePrompt}`;

    return {
      message: fullMessage,
      newState,
      type: 'cta',
    };
  }

  /**
   * Maneja mensajes después de completar el flujo
   */
  private async handleCompletedFlow(
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'completed',
    };

    const defaultReply =
      currentState.language === 'es'
        ? 'Para seguir profundizando en tu caso y obtener un plan personalizado, necesitas dar el siguiente paso. ¡Estoy aquí para ayudarte a empezar!'
        : "To continue delving into your case and get a personalized plan, you need to take the next step. I'm here to help you get started!";

    return {
      message: defaultReply,
      newState,
      type: 'completed',
    };
  }

  /**
   * Detecta el idioma del mensaje
   */
  private async detectLanguage(text: string): Promise<Language> {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          {
            role: 'system',
            content: 'Detecta el idioma del texto y responde SOLO con el código: "es" para español o "en" para inglés.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 5,
      });

      const langCode = response.choices[0]?.message?.content?.trim().toLowerCase();
      return langCode === 'en' ? 'en' : 'es';
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'es';
    }
  }

  /**
   * Extrae el nombre del usuario
   */
  private async extractName(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          {
            role: 'system',
            content:
              'Extrae SOLO el nombre de la persona del texto. Responde ÚNICAMENTE con el nombre, sin explicaciones.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 20,
      });

      const name = response.choices[0]?.message?.content?.trim();
      if (!name || name.length === 0) {
        return 'Usuario';
      }
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    } catch (error) {
      console.error('Error extracting name:', error);
      return 'Usuario';
    }
  }

  /**
   * Genera la etimología del nombre
   */
  private async generateNameEtymology(name: string, language: Language): Promise<string> {
    if (!name || name.toLowerCase() === 'usuario' || name.toLowerCase() === 'user') {
      return '';
    }

    try {
      const prompt =
        language === 'es'
          ? `Genera un comentario breve (máximo 15 palabras) sobre el significado o etimología del nombre "${name}". Sé breve y positivo.`
          : `Generate a brief comment (maximum 15 words) about the meaning or etymology of the name "${name}". Be brief and positive.`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 50,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating name etymology:', error);
      return '';
    }
  }

  /**
   * Valida la respuesta del usuario
   */
  private async validateAnswer(
    question: string,
    answer: string,
    language: Language
  ): Promise<{ isValid: boolean; feedback: string }> {
    // Validación básica: rechazar solo respuestas obviamente inválidas
    const trimmedAnswer = answer.trim();

    // Aceptar cualquier respuesta con al menos 1 carácter
    if (trimmedAnswer.length === 0) {
      return {
        isValid: false,
        feedback: language === 'es'
          ? 'Por favor, escribe una respuesta.'
          : 'Please write an answer.',
      };
    }

    // Rechazar solo respuestas sin sentido o spam
    if (trimmedAnswer.length < 2 && !/[a-zA-Z0-9]/.test(trimmedAnswer)) {
      return {
        isValid: false,
        feedback: language === 'es'
          ? 'Por favor, proporciona una respuesta válida.'
          : 'Please provide a valid answer.',
      };
    }

    // Todas las demás respuestas son válidas (incluyendo "Bien", "Mal", "Sí", "No", etc.)
    return { isValid: true, feedback: '' };
  }

  /**
   * Genera un comentario empático basado en la respuesta
   */
  private async generateEmpathicComment(
    question: string,
    answer: string,
    language: Language
  ): Promise<string> {
    try {
      const prompt =
        language === 'es'
          ? `Genera un comentario corto y empático basado en esta respuesta del cuestionario.

Pregunta: "${question}"
Respuesta: "${answer}"

REQUISITOS:
- Máximo 1-2 frases
- Comenzar con emoji relevante
- NO hacer preguntas adicionales
- Ser empático y alentador`
          : `Generate a short empathetic comment based on this questionnaire response.

Question: "${question}"
Answer: "${answer}"

REQUIREMENTS:
- Maximum 1-2 sentences
- Start with relevant emoji
- DO NOT ask additional questions
- Be empathetic and encouraging`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 80,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating empathic comment:', error);
      return language === 'es'
        ? '✨ Gracias por tu respuesta. Sigamos adelante.'
        : "✨ Thank you for your answer. Let's continue.";
    }
  }

  /**
   * Genera el diagnóstico final
   */
  private async generateDiagnosis(
    userName: string,
    answers: Array<{ question: string; answer: string }>,
    imageAnalysis: string | null,
    language: Language,
    collectedInfo?: CollectedInfo
  ): Promise<string> {
    try {
      // Formatear respuestas
      const answersText = answers
        .map(
          (qa, index) =>
            `${index + 1}. ${qa.question.replace(/^[👋🤔🎯⏰💊🍽️😣💧🏃😴😰🩺💊🚻🌟🔥💬]\s*\d+\.\s*/, '')}\n   Respuesta: ${qa.answer}`
        )
        .join('\n\n');

      const imageSection = imageAnalysis ? `\n\n📸 Análisis de imagen:\n${imageAnalysis}` : '';

      // Add collected info context
      const contextSection = collectedInfo ? `

**INFORMACIÓN RECOPILADA:**
- Edad: ${collectedInfo.age || 'No especificada'}
- Ocupación: ${collectedInfo.occupation || 'No especificada'} (${collectedInfo.occupationType || 'default'})
- Problema principal: ${collectedInfo.mainProblem || 'No especificado'}
- Duración: ${collectedInfo.duration || 'No especificada'}
- Alimentación: ${collectedInfo.diet || 'No especificada'}
- Alimentos problemáticos: ${collectedInfo.badFoods?.join(', ') || 'Ninguno mencionado'}
- Agua: ${collectedInfo.waterIntake || 'No especificada'}
- Ejercicio: ${collectedInfo.exercise || 'No especificado'}
- Sueño: ${collectedInfo.sleep || 'No especificado'}
- Estrés: ${collectedInfo.stress || 'No especificado'}
- Condiciones médicas: ${collectedInfo.medicalConditions?.join(', ') || 'Ninguna'}
- Medicamentos: ${collectedInfo.medications?.join(', ') || 'Ninguno'}
- Objetivo: ${collectedInfo.goal || 'No especificado'}
- Motivación: ${collectedInfo.motivation ? `${collectedInfo.motivation}/10` : 'No especificada'}` : '';

      const prompt =
        language === 'es'
          ? `Genera un diagnóstico personalizado para ${userName} basado en sus respuestas al cuestionario de salud digestiva.

RESPUESTAS DEL CUESTIONARIO:
${answersText}${imageSection}${contextSection}

INSTRUCCIONES:
1. Saludo personalizado con el nombre
2. 3-4 puntos clave con emoji + título en negrita
3. Conclusión conectando todos los puntos
4. Párrafo de solución integral
5. Cierre motivador

REQUISITOS:
- Análisis holístico de síntomas
- Lenguaje empático y alentador
- Evitar jerga médica compleja
- 300-450 palabras
- NO dar planes de acción detallados
- NO mencionar medicamentos específicos`
          : `Generate a personalized diagnosis for ${userName} based on their digestive health questionnaire responses.

QUESTIONNAIRE RESPONSES:
${answersText}${imageSection}${contextSection}

INSTRUCTIONS:
1. Personalized greeting with name
2. 3-4 key points with emoji + bold title
3. Conclusion connecting all points
4. Integral solution paragraph
5. Motivational closing

REQUIREMENTS:
- Holistic symptom analysis
- Empathetic and encouraging language
- Avoid complex medical jargon
- 300-450 words
- DO NOT give detailed action plans
- DO NOT mention specific medications`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [
          { role: 'system', content: ASSISTANT_INSTRUCTIONS },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating diagnosis:', error);
      return language === 'es'
        ? 'Lo siento, hubo un error al generar tu diagnóstico. Por favor, intenta nuevamente.'
        : 'Sorry, there was an error generating your diagnosis. Please try again.';
    }
  }
}
