import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import { jwtDecode } from 'jwt-decode';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const processAuth = async () => {
      const token = searchParams.get('token');

      if (token) {
        try {
          // Fetch full user data from server to get onboardingCompleted status
          const meResponse = await authService.me(token);

          if (meResponse.success && meResponse.data) {
            const user = meResponse.data.user;

            // Save auth data
            setAuth(token, user as any);

            // Redirect based on onboarding status
            if (!user.onboardingCompleted) {
              navigate('/onboarding', { replace: true });
            } else {
              navigate('/pro', { replace: true });
            }
          } else {
            // Fallback: decode token if /me fails
            const decoded: any = jwtDecode(token);

            const user = {
              id: decoded.userId,
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0],
              role: decoded.role,
              provider: 'google' as const,
              emailVerified: true,
              birthDate: null,
              onboardingCompleted: false,
            };

            setAuth(token, user);
            navigate('/onboarding', { replace: true });
          }
        } catch (error) {
          console.error('Error processing auth callback:', error);
          navigate('/login?error=invalid_token', { replace: true });
        }
      } else {
        navigate('/login?error=auth_failed', { replace: true });
      }
    };

    processAuth();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Iniciando sesión...</p>
      </div>
    </div>
  );
}
