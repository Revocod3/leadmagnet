import { useState, useEffect, useRef, useMemo } from 'react';
// Single-flow mode: no navigation needed here
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { useAuthStore } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { EmailCaptureModal } from '../modals/EmailCaptureModal';
import { RatingModal } from '../modals/RatingModal';
import { ChatMessage } from './ChatMessage';
import { ChatHeader } from './ChatHeader';
import { ChatFooter } from './ChatFooter';
import { TypingIndicator } from '../animations/TypingIndicator';
import { DiagnosisGeneratingIndicator } from '../animations/DiagnosisGeneratingIndicator';
import { BlockProgressBar } from './BlockProgressBar';
import { QuickReplyChips } from './QuickReplyChips';
import { InfoWedge } from './InfoWedge';
import { getBlock, getQuestion } from '../../config/diagnostic-flow-config';
import { apiClient } from '../../services/api';

/**
 * Calcula el bloque y pregunta actuales basándose en el turno
 * Turno 1: Bienvenida
 * Turno 2: Usuario confirma -> Pregunta 1
 * Turnos 3-5: Preguntas 2-4 (Digestivo)
 * Turno 6: Cuña + Pregunta 5 (Energía)
 * Turnos 7-9: Preguntas 6-8
 * Turno 10: Cuña + Pregunta 9 (Emocional)
 * Turnos 11-13: Preguntas 10-12
 * Turno 14: Cuña final + Diagnóstico
 */
