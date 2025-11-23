import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'FREE' | 'PRO';
  provider: 'email' | 'google' | 'facebook';
  emailVerified: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
        // Clear from localStorage
        localStorage.removeItem('ovp-auth-storage');
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },

      checkAuth: () => {
        const { token } = get();

        if (!token) {
          return false;
        }

        try {
          // Decode JWT to check expiration
          const decoded: any = jwtDecode(token);
          const now = Date.now() / 1000;

          if (decoded.exp && decoded.exp < now) {
            // Token expired
            get().logout();
            return false;
          }

          return true;
        } catch (error) {
          // Invalid token
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'ovp-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
