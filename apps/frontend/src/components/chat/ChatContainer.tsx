import { useState, useEffect, useRef } from 'react';
// Single-flow mode: no navigation needed here
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { EmailCaptureModal } from '../modals/EmailCaptureModal';
import { ChatMessage } from './ChatMessage';
import { ChatHeader } from './ChatHeader';
import { ChatFooter } from './ChatFooter';
import { TypingIndicator } from '../animations/TypingIndicator';
import { DiagnosisGeneratingIndicator } from '../animations/DiagnosisGeneratingIndicator';
import { apiClient } from '../../services/api';

// Progress Indicator Component
const ProgressIndicator = ({ turnCount, hasRealProblem }: { turnCount: number; hasRealProblem: boolean }) => {
  if (!hasRealProblem || turnCount < 2) return null;

  const maxTurns = 16;
  const progress = Math.min((turnCount / maxTurns) * 100, 90);

  const milestones = {
    25: { message: "🎯 Identificando tu problema...", reward: "" },
    50: { message: "💡 Analizando patrones...", reward: "15% descuento desbloqueado" },
    75: { message: "✨ Preparando diagnóstico...", reward: "30% descuento garantizado" },
    90: { message: "🎁 ¡Casi listo!", reward: "Diagnóstico valorado en 30€" }
  };

  const currentMilestone = Object.entries(milestones)
    .filter(([threshold]) => progress >= Number(threshold))
    .pop();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 px-4 py-3"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Tu diagnóstico
          </span>
          <span className="text-xs font-bold text-brand-green-600 dark:text-brand-green-400">
            {Math.round(progress)}% completado
          </span>
        </div>

        <div className="relative">
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-green-500 to-brand-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Milestone dots */}
          {[25, 50, 75].map((threshold) => (
            <div
              key={threshold}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 
                ${progress >= threshold
                  ? 'bg-brand-green-500 border-brand-green-500'
                  : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'}`}
              style={{ left: `${threshold}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}
        </div>

        {currentMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center justify-between"
          >
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {currentMilestone[1].message}
            </span>
            {currentMilestone[1].reward && (
              <span className="text-xs font-semibold text-brand-green-600 dark:text-brand-green-400 animate-pulse">
                {currentMilestone[1].reward}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export const ChatContainer = () => {
  const { session, language, setSession, imagesUploaded, incrementImagesUploaded } = useSessionStore();
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

  // Create session if it doesn't exist
  useEffect(() => {
    const createSessionIfNeeded = async () => {
      if (!session?.id) {
        try {
          console.log('📝 Creando nueva sesión...');
          const newSession = await apiClient.createSession({
            userName: '', // Empty for now, will be filled during chat
            language: language as 'es' | 'en',
          });
          setSession(newSession);
          console.log('✅ Sesión creada:', newSession.id);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    };

    createSessionIfNeeded();
  }, [session?.id, language, setSession]);

  // Initialize only once when session is available
  useEffect(() => {
    // Solo inicializar si:
    // 1. No hay mensajes
    // 2. Hay una sesión activa
    // 3. No estamos procesando
    if (messages.length === 0 && session?.id && !isProcessing) {
      console.log('🎬 Inicializando chat...');
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const messageToSend = inputMessage;
    const hasImage = !!selectedImage;
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

    // Send the message with optional image
    await processMessage(messageToSend, imageFile);

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
        useSessionStore.getState().setSession({
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

  const handleCameraCapture = async (imageDataUrl: string) => {
    // Verificar límite de imágenes
    if (imagesUploaded >= 1) {
      setShowImageLimitMessage(true);
      setTimeout(() => setShowImageLimitMessage(false), 5000);
      return;
    }
    setSelectedImage(imageDataUrl);
    // Image will be uploaded when user sends a message
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
        <ChatHeader isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

        {/* Progress Indicator - Fixed debajo del header */}
        {state.step === 'asking_questions' && (
          <div className="fixed top-16 left-0 right-0 z-20">
            <ProgressIndicator turnCount={state.currentQuestionIndex} hasRealProblem={true} />
          </div>
        )}

        {/* Main content - Chat Messages */}
        <div className="mobile-chat-container bg-neutral-50 dark:bg-neutral-900 bg-chat-lighting transition-colors duration-200">
          {/* Messages Area */}
          <main className={`mobile-chat-main smooth-scroll scroll-pt-4 pt-20 pb-32 ${state.step === 'asking_questions' ? 'pt-32' : 'pt-20'}`}>
            <div className="container-narrow pt-4 pb-4">
              {/* Empty State - Solo mostrar cuando realmente no hay mensajes Y no estamos cargando */}
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
                    Un momento por favor...
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      message={message}
                      state={state}
                      isLatest={index === messages.length - 1}
                      onDownloadPDF={handleDownloadPDF}
                      isGeneratingPDF={isGeneratingPDF}
                    />
                  ))}
                </AnimatePresence>

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
    </>
  );
};
