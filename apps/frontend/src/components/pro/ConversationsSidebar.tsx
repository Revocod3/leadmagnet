/**
 * PRO Conversations Sidebar
 * 
 * Wrapper around ConversationList that provides:
 * - Overlay with high z-index that slides in from left (all screens)
 * - Backdrop to close when clicking outside
 * - Animations for open/close
 * - Header with title and close button
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ConversationList } from './ConversationList';

interface ConversationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  selectedConversationId: string | undefined;
  isCreatingConversation?: boolean;
}

export const ConversationsSidebar = ({
  isOpen,
  onClose,
  onSelectConversation,
  onNewConversation,
  selectedConversationId,
  isCreatingConversation = false,
}: ConversationsSidebarProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Always visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Sidebar - Always overlay */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 h-full w-80 z-[101] bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 shadow-2xl"
          >
            <div className="w-full h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                <h2 className="font-semibold text-neutral-900 dark:text-white">
                  Mis Conversaciones
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-400"
                  title="Cerrar sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  onSelectConversation={(id) => {
                    onSelectConversation(id);
                  }}
                  onNewConversation={onNewConversation}
                  selectedConversationId={selectedConversationId}
                  isCreatingConversation={isCreatingConversation}
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
