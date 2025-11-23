import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePro?: boolean;
}

export function ProtectedRoute({ children, requirePro = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  // Check if token is still valid
  const isValid = checkAuth();

  if (!isAuthenticated || !isValid) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (requirePro && user?.role !== 'PRO') {
    // Requires PRO but user is FREE
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
