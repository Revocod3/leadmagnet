import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeAnimationProps {
  userName?: string;  // Ahora opcional - puede venir vacío si hay query sin nombre
  etymology?: string;
  initialQuery?: string;
  queryResponse?: string;
  onComplete: () => void;
  onNameCaptured?: (name: string) => void;  // Callback cuando se captura el nombre
  language?: 'es' | 'en';
  alwaysAskName?: boolean; // Si es true, siempre pide el nombre aunque no haya query
}

export const WelcomeAnimation = ({
  userName: initialUserName,
  etymology,
  initialQuery,
  queryResponse,
  onComplete,
  onNameCaptured,
  language = 'es',
  alwaysAskName = false,
}: WelcomeAnimationProps) => {
  const [showEtymology, setShowEtymology] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState(initialUserName || '');
  const [nameInputValue, setNameInputValue] = useState('');
  const [progress, setProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);

  // Determinar si necesitamos pedir el nombre
  // 1. Si alwaysAskName=true y no hay nombre → pedir nombre
  // 2. Si hay query pero no hay nombre → pedir nombre
  const needsNameInput = (alwaysAskName && !initialUserName) || (!!initialQuery && !initialUserName);

  // Mostrar input de nombre si es necesario
  useEffect(() => {
    if (needsNameInput) {
      setShowNameInput(true);
    }
  }, [needsNameInput]);

  // Manejar envío del nombre
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInputValue.trim();

    if (name.length < 2) return;

    // Primero ocultar el input con animación
    setShowNameInput(false);

    // Esperar a que termine la animación de salida antes de actualizar
    setTimeout(() => {
      setUserName(name);

      // Notificar al padre que tenemos el nombre
      if (onNameCaptured) {
        onNameCaptured(name);
      }
    }, 400); // Duración de la animación exit
  };

  // Extraer solo el primer nombre
  const firstName = userName.trim().split(/\s+/)[0];

  // Si hay initialQuery, usar mensajes contextuales
  const isQueryFlow = !!initialQuery;

  const messages = {
    es: {
      greeting: isQueryFlow ? `¡Hola, ${firstName}!` : `¡Hola, ${firstName}!`,
      subtitle: isQueryFlow
        ? 'Vamos a ayudarte con tu consulta'
        : 'Preparando tu experiencia personalizada',
      buttonText: 'Comenzar mi diagnóstico',
      queryMessage: queryResponse || 'Entiendo que te preocupa esto. Voy a hacerte algunas preguntas para darte un diagnóstico personalizado.',
    },
    en: {
      greeting: isQueryFlow ? `Hello, ${firstName}!` : `Hello, ${firstName}!`,
      subtitle: isQueryFlow
        ? "Let's help you with your query"
        : 'Preparing your personalized experience',
      buttonText: 'Start my diagnosis',
      queryMessage: queryResponse || 'I understand your concern. I\'ll ask you some questions to give you a personalized diagnosis.',
    },
  };

  const content = messages[language];

  useEffect(() => {
    if (!userName) return;

    // Secuencia de animaciones
    const timers = [
      // Mostrar etimología o mensaje de query después del saludo
      setTimeout(() => {
        if (etymology || (initialQuery && queryResponse)) {
          setShowEtymology(true);
        }
      }, 1200),

      // Mostrar barra de progreso
      setTimeout(() => {
        setShowProgressBar(true);
      }, (etymology || (initialQuery && queryResponse)) ? 2800 : 1800),
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [etymology, initialQuery, queryResponse, userName]);

  // Barra de progreso automática de 7-8 segundos
  useEffect(() => {
    if (!showProgressBar) return;

    const duration = 7500; // 7.5 segundos
    const intervalTime = 50; // Actualizar cada 50ms
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(interval);
        // Llamar a onComplete automáticamente cuando termine
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [showProgressBar, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
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

      {/* Input de nombre minimalista - Se muestra ANTES de la animación si viene query sin nombre */}
      <AnimatePresence mode="wait">
        {showNameInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{
              duration: 0.4,
              ease: "easeInOut"
            }}
            className="relative text-center px-6 max-w-md z-10"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white/30">
                <img
                  src="/assets/images/favicon.webp"
                  alt="OVP"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Mensaje */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              {language === 'es' ? '¡Hola!' : 'Hello!'}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base text-white/90 mb-6 font-light"
            >
              {language === 'es'
                ? 'Antes de comenzar, ¿cómo te llamas?'
                : 'Before we start, what\'s your name?'}
            </motion.p>

            {/* Input Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleNameSubmit}
              className="w-full"
            >
              <div className="relative">
                <input
                  type="text"
                  value={nameInputValue}
                  onChange={(e) => setNameInputValue(e.target.value)}
                  placeholder={language === 'es' ? 'Tu nombre...' : 'Your name...'}
                  autoFocus
                  className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-full text-white placeholder-white/60 text-center text-lg font-light focus:outline-none focus:border-white/80 focus:bg-white/30 transition-all"
                  style={{
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-8 py-3 bg-white text-[#99AB75] rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nameInputValue.trim().length < 2}
              >
                {language === 'es' ? 'Continuar →' : 'Continue →'}
              </motion.button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content - Solo se muestra cuando tenemos nombre */}
      <AnimatePresence>
      {!showNameInput && userName && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
          delay: 0.2
        }}
        className="relative text-center px-6 max-w-2xl z-10"
      >
        {/* Logo Circular con efecto de respiración */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.3,
          }}
          className="inline-block mb-6"
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
            className="relative border-4 border-white w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden"
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
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            {content.greeting}
          </h1>
        </motion.div>

        {/* Subtitle con línea decorativa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 30 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="h-[2px] bg-white/60"
            />
            <p className="text-base sm:text-lg text-white/95 font-light">
              {content.subtitle}
            </p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 30 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="h-[2px] bg-white/60"
            />
          </div>
        </motion.div>

        {/* Etymology Box o Query Message con diseño mejorado */}
        <AnimatePresence>
          {showEtymology && (etymology || (initialQuery && queryResponse)) && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              className="mb-6 mx-auto max-w-xl"
            >
              <div
                className="relative px-6 py-5 rounded-2xl shadow-2xl border border-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 pb-1 bg-[#6B6C44] rounded-full shadow-lg"
                  style={{
                    boxShadow: '0 0 20px rgba(107, 108, 68, 0.4), 0 4px 10px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <span className="text-[10px] font-semibold text-white tracking-wider uppercase drop-shadow-sm">
                    {initialQuery
                      ? (language === 'es' ? 'Tu consulta' : 'Your query')
                      : (language === 'es' ? 'Sabías que...' : 'Did you know...')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-white/95 leading-relaxed pt-1 font-light">
                  {initialQuery ? content.queryMessage : etymology}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de progreso */}
        <AnimatePresence>
          {showProgressBar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15
              }}
              className="w-full max-w-md mx-auto"
            >
              {/* Texto sobre la barra */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/90 text-sm font-light mb-3 text-center"
              >
                {language === 'es' ? 'Preparando tu experiencia...' : 'Preparing your experience...'}
              </motion.p>

              {/* Barra de progreso */}
              <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-white rounded-full shadow-lg"
                  style={{
                    width: `${progress}%`,
                  }}
                  transition={{
                    duration: 0.1,
                    ease: 'linear',
                  }}
                />
              </div>

              {/* Porcentaje */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/70 text-xs font-light mt-2 text-center"
              >
                {Math.round(progress)}%
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};
