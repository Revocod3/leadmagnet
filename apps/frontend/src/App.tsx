import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProPremiumContainer } from './components/pro';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { SetPasswordPage } from './pages/SetPasswordPage';
import { WelcomePage } from './pages/WelcomePage';
import { PricingPage } from './pages/PricingPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import './styles/globals.css';
import './styles/pricing.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component that redirects authenticated users from home to chat
const HomeOrRedirect = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/pro" replace />;
  }

  return <HomePage />;
};

// Wrapper component for ProPremiumContainer with subscription redirect
const ProPremiumWithRedirect = () => {
  const navigate = useNavigate();

  const handleSubscriptionExpired = () => {
    navigate('/pricing');
  };

  return <ProPremiumContainer onSubscriptionExpired={handleSubscriptionExpired} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            {/* Home - Redirects to /pro if authenticated, otherwise shows free flow */}
            <Route path="/" element={<HomeOrRedirect />} />

            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/suscripcion" element={<PricingPage />} />

            {/* Protected routes - Clara Premium with tabs */}
            <Route
              path="/pro"
              element={
                <ProtectedRoute>
                  <ProPremiumWithRedirect />
                </ProtectedRoute>
              }
            />

            {/* Legacy route redirect */}
            <Route path="/chat" element={<Navigate to="/pro" replace />} />

            {/* Redirect all other routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
