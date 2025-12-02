import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContainer } from '../components/chat/ChatContainer';
import { WelcomeModal } from '../components/modals/WelcomeModal';
import { WelcomeAnimation } from '../components/animations/WelcomeAnimation';
import { useSessionStore } from '../stores/sessionStore';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

/**
 * HomePage - Flujo gratuito sin login
 * Muestra el chat directamente con WelcomeModal overlay en primera visita
 * Si el usuario está logueado como PRO, redirige a /chat
 */
export const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { session, setSession } = useSessionStore();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const [capturedUserName, setCapturedUserName] = useState<string>('');

  // Redirigir usuarios PRO logueados a /chat
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Usuario PRO detectado, redirigiendo a /chat');
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Skip if authenticated (will redirect)
    if (isAuthenticated) return;

    const chatStore = useChatStore.getState();

    // Check if FREE chat has expired (48h after diagnosis completed)
    const isExpired = chatStore.isFreeChatExpired();

    if (isExpired) {
      console.log('🔄 FREE chat expired, clearing state and showing welcome modal');
      chatStore.clearFreeChatState();
      localStorage.removeItem('hasSeenWelcome');
    }

    // Show modal if:
    // 1. No session exists (first time or after logout)
    // 2. OR hasn't seen welcome before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    const hasValidSession = session?.id && session?.userName;

    if (!hasValidSession || !hasSeenWelcome) {
      console.log('📝 Showing welcome modal - no valid session or first time');
      setShowWelcomeModal(true);
    }
  }, [isAuthenticated, session?.id, session?.userName]);

  const handleCloseModal = (userName?: string) => {
    setShowWelcomeModal(false);

    if (userName) {
      setCapturedUserName(userName);
      // Mostrar la animación de bienvenida
      setShowWelcomeAnimation(true);
    }
  };

  const handleAnimationComplete = () => {
    setShowWelcomeAnimation(false);

    // Iniciar sesión gratuita con el nombre proporcionado
    setSession({
      id: `free_${Date.now()}`, // ID temporal para flujo gratuito
      userName: capturedUserName || 'Usuario',
      language: 'es',
      startTime: new Date().toISOString(),
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Chat Container - Visible desde el inicio */}
      <ChatContainer />

      {/* Welcome Modal - Aparece sobre el chat en primera visita */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseModal}
      />

      {/* Welcome Animation - Aparece después del modal */}
      {showWelcomeAnimation && (
        <WelcomeAnimation
          userName={capturedUserName}
          etymology={`El significado de tu nombre es único y especial, ${capturedUserName.split(' ')[0]}. Juntos descubriremos tu camino hacia la transformación.`}
          onComplete={handleAnimationComplete}
          language="es"
        />
      )}
    </div>
  );
};
