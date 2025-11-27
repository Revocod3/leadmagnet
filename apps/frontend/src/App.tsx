import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ChatContainer } from './components/chat/ChatContainer';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            {/* Public home - Free diagnostic flow */}
            <Route path="/" element={<HomePage />} />

            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes - Clara PRO */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatContainer />
                </ProtectedRoute>
              }
            />

            {/* Redirect all other routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
