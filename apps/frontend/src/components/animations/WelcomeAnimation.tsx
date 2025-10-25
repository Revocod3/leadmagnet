import { useEffect, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface WelcomeAnimationProps {
  userName: string;
  etymology?: string;
  onComplete: () => void;
  language?: 'es' | 'en';
}

export const WelcomeAnimation = ({
  userName,
  etymology,
  onComplete,
  language = 'es',
}: WelcomeAnimationProps) => {
  const [showEtymology, setShowEtymology] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  // Mantener una duración estable para la animación de la barra
  const progressDuration = etymology ? 6 : 3;

  const messages = {
    es: {
      greeting: `¡Hola, ${userName}!`,
      subtitle: 'Preparando tu experiencia personalizada',
    },
    en: {
      greeting: `Hello, ${userName}!`,
      subtitle: 'Preparing your personalized experience',
    },
  };

  const content = messages[language];

  useEffect(() => {
    // Mostrar la etimología poco después si existe, pero no continuar automáticamente
    if (etymology) {
      const timer = setTimeout(() => setShowEtymology(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [etymology]);

  // Cambiar automáticamente de barra -> botón al completar la animación
  useEffect(() => {
    const totalMs = (0.7 + progressDuration) * 1000; // incluye el pequeño delay visual
    const timer = setTimeout(() => setShowStartButton(true), totalMs);
    return () => clearTimeout(timer);
  }, [progressDuration]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #99AB75 0%, #A0AD5E 50%, #A5B26C 100%)'
      }}
    >

      {/* Content */}
      <div
        className={`relative text-center px-6 max-w-2xl z-10 transition-all duration-500`}
      >
        {/* Logo Circular */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="inline-block mb-8"
        >
          <div className="relative border border-white w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src="/assets/images/favicon.webp"
              alt="OVP"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight"
        >
          {content.greeting}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-xl text-white/90 mb-8"
        >
          {content.subtitle}
        </motion.p>

        {/* Etymology Box */}
        <div className="relative h-40">
          {' '}
          {/* Placeholder for spacing */}
          <AnimatePresence>
            {showEtymology && etymology && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-x-0 top-0 w-full max-w-lg mx-auto px-6 py-4 bg-white/95 backdrop-blur-sm rounded-t-3xl rounded-r-3xl shadow-xl"
              >
                <p className="text-base text-neutral-700 leading-relaxed">
                  {etymology}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA morph: progress bar -> "Comenzar" button */}
        <LayoutGroup>
          <div className="mt-4 flex items-center justify-center">
            <AnimatePresence initial={false} mode="wait">
              {!showStartButton ? (
                <motion.div
                  key="progress"
                  layoutId="cta-morph"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  className="w-64 h-1 bg-white/30 rounded-full overflow-hidden relative"
                >
                  {/* Barra de progreso determinada */}
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: progressDuration, ease: 'linear' }}
                  />
                </motion.div>
              ) : (
                <motion.button
                  key="button"
                  layoutId="cta-morph"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  onClick={onComplete}
                  className="w-64 h-11 rounded-full border-2 border-white/80 bg-transparent text-white font-medium shadow-[0_0_0_0_rgba(0,0,0,0)] hover:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  {language === 'es' ? 'Comenzar' : 'Start'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </motion.div>
  );
};
