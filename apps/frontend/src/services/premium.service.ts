/**
 * Premium Services - Clara Premium Frontend
 * 
 * Services for diary, challenges, push notifications, and progress.
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000';

const baseURL = API_URL === '' ? '/api' : `${API_URL}/api`;

// Custom error class for subscription required
export class SubscriptionRequiredError extends Error {
  requiresSubscription = true;
  subscriptionExpired: boolean;
  
  constructor(message: string, expired = false) {
    super(message);
    this.name = 'SubscriptionRequiredError';
    this.subscriptionExpired = expired;
  }
}

// Create authenticated axios instance
function createAuthClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Add auth token to requests
  client.interceptors.request.use((config) => {
    // Read from Zustand persisted store
    const storedAuth = localStorage.getItem('ovp-auth-storage');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }
    }
    return config;
  });

  // Add response interceptor to handle 403 subscription errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403) {
        const data = error.response.data;
        if (data?.data?.requiresSubscription || data?.requiresSubscription) {
          throw new SubscriptionRequiredError(
            data.error || 'Necesitas una suscripción Pro',
            data.data?.subscriptionExpired || false
          );
        }
      }
      throw error;
    }
  );

  return client;
}

// ==================== DIARY SERVICE ====================

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood: number | null;
  bloating: number | null;
  triggers: string[] | null;
  improvements: string[] | null;
  claraNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryStats {
  totalEntries: number;
  currentStreak: number;
  avgMood: number | null;
  avgBloating: number | null;
  commonTriggers: Array<{ trigger: string; count: number }>;
  weeklyTrend: string;
}

export interface CalendarData {
  year: number;
  month: number;
  entries: Array<{
    day: number;
    hasEntry: boolean;
    mood: number | null;
    bloating: number | null;
  }>;
}

export const diaryService = {
  async getEntries(page = 1, limit = 20): Promise<{ entries: DiaryEntry[]; total: number; pages: number }> {
    const client = createAuthClient();
    const response = await client.get('/diary', { params: { page, limit } });
    return response.data;
  },

  async getEntry(id: string): Promise<DiaryEntry> {
    const client = createAuthClient();
    const response = await client.get(`/diary/${id}`);
    return response.data.entry;
  },

  async getEntryByDate(date: string): Promise<DiaryEntry | null> {
    const client = createAuthClient();
    try {
      const response = await client.get(`/diary/date/${date}`);
      return response.data.entry;
    } catch (error: any) {
      // 404 means no entry for this date - return null instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createEntry(data: {
    date: string;
    content: string;
    mood?: number;
    bloating?: number;
    triggers?: string[];
    improvements?: string[];
  }): Promise<DiaryEntry> {
    const client = createAuthClient();
    const response = await client.post('/diary', data);
    return response.data.entry;
  },

  async updateEntry(id: string, data: Partial<{
    content: string;
    mood: number;
    bloating: number;
    triggers: string[];
    improvements: string[];
  }>): Promise<DiaryEntry> {
    const client = createAuthClient();
    const response = await client.put(`/diary/${id}`, data);
    return response.data.entry;
  },

  async deleteEntry(id: string): Promise<void> {
    const client = createAuthClient();
    await client.delete(`/diary/${id}`);
  },

  async getStats(): Promise<DiaryStats> {
    const client = createAuthClient();
    const response = await client.get('/diary/stats');
    return response.data;
  },

  async getCalendar(year: number, month: number): Promise<CalendarData> {
    const client = createAuthClient();
    const response = await client.get(`/diary/calendar/${year}/${month}`);
    return response.data;
  }
};

// ==================== CHALLENGE SERVICE ====================

export interface MicroChallenge {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationDays: number;
}

export interface UserChallenge {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  pointsEarned: number | null;
  challenge: MicroChallenge;
}

export interface ChallengeStats {
  total: number;
  completed: number;
  skipped: number;
  inProgress: number;
  totalPoints: number;
  streak: number;
  completionRate: number;
}

export const challengeService = {
  async getCurrent(): Promise<UserChallenge | null> {
    const client = createAuthClient();
    const response = await client.get('/challenges/current');
    return response.data.challenge;
  },

  async getHistory(): Promise<UserChallenge[]> {
    const client = createAuthClient();
    const response = await client.get('/challenges/history');
    return response.data.challenges;
  },

  async getStats(): Promise<ChallengeStats> {
    const client = createAuthClient();
    const response = await client.get('/challenges/stats');
    return response.data;
  },

  async getRecommended(): Promise<MicroChallenge | null> {
    const client = createAuthClient();
    const response = await client.get('/challenges/recommended');
    return response.data.challenge;
  },

  async complete(challengeId: string, notes?: string): Promise<{ success: boolean; pointsEarned: number; message: string }> {
    const client = createAuthClient();
    const response = await client.post('/challenges/complete', { challengeId, notes });
    return response.data;
  },

  async skip(challengeId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const client = createAuthClient();
    const response = await client.post('/challenges/skip', { challengeId, reason });
    return response.data;
  },

  async assign(challengeId: string): Promise<{ success: boolean; message: string }> {
    const client = createAuthClient();
    const response = await client.post('/challenges/assign', { challengeId });
    return response.data;
  }
};

// ==================== PUSH NOTIFICATION SERVICE ====================

export interface Reminder {
  id: string;
  type: 'DIARY' | 'CHECK_IN' | 'CHALLENGE';
  enabled: boolean;
  time: string;
}

export const pushService = {
  async getVapidPublicKey(): Promise<string> {
    const client = createAuthClient();
    const response = await client.get('/push/vapid-public-key');
    return response.data.publicKey;
  },

  async subscribe(subscription: PushSubscription): Promise<void> {
    const client = createAuthClient();
    await client.post('/push/subscribe', { subscription: subscription.toJSON() });
  },

  async unsubscribe(endpoint: string): Promise<void> {
    const client = createAuthClient();
    await client.post('/push/unsubscribe', { endpoint });
  },

  async getReminders(): Promise<Reminder[]> {
    const client = createAuthClient();
    const response = await client.get('/push/reminders');
    return response.data.reminders;
  },

  async updateReminder(type: 'DIARY' | 'CHECK_IN' | 'CHALLENGE', enabled: boolean, time?: string): Promise<void> {
    const client = createAuthClient();
    await client.put('/push/reminders', { type, enabled, time });
  },

  async sendTest(): Promise<void> {
    const client = createAuthClient();
    await client.post('/push/test');
  },

  // Helper to check if push is supported and get subscription
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;

    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  },

  async requestPermission(): Promise<NotificationPermission> {
    return Notification.requestPermission();
  },

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;

    const permission = await this.requestPermission();
    if (permission !== 'granted') return null;

    try {
      const publicKey = await this.getVapidPublicKey();
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      await this.subscribe(subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  },

  // Helper to convert VAPID key
  urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }
};

// ==================== PROGRESS SERVICE ====================

export interface UserProgress {
  phase: 'BIENVENIDA' | 'RADIOGRAFIA' | 'SEGUIMIENTO' | 'AVANZADO';
  phaseStartDate: string | null;
  radiographyComplete: boolean;
  stats: {
    conversationCount: number;
    messageCount: number;
    diaryEntries: number;
    challengesCompleted: number;
    daysActive: number;
  };
  context: {
    mainSymptoms: string | null;
    dietaryProfile: string | null;
    stressLevel: string | null;
    digestiveGoals: string[] | null;
    knownTriggers: string[];
    improvements: string[];
  } | null;
}

export const progressService = {
  async getProgress(): Promise<UserProgress> {
    const client = createAuthClient();
    const response = await client.get('/pro/progress');
    return response.data.data;
  }
};

// Export all services
export default {
  diary: diaryService,
  challenges: challengeService,
  push: pushService,
  progress: progressService
};
