/**
 * PRO Chat Component
 * 
 * Main chat interface for PRO users with conversation management.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../services/api';
import { ConversationList } from './ConversationList';

interface Message {
  role: string;
  content: string;
  createdAt?: string;
}

interface ProChatProps {
  onSubscriptionExpired?: () => void;
}

export const ProChat = ({ onSubscriptionExpired }: ProChatProps) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversation messages
  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const data = await apiClient.getProConversation(conversationId);
      setMessages(data.messages);
      setConversationTitle(data.conversation.title);
      setSelectedConversationId(conversationId);
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new conversation
  const handleNewConversation = async () => {
    try {
      setIsLoading(true);
      setMessages([]);
      setConversationTitle(null);

      const data = await apiClient.createProConversation();
      setSelectedConversationId(data.conversationId);
      setMessages([{
        role: data.message.role,
        content: data.message.content,
        createdAt: new Date().toISOString(),
      }]);
    } catch (err: any) {
      console.error('Error creating conversation:', err);

      if (err.message === 'SUBSCRIPTION_EXPIRED' || err.message?.includes('subscription')) {
        onSubscriptionExpired?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversationId || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const response = await apiClient.sendProMessage(selectedConversationId, userMessage);

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content,
        createdAt: new Date().toISOString(),
      }]);
    } catch (err: any) {
      console.error('Error sending message:', err);

      if (err.message === 'SUBSCRIPTION_EXPIRED') {
        onSubscriptionExpired?.();
        // Add error message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Tu suscripción ha expirado. Renueva para seguir conversando con Clara.',
          createdAt: new Date().toISOString(),
        }]);
      } else {
        // Add error message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Lo siento, hubo un error. Por favor, intenta de nuevo.',
          createdAt: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar - Conversation List */}
      <div
        className={`${showSidebar ? 'w-80' : 'w-0'
          } transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700`}
      >
        <ConversationList
          selectedConversationId={selectedConversationId || undefined}
          onSelectConversation={loadConversation}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {conversationTitle || 'Clara PRO'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tu compañera de salud digestiva
            </p>
          </div>

          {/* PRO Badge */}
          <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-full">
            PRO
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedConversationId && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-4xl">💚</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ¡Hola! Soy Clara PRO
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                Tu compañera personal en el Método Objetivo Vientre Plano.
                Estoy aquí para acompañarte en cada paso de tu transformación.
              </p>
              <button
                onClick={handleNewConversation}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Iniciar conversación
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                        ? 'bg-emerald-500 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {selectedConversationId && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                style={{ maxHeight: '120px' }}
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
