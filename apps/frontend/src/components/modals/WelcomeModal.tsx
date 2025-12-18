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
          {/* Backdrop with Gradient and Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #99AB75 0%, #A0AD5E 50%, #A5B26C 100%)'
            }}
          >
            {/* Efectos de fondo animados */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0.05 }}
                transition={{ duration: 2, ease: 'easeOut', delay: 0.2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-white"
              />
            </div>
          </motion.div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1], // Custom easing for smooth feel
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 mx-4 md:mx-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md">
              {/* Modal Content - Glassmorphism */}
              <div
                className="relative rounded-3xl border border-white/20 overflow-hidden shadow-2xl bg-white/80 backdrop-blur-sm"
                style={{
                  backdropFilter: 'blur(8px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(8px) saturate(120%)',
                }}
              >
                {/* Logo with expanding ring pulse - centered */}
                <div className="flex justify-center pt-6 pb-2 md:pt-10 md:pb-4">
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(153, 171, 117, 0.4)',
                        '0 0 0 20px rgba(153, 171, 117, 0)',
                        '0 0 0 0 rgba(153, 171, 117, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                    className="relative border-4 border-[#99AB75]/30 w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg"
                  >
                    <img
                      src="/assets/images/favicon.webp"
                      alt="OVP"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="px-5 pb-5 md:px-8 md:pb-10 text-center">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5"
                  >
                    ¡Aquí empieza tu transformación!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-sm md:px-12 text-gray-600 mb-3.5 leading-relaxed"
                  >
                    Ingresa tu nombre para acceder al chat de Objetivo Vientre Plano.
                  </motion.p>

                  {/* Input de nombre */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mb-3.5"
                  >
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        setError('');
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="¿Cómo te llamas?"
                      className="w-full px-4 py-3 rounded-2xl border-[3px] border-gray-300 focus:border-[#99AB75] focus:outline-none focus:ring-2 focus:ring-[#99AB75]/20 transition-all text-gray-900 placeholder-gray-400 text-base bg-white shadow-sm"
                      autoFocus
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-2 text-left px-1"
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
                    className="relative w-full py-3.5 rounded-2xl font-semibold text-white text-base shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(153,171,117,0.5)] transition-shadow duration-300 mb-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, #99AB75 0%, #A0AD5E 100%)',
                    }}
                  >
                    <span
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 pointer-events-none"
                      style={{
                        animation: 'shimmer 3s linear infinite',
                        animationDelay: '1s',
                      }}
                    />
                    <span className="relative z-10">Comenzar diagnóstico</span>
                    <svg
                      className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300"
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
                    className="text-xs text-gray-500"
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
                    className="mt-3 mb-2 pt-3 border-t border-gray-200/50 flex items-center justify-center gap-1 text-xs text-gray-500"
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
                    <span>Sin email ni tarjetas requeridas</span>
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
