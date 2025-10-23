import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { Moon, Sun, Mic, Download, ArrowLeft, MoreVertical, Plus, ArrowUp, Camera, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { MessageActions } from './MessageActions';

export const ChatContainer = () => {
  const navigate = useNavigate();
  const { clearSession } = useSessionStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const {
    messages,
    state,
    isProcessing,
    initialize,
    processMessage,
  } = useDiagnosticFlow();  const { generatePDF } = usePDFGenerator();
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    if (messages.length === 0) {
      initialize();
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const messageToSend = inputMessage;
    setInputMessage('');

    // If we have a selected image and we're on question 17, send it with the message
    if (selectedImage && state.currentQuestionIndex === 16) {
      const base64Data = selectedImage.split(',')[1];
      if (base64Data) {
        const imageData = {
          base64: base64Data,
          mimeType: 'image/jpeg',
        };
        await processMessage(messageToSend, imageData);
        setSelectedImage(null);
      } else {
        await processMessage(messageToSend);
      }
    } else {
      await processMessage(messageToSend);
    }
  };

  const handleDownloadPDF = () => {
    if (!state.diagnosisContent) return;

    setIsGeneratingPDF(true);
    try {
      const success = generatePDF({
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
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
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

  const handleCameraCapture = (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setSelectedImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  };

  const handleRegenerateResponse = async () => {
    // TODO: Implementar lógica de regeneración
    console.log('Regenerando respuesta...');
  };

  const handleBackToStart = () => {
    sessionStorage.removeItem('userData');
    clearSession();
    navigate('/', { replace: true });
    window.location.href = '/';
  };

  return (
    <>
      <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''} bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200`}>
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800">
          <div className="container-narrow py-3 flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={handleBackToStart}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
              title="Volver al inicio"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>

            {/* Center: Title */}
            <div className="flex items-center gap-3">

              <span className="text-sm font-medium text-foreground">
                Diagnóstico {
                  <span className="text-sm font-medium text-brand-green-500 animated-pulse-strong">
                    En Línea
                  </span>
                }
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )}
              </button>
              <button className="p-2 rounded-lg hover:bg-surface transition-colors">
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto smooth-scroll">
          <div className="container-narrow py-8">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 mb-6"
                >
                  <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-contain drop-shadow-lg" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Comencemos tu diagnóstico
                </h2>
                <p className="text-secondary max-w-md">
                  Estoy aquí para ayudarte a entender mejor tu salud digestiva
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {/* Avatar for assistant */}
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-sm ring-2 ring-brand-green-500/20 dark:ring-brand-green-400/30">
                        <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Message Content Wrapper */}
                    <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
                      {/* Message Bubble */}
                      <div
                        className={`${message.role === 'user'
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                          : 'bg-transparent text-foreground'
                          } rounded-2xl px-5 py-3`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>

                        {/* Show download button for diagnosis */}
                        {message.type === 'diagnosis' && state.diagnosisContent && (
                          <button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingPDF ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Generando PDF...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Descargar diagnóstico
                              </>
                            )}
                          </button>
                        )}


                        {/* Show question details if available */}
                        {message.question?.questionDetails && (
                          <p className="mt-2 text-sm opacity-80 whitespace-pre-wrap">
                            {message.question.questionDetails}
                          </p>
                        )}
                      </div>

                      {/* Message Actions */}
                      <MessageActions
                        messageText={message.content}
                        {...(message.role === 'assistant' && { onRegenerate: handleRegenerateResponse })}
                        isUserMessage={message.role === 'user'}
                      />
                    </div>

                    {/* Avatar for user */}
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                        {state.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-brand-green-500/20 dark:ring-brand-green-400/30">
                    <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-transparent rounded-2xl px-5 py-4">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse-soft" />
                      <span className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse-soft [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse-soft [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Input Area - ChatGPT Style */}
        <footer className="sticky bottom-0 bg-neutral-50 dark:bg-neutral-900 pb-safe">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Selected Image Preview */}
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-md"
              >
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => handleImageClick(selectedImage)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Imagen seleccionada</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Se enviará con tu próximo mensaje</p>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* Input Container */}
            <form onSubmit={handleSendMessage} className="relative bg-white dark:bg-neutral-800 rounded-[26px] border border-neutral-300 dark:border-neutral-700 shadow-md p-2 transition-all focus-within:border-neutral-400 dark:focus-within:border-neutral-600 focus-within:shadow-lg">
              {/* File input (hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex items-end gap-2">
                {/* Plus Button with React Dropdown Menu */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPlusMenuOpen((v) => !v)}
                    className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    title="Más opciones"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {isPlusMenuOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/3 mb-3 z-20">
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

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-2 pb-[6px] text-neutral-900 dark:text-white border-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none text-[15px] max-h-[200px]"
                  style={{ minHeight: '24px' }}
                />

                {/* Right Side Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">

                  {/* Voice Button */}
                  {isSpeechSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-lg transition-colors ${isListening
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

            {/* Footer Note */}
            <p className="text-center text-[10px] text-tertiary mt-3">
              ChatOVP puede cometer errores. Comprueba la información importante.
            </p>
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
    </>
  );
};
