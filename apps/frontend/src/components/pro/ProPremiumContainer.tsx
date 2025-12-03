/**
 * PRO Premium Container - Clara Premium
 * 
 * Main container with tabs for Chat, Diary, and Progress.
 * Wraps the existing ProChat with new premium features.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Loader2, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ProChat } from './ProChat';
import { DiaryView, ProgressView } from '../premium';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { ChatHeader } from '../chat/ChatHeader';

export type Tab = 'chat' | 'diario' | 'progreso';

interface ProPremiumContainerProps {
  onSubscriptionExpired?: () => void;
}

export function ProPremiumContainer({ onSubscriptionExpired }: ProPremiumContainerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'chat';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(() => {
    return localStorage.getItem('push-prompt-dismissed') === 'true';
  });
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Push notifications
  const {
    isSupported: isPushSupported,
    isSubscribed,
    subscribe,
    error: pushError
  } = usePushNotifications();

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  // Handle initial tab from URL (e.g., from push notification click)
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null;
    if (tabParam && ['chat', 'diario', 'progreso'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handle push notification subscription
  const handlePushToggle = async () => {
    if (!isSubscribed && pushStatus !== 'loading') {
      setPushStatus('loading');
      try {
        const result = await subscribe();
        if (result) {
          setPushStatus('success');
          // Close modal after showing success briefly
          setTimeout(() => {
            setPushDismissed(true);
            localStorage.setItem('push-prompt-dismissed', 'true');
          }, 1500);
        } else {
          setPushStatus('error');
        }
      } catch {
        setPushStatus('error');
      }
    }
  };

  // Dismiss push prompt
  const dismissPushPrompt = () => {
    setPushDismissed(true);
    localStorage.setItem('push-prompt-dismissed', 'true');
  };

  // Show push prompt
  const showPushPrompt = isPushSupported && !isSubscribed && !pushDismissed;

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

  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <ProChat
                {...(onSubscriptionExpired && { onSubscriptionExpired })}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </motion.div>
          )}

          {activeTab === 'diario' && (
            <motion.div
              key="diario"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              <ChatHeader
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                showConversationsOption={true}
                onToggleConversations={() => handleTabChange('chat')}
              />
              <div className="flex-1 overflow-auto pt-16">
                <DiaryView onSubscriptionExpired={onSubscriptionExpired} />
              </div>
            </motion.div>
          )}

          {activeTab === 'progreso' && (
            <motion.div
              key="progreso"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              <ChatHeader
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                showConversationsOption={true}
                onToggleConversations={() => handleTabChange('chat')}
              />
              <div className="flex-1 overflow-auto pt-16">
                <ProgressView onSubscriptionExpired={onSubscriptionExpired} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Push notification prompt - Mobile & Desktop */}
      <AnimatePresence>
        {showPushPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-6 md:max-w-sm
                       bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 
                       dark:border-neutral-700 p-4 z-50"
          >
            {/* Close button */}
            <button
              onClick={dismissPushPrompt}
              className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-neutral-600 
                         dark:hover:text-neutral-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="p-2 bg-brand-green-100 dark:bg-brand-green-900/30 rounded-lg flex-shrink-0">
                <Bell className="w-5 h-5 text-brand-green-600 dark:text-brand-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  Activa las notificaciones
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Recibe recordatorios para tu diario y nuevos micro-retos.
                </p>

                {pushError && (
                  <p className="text-xs text-red-500 mt-2">{pushError}</p>
                )}

                <button
                  onClick={handlePushToggle}
                  disabled={pushStatus === 'loading' || pushStatus === 'success'}
                  className="mt-3 w-full md:w-auto px-4 py-2 bg-brand-green-500 hover:bg-brand-green-600 
                             disabled:bg-brand-green-400 text-white rounded-lg text-sm font-medium 
                             transition-colors flex items-center justify-center gap-2"
                >
                  {pushStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activando...
                    </>
                  ) : pushStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      ¡Activadas!
                    </>
                  ) : (
                    'Activar notificaciones'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
