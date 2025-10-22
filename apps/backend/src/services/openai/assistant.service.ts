import { openai, MODELS, ASSISTANT_INSTRUCTIONS } from '../config/openai';
import { env } from '../config/env';
import type { Language, ChatMessage, DiagnosisResponse } from '../types';

export class AssistantService {
  private assistantId: string;

  constructor(assistantId: string) {
    this.assistantId = assistantId;
  }

  async createThread(): Promise<string> {
    const thread = await openai.beta.threads.create();
    return thread.id;
  }

  async addMessage(threadId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<void> {
    await openai.beta.threads.messages.create(threadId, {
      role,
      content,
    });
  }

  async runThread(threadId: string): Promise<string> {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed') {
        throw new Error(`Assistant run failed: ${runStatus.last_error?.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Get the latest message
    const messages = await openai.beta.threads.messages.list(threadId, { limit: 1 });
    const message = messages.data[0];

    if (!message || !message.content[0]) {
      throw new Error('No response from assistant');
    }

    const content = message.content[0];
    if ('text' in content) {
      return content.text.value;
    }

    throw new Error('Unexpected message format');
  }

  async sendMessage(threadId: string, message: string): Promise<string> {
    await this.addMessage(threadId, message, 'user');
    return this.runThread(threadId);
  }

  async validateAnswer(question: string, answer: string): Promise<{ isValid: boolean; feedback?: string }> {
    const prompt = `
Valida si esta respuesta es coherente para la pregunta.

Pregunta: "${question}"
Respuesta: "${answer}"

Responde en formato JSON:
{
  "isValid": boolean,
  "feedback": "mensaje solo si es inválida"
}
    `.trim();

    const response = await openai.chat.completions.create({
      model: MODELS.TEXT,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { isValid: true };
    }

    try {
      return JSON.parse(content);
    } catch {
      return { isValid: true };
    }
  }

  async generateEmpathicComment(question: string, answer: string, language: Language): Promise<string> {
    const prompt = `
Genera un comentario corto y empático basado en esta respuesta.

Pregunta: "${question}"
Respuesta: "${answer}"

Requisitos:
- 1-2 frases máximo
- Comienza con emoji relevante
- No hagas preguntas
- Responde en ${language === 'es' ? 'español' : 'inglés'}
    `.trim();

    const response = await openai.chat.completions.create({
      model: MODELS.TEXT,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateDiagnosis(
    userName: string | undefined,
    answers: string,
    imageAnalysis: string | undefined,
    language: Language
  ): Promise<string> {
    const imageSection = imageAnalysis ? `\n\nAnálisis de imagen: ${imageAnalysis}` : '';

    const prompt = `
Genera un diagnóstico para ${userName || 'el usuario'} basado en:

${answers}${imageSection}

Recuerda seguir la estructura exacta del diagnóstico.
Responde en ${language === 'es' ? 'español' : 'inglés'}.
    `.trim();

    const response = await openai.chat.completions.create({
      model: MODELS.TEXT,
      messages: [
        { role: 'system', content: ASSISTANT_INSTRUCTIONS },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || '';
  }
}

export async function createAssistant(): Promise<string> {
  const assistant = await openai.beta.assistants.create({
    name: 'Objetivo Vientre Plano Assistant',
    instructions: ASSISTANT_INSTRUCTIONS,
    model: MODELS.TEXT,
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('✅ Assistant created:', assistant.id);
  return assistant.id;
}

export async function getOrCreateAssistant(): Promise<string> {
  if (env.OPENAI_ASSISTANT_ID) {
    try {
      await openai.beta.assistants.retrieve(env.OPENAI_ASSISTANT_ID);
      return env.OPENAI_ASSISTANT_ID;
    } catch {
      console.log('⚠️  Assistant not found, creating new one...');
    }
  }

  return createAssistant();
}