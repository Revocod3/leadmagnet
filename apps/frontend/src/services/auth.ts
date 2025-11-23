import { apiClient } from './api';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: 'FREE' | 'PRO';
      provider: string;
      emailVerified: boolean;
    };
  };
  error?: string;
}

class AuthService {
  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient['client'].post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  }

  /**
   * Login with email/password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient['client'].post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  }

  /**
   * Get current user
   */
  async me(token: string): Promise<AuthResponse> {
    try {
      const response = await apiClient['client'].get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get user',
      };
    }
  }

  /**
   * Get Google OAuth URL
   */
  getGoogleAuthUrl(): string {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${API_URL}/api/auth/google`;
  }
}

export const authService = new AuthService();
