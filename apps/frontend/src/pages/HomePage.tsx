import { useState, useEffect } from 'react';
import { ChatContainer } from '../components/chat/ChatContainer';
import { WelcomeModal } from '../components/modals/WelcomeModal';
import { useSessionStore } from '../stores/sessionStore';

/**
 * HomePage - Flujo gratuito sin login
 * Muestra el chat directamente con WelcomeModal overlay en primera visita
 */
export const HomePage = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { setSession } = useSessionStore();

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    // Show modal only if user hasn't seen it before
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseModal = () => {
    setShowWelcomeModal(false);

    // Iniciar sesión gratuita anónima cuando cierra el modal
    setSession({
      id: `free_${Date.now()}`, // ID temporal para flujo gratuito
      userName: 'Usuario', // Nombre por defecto para flujo gratuito
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
    </div>
  );
};
