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
  const [fadeOut, setFadeOut] = useState(false);

  const messages = {
    es: {
      greeting: `Hola, ${userName}`,
      subtitle: 'Preparando tu experiencia personalizada',
      preparing: 'Analizando tu perfil...',
    },
    en: {
      greeting: `Hello, ${userName}`,
      subtitle: 'Preparing your personalized experience',
      preparing: 'Analyzing your profile...',
    },
  };

  const content = messages[language];

  useEffect(() => {
    // Show etymology after delay
    const etymologyTimer = setTimeout(() => {
      if (etymology) {
        setShowEtymology(true);
      }
    }, 1500);

    // Start fade out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    // Complete animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => {
      clearTimeout(etymologyTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [etymology, onComplete]);

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-brand-cream-100 via-brand-cream-50 to-white"
        >
          {/* Content */}
          <div className="text-center px-6 max-w-2xl">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2,
              }}
              className="inline-block w-24 h-24 mb-8"
            >
              <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-contain drop-shadow-2xl" />
            </motion.div>

            {/* Greeting */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-5xl sm:text-6xl font-bold text-neutral-900 mb-4 tracking-tight"
            >
              {content.greeting}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl text-neutral-600 mb-8"
            >
              {content.subtitle}
            </motion.p>

            {/* Etymology Box */}
            <AnimatePresence mode="wait">
              {!showEtymology ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  className="inline-flex items-center gap-3 px-6 py-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-neutral-200 shadow-soft"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse-soft" />
                    <span className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse-soft [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse-soft [animation-delay:0.4s]" />
                  </div>
                  <span className="text-sm text-neutral-600">
                    {content.preparing}
                  </span>
                </motion.div>
              ) : etymology ? (
                <motion.div
                  key="etymology"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-lg mx-auto px-6 py-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-brand-green-200 shadow-soft"
                >
                  <p className="text-base text-neutral-700 leading-relaxed">
                    {etymology}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1, duration: 2 }}
              className="mt-12 w-48 h-1 bg-neutral-200 rounded-full mx-auto overflow-hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: 1,
                }}
                className="h-full w-1/2 bg-gradient-to-r from-brand-green-400 to-brand-green-600 rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
