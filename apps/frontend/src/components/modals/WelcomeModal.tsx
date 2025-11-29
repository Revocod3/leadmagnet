import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: (userName?: string) => void;
}

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  const handleContinueDiagnostic = () => {
    if (!userName.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    // Guardar en localStorage que ya vio el modal
    localStorage.setItem('hasSeenWelcome', 'true');
    onClose(userName.trim());
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleContinueDiagnostic();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1], // Custom easing for smooth feel
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md">
              {/* Modal Content */}
              <div
                className="relative rounded-3xl border border-white/20 overflow-hidden shadow-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {/* Checkmark icon with subtle background - centered */}
                <div className="flex justify-center pt-8 pb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(153, 171, 117, 0.1)',
                    }}
                  >
                    <svg
                      className="w-8 h-8 text-[#99AB75]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 text-center">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-3xl font-bold text-gray-900 mb-3"
                  >
                    ¡Comienza tu transformación!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-base text-gray-600 mb-6 leading-relaxed px-2"
                  >
                    Ingresa tu nombre para acceder a tu diagnóstico gratuito
                    personalizado
                  </motion.p>

                  {/* Input de nombre */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mb-6"
                  >
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        setError('');
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Tu nombre"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#99AB75] focus:outline-none transition-all text-gray-900 placeholder-gray-400 text-base"
                      autoFocus
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-2 text-left px-2"
                      >
                        {error}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Main CTA Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinueDiagnostic}
                    disabled={!userName.trim()}
                    className="w-full py-4 rounded-2xl font-semibold text-white text-base shadow-lg hover:shadow-xl transition-all mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #99AB75 0%, #A0AD5E 100%)',
                    }}
                  >
                    Comenzar mi diagnóstico gratuito
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                  </motion.button>

                  {/* Secondary action - Login link */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="text-sm text-gray-500"
                  >
                    <button
                      onClick={handleLogin}
                      className="hover:text-[#99AB75] transition-colors font-medium"
                    >
                      ¿Ya tienes cuenta?{' '}
                      <span className="underline">Iniciar Sesión</span>
                    </button>
                  </motion.div>

                  {/* Benefits footer */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="mt-8 pt-6 border-t border-gray-200/50 flex items-center justify-center gap-1 text-xs text-gray-500"
                  >
                    <svg
                      className="w-4 h-4 text-[#99AB75]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>100% gratuito • Sin email requerido • Resultados inmediatos</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
