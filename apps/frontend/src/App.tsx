import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntroScreen } from './components/screens/IntroScreen';
import { ChatContainer } from './components/chat/ChatContainer';
import { QuizContainer } from './components/quiz/QuizContainer';
import { DiagnosisScreen } from './components/screens/DiagnosisScreen';
import { Layout } from './components/layout/Layout';
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
            <Route path="/" element={<IntroScreen />} />
            <Route path="/chat" element={<ChatContainer />} />
            <Route path="/quiz" element={<QuizContainer />} />
            <Route path="/diagnosis" element={<DiagnosisScreen />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;