import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// Single-flow mode: no navigation needed here
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { EmailCaptureModal } from '../modals/EmailCaptureModal';
import { RatingModal } from '../modals/RatingModal';
import { RestoreDiagnosticModal } from '../modals/RestoreDiagnosticModal';
import { ChatMessage } from './ChatMessage';
import { ChatHeader } from './ChatHeader';
import { ChatFooter } from './ChatFooter';
import { TypingIndicator } from '../animations/TypingIndicator';
import { DiagnosisGeneratingIndicator } from '../animations/DiagnosisGeneratingIndicator';
import { QuickReplyChips } from './QuickReplyChips';
import { InfoWedge } from './InfoWedge';
import { getBlock, getQuestion, type FlowBlock, type FlowQuestion } from '../../config/diagnostic-flow-config';
import { apiClient } from '../../services/api';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';

/**
 * Patrones de texto para detectar cada pregunta en el mensaje de Clara.
 * Usamos frases clave que son únicas de cada pregunta.
 */
const QUESTION_PATTERNS: { blockIndex: number; questionIndex: number; patterns: RegExp[] }[] = [
  // BLOQUE PERSONAL (0)
  { blockIndex: 0, questionIndex: 0, patterns: [/qué edad tienes/i, /edad tienes/i] },
  { blockIndex: 0, questionIndex: 1, patterns: [/objetivo principal ahora mismo/i, /cuál.*objetivo principal/i] },
  { blockIndex: 0, questionIndex: 2, patterns: [/qué punto.*estás.*bienestar/i, /punto.*sientes.*bienestar/i] },
  // BLOQUE DIGESTIVO (1)
  { blockIndex: 1, questionIndex: 0, patterns: [/momento del día.*barriga.*inflamada/i, /qué momento.*sientes.*inflamada/i] },
  { blockIndex: 1, questionIndex: 1, patterns: [/gases.*pesadez.*digestiones lentas/i, /sueles tener gases/i] },
  { blockIndex: 1, questionIndex: 2, patterns: [/hinchas.*comidas ligeras/i, /notas que te hinchas/i] },
  { blockIndex: 1, questionIndex: 3, patterns: [/inflamas.*tarda.*en bajar/i, /sensación tarda mucho/i] },
  { blockIndex: 1, questionIndex: 4, patterns: [/cuántos días.*semana.*molestias digestivas/i, /días.*semana.*molestias/i] },
  { blockIndex: 1, questionIndex: 5, patterns: [/digestión afecta.*comodidad diaria/i, /ropa.*postura.*movimiento/i] },
  // BLOQUE ENERGÍA (2)
  { blockIndex: 2, questionIndex: 0, patterns: [/energía después de comer/i, /cómo sientes tu energía/i] },
  { blockIndex: 2, questionIndex: 1, patterns: [/dependes de café.*azúcar/i, /café.*snacks.*rendir/i] },
  { blockIndex: 2, questionIndex: 2, patterns: [/momento del día.*más activo.*más cansado/i, /activo.*cansado/i] },
  { blockIndex: 2, questionIndex: 3, patterns: [/falta de energía.*día a día/i, /cómo te afecta la falta/i] },
  { blockIndex: 2, questionIndex: 4, patterns: [/cómo te levantas.*mañanas/i, /levantas normalmente/i] },
  { blockIndex: 2, questionIndex: 5, patterns: [/bajones fuertes de energía/i, /bajones.*alguna hora/i] },
  // BLOQUE EMOCIONAL (3)
  { blockIndex: 3, questionIndex: 0, patterns: [/estrés.*más presente.*últimamente/i, /sientes que el estrés/i] },
  { blockIndex: 3, questionIndex: 1, patterns: [/menos motivación.*constancia/i, /cuesta mantener la constancia/i] },
  { blockIndex: 3, questionIndex: 2, patterns: [/preocupaciones.*ansiedad.*afectan/i, /ansiedad te afectan/i] },
  { blockIndex: 3, questionIndex: 3, patterns: [/aspecto emocional.*mejorar/i, /emocional.*gustaría mejorar/i] },
  { blockIndex: 3, questionIndex: 4, patterns: [/afecta emocionalmente.*inflamado.*poca energía/i, /emocionalmente sentirte/i] },
  { blockIndex: 3, questionIndex: 5, patterns: [/cómo te sientes contigo mismo/i, /sientes contigo.*últimos meses/i] },
];

