/**
 * PRO Conversation List Component
 * 
 * Shows list of user's conversations with ability to create new or continue existing.
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConfirmModal } from '../modals/ConfirmModal';

interface Conversation {
  id: string;
  title: string | null;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  onNewConversation?: () => void; // Optional, not used in UI but kept for API compatibility
  selectedConversationId: string | undefined;
  isCreatingConversation?: boolean;
}

export const ConversationList = ({
  onSelectConversation,
  onNewConversation: _onNewConversation, // Prefixed with _ to indicate intentionally unused
  selectedConversationId,
  isCreatingConversation: _isCreatingConversation, // Not used in this component
}: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setConversationToDelete(conversationId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteProConversation(conversationToDelete);
      setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
      setDeleteModalOpen(false);
      setConversationToDelete(null);
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Error al eliminar la conversación. Por favor, intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-purple-500 mb-2">{error}</p>
        <button
          onClick={loadConversations}
          className="text-brand-green-600 hover:text-brand-green-700 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
            <p className="mb-2">No tienes conversaciones aún</p>
            <p className="text-sm">¡Inicia una nueva para hablar con Clara!</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${selectedConversationId === conversation.id
                  ? 'bg-brand-green-50 dark:bg-brand-green-900/20 border-l-4 border-brand-green-500'
                  : ''
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                      {conversation.title || 'Nueva conversación'}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {conversation.messageCount} mensajes
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className="p-1 text-neutral-400 hover:text-purple-500 transition-colors"
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setConversationToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar conversación?"
        message="Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
