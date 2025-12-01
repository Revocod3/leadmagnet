/**
 * PRO Conversation List Component
 * 
 * Shows list of user's conversations with ability to create new or continue existing.
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Conversation {
  id: string;
  title: string | null;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  selectedConversationId: string | undefined;
}

export const ConversationList = ({
  onSelectConversation,
  onNewConversation,
  selectedConversationId,
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getProConversations();
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Error al cargar conversaciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();

    if (!confirm('¿Eliminar esta conversación?')) return;

    try {
      await apiClient.deleteProConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <button
          onClick={loadConversations}
          className="text-emerald-600 hover:text-emerald-700 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva conversación
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">No tienes conversaciones aún</p>
            <p className="text-sm">¡Inicia una nueva para hablar con Clara!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${selectedConversationId === conversation.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500'
                    : ''
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title || 'Nueva conversación'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {conversation.messageCount} mensajes
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar conversación"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
