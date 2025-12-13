/**
 * PRO Chat Component (Refactored)
 * 
 * Uses the same UI components as the free ChatContainer but with:
 * - Sidebar for conversation management
 * - Unlimited images
 * - PRO-specific features
 * - Premium onboarding flow with ProgressChip
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProChat } from '../../hooks/useProChat';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';
import { ChatHeader } from '../chat/ChatHeader';
import { ChatFooter } from '../chat/ChatFooter';
import { ChatMessage } from '../chat/ChatMessage';
import { TypingIndicator } from '../animations/TypingIndicator';
import { ConversationsSidebar } from './ConversationsSidebar';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { QuickReplyChips } from '../chat/QuickReplyChips';
import { InfoWedge } from '../chat/InfoWedge';
import {
  getQuestionByTurn,
  QUESTION_ID_TO_TURN,
} from '../../config/pro-onboarding-config';
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
    isCreatingConversation,
    error,
    sendMessage,
    state,
    isOnboarding,
    onboardingTurn,
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
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(true);

  // Speech to text
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Hook para manejar el teclado móvil
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard({
    onKeyboardShow: () => {
      scrollToBottom('instant');
    },
  });

  // Función mejorada de scroll al final
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: 'end',
      });
    }

    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, scrollToBottom]);

  // Track typewriter lifecycle to sync scroll with assistant animation
  const handleTypewriterComplete = useCallback(() => {
    setIsTypewriterComplete(true);
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  // Helper to get current question info for Quick Replies
  // USA EL TURNO DEL BACKEND - no depende de regex ni del contenido del mensaje
  const currentQuestionInfo = useMemo(() => {
    // Si no estamos en onboarding, no hay quick replies
    if (!isOnboarding) return null;

    // Usar el turno del backend para calcular la posición exacta
    const result = getQuestionByTurn(onboardingTurn);
    if (!result) return null;

    return {
      block: result.block,
      questionNum: result.questionIndex + 1, // 1-indexed for display
      questionId: result.questionId,
      options: result.options,
      blockIndex: result.blockIndex,
      questionIndex: result.questionIndex,
    };
  }, [isOnboarding, onboardingTurn]);
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      if (lastMessage.isNew !== false) {
        setIsTypewriterComplete(false);
      } else {
        setIsTypewriterComplete(true);
      }
    }
  }, [messages])

  // Auto-scroll when typewriter finishes so the latest chips/footer stay visible
  useEffect(() => {
    if (isTypewriterComplete) {
      const timer = window.setTimeout(() => {
        scrollToBottom('smooth');
      }, 120);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isTypewriterComplete, scrollToBottom]);

  // Auto-scroll when sending
  useEffect(() => {
    if (isSending) {
      scrollToBottom('smooth');
    }
  }, [isSending, scrollToBottom]);

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

  // Detect onboarding progress from latest assistant message
  // Uses currentQuestionInfo which already has the detection done
  const progressInfo = useMemo(() => {
    if (!currentQuestionInfo || !isOnboarding) return null;

    const { block, questionIndex } = currentQuestionInfo;

    // Convert to FlowBlock format for ProgressChip compatibility
    return {
      currentBlock: {
        id: block.id,
        name: block.name,
        emoji: '📋', // Generic emoji for onboarding
        color: block.color,
        colorLight: block.bgColor,
        questions: [],
        infoWedge: block.infoWedge,
      },
      currentQuestionIndex: questionIndex, // Already 0-indexed
      totalQuestionsInBlock: block.questionsCount,
    };
  }, [isOnboarding, currentQuestionInfo]);

  const handleChipSelect = (option: { value: string; label: string }) => {
    handleSendMessage(undefined, option.value);
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
          isCreatingConversation={isCreatingConversation}
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
            progressInfo={progressInfo}
            {...(activeTab && { activeTab })}
            {...(onTabChange && { onTabChange })}
          />

          {/* Chat Content */}
          <div
            ref={chatContainerRef}
            className="mobile-chat-container flex-1 bg-neutral-50 dark:bg-neutral-900 bg-chat-lighting transition-colors duration-200"
            style={{
              height: isKeyboardOpen ? `calc(100dvh - ${keyboardHeight}px)` : undefined,
            }}
          >
            <main
              ref={messagesContainerRef}
              className="mobile-chat-main smooth-scroll scroll-pt-4 pt-20"
              style={{
                paddingBottom: isKeyboardOpen ? '100px' : '140px',
              }}
            >
              <div className="container-narrow pt-4 pb-4">
                {/* Error State - Show when there's an error */}
                {error && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    {/* Error Icon with animation */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="mb-6"
                    >
                      {error.includes('Demasiadas solicitudes') || error.includes('rate limit') ? (
                        // Rate limit icon (clock)
                        <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                          <svg className="w-10 h-10 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        // Generic error icon
                        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      )}
                    </motion.div>

                    {/* Error Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="max-w-md"
                    >
                      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                        {error.includes('Demasiadas solicitudes') || error.includes('rate limit')
                          ? 'Un momento por favor'
                          : '¡Ups! Algo salió mal'}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        {error}
                      </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col sm:flex-row gap-3"
                    >
                      {conversations.length > 0 && (
                        <button
                          onClick={() => {
                            setShowSidebar(true);
                          }}
                          className="px-6 py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                          Ver conversaciones
                        </button>
                      )}
                      <button
                        onClick={handleNewConversation}
                        disabled={isCreatingConversation}
                        className="px-6 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isCreatingConversation ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900 dark:border-white" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva conversación
                          </>
                        )}
                      </button>
                    </motion.div>
                  </div>
                )}

                {/* Empty State - Only when user has zero conversations (rare: user deleted all) */}
                {!error && conversations.length === 0 && !selectedConversationId && !isLoading && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mb-6"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-brand-green-100 dark:border-brand-green-800">
                        <img
                          src="/assets/images/favicon.webp"
                          alt="Clara"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                        ¡Hola! Soy Clara
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm">
                        Escribe un mensaje para comenzar tu acompañamiento personalizado
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* Loading State */}
                {!error && isLoading && (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-500" />
                  </div>
                )}

                {/* Messages */}
                {!error && selectedConversationId && !isLoading && (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {messages.map((message, index) => {
                        // Extract question ID from Clara's message metadata
                        let showInfoWedge = false;
                        let wedgeBlock = null;

                        if (message.role === 'assistant' && index > 0) {
                          // Extract [PREGUNTA_ACTUAL: xxx] from current message
                          const currentMatch = message.content.match(/\[PREGUNTA_ACTUAL:\s*(\w+)\]/);
                          const currentQuestionId = currentMatch ? currentMatch[1] : null;

                          // Find previous assistant message
                          let prevAssistantIndex = -1;
                          for (let i = index - 1; i >= 0; i--) {
                            if (messages[i]?.role === 'assistant') {
                              prevAssistantIndex = i;
                              break;
                            }
                          }

                          if (prevAssistantIndex >= 0 && messages[prevAssistantIndex]) {
                            const prevMatch = messages[prevAssistantIndex]!.content.match(/\[PREGUNTA_ACTUAL:\s*(\w+)\]/);
                            const prevQuestionId = prevMatch ? prevMatch[1] : null;

                            // Special case: First InfoWedge (Digestivo) appears when transitioning from welcome to dig_1
                            if (prevQuestionId === 'welcome' && currentQuestionId === 'dig_1') {
                              const dig1Turn = QUESTION_ID_TO_TURN['dig_1'];
                              const currentInfo = typeof dig1Turn === 'number' ? getQuestionByTurn(dig1Turn) : null;
                              if (currentInfo) {
                                showInfoWedge = true;
                                wedgeBlock = currentInfo.block;
                              }
                            }
                            // All other InfoWedges appear when we LEAVE a block (transition)
                            else if (prevQuestionId && currentQuestionId && currentQuestionId !== 'welcome' && currentQuestionId !== 'completed') {
                              // Convert question IDs to block indices
                              const currentTurn = QUESTION_ID_TO_TURN[currentQuestionId] || 0;
                              const prevTurn = QUESTION_ID_TO_TURN[prevQuestionId] || 0;

                              const currentInfo = getQuestionByTurn(currentTurn);
                              const prevInfo = getQuestionByTurn(prevTurn);

                              // Show InfoWedge when changing blocks (transition from old block to new)
                              if (currentInfo && prevInfo && currentInfo.blockIndex !== prevInfo.blockIndex) {
                                showInfoWedge = true;
                                wedgeBlock = currentInfo.block;
                              }
                            }
                          }
                        }

                        return (
                          <div key={`${selectedConversationId}-${index}`}>
                            {showInfoWedge && wedgeBlock && (
                              <div className="mb-4">
                                <InfoWedge
                                  content={wedgeBlock.infoWedge}
                                  blockColor={wedgeBlock.color}
                                  blockColorLight={wedgeBlock.bgColor}
                                  blockEmoji="✨"
                                />
                              </div>
                            )}
                            <ChatMessage
                              message={{
                                ...message,
                                // Remove metadata from display: [PREGUNTA_ACTUAL: xxx] and PREGUNTA X (xxx):
                                content: message.content
                                  .replace(/\[PREGUNTA_ACTUAL:\s*\w+\]/g, '')
                                  .replace(/PREGUNTA \d+ \(\w+\):/g, '')
                                  .trim()
                              }}
                              state={state}
                              isLatest={index === messages.length - 1}
                              onTypewriterComplete={index === messages.length - 1 ? handleTypewriterComplete : undefined}
                            />
                          </div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Quick Reply Chips */}
                    {!isSending &&
                      isTypewriterComplete &&
                      currentQuestionInfo?.options && (
                        <QuickReplyChips
                          options={currentQuestionInfo.options}
                          onSelect={handleChipSelect}
                          disabled={isSending}
                          blockColor={currentQuestionInfo.block.color}
                        />
                      )}

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

          {/* Footer - Always show unless there's an error */}
          {!error && (
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
              isKeyboardOpen={isKeyboardOpen}
              onInputFocus={scrollToBottom}
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
