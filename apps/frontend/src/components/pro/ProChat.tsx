/**
 * PRO Chat Component (Refactored)
 * 
 * Uses the same UI components as the free ChatContainer but with:
 * - Sidebar for conversation management
 * - Unlimited images
 * - PRO-specific features
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProChat } from '../../hooks/useProChat';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { ChatHeader } from '../chat/ChatHeader';
import { ChatFooter } from '../chat/ChatFooter';
import { ChatMessage } from '../chat/ChatMessage';
import { TypingIndicator } from '../animations/TypingIndicator';
import { ConversationsSidebar } from './ConversationsSidebar';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import type { Tab } from './ProPremiumContainer';

interface ProChatProps {
  onSubscriptionExpired?: () => void;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export const ProChat = ({ onSubscriptionExpired, activeTab, onTabChange }: ProChatProps) => {
  // Use the PRO chat hook
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    createNewConversation,
    messages,
    isLoading,
    isSending,
    sendMessage,
    state,
  } = useProChat(onSubscriptionExpired);

  // Local UI state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Speech to text
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  // Dark mode toggle
  const toggleDarkMode = () => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    setIsDarkMode(!isDarkMode);
    root.classList.toggle('dark');
    window.setTimeout(() => {
      root.classList.remove('theme-switching');
    }, 250);
  };

  // Handle send message
  const handleSendMessage = async (e?: React.FormEvent, overrideMessage?: string, overrideImage?: string) => {
    e?.preventDefault();

    const messageToSend = overrideMessage ?? inputMessage;
    const imageToSend = overrideImage ?? selectedImage;

    // Allow image-only or text (or both)
    if (!messageToSend.trim() && !imageToSend) return;
    if (isSending) return;

    if (!overrideMessage) setInputMessage('');

    let imageFile: File | undefined;

    // If there's an image (selected or override), convert it to File
    if (imageToSend) {
      try {
        setIsUploadingImage(true);
        const response = await fetch(imageToSend);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      } catch (error) {
        console.error('Error preparing image:', error);
        setIsUploadingImage(false);
        return;
      }
    }

    // Use messageToSend or empty string for image-only
    await sendMessage(messageToSend.trim() || '', imageFile);

    if (imageToSend) {
      if (!overrideImage) setSelectedImage(null);
      setIsUploadingImage(false);
    }
  };

  // Voice input toggle
  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Camera capture - PRO has unlimited images
  const handleCameraCapture = async (imageDataUrl: string, message?: string) => {
    setIsCameraOpen(false);
    // Send directly with optional message
    await handleSendMessage(undefined, message || '', imageDataUrl);
  };

  // File select - PRO has unlimited images
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setSelectedImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Image viewer
  const handleImageClick = (imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle conversation selection from sidebar
  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  // Handle new conversation
  const handleNewConversation = async () => {
    await createNewConversation();
    // On mobile, close sidebar after creation
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  return (
    <>
      {/* Main layout with sidebar */}
      <div className={`${isDarkMode ? 'dark' : ''} flex h-screen overflow-hidden`}>
        {/* Conversations Sidebar */}
        <ConversationsSidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          selectedConversationId={selectedConversationId || undefined}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <ChatHeader
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            showConversationsOption={true}
            onToggleConversations={() => setShowSidebar(!showSidebar)}
            isConversationsSidebarOpen={showSidebar}
            {...(activeTab && { activeTab })}
            {...(onTabChange && { onTabChange })}
          />

          {/* Chat Content */}
          <div className="mobile-chat-container flex-1 bg-neutral-50 dark:bg-neutral-900 bg-chat-lighting transition-colors duration-200">
            <main className="mobile-chat-main smooth-scroll scroll-pt-4 pt-20 pb-32">
              <div className="container-narrow pt-4 pb-4">
                {/* Empty State - No conversation selected */}
                {!selectedConversationId && !isLoading && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
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
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                      ¡Hola! Soy Clara PRO
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 max-w-md mb-6">
                      Tu compañera personal en el Método Objetivo Vientre Plano.
                      Estoy aquí para acompañarte en cada paso de tu transformación.
                    </p>
                    <button
                      onClick={handleNewConversation}
                      className="px-6 py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl font-medium transition-colors shadow-lg"
                    >
                      Iniciar conversación
                    </button>

                    {conversations.length > 0 && (
                      <button
                        onClick={() => setShowSidebar(true)}
                        className="mt-4 px-4 py-2 text-brand-green-600 dark:text-brand-green-400 hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 rounded-lg font-medium transition-colors"
                      >
                        Ver conversaciones anteriores ({conversations.length})
                      </button>
                    )}
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-500" />
                  </div>
                )}

                {/* Messages */}
                {selectedConversationId && !isLoading && (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {messages.map((message, index) => (
                        <ChatMessage
                          key={`${selectedConversationId}-${index}`}
                          message={message}
                          state={state}
                          isLatest={index === messages.length - 1}
                        />
                      ))}
                    </AnimatePresence>

                    {/* Typing Indicator */}
                    {isSending && (
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
                )}
              </div>
            </main>
          </div>

          {/* Footer - Only show when conversation is selected */}
          {selectedConversationId && (
            <ChatFooter
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              isProcessing={isSending}
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
              showImageLimitMessage={false} // PRO has unlimited images
            />
          )}
        </div>
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
    </>
  );
};
