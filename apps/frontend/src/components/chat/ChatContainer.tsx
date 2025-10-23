import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { Moon, Sun, Send, Mic, Camera, Paperclip, Download, ArrowLeft } from 'lucide-react';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { ShareModal } from '../modals/ShareModal';
import { MessageActions } from './MessageActions';
import { WelcomeAnimation } from '../animations/WelcomeAnimation';

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
    showWelcome,
    etymology,
    initialize,
    processMessage,
    handleWelcomeComplete,
  } = useDiagnosticFlow();
  const { generatePDF } = usePDFGenerator();
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize diagnostic flow
  useEffect(() => {
    if (messages.length === 0) {
      initialize();
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl);
    // You can send the image to the backend here
    // For now, we'll just store it
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
    // Limpiar toda la información de la sesión
    sessionStorage.removeItem('userData');
    clearSession();
    // Navegar al inicio
    navigate('/', { replace: true });
    // Recargar la página para resetear el estado completo
    window.location.href = '/';
  };

  return (
    <>
      {/* Welcome Animation Overlay */}
      {showWelcome && state.userName && (
        <WelcomeAnimation
          userName={state.userName}
          etymology={etymology}
          onComplete={handleWelcomeComplete}
          language={state.language}
        />
      )}

      <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''}`}>
        {/* Header */}
        <header
        className="px-5 py-2.5 border-b transition-colors duration-300"
        style={{
          backgroundColor: 'var(--color-header-bg)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToStart}
              className="p-2 rounded-full transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10"
              title="Volver al inicio"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
            </button>

            <a
              href="https://www.objetivovientreplano.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform duration-200 hover:scale-105"
            >
              <div className="h-10 flex items-center">
                <span className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Objetivo Vientre Plano
                </span>
              </div>
            </a>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10"
            title="Cambiar tema"
          >
            {isDarkMode ? (
              <Moon className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
            ) : (
              <Sun className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
            )}
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main
        className="flex-1 px-md-fluid py-md-fluid overflow-y-auto smooth-scroll"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-md-fluid">
          {messages.length === 0 && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] message-bubble-ai">
                <p className="m-0">
                  ¡Hola! 👋 Soy tu asistente para el diagnóstico de vientre plano. ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              <div className={`max-w-[80%] flex flex-col`}>
                <div
                  className={`${message.role === 'user'
                    ? 'message-bubble-user'
                    : 'message-bubble-ai'
                    }`}
                >
                  <p className="m-0 whitespace-pre-wrap">{message.content}</p>

                  {/* Show question details if available */}
                  {message.question?.questionDetails && (
                    <p className="m-0 mt-2 text-sm opacity-80 whitespace-pre-wrap">
                      {message.question.questionDetails}
                    </p>
                  )}

                  {/* Show PDF download button after diagnosis */}
                  {message.type === 'diagnosis' && state.diagnosisContent && (
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isGeneratingPDF}
                      className="mt-4 py-2 px-4 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Generando PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Descargar Diagnóstico PDF
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Message Actions */}
                <MessageActions
                  messageText={message.content}
                  onShare={() => handleShareMessage(message.content)}
                  isUserMessage={message.role === 'user'}
                />
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] message-bubble-ai">
                <div className="flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>•</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer
        className="px-md-fluid py-sm-fluid border-t transition-colors duration-300"
        style={{
          backgroundColor: 'var(--color-input-bg)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {/* Attachment Buttons */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                title="Adjuntar imagen"
              >
                <Paperclip className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="p-2 rounded-full transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                title="Tomar foto"
              >
                <Camera className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className="flex-1 px-4 py-3 border rounded-3xl resize-none overflow-y-auto transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-green text-base-fluid"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-input-border)',
                maxHeight: 'clamp(100px, 30vh, 200px)',
                fontSize: '16px' // Evita zoom en iOS
              }}
            />

            {/* Voice Button */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-full transition-all duration-200 ${isListening
                    ? 'bg-brand-green text-black animate-pulse'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                title={isListening ? 'Detener grabación' : 'Escribir por voz'}
              >
                <Mic className="w-5 h-5" style={{ color: isListening ? '#000' : 'var(--color-text)' }} />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isProcessing}
              className="p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: inputMessage.trim() ? '#95C11F' : '#e0e0e0',
                color: inputMessage.trim() ? '#000' : '#999'
              }}
              title="Enviar mensaje"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="mt-3 flex items-center gap-2">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleImageClick(selectedImage)}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </footer>

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
      </div>
    </>
  );
};
