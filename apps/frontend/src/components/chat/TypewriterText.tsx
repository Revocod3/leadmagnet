import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  shouldAnimate?: boolean; // Si es false, mostrar texto completo inmediatamente
}

export const TypewriterText = ({
  text,
  speed = 30,
  onComplete,
  className = '',
  shouldAnimate = true // Por defecto anima
}: TypewriterTextProps) => {
  // Si no debe animar, mostrar texto completo desde el inicio
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : text);
  const [currentIndex, setCurrentIndex] = useState(shouldAnimate ? 0 : text.length);
  const [isComplete, setIsComplete] = useState(!shouldAnimate);
  const initialTextRef = useRef(text);
  const animationStarted = useRef(false);

  // Si shouldAnimate es false, mostrar texto completo inmediatamente
  useEffect(() => {
    if (!shouldAnimate && !isComplete) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      setIsComplete(true);
    }
  }, [shouldAnimate, text, isComplete]);

  // Solo resetear si el texto inicial cambia (prevenir re-renders)
  useEffect(() => {
    if (initialTextRef.current !== text && !animationStarted.current) {
      initialTextRef.current = text;
      if (shouldAnimate) {
        setDisplayedText('');
        setCurrentIndex(0);
        setIsComplete(false);
        animationStarted.current = false;
      } else {
        setDisplayedText(text);
        setCurrentIndex(text.length);
        setIsComplete(true);
      }
    }
  }, [text, shouldAnimate]);

  useEffect(() => {
    // Si no debe animar, ya se maneja en el otro useEffect
    if (!shouldAnimate) {
      return;
    }

    if (!animationStarted.current && currentIndex === 0) {
      animationStarted.current = true;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }

    return undefined;
  }, [currentIndex, text, speed, onComplete, isComplete, shouldAnimate]);

  return (
    <div className={className}>
      {isComplete ? (
        // Cuando termine, mostrar con Markdown formateado
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words font-semibold leading-tight">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-foreground">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic font-semibold">{children}</em>
            ),
            br: () => null, // Eliminar todos los <br> para mantener compacto
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-0.5 font-semibold leading-tight">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 space-y-0.5 font-semibold leading-tight">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="ml-2 font-semibold leading-tight">{children}</li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-full text-sm font-bold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 no-underline"
              >
                {children}
                <span className="text-xs">→</span>
              </a>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      ) : (
        // Durante el typing, mostrar texto plano con cursor
        <span className="whitespace-pre-wrap break-words font-semibold leading-tight">
          {displayedText}
          <span className="inline-block w-[2px] h-4 ml-0.5 bg-current animate-pulse" />
        </span>
      )}
    </div>
  );
};
