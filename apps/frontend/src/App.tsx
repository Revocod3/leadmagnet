import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntroScreen } from './components/screens/IntroScreen';
import { ChoiceScreen } from './components/screens/ChoiceScreen';
import { ChatContainer } from './components/chat/ChatContainer';
import { QuizContainer } from './components/quiz/QuizContainer';
import { DiagnosisScreen } from './components/screens/DiagnosisScreen';
import { WelcomeAnimation } from './components/animations/WelcomeAnimation';
import { Layout } from './components/layout/Layout';
import { openaiService } from './services/openai';
import { useSessionStore } from './stores/sessionStore';
import { apiClient } from './services/api';
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
  const { setSession } = useSessionStore();
  const [hasCompletedIntro, setHasCompletedIntro] = useState(() => {
    return !!sessionStorage.getItem('userData');
  });
  const [showChoice, setShowChoice] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  const [etymology, setEtymology] = useState('');

  const handleIntroComplete = async (name: string, email: string, leadId?: string) => {
    // Store user data in session storage
    sessionStorage.setItem('userData', JSON.stringify({ name, email, leadId }));
    setUserName(name);
    setHasCompletedIntro(true);

    // Create backend session with user data
    try {
      const sessionData: any = {
        userName: name,
        userEmail: email,
        language: 'es' as const,
      };

      if (leadId) {
        sessionData.wordpressLeadId = leadId;
      }

      const newSession = await apiClient.createSession(sessionData);
      setSession(newSession);
      console.log('Session created:', newSession);
    } catch (error) {
      console.error('Error creating session:', error);
      // Continue anyway, will show error later if needed
    }

    // Show welcome animation immediately
    setShowWelcome(true);

    // Generate etymology for the welcome animation in background
    try {
      const etymologyText = await openaiService.generateNameEtymology(name, 'es');
      if (etymologyText) {
        setEtymology(etymologyText);
      }
    } catch (error) {
      console.error('Error generating etymology:', error);
      // Continue without etymology
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
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
    setShowWelcome(false);
    setUserName('');
    setEtymology('');
    navigate('/');
  };

  return (
    <>
      {!hasCompletedIntro && <IntroScreen onComplete={handleIntroComplete} />}
      {showWelcome && (
        <WelcomeAnimation
          userName={userName}
          etymology={etymology}
          onComplete={handleWelcomeComplete}
          language="es"
        />
      )}
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