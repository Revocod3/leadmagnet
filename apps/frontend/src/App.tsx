import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatContainer } from './components/chat/ChatContainer';
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
  useNavigate();
  const location = useLocation();
  const { setSession } = useSessionStore();
  const [, setHasCompletedIntro] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true); // Cambiar a true por defecto
  const [userName, setUserName] = useState('');
  const [etymology, setEtymology] = useState('');
  const hasInitializedRef = useRef(false);

  // Auto-detect URL params and start flow
  useEffect(() => {
    console.log('🔍 useEffect ejecutado - pathname:', location.pathname);

    // Solo corre en '/'
    if (location.pathname !== '/') return;

    // Evitar ejecución múltiple en React Strict Mode
    if (hasInitializedRef.current) {
      console.log('⏭️ Ya inicializado, saltando...');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const nombre = urlParams.get('nombre');
    const email = urlParams.get('email');
    const leadId = urlParams.get('leadId') || urlParams.get('lead_id');

    // Si vienen params, SIEMPRE corremos intro (queremos animación cada vez que llegas con URL)
    if (nombre && email) {
      hasInitializedRef.current = true;
      // Limpiar cualquier sesión anterior antes de crear una nueva
      sessionStorage.removeItem('userData');
      localStorage.removeItem('ovp-session-storage');
      handleIntroComplete(nombre, email, leadId || undefined);
      return;
    }

    const userDataStr = sessionStorage.getItem('userData');

    // Si no hay params pero tenemos userData guardado: asegurar sesión y NO mostrar animación
    if (userDataStr) {
      const parsed = JSON.parse(userDataStr);
      setUserName(parsed.name);
      setHasCompletedIntro(true);
      setShowWelcome(false); // No mostrar animación cuando regresamos
      hasInitializedRef.current = true;
      return;
    }

    // No params y sin userData: redirigir a WP (primer ingreso inválido)
    window.location.href = 'https://objetivovientreplano.com/diagnostico-gratuito/';
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
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome ? (
          userName ? (
            <WelcomeAnimation
              userName={userName}
              etymology={etymology}
              onComplete={handleWelcomeComplete}
              language="es"
            />
          ) : (
            // Loading screen mientras se obtiene el nombre
            <motion.div
              key="loading"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #99AB75 0%, #A0AD5E 50%, #A5B26C 100%)'
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20"
              >
                <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-contain drop-shadow-2xl" />
              </motion.div>
            </motion.div>
          )
        ) : (
          <motion.div
            key="chat-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Routes>
              <Route path="/" element={<ChatContainer />} />
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
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