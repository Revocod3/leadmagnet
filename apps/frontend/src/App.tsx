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
  const [initialQuery, setInitialQuery] = useState<string | undefined>();
  const [queryResponse, setQueryResponse] = useState<string | undefined>();
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
    const query = urlParams.get('query');
    const email = urlParams.get('email');
    const leadId = urlParams.get('leadId') || urlParams.get('lead_id');

    // Si viene query (nuevo flujo híbrido), SIEMPRE corremos intro con query
    if (query) {
      hasInitializedRef.current = true;
      console.log('🔍 Detectado parámetro query:', query);
      // Limpiar cualquier sesión anterior antes de crear una nueva
      sessionStorage.removeItem('userData');
      localStorage.removeItem('ovp-session-storage');
      // Usar nombre genérico cool en vez de "Usuario"
      handleIntroComplete('Amigo', email ?? undefined, leadId ?? undefined, query);
      return;
    }

    // Si viene nombre (email es opcional ahora), SIEMPRE corremos intro
    if (nombre) {
      hasInitializedRef.current = true;
      console.log('📝 Detectado parámetro nombre:', nombre);

      // Detectar si el "nombre" parece ser una consulta (tiene más de 4 palabras o palabras clave)
      const palabras = nombre.trim().split(/\s+/);
      const palabrasClave = ['quiero', 'tengo', 'necesito', 'me duele', 'dolor', 'problema', 'consulta', 'ayuda'];
      const esConsulta = palabras.length > 4 || palabrasClave.some(p => nombre.toLowerCase().includes(p));

      if (esConsulta) {
        console.log('⚠️ El parámetro "nombre" parece ser una consulta, convirtiéndolo a query');
        // Limpiar cualquier sesión anterior antes de crear una nueva
        sessionStorage.removeItem('userData');
        localStorage.removeItem('ovp-session-storage');
        // Tratar como query en vez de nombre
        handleIntroComplete('Amigo', email ?? undefined, leadId ?? undefined, nombre);
        return;
      }

      // Limpiar cualquier sesión anterior antes de crear una nueva
      sessionStorage.removeItem('userData');
      localStorage.removeItem('ovp-session-storage');
      handleIntroComplete(nombre, email ?? undefined, leadId ?? undefined);
      return;
    }

    const userDataStr = sessionStorage.getItem('userData');

    // Si no hay params pero tenemos userData guardado: recrear sesión y NO mostrar animación
    if (userDataStr) {
      try {
        const parsed = JSON.parse(userDataStr);
        setUserName(parsed.name);
        setHasCompletedIntro(true);
        setShowWelcome(false); // No mostrar animación cuando regresamos
        hasInitializedRef.current = true;

        // CRÍTICO: Recrear sesión en backend si no existe o si expiró
        // Esto previene crashes cuando el usuario regresa con una sesión vieja
        const sessionData: any = {
          userName: parsed.name,
          language: 'es' as const,
        };

        if (parsed.email) {
          sessionData.userEmail = parsed.email;
        }

        if (parsed.leadId) {
          sessionData.wordpressLeadId = parsed.leadId;
        }

        console.log('🔄 Recreando sesión en backend para userData existente...', sessionData);
        apiClient.createSession(sessionData)
          .then(newSession => {
            setSession(newSession);
            console.log('✅ Sesión recreada:', newSession);
          })
          .catch(error => {
            console.error('❌ Error recreando sesión:', error);
            // Si falla, limpiar y redirigir a WordPress
            sessionStorage.removeItem('userData');
            localStorage.removeItem('ovp-session-storage');
            window.location.href = 'https://objetivovientreplano.com/diagnostico-gratuito/';
          });

        return;
      } catch (error) {
        console.error('Error parsing userData:', error);
        sessionStorage.removeItem('userData');
      }
    }

    // No params y sin userData: redirigir a WP (primer ingreso inválido)
    window.location.href = 'https://objetivovientreplano.com/diagnostico-gratuito/';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleIntroComplete = async (name: string, email?: string, leadId?: string, initialQuery?: string) => {
    console.log('📝 handleIntroComplete llamado:', { name, email: email || 'NO PROPORCIONADO', leadId, initialQuery });

    // Store user data in session storage
    sessionStorage.setItem('userData', JSON.stringify({ name, email, leadId, initialQuery }));
    setUserName(name);
    setInitialQuery(initialQuery);
    setHasCompletedIntro(true);

    // Create backend session with user data
    try {
      const sessionData: any = {
        userName: name,
        language: 'es' as const,
      };

      // Email is now optional
      if (email) {
        sessionData.userEmail = email;
      }

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

    // Si hay query inicial, generar respuesta contextual en vez de etymology
    if (initialQuery) {
      console.log('🔍 Query inicial detectada:', initialQuery);
      console.log('👤 Nombre usado:', name);
      console.log('🎯 Flujo: QUERY (sin etimología)');
      try {
        const contextualResponse = await openaiService.generateQueryResponse(initialQuery, 'es');
        if (contextualResponse) {
          setQueryResponse(contextualResponse);
          console.log('✅ Respuesta contextual generada:', contextualResponse);
        }
      } catch (error) {
        console.error('❌ Error generating query response:', error);
        // Continue with default message
      }
      // NO hacer return aquí - dejar que se muestre el WelcomeAnimation
    } else {
      // Generate etymology for the welcome animation in background (solo para nombres reales)
      console.log('👤 Nombre detectado:', name);
      console.log('🎯 Flujo: NOMBRE (con etimología)');
      try {
        const etymologyText = await openaiService.generateNameEtymology(name, 'es');
        if (etymologyText) {
          setEtymology(etymologyText);
          console.log('✅ Etimología generada:', etymologyText.substring(0, 50) + '...');
        } else {
          console.log('⏭️ No se generó etimología (nombre genérico o error)');
        }
      } catch (error) {
        console.error('❌ Error generating etymology:', error);
        // Continue without etymology
      }
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
              {...(etymology && { etymology })}
              {...(initialQuery && { initialQuery })}
              {...(queryResponse && { queryResponse })}
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
                className="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center p-2 ring-4 ring-white/30"
              >
                <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-cover rounded-full" />
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