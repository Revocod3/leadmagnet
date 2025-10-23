import { openai, MODELS, ASSISTANT_INSTRUCTIONS } from '../../config/openai';
import { getDiagnosticQuestions, WELCOME_MESSAGES, GREETING_MESSAGES, DID_YOU_KNOW, PDF_QUESTION, FINAL_CTA } from '../../constants/questions';
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
  userName: string | null;
  language: Language;
  answers: Array<{ question: string; answer: string }>;
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
   * Inicializa una nueva sesión de diagnóstico
   */
  initializeFlow(language: Language = 'es'): { message: string; state: DiagnosticFlowState } {
    const state: DiagnosticFlowState = {
      step: 'initial',
      currentQuestionIndex: 0,
      userName: null,
      language,
      answers: [],
      imageAnalysis: null,
      diagnosisContent: null,
    };

    return {
      message: WELCOME_MESSAGES[language as 'es' | 'en'],
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
   * Maneja el primer mensaje del usuario (extracción de nombre y detección de idioma)
   */
  private async handleInitialMessage(
    userMessage: string,
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    // Detectar idioma
    const language = await this.detectLanguage(userMessage);

    // Extraer nombre
    const userName = await this.extractName(userMessage);

    // Generar etimología del nombre
    const etymology = await this.generateNameEtymology(userName, language);

    // Guardar primera respuesta
    const questions = getDiagnosticQuestions(language);
    const firstQuestion = questions[0];
    if (!firstQuestion) {
      throw new Error('No questions available');
    }
    const answers = [
      {
        question: firstQuestion.question,
        answer: userMessage,
      },
    ];

    // Preparar estado actualizado
    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'greeting',
      userName,
      language,
      answers,
      currentQuestionIndex: 0,
    };

    // Construir mensaje de saludo
    let greeting = GREETING_MESSAGES[language as 'es' | 'en'].replace('{userName}', userName);
    if (etymology) {
      const etymologyClean = etymology.replace(/[.!?]$/, '').trim();
      greeting += ` ${DID_YOU_KNOW[language as 'es' | 'en']}${etymologyClean}?`;
    }

    return {
      message: greeting,
      newState,
      requiresWelcomeAnimation: true,
      etymology,
      type: 'greeting',
    };
  }

  /**
   * Después del saludo, envía la segunda pregunta
   */
  private async handleGreetingAcknowledgment(
    currentState: DiagnosticFlowState
  ): Promise<FlowResponse> {
    const questions = getDiagnosticQuestions(currentState.language);
    const nextQuestion = questions[1]; // Segunda pregunta (índice 1)

    if (!nextQuestion) {
      throw new Error('Next question not found');
    }

    const newState: DiagnosticFlowState = {
      ...currentState,
      step: 'asking_questions',
      currentQuestionIndex: 1,
    };

    return {
      message: nextQuestion.question,
      newState,
      nextQuestion: nextQuestion.question,
      questionDetails: nextQuestion.questionDetails,
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
      // Respuesta inválida - pedir al usuario que responda de nuevo
      return {
        message: validation.feedback || 'Por favor, proporciona una respuesta más detallada.',
        newState: currentState,
        nextQuestion: currentQuestion.question,
        questionDetails: currentQuestion.questionDetails,
        type: 'validation_error',
      };
    }

    // Respuesta válida - guardar y continuar
    const newAnswers = [
      ...currentState.answers,
      {
        question: currentQuestion.question,
        answer: userAnswer,
      },
    ];

    // Analizar imagen si es la pregunta 17
    let imageAnalysis = currentState.imageAnalysis;
    if (currentState.currentQuestionIndex === 16 && imageData) {
      try {
        // Convert base64 string to Buffer
        const imageBuffer = Buffer.from(imageData.base64, 'base64');
        imageAnalysis = await this.visionService.analyzeImage(
          imageBuffer,
          currentState.language
        );
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

    // Verificar si hay más preguntas
    const nextIndex = currentState.currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      // Hay más preguntas
      const nextQuestion = questions[nextIndex];
      if (!nextQuestion) {
        throw new Error('Next question not found');
      }

      const newState: DiagnosticFlowState = {
        ...currentState,
        currentQuestionIndex: nextIndex,
        answers: newAnswers,
        imageAnalysis,
      };

      return {
        message: comment,
        newState,
        nextQuestion: nextQuestion.question,
        questionDetails: nextQuestion.questionDetails,
        type: 'comment',
      };
    } else {
      // Todas las preguntas respondidas - generar diagnóstico
      const diagnosis = await this.generateDiagnosis(
        currentState.userName!,
        newAnswers,
        imageAnalysis,
        currentState.language
      );

      const newState: DiagnosticFlowState = {
        ...currentState,
        step: 'pdf_question',
        answers: newAnswers,
        imageAnalysis,
        diagnosisContent: diagnosis,
      };

      // Retornar comentario + diagnóstico + pregunta de PDF
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
    try {
      const prompt =
        language === 'es'
          ? `Valida si esta respuesta es coherente para la pregunta del cuestionario de salud digestiva.

Pregunta: "${question}"
Respuesta: "${answer}"

Responde SOLO con JSON:
{
  "isValid": boolean,
  "feedback": "mensaje de validación si no es válido, vacío si es válido"
}`
          : `Validate if this answer is coherent for the digestive health questionnaire question.

Question: "${question}"
Answer: "${answer}"

Respond ONLY with JSON:
{
  "isValid": boolean,
  "feedback": "validation message if invalid, empty if valid"
}`;

      const response = await openai.chat.completions.create({
        model: MODELS.TEXT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 100,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { isValid: true, feedback: '' };
      }

      const result = JSON.parse(content);
      return result;
    } catch (error) {
      console.error('Error validating answer:', error);
      // Default to valid on error to avoid blocking user
      return { isValid: true, feedback: '' };
    }
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
    language: Language
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

      const prompt =
        language === 'es'
          ? `Genera un diagnóstico personalizado para ${userName} basado en sus respuestas al cuestionario de salud digestiva.

RESPUESTAS DEL CUESTIONARIO:
${answersText}${imageSection}

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
${answersText}${imageSection}

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
