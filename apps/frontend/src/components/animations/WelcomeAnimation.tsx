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
    // Show etymology immediately if available
    if (etymology) {
      const timer = setTimeout(() => {
        setShowEtymology(true);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // If no etymology, just complete after showing greeting
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [etymology, onComplete]);

  useEffect(() => {
    // Complete animation after showing etymology
    if (showEtymology) {
      const timer = setTimeout(() => {
        onComplete();
      }, 6000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showEtymology, onComplete]);

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
      {/* Círculo superior izquierdo - breathing effect */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.2, 0.15],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="absolute -top-48 -left-48 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(153, 171, 117, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Círculo inferior derecho - breathing effect */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.2, 0.15],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 4, // Desfasado para efecto más orgánico
        }}
        className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(165, 178, 108, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Content */}
      <div className="relative text-center px-6 max-w-2xl z-10">
        {/* Logo Circular */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="inline-block mb-8"
        >
          <div className="relative w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden">
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
        <AnimatePresence>
          {showEtymology && etymology && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="max-w-lg mx-auto px-8 py-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl"
            >
              <p className="text-base text-neutral-700 leading-relaxed">
                {etymology}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar - más elegante y simple */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 w-64 h-1 bg-white/20 rounded-full mx-auto overflow-hidden"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: showEtymology ? 6 : 3,
              ease: "linear",
            }}
            className="h-full bg-white/80 rounded-full"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
