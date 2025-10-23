import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntroScreen } from './components/screens/IntroScreen';
import { ChoiceScreen } from './components/screens/ChoiceScreen';
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

function MainFlow() {
  const navigate = useNavigate();
  const [hasCompletedIntro, setHasCompletedIntro] = useState(() => {
    return !!sessionStorage.getItem('userData');
  });
  const [showChoice, setShowChoice] = useState(false);

  const handleIntroComplete = (name: string, email: string) => {
    // Store user data in session storage or state management
    sessionStorage.setItem('userData', JSON.stringify({ name, email }));
    setHasCompletedIntro(true);
    setShowChoice(true);
  };

  const handleChoiceSelect = (choice: 'chat' | 'quiz') => {
    setShowChoice(false);
    if (choice === 'chat') {
      navigate('/chat');
    } else {
      navigate('/quiz');
    }
  };

  const handleRestart = () => {
    sessionStorage.removeItem('userData');
    setHasCompletedIntro(false);
    setShowChoice(false);
    navigate('/');
  };

  return (
    <>
      {!hasCompletedIntro && <IntroScreen onComplete={handleIntroComplete} />}
      {hasCompletedIntro && showChoice && <ChoiceScreen onSelect={handleChoiceSelect} />}
      <Routes>
        <Route path="/" element={<div />} />
        <Route path="/chat" element={<ChatContainer />} />
        <Route path="/quiz" element={<QuizContainer onRestart={handleRestart} />} />
        <Route path="/diagnosis" element={<DiagnosisScreen />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <MainFlow />
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;