const getFlowPosition = (turnCount: number): {
  blockIndex: number;
  questionIndex: number;
  showWedge: boolean;
  isComplete: boolean;
} => {
  // Antes de empezar preguntas
  if (turnCount < 2) {
    return { blockIndex: 0, questionIndex: -1, showWedge: false, isComplete: false };
  }
  
  // Mapeo de turno a pregunta (turno 2 = pregunta 0, turno 3 = pregunta 1, etc.)
  const questionNumber = turnCount - 2; // 0-11 para las 12 preguntas
  
  // Bloque Digestivo: preguntas 0-3 (turnos 2-5)
  if (questionNumber < 4) {
    return { 
      blockIndex: 0, 
      questionIndex: questionNumber, 
      showWedge: questionNumber === 3, // Mostrar cuña después de pregunta 4
      isComplete: false 
    };
  }
  
  // Bloque Energía: preguntas 4-7 (turnos 6-9)
  if (questionNumber < 8) {
    return { 
      blockIndex: 1, 
      questionIndex: questionNumber - 4, 
      showWedge: questionNumber === 7, // Mostrar cuña después de pregunta 8
      isComplete: false 
    };
  }
  
  // Bloque Emocional: preguntas 8-11 (turnos 10-13)
  if (questionNumber < 12) {
    return { 
      blockIndex: 2, 
      questionIndex: questionNumber - 8, 
      showWedge: questionNumber === 11, // Mostrar cuña después de pregunta 12
      isComplete: false 
    };
  }
  
  // Flujo completado
  return { blockIndex: 2, questionIndex: 3, showWedge: false, isComplete: true };
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  // Persistir hasRated en localStorage para que no se muestre repetidamente
  const [hasRated, setHasRated] = useState(() => {
    const sessionId = session?.id;
    if (sessionId) {
      return localStorage.getItem(`rated_${sessionId}`) === 'true';
    }
    return false;
  });

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

  // Calcular posición del flujo estructurado basado en el número de mensajes del usuario
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const flowPosition = useMemo(() => getFlowPosition(userMessageCount + 1), [userMessageCount]);
  const currentBlock = useMemo(() => getBlock(flowPosition.blockIndex), [flowPosition.blockIndex]);
  const currentQuestion = useMemo(
    () => getQuestion(flowPosition.blockIndex, flowPosition.questionIndex),
    [flowPosition.blockIndex, flowPosition.questionIndex]
  );

  // Handler para selección de chip de respuesta rápida
  const handleChipSelect = (option: { value: string; label: string }) => {
    if (!isProcessing) {
      processMessage(option.label);
    }
  };

  // Actualizar hasRated cuando cambie la sesión
  useEffect(() => {
    if (session?.id) {
      const rated = localStorage.getItem(`rated_${session.id}`) === 'true';
      setHasRated(rated);
    }
  }, [session?.id]);

  // Create session if it doesn't exist OR if session doesn't belong to current user
  useEffect(() => {
    const createSessionIfNeeded = async () => {
      // VALIDACIÓN CRÍTICA: Si hay usuario PRO autenticado
      if (user) {
        // Si hay sesión PERO no pertenece a este usuario → LIMPIAR
        if (session?.id && session.userId !== user.id) {
          console.log('⚠️ Sesión existente no pertenece al usuario actual, limpiando...');
          console.log('   Session userId:', session.userId, '| Current user:', user.id);
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

          console.log('📝 Solicitando sesión para:', userName, user ? `(PRO - userId: ${user.id})` : '(Free)');

          // Para usuarios PRO, pasar userId - el backend buscará sesión existente
          const newSession = await apiClient.createSession({
            userName: userName,
            language: language as 'es' | 'en',
            ...(user && { userId: user.id }), // Solo si es usuario PRO
          });

          setSession(newSession);
          console.log('✅ Sesión obtenida/creada:', newSession.id);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    };

    createSessionIfNeeded();
  }, [session?.id, session?.userId, session?.userName, user, language, setSession]);

  // Initialize only once when session is available
  useEffect(() => {
    // Solo inicializar si:
    // 1. No hay mensajes
    // 2. Hay una sesión activa
    // 3. El sessionId NO es temporal (ya fue reemplazado por uno real del backend)
    // 4. No estamos procesando
    const isRealSession = session?.id && !session.id.startsWith('free_');

    if (messages.length === 0 && isRealSession && !isProcessing) {
      console.log('🎬 Inicializando chat con sesión:', session.id);
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Sincronizar idioma de i18next con sessionStore
  useEffect(() => {
    const detectedLang = i18n.language.split('-')[0] as 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';
    const supportedLangs = ['es', 'en', 'fr', 'de', 'it', 'pt'];
    const finalLang = supportedLangs.includes(detectedLang) ? detectedLang : 'es';

    if (language !== finalLang) {
      console.log('🌍 Idioma detectado automáticamente:', finalLang);
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
        console.log('PDF generado exitosamente');
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

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!session?.id) return;

    try {
      // Determinar el tipo de flujo: 'free' o 'paid'
      const flowType = user ? 'paid' : 'free';

      await apiClient.createRating({
        sessionId: session.id,
        rating,
        comment,
        flowType,
      });

      setHasRated(true);
      // Guardar en localStorage para que persista
      if (session?.id) {
        localStorage.setItem(`rated_${session.id}`, 'true');
      }
      console.log('✅ Valoración enviada exitosamente');
    } catch (error) {
      console.error('❌ Error al enviar valoración:', error);
      throw error;
    }
  };

  // Mostrar modal de valoración cuando el diagnóstico esté listo (solo en flujo gratuito)
  useEffect(() => {
    if (state.step === 'diagnosis_ready' && !user && !hasRated && !isRatingModalOpen) {
      // Esperar 2 segundos antes de mostrar el modal
      const timer = setTimeout(() => {
        setIsRatingModalOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.step, user, hasRated, isRatingModalOpen]);

  return (
    <>
      {/* Wrapper con dark mode */}
      <div className={`${isDarkMode ? 'dark' : ''}`}>
        {/* Header flotante transparente */}
        <ChatHeader isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

        {/* Block Progress Bar - Fixed debajo del header */}
        {/* Se muestra cuando hay preguntas activas (no solo cuando state.step === 'asking_questions') */}
        {currentBlock && flowPosition.questionIndex >= 0 && !flowPosition.isComplete && messages.length > 0 && (
          <div className="fixed top-16 left-0 right-0 z-20">
            <BlockProgressBar
              currentBlock={currentBlock}
              currentQuestionIndex={flowPosition.questionIndex}
              totalQuestionsInBlock={currentBlock.questions.length}
            />
          </div>
        )}

        {/* Main content - Chat Messages */}
        <div className="mobile-chat-container bg-neutral-50 dark:bg-neutral-900 bg-chat-lighting transition-colors duration-200">
          {/* Messages Area */}
          <main className={`mobile-chat-main smooth-scroll scroll-pt-4 pt-20 pb-32 ${(currentBlock && flowPosition.questionIndex >= 0 && !flowPosition.isComplete) ? 'pt-32' : 'pt-20'}`}>
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
                    const rateHandler = user && !hasRated ? () => setIsRatingModalOpen(true) : undefined;
                    return (
                      <ChatMessage
                        key={index}
                        message={message}
                        state={state}
                        isLatest={index === messages.length - 1}
                        onDownloadPDF={handleDownloadPDF}
                        isGeneratingPDF={isGeneratingPDF}
                        {...(rateHandler && { onRateExperience: rateHandler })}
                      />
                    );
                  })}
                </AnimatePresence>

                {/* Quick Reply Chips - mostrar si la pregunta actual tiene opciones */}
                {!isProcessing && 
                 !flowPosition.isComplete &&
                 currentQuestion?.type === 'multiple_choice' && 
                 currentQuestion?.options && 
                 currentBlock && (
                  <QuickReplyChips
                    options={currentQuestion.options}
                    onSelect={handleChipSelect}
                    disabled={isProcessing}
                    blockColor={currentBlock.color}
                  />
                )}

                {/* Info Wedge - mostrar cuña informativa cuando se completa un bloque */}
                {flowPosition.showWedge && currentBlock && !isProcessing && (
                  <InfoWedge
                    content={currentBlock.infoWedge}
                    blockColor={currentBlock.color}
                    blockColorLight={currentBlock.colorLight}
                    blockEmoji={currentBlock.emoji}
                  />
                )}

                {/* Diagnosis Generating Indicator - Special state */}
                {state.step === 'generating_diagnosis' && !isProcessing && (
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
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
      />
    </>
  );
};
