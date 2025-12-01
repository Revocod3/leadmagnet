import { useState } from 'react';
import { Moon, Sun, Menu, LogOut, BookOpen, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  showConversationsOption?: boolean;
  onToggleConversations?: () => void;
  isConversationsSidebarOpen?: boolean;
}

export const ChatHeader = ({
  isDarkMode,
  onToggleDarkMode,
  showConversationsOption = false,
  onToggleConversations,
  isConversationsSidebarOpen = false,
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      {/* Gradiente sutil de arriba hacia abajo */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/95 via-neutral-50/60 to-transparent dark:from-neutral-900/95 dark:via-neutral-900/60 dark:to-transparent pointer-events-none" />

      <div className="container-narrow py-3 flex items-center justify-between pointer-events-auto relative z-10">
        {/* Left: ChatOVP + "En Línea" Bubble */}
        <div className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full px-4 py-2 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {isAuthenticated ? 'Clara PRO' : 'ChatOVP'}
            </span>
            <span className="text-[10px] font-medium text-brand-green-500 flex items-center gap-1.5 online-pulse">
              <span className="w-2 h-2 bg-brand-green-500 rounded-full online-pulse"></span>
              En Línea
            </span>
          </div>
        </div>

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
                      className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-white/95 dark:bg-neutral-800/95 rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden z-50"
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
                          onClick={() => {
                            navigate('/diary');
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-left"
                        >
                          <BookOpen className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            Mi Diario
                          </span>
                        </button>

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
