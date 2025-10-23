import {
  createLanguageDetectionMessages,
  createNameExtractionMessages,
  createNameEtymologyMessages,
  createResponseValidationMessages,
  createContextualCommentMessages,
  createDiagnosisMessages,
  type ChatMessage,
} from '../constants/prompts';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const TEXT_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ValidationResult {
  isValid: boolean;
  feedback: string;
}

async function callOpenAI(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
  }
): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.error('VITE_OPENAI_API_KEY no está configurada');
    throw new Error('API key not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 150,
      ...(options?.responseFormat && { response_format: options.responseFormat }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error de OpenAI:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

export const openaiService = {
  /**
   * Detecta el idioma de un texto usando OpenAI
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const messages = createLanguageDetectionMessages(text);
      const langCode = await callOpenAI(messages, {
        temperature: 0,
        maxTokens: 5,
      });
      const cleanCode = langCode.trim().toLowerCase();
      if (/^[a-z]{2}$/.test(cleanCode)) {
        return cleanCode;
      }
      return 'es';
    } catch (error) {
      console.error('Error al detectar idioma con OpenAI:', error);
      return 'es';
    }
  },

  /**
   * Extrae el nombre de una persona del texto
   */
  async extractUserName(text: string): Promise<string> {
    try {
      const messages = createNameExtractionMessages(text);
      const name = await callOpenAI(messages, {
        temperature: 0,
        maxTokens: 10,
      });
      return name.trim() || 'Usuario';
    } catch (error) {
      console.error('Error al extraer el nombre con OpenAI:', error);
      return 'Usuario';
    }
  },

  /**
   * Genera un comentario sobre la etimología del nombre
   */
  async generateNameEtymology(name: string, language: string): Promise<string> {
    if (!name || name.toLowerCase() === 'usuario') {
      return '';
    }
    try {
      const messages = createNameEtymologyMessages(name, language);
      const etymology = await callOpenAI(messages, {
        temperature: 0.6,
        maxTokens: 60,
      });
      return etymology.trim();
    } catch (error) {
      console.error(`Error al generar la etimología del nombre para "${name}":`, error);
      return '';
    }
  },

  /**
   * Valida si la respuesta del usuario es coherente y relevante para la pregunta
   */
  async validateResponse(
    question: string,
    userAnswer: string,
    language: string
  ): Promise<ValidationResult> {
    try {
      const messages = createResponseValidationMessages(question, userAnswer, language);
      const result = await callOpenAI(messages, {
        temperature: 0,
        maxTokens: 100,
        responseFormat: { type: 'json_object' },
      });
      return JSON.parse(result) as ValidationResult;
    } catch (error) {
      console.error('Error al validar la respuesta con OpenAI:', error);
      // Default to true on error to avoid blocking the user
      return { isValid: true, feedback: '' };
    }
  },

  /**
   * Genera un comentario contextual y empático basado en la respuesta del usuario
   */
  async generateContextualComment(
    question: string,
    userAnswer: string,
    language: string
  ): Promise<string> {
    try {
      const messages = createContextualCommentMessages(question, userAnswer, language);
      const comment = await callOpenAI(messages, {
        temperature: 0.5,
        maxTokens: 80,
      });
      return comment.trim();
    } catch (error) {
      console.error('Error al generar comentario contextual con OpenAI:', error);
      return language === 'es'
        ? 'Gracias por tu respuesta. Sigamos adelante.'
        : 'Thank you for your answer. Let\'s continue.';
    }
  },

  /**
   * Genera el diagnóstico final basado en todas las respuestas del usuario
   */
  async generateDiagnosis(
    userName: string,
    questionsAndAnswers: Array<{ question: string; answer: string }>,
    imageAnalysis: string | null,
    language: string
  ): Promise<string> {
    try {
      const messages = createDiagnosisMessages(
        userName,
        questionsAndAnswers,
        imageAnalysis,
        language
      );
      const diagnosis = await callOpenAI(messages, {
        temperature: 0.7,
        maxTokens: 1024,
      });
      return diagnosis.trim();
    } catch (error) {
      console.error('Error al generar diagnóstico con OpenAI:', error);
      return language === 'es'
        ? 'Lo siento, hubo un error al generar tu diagnóstico. Por favor, intenta nuevamente.'
        : 'Sorry, there was an error generating your diagnosis. Please try again.';
    }
  },
};
