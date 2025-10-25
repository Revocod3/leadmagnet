import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showButton, setShowButton] = useState(false);

  const messages = {
    es: {
      greeting: `¡Hola, ${userName}!`,
      subtitle: 'Preparando tu experiencia personalizada',
      buttonText: 'Comenzar mi diagnóstico',
    },
    en: {
      greeting: `Hello, ${userName}!`,
      subtitle: 'Preparing your personalized experience',
      buttonText: 'Start my diagnosis',
    },
  };

  const content = messages[language];

  useEffect(() => {
    // Secuencia de animaciones
    const timers = [
      // Mostrar etimología después del saludo
      setTimeout(() => {
        if (etymology) {
          setShowEtymology(true);
        }
      }, 1200),

      // Mostrar botón después de la etimología (o antes si no hay etimología)
      setTimeout(() => {
        setShowButton(true);
      }, etymology ? 2800 : 1800),
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [etymology]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden backdrop-blur-sm"
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

      {/* Content */}
      <div className="relative text-center px-6 max-w-3xl z-10">
        {/* Logo Circular con efecto de respiración */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
          className="inline-block mb-10"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255, 255, 255, 0.4)',
                '0 0 0 20px rgba(255, 255, 255, 0)',
                '0 0 0 0 rgba(255, 255, 255, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="relative border-4 border-white w-32 h-32 bg-white rounded-full flex items-center justify-center overflow-hidden"
          >
            <img
              src="/assets/images/favicon.webp"
              alt="OVP"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Greeting con efecto de texto */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-6xl sm:text-7xl font-bold text-white mb-6 tracking-tight">
            {content.greeting}
          </h1>
        </motion.div>

        {/* Subtitle con línea decorativa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="h-[2px] bg-white/60"
            />
            <p className="text-xl sm:text-2xl text-white/95 font-light">
              {content.subtitle}
            </p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="h-[2px] bg-white/60"
            />
          </div>
        </motion.div>

        {/* Etymology Box con diseño mejorado */}
        <AnimatePresence>
          {showEtymology && etymology && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              className="mb-8 mx-auto max-w-2xl"
            >
              <div className="relative px-8 py-6 bg-white/98 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#99AB75] to-[#A0AD5E] rounded-full">
                  <span className="text-xs font-semibold text-white tracking-wider uppercase">
                    {language === 'es' ? 'Sabías que...' : 'Did you know...'}
                  </span>
                </div>
                <p className="text-lg text-neutral-700 leading-relaxed pt-2">
                  {etymology}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón mejorado */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15
              }}
            >
              <motion.button
                onClick={onComplete}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-12 py-4 bg-white text-[#99AB75] rounded-full font-bold text-lg shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {content.buttonText}
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
                <motion.div
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#99AB75] to-[#A0AD5E] -z-0"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 opacity-0 group-hover:opacity-100"
                >
                  <span className="flex items-center gap-3">
                    {content.buttonText}
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                </motion.div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
