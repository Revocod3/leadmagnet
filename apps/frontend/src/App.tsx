import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
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
  const location = useLocation();
  const { setSession } = useSessionStore();
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  const [etymology, setEtymology] = useState('');

  // Auto-detect URL params and start flow
  useEffect(() => {
    console.log('🔍 useEffect ejecutado - pathname:', location.pathname);

    // Only run on root path
    if (location.pathname !== '/') {
      console.log('❌ No es root path, saliendo...');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const nombre = urlParams.get('nombre');
    const email = urlParams.get('email');
    const leadId = urlParams.get('leadId') || urlParams.get('lead_id');

    // Check if user already has session data (returning from chat/quiz)
    const userData = sessionStorage.getItem('userData');

    console.log('📊 Estado actual:', {
      nombre,
      email,
      leadId,
      userData: userData ? 'existe' : 'no existe'
    });

    // Si ya hay userData, mostrar ChoiceScreen (usuario volviendo de chat/quiz)
    if (userData) {
      console.log('🔄 Hay userData, mostrando ChoiceScreen...');
      const parsedData = JSON.parse(userData);
      setUserName(parsedData.name);
      setHasCompletedIntro(true);
      setShowChoice(true);
      return;
    }

    // Si hay params en URL, iniciar flujo
    if (nombre && email) {
      console.log('✅ Hay params, iniciando flujo...');
      handleIntroComplete(nombre, email, leadId || undefined);
    } else {
      console.log('⚠️ No hay params ni userData, redirigiendo a WordPress...');
      // Solo redirigir si no hay sesión (primera vez sin params)
      window.location.href = 'https://objetivovientreplano.com/diagnostico-gratuito/';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleIntroComplete = async (name: string, email: string, leadId?: string) => {
    console.log('📝 handleIntroComplete llamado:', { name, email, leadId });

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
        console.log('🏷️ WordPress Lead ID incluido:', leadId);
      }

      console.log('🔄 Creando sesión en backend...', sessionData);
      const newSession = await apiClient.createSession(sessionData);
      setSession(newSession);
      console.log('✅ Sesión creada:', newSession);
    } catch (error) {
      console.error('❌ Error creating session:', error);
      // Continue anyway, will show error later if needed
    }

    // Show welcome animation immediately
    console.log('🎬 Mostrando animación de bienvenida...');
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

  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome && (
          <WelcomeAnimation
            userName={userName}
            etymology={etymology}
            onComplete={handleWelcomeComplete}
            language="es"
          />
        )}
        {hasCompletedIntro && !showWelcome && showChoice && (
          <ChoiceScreen onSelect={handleChoiceSelect} />
        )}
      </AnimatePresence>
      <Routes>
        <Route path="/" element={<div />} />
        <Route path="/chat" element={<ChatContainer />} />
        <Route path="/quiz" element={<QuizContainer />} />
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