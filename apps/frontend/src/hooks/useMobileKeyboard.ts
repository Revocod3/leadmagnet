import { useState, useEffect, useCallback, useRef } from 'react';

interface UseMobileKeyboardOptions {
  onKeyboardShow?: (keyboardHeight: number) => void;
  onKeyboardHide?: () => void;
}

interface UseMobileKeyboardReturn {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  viewportHeight: number;
}

/**
 * Hook para manejar el teclado virtual en dispositivos móviles.
 * Detecta cuando el teclado se abre/cierra y calcula la altura disponible.
 *
 * Estrategias utilizadas:
 * 1. visualViewport API (preferida - Chrome, Safari modernos)
 * 2. Fallback con window.innerHeight + focus/blur en inputs
 */
export const useMobileKeyboard = (
  options: UseMobileKeyboardOptions = {}
): UseMobileKeyboardReturn => {
  const { onKeyboardShow, onKeyboardHide } = options;

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 0
  );

  const initialViewportHeight = useRef<number>(0);
  const isIOS = useRef<boolean>(false);

  // Detectar iOS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      isIOS.current = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as Window & { MSStream?: unknown }).MSStream;
      initialViewportHeight.current = window.visualViewport?.height ?? window.innerHeight;
    }
  }, []);

  // Handler para visualViewport (API moderna)
  const handleViewportResize = useCallback(() => {
    if (!window.visualViewport) return;

    const currentHeight = window.visualViewport.height;
    const heightDiff = initialViewportHeight.current - currentHeight;

    // Threshold de 100px para considerar que el teclado está abierto
    // (evitar falsos positivos por rotación de pantalla o barras de navegación)
    const threshold = 100;
    const keyboardIsOpen = heightDiff > threshold;

    setViewportHeight(currentHeight);
    setIsKeyboardOpen(keyboardIsOpen);

    if (keyboardIsOpen) {
      setKeyboardHeight(heightDiff);
      onKeyboardShow?.(heightDiff);
    } else {
      setKeyboardHeight(0);
      onKeyboardHide?.();
    }
  }, [onKeyboardShow, onKeyboardHide]);

  // Handler para scroll del viewport (iOS Safari específico)
  const handleViewportScroll = useCallback(() => {
    if (!window.visualViewport) return;

    // En iOS, cuando el teclado aparece, el viewport hace scroll
    // Necesitamos compensar este scroll
    const scrollTop = window.visualViewport.offsetTop;

    // Aplicar compensación CSS si hay scroll
    if (scrollTop > 0 && isIOS.current) {
      document.documentElement.style.setProperty('--keyboard-offset', `${scrollTop}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    }
  }, []);

  // Fallback para navegadores sin visualViewport
  const handleFocusIn = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Dar tiempo al teclado para aparecer
      setTimeout(() => {
        const newHeight = window.innerHeight;
        const heightDiff = initialViewportHeight.current - newHeight;

        if (heightDiff > 100) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDiff);
          setViewportHeight(newHeight);
          onKeyboardShow?.(heightDiff);
        }
      }, 300);
    }
  }, [onKeyboardShow]);

  const handleFocusOut = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Dar tiempo al teclado para desaparecer
      setTimeout(() => {
        // Solo resetear si no hay otro input enfocado
        if (!document.activeElement ||
            (document.activeElement.tagName !== 'INPUT' &&
             document.activeElement.tagName !== 'TEXTAREA')) {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
          setViewportHeight(window.innerHeight);
          onKeyboardHide?.();
        }
      }, 100);
    }
  }, [onKeyboardHide]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Actualizar altura inicial al montar
    initialViewportHeight.current = window.visualViewport?.height ?? window.innerHeight;
    setViewportHeight(initialViewportHeight.current);

    // Inicializar CSS variable
    document.documentElement.style.setProperty('--keyboard-offset', '0px');
    document.documentElement.style.setProperty('--viewport-height', `${initialViewportHeight.current}px`);

    // Preferir visualViewport API si está disponible
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportScroll);

      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
        window.visualViewport?.removeEventListener('scroll', handleViewportScroll);
      };
    }

    // Fallback para navegadores más antiguos
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [handleViewportResize, handleViewportScroll, handleFocusIn, handleFocusOut]);

  // Actualizar CSS variable cuando cambia la altura del viewport
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    }
  }, [viewportHeight, keyboardHeight]);

  return {
    isKeyboardOpen,
    keyboardHeight,
    viewportHeight,
  };
};
