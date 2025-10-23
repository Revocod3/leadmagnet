import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { Send, Moon, Sun, Mic, Camera, Paperclip, Download, ArrowLeft, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { ShareModal } from '../modals/ShareModal';
import { MessageActions } from './MessageActions';

export const ChatContainer = () => {
  const navigate = useNavigate();
  const { clearSession } = useSessionStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState('');
  const [shareModalText, setShareModalText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const handleShareMessage = (text: string) => {
    setShareModalText(text);
  };

  const handleBackToStart = () => {
    sessionStorage.removeItem('userData');
    clearSession();
    navigate('/', { replace: true });
    window.location.href = '/';
  };

  return (
    <>
      <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''} bg-background transition-colors duration-200`}>
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border">
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
              <div className="w-2 h-2 rounded-full bg-brand-green-500 animate-pulse-soft" />
              <span className="text-sm font-medium text-foreground">
                Asistente de Diagnóstico
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
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green-400 to-brand-green-600 flex items-center justify-center mb-6"
                >
                  <span className="text-3xl">✨</span>
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-green-500 flex items-center justify-center text-white text-sm font-semibold">
                        AI
                      </div>
                    )}

                    {/* Message Content Wrapper */}
                    <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
                      {/* Message Bubble */}
                      <div
                        className={`${message.role === 'user'
                          ? 'bg-brand-green-500 text-white'
                          : 'bg-surface border border-border'
                          } rounded-2xl px-5 py-3 shadow-sm`}
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
                        onShare={() => handleShareMessage(message.content)}
                        isUserMessage={message.role === 'user'}
                      />
                    </div>

                    {/* Avatar for user */}
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700 dark:bg-neutral-300 flex items-center justify-center text-white dark:text-neutral-900 text-sm font-semibold">
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
                  <div className="w-8 h-8 rounded-full bg-brand-green-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-surface border border-border rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-soft" />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-soft [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-soft [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Input Area */}
        <footer className="sticky bottom-0 backdrop-blur-xl bg-background/80 border-t border-border pb-safe">
          <div className="container-narrow py-4">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              {/* File input (hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Attachment Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-surface transition-colors"
                  title="Adjuntar imagen"
                >
                  <Paperclip className="w-5 h-5 text-foreground" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="p-2 rounded-lg hover:bg-surface transition-colors"
                  title="Tomar foto"
                >
                  <Camera className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Textarea Container */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                  className="w-full resize-none rounded-2xl bg-surface border-2 border-border px-4 py-3 pr-24 text-foreground placeholder:text-tertiary focus:outline-none focus:border-brand-green-500 focus:ring-4 focus:ring-brand-green-500/10 transition-all duration-200 text-[15px]"
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                />

                {/* Voice and Send buttons inside textarea */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {/* Voice Button */}
                  {isSpeechSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-lg transition-all duration-200 ${isListening
                        ? 'bg-brand-green-500 text-white animate-pulse-soft'
                        : 'hover:bg-surface-hover'
                        }`}
                      title={isListening ? 'Detener grabación' : 'Escribir por voz'}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isProcessing}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${inputMessage.trim() && !isProcessing
                      ? 'bg-brand-green-500 hover:bg-brand-green-600 text-white shadow-sm hover:shadow-md'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                      }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Selected Image Preview */}
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2"
              >
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-border"
                  onClick={() => handleImageClick(selectedImage)}
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-error hover:text-error-dark text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-error/10 transition-colors"
                >
                  Eliminar
                </button>
              </motion.div>
            )}

            {/* Bottom Text */}
            <p className="text-center text-xs text-tertiary mt-3">
              El asistente puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </footer>
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

      <ShareModal
        isOpen={!!shareModalText}
        text={shareModalText}
        onClose={() => setShareModalText('')}
      />
    </>
  );
};
