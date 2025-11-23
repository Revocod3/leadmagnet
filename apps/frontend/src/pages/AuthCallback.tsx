import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { jwtDecode } from 'jwt-decode';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      try {
        // Decode token to get user info
        const decoded: any = jwtDecode(token);

        // Create user object from JWT payload
        const user = {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          role: decoded.role,
          provider: 'google',
          emailVerified: true,
        };

        // Save auth data
        setAuth(token, user as any);

        // Redirect to chat
        navigate('/chat', { replace: true });
      } catch (error) {
        console.error('Error processing auth callback:', error);
        navigate('/login?error=invalid_token', { replace: true });
      }
    } else {
      // No token, redirect to login with error
      navigate('/login?error=auth_failed', { replace: true });
    }
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
