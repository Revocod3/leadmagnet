import { openai, getOrCreateAssistant } from '../../config/assistants';
import type { Language } from '../../types';

/**
 * AssistantAPIService - Wrapper for OpenAI Assistants API
 * 
 * Handles:
 * - Thread management (create, retrieve)
 * - Message sending
 * - Response streaming
 * - Run management
 */
export class AssistantAPIService {
  private assistantId: string | null = null;

  /**
   * Initialize the service and get/create assistant
   */
  async initialize(): Promise<void> {
    if (!this.assistantId) {
      this.assistantId = await getOrCreateAssistant();
    }
  }

  /**
   * Create a new thread for a conversation
   */
  async createThread(): Promise<string> {
    await this.initialize();

    const thread = await openai.beta.threads.create();
    console.log('📝 Created new thread:', thread.id);

    return thread.id;
  }

  /**
   * Add a message to a thread
   */
  async addMessage(
    threadId: string,
    content: string,
    role: 'user' | 'assistant' = 'user'
  ): Promise<void> {
    await openai.beta.threads.messages.create(threadId, {
      role,
      content,
    });
  }

  /**
   * Send a message and get response from the assistant
   * 
   * @param threadId - Thread ID
   * @param userMessage - User's message
   * @param dynamicInstructions - Optional dynamic instructions to override base instructions
   * @returns Assistant's response
   */
  async sendMessage(
    threadId: string,
    userMessage: string,
    dynamicInstructions?: string
  ): Promise<string> {
    await this.initialize();

    if (!this.assistantId) {
      throw new Error('Assistant not initialized');
    }

    // Add user message to thread
    await this.addMessage(threadId, userMessage, 'user');

    // Create run with optional dynamic instructions
    const runParams: any = {
      assistant_id: this.assistantId,
    };

    if (dynamicInstructions) {
      runParams.additional_instructions = dynamicInstructions;
    }

    const run = await openai.beta.threads.runs.create(threadId, runParams);

    // Wait for completion
    const completedRun = await this.waitForRunCompletion(threadId, run.id);

    if (completedRun.status !== 'completed') {
      throw new Error(`Run failed with status: ${completedRun.status}`);
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 1,
    });

    const lastMessage = messages.data[0];
    if (!lastMessage || lastMessage.role !== 'assistant') {
      throw new Error('No assistant response found');
    }

    // Extract text content
    const textContent = lastMessage.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return textContent.text.value;
  }

  /**
   * Wait for a run to complete
   */
  private async waitForRunCompletion(
    threadId: string,
    runId: string,
    maxAttempts = 30
  ): Promise<any> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);

      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
      }

      // Wait before next check (exponential backoff)
      const delay = Math.min(1000 * Math.pow(1.5, attempts), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));

      attempts++;
    }

    throw new Error('Run timed out');
  }

  /**
   * Get conversation history from thread
   */
  async getThreadMessages(
    threadId: string,
    limit = 20
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: 'asc',
      limit,
    });

    return messages.data.map(msg => {
      const textContent = msg.content.find(c => c.type === 'text');
      return {
        role: msg.role as 'user' | 'assistant',
        content: textContent && textContent.type === 'text' ? textContent.text.value : '',
      };
    });
  }

  /**
   * Delete a thread (cleanup)
   */
  async deleteThread(threadId: string): Promise<void> {
    try {
      await openai.beta.threads.del(threadId);
      console.log('🗑️ Deleted thread:', threadId);
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  }

  /**
   * Stream a response (for real-time UI updates)
   * This is a placeholder for future streaming implementation
   * For now, we just use the regular sendMessage method
   */
  async sendMessageStream(
    threadId: string,
    userMessage: string,
    onChunk: (text: string) => void,
    dynamicInstructions?: string
  ): Promise<string> {
    // For now, just use regular send and call onChunk once with full response
    const response = await this.sendMessage(threadId, userMessage, dynamicInstructions);
    onChunk(response);
    return response;
  }
}
