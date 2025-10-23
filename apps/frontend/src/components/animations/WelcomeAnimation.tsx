import { useEffect, useState } from 'react';

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
  const [fadeOut, setFadeOut] = useState(false);
  const [showEtymology, setShowEtymology] = useState(false);

  const messages = {
    es: {
      greeting: `Hola, ${userName}. ✨`,
      subtitle: 'Bienvenido/a a tu diagnóstico gratuito',
      loader: 'Preparando algo especial para ti...',
    },
    en: {
      greeting: `Hello, ${userName}. ✨`,
      subtitle: 'Welcome to your free diagnosis',
      loader: 'Preparing something special for you...',
    },
  };

  const content = messages[language];

  useEffect(() => {
    // Show etymology after a short delay
    if (etymology) {
      const etymologyTimer = setTimeout(() => {
        setShowEtymology(true);
      }, 1000);

      return () => clearTimeout(etymologyTimer);
    }
    return undefined;
  }, [etymology]);

  useEffect(() => {
    // Start fade out after 4 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 4000);

    // Complete animation and call onComplete after fade out
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-800 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #97aa79 0%, #a2ae5a 100%)',
      }}
    >
      <div className="welcome-content-wrapper text-center p-5 animate-fade-in-scale">
        <h1 className="welcome-greeting text-5xl md:text-6xl font-semibold text-white mb-4 drop-shadow-lg">
          {content.greeting}
        </h1>
        <p className="welcome-subtext text-xl md:text-2xl text-white/90 mb-8">
          {content.subtitle}
        </p>
        <div className="welcome-etymology max-w-lg mx-auto p-5 bg-white/15 rounded-2xl backdrop-blur-md">
          {!showEtymology ? (
            <div className="etymology-loader text-white/80 text-base animate-pulse-slow">
              {content.loader}
            </div>
          ) : (
            <p className="etymology-text text-white text-lg leading-relaxed animate-fade-in">
              {etymology}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
