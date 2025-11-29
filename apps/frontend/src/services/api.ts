// apps/frontend/src/services/api.ts

import axios, { AxiosInstance, AxiosError } from 'axios';
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
        const errorMessage = error.response?.data?.error || 'Error de conexión';
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
      // Send as FormData with image
      const formData = new FormData();
      formData.append('sessionId', data.sessionId);
      formData.append('message', data.message);
      formData.append('image', imageFile);

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

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();