import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { ChatContainer } from './components/chat/ChatContainer';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { useAuthStore } from './stores/authStore';
import './styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootRoute() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const isValid = checkAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    // Show modal only if:
    // 1. User hasn't seen it before
    // 2. User is not authenticated (if authenticated, redirect to chat)
    if (!hasSeenWelcome && !isAuthenticated) {
      setShowWelcomeModal(true);
    }
  }, [isAuthenticated]);

  // If authenticated, redirect to chat
  if (isAuthenticated && isValid) {
    return <Navigate to="/chat" replace />;
  }

  // Show chat with welcome modal overlay for first-time visitors
  return (
    <>
      <ChatContainer />
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            {/* Root route - shows chat with welcome modal for new users */}
            <Route path="/" element={<RootRoute />} />

            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatContainer />
                </ProtectedRoute>
              }
            />

            {/* Redirect all other routes to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
