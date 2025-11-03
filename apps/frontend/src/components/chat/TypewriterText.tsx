import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export const TypewriterText = ({
  text,
  speed = 30,
  onComplete,
  className = ''
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const initialTextRef = useRef(text);
  const animationStarted = useRef(false);

  // Solo resetear si el texto inicial cambia (prevenir re-renders)
  useEffect(() => {
    if (initialTextRef.current !== text && !animationStarted.current) {
      console.log('🔄 TypewriterText: Texto cambiado, reiniciando animación');
      initialTextRef.current = text;
      setDisplayedText('');
      setCurrentIndex(0);
      setIsComplete(false);
      animationStarted.current = false;
    }
  }, [text]);

  useEffect(() => {
    if (!animationStarted.current && currentIndex === 0) {
      animationStarted.current = true;
      console.log('▶️ TypewriterText: Iniciando animación');
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      console.log('✅ TypewriterText: Animación completada');
      if (onComplete) {
        onComplete();
      }
    }

    return undefined;
  }, [currentIndex, text, speed, onComplete, isComplete]);

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
