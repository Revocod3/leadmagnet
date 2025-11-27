import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WelcomeAnimation } from '../components/animations/WelcomeAnimation';
import { ChatContainer } from '../components/chat/ChatContainer';
import { useSessionStore } from '../stores/sessionStore';

/**
 * HomePage - Flujo gratuito sin login
 * Muestra WelcomeAnimation -> ChatContainer (diagnóstico gratuito)
 */
export const HomePage = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const [userName, setUserName] = useState('');
  const { setSession } = useSessionStore();

  // Capturar nombre del usuario desde WelcomeAnimation
  const handleNameCaptured = (name: string) => {
    setUserName(name);
  };

  // Completar welcome animation e iniciar chat gratuito
  const handleWelcomeComplete = () => {
    setShowWelcome(false);

    // Iniciar sesión gratuita (sin userId - es anónimo)
    setSession({
      id: `free_${Date.now()}`, // ID temporal para flujo gratuito
      userName,
      language: 'es',
      startTime: new Date().toISOString(),
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Botón de "Ya tienes cuenta? Iniciar Sesión" - Fixed top right */}
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed top-4 right-4 z-[10000]"
        >
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-full text-white font-semibold text-sm hover:bg-white/30 hover:border-white/60 transition-all shadow-lg"
          >
            ¿Ya tienes cuenta? <span className="font-bold">Iniciar Sesión</span>
          </button>
        </motion.div>
      )}

      {/* Welcome Animation */}
      {showWelcome && (
        <WelcomeAnimation
          {...(userName ? { userName } : {})} // Solo pasar userName si existe
          onComplete={handleWelcomeComplete}
          onNameCaptured={handleNameCaptured}
          language="es"
          alwaysAskName={true} // Siempre pedir nombre en homepage
        />
      )}

      {/* Chat Container - Flujo gratuito */}
      {!showWelcome && <ChatContainer />}
    </div>
  );
};