/**
 * Detecta la pregunta actual basándose en el contenido del último mensaje de Clara.
 * Retorna null si no se detecta ninguna pregunta (ej: mensaje de bienvenida, diagnóstico, etc.)
 */
const detectCurrentQuestion = (lastAssistantMessage: string): {
  blockIndex: number;
  questionIndex: number;
  block: FlowBlock;
  question: FlowQuestion;
} | null => {
  if (!lastAssistantMessage) return null;

  for (const { blockIndex, questionIndex, patterns } of QUESTION_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lastAssistantMessage)) {
        const block = getBlock(blockIndex);
        const question = getQuestion(blockIndex, questionIndex);
        if (block && question) {
          return { blockIndex, questionIndex, block, question };
        }
      }
    }
  }

  return null;
};

export const ChatContainer = () => {
  const { session, language, setSession, imagesUploaded, incrementImagesUploaded } = useSessionStore();
  const { user } = useAuthStore();
  const { i18n } = useTranslation();
  const [inputMessage, setInputMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageLimitMessage, setShowImageLimitMessage] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [hasCheckedRestore, setHasCheckedRestore] = useState(false);
  const [shouldInitialize, setShouldInitialize] = useState(false);

  // Check if already rated on mount/session change
  useEffect(() => {
    if (session?.id) {
      const rated = localStorage.getItem(`rated_${session.id}`) === 'true';
      setHasRated(rated);
    }
  }, [session?.id]);

  // Check for previous session on mount (FREE users only)
  useEffect(() => {
    if (!hasCheckedRestore && !user) {
      // Solo para usuarios FREE - PRO users mantienen su sesión
      const storedSession = localStorage.getItem('ovp-session-storage');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          const session = parsed?.state?.session;

          // Si hay sesión previa, preguntar qué hacer
          if (session?.id) {
            setShowRestoreModal(true);
          } else {
            // No hay sesión previa, inicializar normalmente
            setShouldInitialize(true);
          }
        } catch (e) {
          // Error parseando, inicializar normalmente
          setShouldInitialize(true);
        }
      } else {
        // No hay nada guardado, inicializar normalmente
        setShouldInitialize(true);
      }
      setHasCheckedRestore(true);
    }
  }, [hasCheckedRestore, user]);

  const {
    messages,
    state,
    isProcessing,
    initialize,
    processMessage,
  } = useDiagnosticFlow();

  const { generatePDF } = usePDFGenerator();
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const diagnosisMessageRef = useRef<HTMLDivElement>(null);

  // Estado para controlar si el typewriter terminó
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(true);

  // Hook para manejar el teclado móvil
  const { isKeyboardOpen } = useMobileKeyboard({
    onKeyboardShow: () => {
      // Scroll al final cuando se abre el teclado
      scrollToBottom('instant');
    },
  });

  // Función mejorada de scroll al final
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // Método 1: Usar el ref del final de mensajes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: 'end',
      });
    }

    // Método 2: Backup - scroll del contenedor directamente
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Pequeño delay para asegurar que el DOM se actualizó
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, []);

  // Detectar pregunta actual basándose en el último mensaje de Clara
  const lastAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    return assistantMessages[assistantMessages.length - 1]?.content || '';
  }, [messages]);

  // Detectar pregunta actual parseando el contenido del mensaje
  const currentQuestionInfo = useMemo(() => {
    return detectCurrentQuestion(lastAssistantMessage);
  }, [lastAssistantMessage]);

  // Bloque y pregunta actuales (si estamos en flujo de preguntas)
  const currentBlock = currentQuestionInfo?.block || null;
  const currentQuestion = currentQuestionInfo?.question || null;

  // ¿Mostrar barra de progreso? Solo si detectamos una pregunta válida
  const showProgressBar = currentQuestionInfo !== null && state.step !== 'diagnosis_ready';

  // Handler para selección de chip de respuesta rápida
  const handleChipSelect = (option: { value: string; label: string }) => {
    if (!isProcessing && isTypewriterComplete) {
      processMessage(option.label);
    }
  };

  // Cuando llega un nuevo mensaje de asistente, resetear el estado del typewriter
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      // Si el mensaje es nuevo (isNew !== false), el typewriter empezará
      if (lastMessage.isNew !== false) {
        setIsTypewriterComplete(false);
      } else {
        // Mensaje restaurado, ya está completo
        setIsTypewriterComplete(true);
      }
    }
  }, [messages]);

  // Callback para cuando el typewriter termina
  const handleTypewriterComplete = () => {
    setIsTypewriterComplete(true);
  };

  // Trigger Rating Modal when diagnosis is ready and user scrolls to bottom
  useEffect(() => {
    if (state.step === 'diagnosis_ready' && !hasRated && !showRatingModal) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            // Add a small delay to not be too intrusive immediately
            setTimeout(() => {
              setShowRatingModal(true);
            }, 1500);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (messagesEndRef.current) {
        observer.observe(messagesEndRef.current);
      }

      return () => observer.disconnect();
    }
    return undefined;
  }, [state.step, hasRated, showRatingModal]);

  // Create session if it doesn't exist OR if session doesn't belong to current user
  useEffect(() => {
    const createSessionIfNeeded = async () => {
      // VALIDACIÓN CRÍTICA: Si hay usuario PRO autenticado
      if (user) {
        // Si hay sesión PERO no pertenece a este usuario → LIMPIAR
        if (session?.id && session.userId !== user.id) {
          setSession({ ...session, id: '', userId: undefined } as any); // Forzar limpieza
          return; // Salir y dejar que el siguiente render cree la sesión correcta
        }
      }

      // Crear sesión si:
      // 1. No hay session.id O tiene un ID temporal (free_*)
      // 2. Y hay user (PRO) O hay userName (free)
      const needsSession = (!session?.id || session.id.startsWith('free_')) &&
        (user || session?.userName);

      if (needsSession) {
        try {
          // Determinar userName según el contexto
          const userName = user
            ? (user.name || user.email.split('@')[0] || 'Usuario')
            : (session?.userName || 'Usuario');


          // Para usuarios PRO, pasar userId - el backend buscará sesión existente
          const newSession = await apiClient.createSession({
            userName: userName,
            language: language as 'es' | 'en',
            ...(user && { userId: user.id }), // Solo si es usuario PRO
          });

          setSession(newSession);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    };

    createSessionIfNeeded();
  }, [session?.id, session?.userId, session?.userName, user, language, setSession]);

  // Initialize only once when session is available AND shouldInitialize is true
  useEffect(() => {
    // Solo inicializar si:
    // 1. No hay mensajes
    // 2. Hay una sesión activa
    // 3. El sessionId NO es temporal (ya fue reemplazado por uno real del backend)
    // 4. No estamos procesando
    // 5. shouldInitialize es true (usuario eligió continuar o es sesión nueva)
    const isRealSession = session?.id && !session.id.startsWith('free_');

    if (messages.length === 0 && isRealSession && !isProcessing && shouldInitialize) {
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, shouldInitialize]);

  // Auto-scroll cuando cambian los mensajes
  useEffect(() => {
    // Detectar si el último o penúltimo mensaje es diagnosis_ready
    const lastMessage = messages[messages.length - 1];
    const secondToLastMessage = messages[messages.length - 2];

    // Si acabamos de agregar diagnosis_ready + closing_cta, scrollear al inicio del diagnóstico
    const justAddedDiagnosis =
      lastMessage?.type === 'closing_cta' &&
      secondToLastMessage?.type === 'diagnosis_ready';

    if (justAddedDiagnosis && diagnosisMessageRef.current) {
      // Scroll al inicio del mensaje de diagnóstico
      requestAnimationFrame(() => {
        diagnosisMessageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    } else {
      // Comportamiento normal: scroll al final
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  // Auto-scroll cuando el typewriter termina (para que los QuickReplies sean visibles)
  useEffect(() => {
    if (isTypewriterComplete) {
      // Pequeño delay para que los QuickReplyChips se rendericen
      const timer = setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isTypewriterComplete, scrollToBottom]);

  // Auto-scroll cuando cambia isProcessing (cuando se envía/recibe mensaje)
  useEffect(() => {
    if (isProcessing) {
      // Scroll inmediato cuando empieza a procesar (mensaje enviado)
      scrollToBottom('smooth');
    }
  }, [isProcessing, scrollToBottom]);

  // Sincronizar idioma de i18next con sessionStore
  useEffect(() => {
    const detectedLang = i18n.language.split('-')[0] as 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';
    const supportedLangs = ['es', 'en', 'fr', 'de', 'it', 'pt'];
    const finalLang = supportedLangs.includes(detectedLang) ? detectedLang : 'es';

    if (language !== finalLang) {
      useSessionStore.getState().setLanguage(finalLang as any);
    }
  }, [i18n.language, language]);

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // Permitir enviar si hay texto O imagen
    if ((!inputMessage.trim() && !selectedImage) || isProcessing) return;

    const messageToSend = inputMessage.trim() || 'Imagen adjunta';
    const hasImage = !!selectedImage;
    const imageToSend = selectedImage; // Guardar referencia para el mensaje
    setInputMessage('');

    let imageFile: File | undefined;

    // If there's a selected image, convert it to File
    if (selectedImage) {
      try {
        setIsUploadingImage(true);
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      } catch (error) {
        console.error('Error preparing image:', error);
        setIsUploadingImage(false);
        return; // Don't send message if image preparation failed
      }
    }

    // Send the message with optional image (pass imageUrl for display in chat)
    await processMessage(messageToSend, imageFile, imageToSend || undefined);

    // Si se envió una imagen, incrementar contador y limpiar
    if (hasImage && imageFile) {
      incrementImagesUploaded();
      setSelectedImage(null);
      setIsUploadingImage(false);
    }
  }; const handleDownloadPDF = async () => {
    if (!state.diagnosisContent) return;

    // Si ya tiene email guardado en la sesión, descargar directamente
    if (session?.userEmail) {
      await generatePDFDirectly();
    } else {
      // Si no tiene email, mostrar modal para capturarlo
      setIsEmailModalOpen(true);
    }
  };

  const handleEmailSubmit = async (email: string) => {
    try {
      // Actualizar la sesión con el email
      if (session?.id) {
        await apiClient.updateSession(session.id, { userEmail: email });

        // Actualizar el store local
        setSession({
          ...session,
          userEmail: email,
        });
      }

      // Cerrar modal
      setIsEmailModalOpen(false);

      // Generar PDF
      await generatePDFDirectly();
    } catch (error) {
      console.error('Error al guardar email:', error);
      throw error; // Re-throw para que el modal muestre el error
    }
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!session?.id) return;

    try {
      await apiClient.submitRating({
        sessionId: session.id,
        rating,
        comment,
        flowType: 'free'
      });

      localStorage.setItem(`rated_${session.id}`, 'true');
      setHasRated(true);
      setShowRatingModal(false);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handleRatingClose = () => {
    if (session?.id) {
      // Marcar como "rated" incluso si cierra sin valorar
      // para que no vuelva a aparecer el modal
      localStorage.setItem(`rated_${session.id}`, 'true');
      setHasRated(true);
    }
    setShowRatingModal(false);
  };

  // Handler para continuar con sesión previa
  const handleContinuePreviousSession = () => {
    setShowRestoreModal(false);
    setShouldInitialize(true);
  };

  // Handler para empezar de nuevo (clear completo)
  const handleRestartDiagnostic = () => {
    // Limpiar TODA la persistencia
    localStorage.clear();

    // Limpiar stores
    const { clearSession } = useSessionStore.getState();
    const { clearFreeChatState } = useChatStore.getState();

    clearSession();
    clearFreeChatState();

    // Cerrar modal y forzar reinicio completo
    setShowRestoreModal(false);

    // Recargar la página para empezar completamente limpio
    window.location.reload();
  };

  const generatePDFDirectly = async () => {
    if (!state.diagnosisContent) return;

    setIsGeneratingPDF(true);
    try {
      const success = await generatePDF({
        userName: state.userName || 'Usuario',
        diagnosisContent: state.diagnosisContent,
        language: state.language,
      });

      if (success) {
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const toggleDarkMode = () => {
    const root = document.documentElement;
    // Enable temporary smooth theme transitions
    root.classList.add('theme-switching');
    setIsDarkMode(!isDarkMode);
    root.classList.toggle('dark');
    // Remove the helper class after the transition finishes
    window.setTimeout(() => {
      root.classList.remove('theme-switching');
    }, 250);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCameraCapture = async (imageDataUrl: string, captureMessage?: string) => {
    // Verificar límite de imágenes
    if (imagesUploaded >= 1) {
      setShowImageLimitMessage(true);
      setTimeout(() => setShowImageLimitMessage(false), 5000);
      return;
    }

    // Si viene con mensaje, enviar directamente
    if (captureMessage !== undefined) {
      // Enviar imagen + mensaje directamente
      try {
        setIsUploadingImage(true);
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });

        const messageToSend = captureMessage.trim() || 'Imagen adjunta';
        await processMessage(messageToSend, imageFile, imageDataUrl);

        incrementImagesUploaded();
        setIsUploadingImage(false);
      } catch (error) {
        console.error('Error sending camera image:', error);
        setIsUploadingImage(false);
      }
    } else {
      // Sin mensaje, solo seleccionar la imagen
      setSelectedImage(imageDataUrl);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Verificar límite de imágenes
    if (imagesUploaded >= 1) {
      setShowImageLimitMessage(true);
      setTimeout(() => setShowImageLimitMessage(false), 5000);
      e.target.value = ''; // Reset input
      return;
    }

    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setSelectedImage(imageDataUrl);
        // Image will be uploaded when user sends a message
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
  };

  const handleImageClick = (imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  return (
    <>
      {/* Wrapper con dark mode */}
      <div className={`${isDarkMode ? 'dark' : ''}`}>
        {/* Header flotante transparente */}
        <ChatHeader
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          progressInfo={showProgressBar && currentBlock && currentQuestionInfo ? {
            currentBlock,
            currentQuestionIndex: currentQuestionInfo.questionIndex,
            totalQuestionsInBlock: currentBlock.questions.length,
          } : null}
        />

        {/* Main content - Chat Messages */}
        <div
          ref={chatContainerRef}
          className="mobile-chat-container bg-brand-cream-100 dark:bg-neutral-900 bg-chat-lighting transition-colors duration-200"
        >
          {/* Messages Area */}
          <main
            ref={messagesContainerRef}
            className="mobile-chat-main smooth-scroll scroll-pt-4 pt-20 pb-32"
          >
            <div className="container-narrow pt-4 pb-4">
                {/* Empty State - Loading state while initializing */}
                {messages.length === 0 && !isProcessing && (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="mb-6"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl">
                        <img
                          src="/assets/images/favicon.webp"
                          alt="OVP"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Preparando tu diagnóstico
                    </h2>
                    <p className="text-secondary max-w-md">
                      Un momento por favor
                    </p>
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => {

                      // Detectar si este mensaje inicia un nuevo bloque (para mostrar InfoWedge)
                      let showInfoWedgeBefore = false;
                      let wedgeBlock: FlowBlock | null = null;

                      if (message.role === 'assistant' && index > 0) {
                        const currentMsgQuestion = detectCurrentQuestion(message.content);

                        // Detectar si es mensaje de diagnóstico (generando o listo)
                        const isDiagnosisMessage = message.type === 'diagnosis_ready' ||
                          message.type === 'comment' ||
                          /diagnóstico personalizado|toda la información que necesito/i.test(message.content);

                        // Buscar la pregunta del mensaje de asistente anterior
                        let prevAssistantIndex = index - 1;
                        while (prevAssistantIndex >= 0 && messages[prevAssistantIndex]?.role !== 'assistant') {
                          prevAssistantIndex--;
                        }

                        if (prevAssistantIndex >= 0 && messages[prevAssistantIndex]) {
                          const prevMsgQuestion = detectCurrentQuestion(messages[prevAssistantIndex]!.content);

                          // Si cambiamos de bloque, mostrar el InfoWedge del bloque anterior
                          if (currentMsgQuestion && prevMsgQuestion &&
                            currentMsgQuestion.blockIndex !== prevMsgQuestion.blockIndex) {
                            showInfoWedgeBefore = true;
                            wedgeBlock = prevMsgQuestion.block;
                          }

                          // Si el mensaje anterior era la última pregunta del bloque emocional (pregunta 21)
                          // y el actual es el diagnóstico, mostrar el InfoWedge del bloque emocional
                          if (prevMsgQuestion &&
                            prevMsgQuestion.blockIndex === 3 &&
                            prevMsgQuestion.questionIndex === 5 &&
                            isDiagnosisMessage) {
                            showInfoWedgeBefore = true;
                            wedgeBlock = prevMsgQuestion.block;
                          }
                        }
                      }

                      return (
                        <div key={index}>
                          {/* InfoWedge antes del mensaje si cambiamos de bloque */}
                          {showInfoWedgeBefore && wedgeBlock && (
                            <div className="mb-4">
                              <InfoWedge
                                content={wedgeBlock.infoWedge}
                                blockColor={wedgeBlock.color}
                                blockColorLight={wedgeBlock.colorLight}
                                blockEmoji={wedgeBlock.emoji}
                              />
                            </div>
                          )}

                          <ChatMessage
                            ref={message.type === 'diagnosis_ready' ? diagnosisMessageRef : undefined}
                            message={{
                              ...message,
                              // Remove metadata from display to avoid breaking quick replies
                              content: message.content
                                .replace(/\[PREGUNTA_ACTUAL:\s*\w+\]/g, '')
                                .replace(/PREGUNTA \d+ \(\w+\):/g, '')
                                .trim()
                            }}
                            state={state}
                            isLatest={index === messages.length - 1}
                            onDownloadPDF={handleDownloadPDF}
                            isGeneratingPDF={isGeneratingPDF}
                            onTypewriterComplete={index === messages.length - 1 ? handleTypewriterComplete : undefined}
                          />
                        </div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Quick Reply Chips - mostrar después de que el typewriter termine */}
                  {!isProcessing &&
                    isTypewriterComplete &&
                    currentQuestion?.type === 'multiple_choice' &&
                    currentQuestion?.options &&
                    currentBlock &&
                    state.step !== 'diagnosis_ready' && (
                      <QuickReplyChips
                        options={currentQuestion.options}
                        onSelect={handleChipSelect}
                        disabled={isProcessing}
                        blockColor={currentBlock.color}
                      />
                    )}

                  {/* Info Wedge REMOVIDO - Clara ya incluye la cuña informativa en su mensaje */}

                  {/* Diagnosis Generating Indicator - Special state */}
                  {/* Solo mostrar después de que el typewriter termine para mantener jerarquía visual */}
                  {state.step === 'generating_diagnosis' && !isProcessing && isTypewriterComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <DiagnosisGeneratingIndicator />
                    </motion.div>
                  )}

                  {/* Typing Indicator - Normal processing */}
                  {isProcessing && state.step !== 'generating_diagnosis' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </main>
        </div>

        {/* Footer flotante transparente */}
        <ChatFooter
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isProcessing={isProcessing}
          onSendMessage={handleSendMessage}
          onKeyDown={handleKeyDown}
          isListening={isListening}
          onVoiceInput={handleVoiceInput}
          isSpeechSupported={isSpeechSupported}
          isPlusMenuOpen={isPlusMenuOpen}
          setIsPlusMenuOpen={setIsPlusMenuOpen}
          onCameraClick={() => setIsCameraOpen(true)}
          onFileSelect={handleFileSelect}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          isUploadingImage={isUploadingImage}
          onImageClick={handleImageClick}
          showImageLimitMessage={showImageLimitMessage}
          isKeyboardOpen={isKeyboardOpen}
          onInputFocus={scrollToBottom}
        />
      </div>

      {/* Modals */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <ImageViewerModal
        isOpen={!!imageViewerUrl}
        imageUrl={imageViewerUrl}
        onClose={() => setImageViewerUrl('')}
      />

      <EmailCaptureModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSubmit={handleEmailSubmit}
        userName={state.userName}
      />

      <RatingModal
        isOpen={showRatingModal}
        onClose={handleRatingClose}
        onSubmit={handleRatingSubmit}
      />

      <RestoreDiagnosticModal
        isOpen={showRestoreModal}
        onContinue={handleContinuePreviousSession}
        onRestart={handleRestartDiagnostic}
      />

    </>
  );
};
