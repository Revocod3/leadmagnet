import { useState } from 'react';
import { Moon, Sun, Menu, LogOut, BookOpen, MessageSquare, X, TrendingUp, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressChip } from './ProgressChip';
import type { FlowBlock } from '../../config/diagnostic-flow-config';

type Tab = 'chat' | 'diario' | 'progreso';

interface ProgressInfo {
  currentBlock: FlowBlock;
  currentQuestionIndex: number;
  totalQuestionsInBlock: number;
}

interface ChatHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  showConversationsOption?: boolean;
  onToggleConversations?: () => void;
  isConversationsSidebarOpen?: boolean;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  progressInfo?: ProgressInfo | null;
}

export const ChatHeader = ({
  isDarkMode,
  onToggleDarkMode,
  showConversationsOption = false,
  onToggleConversations,
  isConversationsSidebarOpen = false,
  activeTab,
  onTabChange,
  progressInfo,
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  const handleTabClick = (tab: Tab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    setShowMenu(false);
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Gradiente de arriba hacia abajo */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-neutral-50/80 via-50% to-transparent dark:from-neutral-900 dark:via-neutral-900/80 dark:via-50% dark:to-transparent pointer-events-none" />

      <div className="container-narrow py-3 flex items-center justify-between pointer-events-auto relative z-10">
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

        {/* Center: Progress Chip - Solo visible durante el flujo de preguntas */}
        <AnimatePresence>
          {progressInfo && (
            <ProgressChip
              currentBlock={progressInfo.currentBlock}
              currentQuestionIndex={progressInfo.currentQuestionIndex}
              totalQuestionsInBlock={progressInfo.totalQuestionsInBlock}
            />
          )}
        </AnimatePresence>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full p-2.5 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            ) : (
              <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            )}
          </button>

          {/* Menu Button - Solo visible para usuarios autenticados */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full p-2.5 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
                aria-label="Menú"
              >
                <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showMenu && (
                  <>
                    {/* Fullscreen Menu for Mobile */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="md:hidden fixed inset-0 z-50 bg-white dark:bg-neutral-900"
                    >
                      {/* Close button */}
                      <button
                        onClick={() => setShowMenu(false)}
                        className="absolute top-4 right-4 p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <X className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
                      </button>

                      {/* Menu Content */}
                      <div className="flex flex-col h-full pt-20 px-6">
                        {/* User Info */}
                        <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-700">
                          <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {user?.name || 'Usuario'}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {user?.email}
                          </p>
                          {user?.role === 'PRO' && (
                            <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                              PRO
                            </span>
                          )}
                        </div>

                        {/* Navigation Tabs - Solo para usuarios PRO */}
                        {onTabChange && (
                          <div className="mb-8">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                              Navegación
                            </p>
                            <div className="space-y-2">
                              <button
                                onClick={() => handleTabClick('chat')}
                                className={`w-full p-4 flex items-center gap-4 rounded-xl transition-colors ${activeTab === 'chat'
                                  ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 dark:text-brand-green-400'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                                  }`}
                              >
                                <MessageCircle className="w-6 h-6" />
                                <span className="text-lg font-medium">Chat</span>
                              </button>

                              <button
                                onClick={() => handleTabClick('diario')}
                                className={`w-full p-4 flex items-center gap-4 rounded-xl transition-colors ${activeTab === 'diario'
                                  ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 dark:text-brand-green-400'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                                  }`}
                              >
                                <BookOpen className="w-6 h-6" />
                                <span className="text-lg font-medium">Mi Diario</span>
                              </button>

                              <button
                                onClick={() => handleTabClick('progreso')}
                                className={`w-full p-4 flex items-center gap-4 rounded-xl transition-colors ${activeTab === 'progreso'
                                  ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 dark:text-brand-green-400'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                                  }`}
                              >
                                <TrendingUp className="w-6 h-6" />
                                <span className="text-lg font-medium">Mi Progreso</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Mis Conversaciones - Solo para PRO */}
                        {showConversationsOption && onToggleConversations && (
                          <div className="mb-8">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                              Opciones
                            </p>
                            <button
                              onClick={() => {
                                onToggleConversations();
                                setShowMenu(false);
                              }}
                              className="w-full p-4 flex items-center gap-4 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <MessageSquare className="w-6 h-6 text-brand-green-600 dark:text-brand-green-400" />
                              <span className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
                                {isConversationsSidebarOpen ? 'Ocultar Conversaciones' : 'Mis Conversaciones'}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Logout */}
                        <div className="pb-8">
                          <button
                            onClick={handleLogout}
                            className="w-full p-4 flex items-center gap-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <span className="text-lg font-medium text-red-600 dark:text-red-400">
                              Cerrar Sesión
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Desktop Dropdown Menu */}
                    <div className="hidden md:block">
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                      />

                      {/* Menu */}
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 backdrop-blur-xl bg-white/95 dark:bg-neutral-800/95 rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden z-50"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                            {user?.name || 'Usuario'}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {user?.email}
                          </p>
                        </div>

                        {/* Navigation - Solo para PRO */}
                        {onTabChange && (
                          <div className="py-2 border-b border-neutral-200 dark:border-neutral-700">
                            <button
                              onClick={() => handleTabClick('chat')}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${activeTab === 'chat'
                                ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                                }`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Chat</span>
                            </button>
                            <button
                              onClick={() => handleTabClick('diario')}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${activeTab === 'diario'
                                ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                                }`}
                            >
                              <BookOpen className="w-4 h-4" />
                              <span className="text-sm font-medium">Mi Diario</span>
                            </button>
                            <button
                              onClick={() => handleTabClick('progreso')}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${activeTab === 'progreso'
                                ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                                }`}
                            >
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-medium">Mi Progreso</span>
                            </button>
                          </div>
                        )}

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Mis Conversaciones - Solo para PRO */}
                          {showConversationsOption && onToggleConversations && (
                            <button
                              onClick={() => {
                                onToggleConversations();
                                setShowMenu(false);
                              }}
                              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-left"
                            >
                              <MessageSquare className="w-4 h-4 text-brand-green-600 dark:text-brand-green-400" />
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {isConversationsSidebarOpen ? 'Ocultar Conversaciones' : 'Mis Conversaciones'}
                              </span>
                            </button>
                          )}

                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                          >
                            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Cerrar Sesión
                            </span>
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
