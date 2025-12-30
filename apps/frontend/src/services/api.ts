// apps/frontend/src/services/api.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
import { compressImageIfNeeded } from '../utils/imageCompression';
import type {
  ApiResponse,
  CreateSessionRequest,
  SendMessageRequest,
  SubmitQuizAnswerRequest,
  SessionData,
  ChatMessage,
  QuizAnswer,
  DiagnosisResponse,
} from '../types';

// Use undefined check instead of falsy check to distinguish between empty string and undefined
const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // If API_URL is empty string (production), use relative path /api
    // If API_URL has value (dev), append /api to it
    const baseURL = API_URL === '' ? '/api' : `${API_URL}/api`;

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 segundos para dar tiempo a generar diagnósticos
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        const responseData = error.response?.data as any;

        // Check for rate limit errors (429)
        if (error.response?.status === 429) {
          const rateLimitError = new Error(responseData?.error || 'Demasiadas solicitudes. Por favor espera un momento.');
          (rateLimitError as any).code = 'RATE_LIMIT';
          (rateLimitError as any).isRateLimit = true;
          throw rateLimitError;
        }

        // Check for conversation not found errors (404)
        if (error.response?.status === 404 && responseData?.code === 'CONVERSATION_NOT_FOUND') {
          const notFoundError = new Error(responseData.error || 'Conversation not found');
          (notFoundError as any).code = 'CONVERSATION_NOT_FOUND';
          throw notFoundError;
        }

        // Check for subscription required errors (403 with requiresSubscription)
        if (error.response?.status === 403 && responseData?.data?.requiresSubscription) {
          const subscriptionError = new Error(responseData.error || 'Necesitas una suscripción Pro');
          (subscriptionError as any).requiresSubscription = true;
          (subscriptionError as any).subscriptionExpired = responseData.data?.subscriptionExpired || false;
          (subscriptionError as any).trialExpired = responseData.data?.trialExpired || false;
          throw subscriptionError;
        }

        const errorMessage = responseData?.error || 'Error de conexión';
        throw new Error(errorMessage);
      }
    );
  }

  // Session endpoints
  async createSession(data: CreateSessionRequest): Promise<SessionData> {
    const response = await this.client.post<ApiResponse<SessionData>>('/sessions', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al crear sesión');
    }
    return response.data.data;
  }

  async getSession(sessionId: string): Promise<SessionData> {
    const response = await this.client.get<ApiResponse<SessionData>>(`/sessions/${sessionId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener sesión');
    }
    return response.data.data;
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<SessionData> {
    const response = await this.client.put<ApiResponse<SessionData>>(
      `/sessions/${sessionId}`,
      updates
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al actualizar sesión');
    }
    return response.data.data;
  }

  // Chat endpoints
  async initializeChat(sessionId: string, language: 'es' | 'en'): Promise<ChatMessage> {
    const response = await this.client.post<ApiResponse<ChatMessage>>('/chat/init', {
      sessionId,
      language,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al inicializar chat');
    }
    return response.data.data;
  }

  async sendMessage(data: SendMessageRequest, imageFile?: File): Promise<ChatMessage> {
    let response;

    if (imageFile) {
      const uploadFile = await compressImageIfNeeded(imageFile);
      // Send as FormData with image
      const formData = new FormData();
      formData.append('sessionId', data.sessionId);
      formData.append('message', data.message);
      formData.append('image', uploadFile);

      response = await this.client.post<ApiResponse<ChatMessage>>('/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Send as JSON without image
      response = await this.client.post<ApiResponse<ChatMessage>>('/chat', data);
    }

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al enviar mensaje');
    }
    return response.data.data;
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await this.client.get<ApiResponse<ChatMessage[]>>(`/chat/${sessionId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener historial');
    }
    return response.data.data;
  }

  async getConversationalDiagnosis(sessionId: string): Promise<{ ready: boolean; content: string | null; discountCode?: string; discountPercentage?: number }> {
    const response = await this.client.get<ApiResponse<{ ready: boolean; content: string | null; discountCode?: string; discountPercentage?: number }>>(`/chat/${sessionId}/diagnosis`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener diagnóstico');
    }
    return response.data.data;
  }

  // Quiz endpoints
  async submitQuizAnswer(data: SubmitQuizAnswerRequest): Promise<QuizAnswer> {
    const response = await this.client.post<ApiResponse<QuizAnswer>>('/quiz', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al enviar respuesta');
    }
    return response.data.data;
  }

  async getQuizAnswers(sessionId: string): Promise<QuizAnswer[]> {
    const response = await this.client.get<ApiResponse<QuizAnswer[]>>(`/quiz/${sessionId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener respuestas');
    }
    return response.data.data;
  }

  async generateDiagnosis(sessionId: string): Promise<DiagnosisResponse> {
    const response = await this.client.post<ApiResponse<DiagnosisResponse>>(
      `/quiz/${sessionId}/diagnosis`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al generar diagnóstico');
    }
    return response.data.data;
  }

  async getDiagnosis(sessionId: string): Promise<DiagnosisResponse> {
    const response = await this.client.get<ApiResponse<DiagnosisResponse>>(
      `/quiz/${sessionId}/diagnosis`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener diagnóstico');
    }
    return response.data.data;
  }

  // Image endpoints
  async uploadImage(sessionId: string, imageFile: File): Promise<{ analysis: string }> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('image', imageFile);

    const response = await this.client.post<ApiResponse<{ analysis: string }>>(
      '/images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al subir imagen');
    }
    return response.data.data;
  }

  async getImageAnalysis(sessionId: string): Promise<{ analysis: string | null }> {
    const response = await this.client.get<ApiResponse<{ analysis: string | null }>>(
      `/images/${sessionId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener análisis');
    }
    return response.data.data;
  }

  // Rating endpoints
  async createRating(data: {
    sessionId: string;
    rating: number;
    comment?: string;
    flowType: 'free' | 'paid';
  }): Promise<void> {
    const response = await this.client.post<ApiResponse>('/ratings', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al enviar valoración');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PRO API Endpoints
  // ══════════════════════════════════════════════════════════════

  private getAuthHeaders(): { Authorization: string } | {} {
    // Read from Zustand persisted store
    const storedAuth = localStorage.getItem('ovp-auth-storage');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const token = parsed.state?.token;
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }
    }
    return {};
  }

  // Get PRO status and subscription info
  async getProStatus(): Promise<{
    user: { name: string; email: string; role: string };
    subscription: {
      status: string;
      plan: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
      isActive: boolean;
    } | null;
    stats: { conversationCount: number };
  }> {
    const response = await this.client.get<ApiResponse<any>>('/pro/status', {
      headers: this.getAuthHeaders(),
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener estado PRO');
    }
    return response.data.data;
  }

  // List all PRO conversations
  async getProConversations(): Promise<Array<{
    id: string;
    title: string | null;
    lastMessageAt: string;
    messageCount: number;
    createdAt: string;
  }>> {
    const response = await this.client.get<ApiResponse<any>>('/pro/conversations', {
      headers: this.getAuthHeaders(),
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener conversaciones');
    }
    return response.data.data;
  }

  // Create new PRO conversation
  async createProConversation(): Promise<{
    conversationId: string;
    message: { role: string; content: string };
    isOnboarding?: boolean;
    onboardingTurn?: number;
  }> {
    const response = await this.client.post<ApiResponse<any>>('/pro/conversations', {}, {
      headers: this.getAuthHeaders(),
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al crear conversación');
    }
    return response.data.data;
  }

  // Get PRO conversation with messages
  async getProConversation(conversationId: string): Promise<{
    messages: Array<{ role: string; content: string; createdAt: string }>;
    conversation: { id: string; title: string | null; createdAt: string };
    isOnboarding?: boolean;
    onboardingTurn?: number;
  }> {
    const response = await this.client.get<ApiResponse<any>>(`/pro/conversations/${conversationId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener conversación');
    }
    return response.data.data;
  }

  // Send message in PRO conversation
  async sendProMessage(conversationId: string, message: string, imageFile?: File): Promise<{
    role: string;
    content: string;
    isOnboarding?: boolean;
    onboardingTurn?: number;
  }> {
    let response;

    if (imageFile) {
      const uploadFile = await compressImageIfNeeded(imageFile);
      // Send as FormData with image (same as free flow)
      const formData = new FormData();
      formData.append('message', message);
      formData.append('image', uploadFile);

      response = await this.client.post<ApiResponse<any>>(
        `/pro/conversations/${conversationId}/message`,
        formData,
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } else {
      // Send as JSON without image
      response = await this.client.post<ApiResponse<any>>(
        `/pro/conversations/${conversationId}/message`,
        { message },
        { headers: this.getAuthHeaders() }
      );
    }

    if (!response.data.success || !response.data.data) {
      // Check for subscription expired
      if ((response.data as any).code === 'SUBSCRIPTION_EXPIRED') {
        throw new Error('SUBSCRIPTION_EXPIRED');
      }
      throw new Error(response.data.error || 'Error al enviar mensaje');
    }
    return response.data.data;
  }

  // Delete PRO conversation
  async deleteProConversation(conversationId: string): Promise<void> {
    const response = await this.client.delete<ApiResponse<any>>(
      `/pro/conversations/${conversationId}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al eliminar conversación');
    }
  }

  // Ratings
  async submitRating(data: { sessionId: string; rating: number; comment?: string; flowType: 'free' | 'paid' }): Promise<void> {
    const response = await this.client.post<ApiResponse<void>>('/ratings', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al enviar valoración');
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();