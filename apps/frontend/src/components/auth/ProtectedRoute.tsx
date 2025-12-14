import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PRO_MAINTENANCE_MODE } from '../../config/pro-maintenance';
import { ProMaintenanceModal } from '../modals/ProMaintenanceModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePro?: boolean;
  skipOnboardingCheck?: boolean;
}

export function ProtectedRoute({ children, requirePro = false, skipOnboardingCheck = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  // Check if token is still valid
  const isValid = checkAuth();

  if (!isAuthenticated || !isValid) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Global maintenance gate for the PRO experience (covers /pro and /onboarding)
  if (PRO_MAINTENANCE_MODE) {
    return (
      <>
        {children}
        <ProMaintenanceModal isOpen />
      </>
    );
  }

  // Check if user needs to complete onboarding
  if (!skipOnboardingCheck && user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requirePro && user?.role !== 'PRO') {
    // Requires PRO but user is FREE
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
