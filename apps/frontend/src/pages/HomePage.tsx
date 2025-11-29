import { useState, useEffect } from 'react';
import { ChatContainer } from '../components/chat/ChatContainer';
import { WelcomeModal } from '../components/modals/WelcomeModal';
import { WelcomeAnimation } from '../components/animations/WelcomeAnimation';
import { useSessionStore } from '../stores/sessionStore';

/**
 * HomePage - Flujo gratuito sin login
 * Muestra el chat directamente con WelcomeModal overlay en primera visita
 */
export const HomePage = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const [capturedUserName, setCapturedUserName] = useState<string>('');
  const { setSession } = useSessionStore();

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    // Show modal only if user hasn't seen it before
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

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
