import { useState, useEffect, useRef } from 'react';
// Single-flow mode: no navigation needed here
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { Moon, Sun, Mic, Plus, ArrowUp, Camera, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { EmailCaptureModal } from '../modals/EmailCaptureModal';
import { ChatMessage } from './ChatMessage';
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
      className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 px-4 py-3"
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
  const { session, imagesUploaded, incrementImagesUploaded } = useSessionStore();
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
  } = useDiagnosticFlow(); const { generatePDF } = usePDFGenerator();
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll when keyboard opens (detect input focus)
  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === textareaRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };

    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside as EventListener);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isPlusMenuOpen]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  // No-op: back button removed in single-flow UX

  return (
    <>
      <div className={`mobile-chat-container ${isDarkMode ? 'dark' : ''} bg-neutral-50 dark:bg-neutral-900 bg-chat-lighting transition-colors duration-200`}>
        {/* Floating Header Bubbles - ChatGPT Style */}
        <header className="mobile-chat-header pb-2">
          <div className="container-narrow py-3 flex items-center justify-between pointer-events-auto">
            {/* Left: ChatOVP + "En Línea" Bubble */}
            <div className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full px-4 py-2 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  ChatOVP
                </span>
                <span className="text-[10px] font-medium text-brand-green-500 flex items-center gap-1.5 online-pulse">
                  <span className="w-2 h-2 bg-brand-green-500 rounded-full online-pulse"></span>
                  En Línea
                </span>
              </div>
            </div>

            {/* Right: Theme Toggle Bubble */}
            <button
              onClick={toggleDarkMode}
              className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full p-2.5 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
              ) : (
                <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
              )}
            </button>
          </div>
        </header>

        {/* Progress Indicator */}
        {state.step === 'asking_questions' && (
          <ProgressIndicator turnCount={state.currentQuestionIndex} hasRealProblem={true} />
        )}

        {/* Messages Area */}
        <main className="mobile-chat-main smooth-scroll scroll-pt-4">
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

        {/* Floating Input Area - ChatGPT Style */}
        <footer className="mobile-chat-footer pb-safe pt-4">
          <div className="max-w-3xl mx-auto px-4 py-4 pb-6 pointer-events-auto">
            {/* Mensaje de límite de imágenes alcanzado */}
            <AnimatePresence>
              {showImageLimitMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🔒</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">
                        Límite de imágenes alcanzado
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                        Ya has subido 1 imagen en esta sesión gratuita.
                      </p>
                      <a
                        href="https://objetivovientreplano.com/suscripcion/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                      >
                        <span>✨ Desbloquea imágenes ilimitadas</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Image Preview */}
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-3 flex items-center gap-3 p-3 bg-gradient-to-r from-brand-green-50 to-green-100 dark:from-brand-green-900/20 dark:to-green-800/20 rounded-xl border-2 border-brand-green-300 dark:border-brand-green-700 shadow-md"
              >
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => handleImageClick(selectedImage)}
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="animate-spin text-white text-xl">⏳</div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-green-900 dark:text-brand-green-200">
                    {isUploadingImage ? 'Enviando imagen...' : '📷 Imagen lista para enviar'}
                  </p>
                  <p className="text-xs text-brand-green-700 dark:text-brand-green-300">
                    {isUploadingImage ? 'Clara la está analizando...' : 'Escribe un mensaje y presiona enviar'}
                  </p>
                </div>
                {!isUploadingImage && (
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 rounded-lg hover:bg-brand-green-200 dark:hover:bg-brand-green-800 transition-colors text-brand-green-700 dark:text-brand-green-300"
                  >
                    ✕
                  </button>
                )}
              </motion.div>
            )}

            {/* File input (hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Container para botón + y input */}
            <div className="flex items-center gap-2">
              {/* Plus Button - Separado e independiente, misma altura que input */}
              <div ref={plusMenuRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen((v) => !v)}
                  className="h-[44px] w-[44px] flex items-center justify-center text-neutral-700 dark:text-neutral-300 rounded-full bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all shadow-md"
                  title="Más opciones"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {isPlusMenuOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20">
                    <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-xl p-1">
                      <button
                        type="button"
                        className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                        title="Subir imagen"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setIsPlusMenuOpen(false);
                        }}
                      >
                        <Image className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      </button>
                      <button
                        type="button"
                        className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                        title="Tomar foto"
                        onClick={() => {
                          setIsCameraOpen(true);
                          setIsPlusMenuOpen(false);
                        }}
                      >
                        <Camera className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Container - Separado del botón + */}
              <form onSubmit={handleSendMessage} className="flex-1 relative rounded-[26px] shadow-md px-4 py-2 transition-all focus-within:shadow-lg bg-gradient-to-b from-white to-white/95 dark:from-neutral-800 dark:to-neutral-800/90 dark:border dark:border-neutral-700 min-h-[44px]">
                <div className="flex items-center gap-2">
                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu mensaje..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-neutral-900 dark:text-white border-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none text-[16px] max-h-[120px] py-1"
                    style={{ minHeight: '24px' }}
                  />

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Voice Button */}
                    {isSpeechSupported && (
                      <button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`p-2 rounded-full transition-colors ${isListening
                          ? 'text-brand-green-600 bg-brand-green-50 dark:bg-brand-green-500/10'
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                        title={isListening ? 'Detener grabación' : 'Escribir por voz'}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}

                    {/* Send Button - Green Circle like ChatGPT */}
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isProcessing}
                      className={`p-2 rounded-full transition-all ${inputMessage.trim() && !isProcessing
                        ? 'text-white bg-neutral-900 dark:bg-white dark:text-black hover:bg-neutral-700 dark:hover:bg-neutral-200'
                        : 'text-neutral-400 bg-transparent cursor-not-allowed'
                        }`}
                      title="Enviar mensaje"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </footer >
      </div >

      {/* Modals */}
      < CameraModal
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
