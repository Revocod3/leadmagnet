/**
 * PRO Premium Container - Clara Premium
 * 
 * Main container with tabs for Chat, Diary, and Progress.
 * Wraps the existing ProChat with new premium features.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, BookOpen, TrendingUp, Bell, BellOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ProChat } from './ProChat';
import { DiaryView, ProgressView } from '../premium';
import { usePushNotifications } from '../../hooks/usePushNotifications';

type Tab = 'chat' | 'diario' | 'progreso';

const TABS = [
  { id: 'chat' as Tab, label: 'Chat', icon: MessageCircle },
  { id: 'diario' as Tab, label: 'Diario', icon: BookOpen },
  { id: 'progreso' as Tab, label: 'Progreso', icon: TrendingUp },
];

interface ProPremiumContainerProps {
  onSubscriptionExpired?: () => void;
}

export function ProPremiumContainer({ onSubscriptionExpired }: ProPremiumContainerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'chat';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Push notifications
  const {
    isSupported: isPushSupported,
    isSubscribed,
    subscribe,
    isLoading: isPushLoading
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
    if (!isSubscribed) {
      await subscribe();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar with push notification toggle (mobile) */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 
                      border-b border-gray-200 dark:border-gray-700">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          Clara Premium
        </span>

        {isPushSupported && (
          <button
            onClick={handlePushToggle}
            disabled={isPushLoading || isSubscribed}
            className={`p-2 rounded-lg transition-colors ${isSubscribed
                ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            title={isSubscribed ? 'Notificaciones activadas' : 'Activar notificaciones'}
          >
            {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
        )}
      </div>

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
              <ProChat {...(onSubscriptionExpired && { onSubscriptionExpired })} />
            </motion.div>
          )}

          {activeTab === 'diario' && (
            <motion.div
              key="diario"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <DiaryView />
            </motion.div>
          )}

          {activeTab === 'progreso' && (
            <motion.div
              key="progreso"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <ProgressView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom tab bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 
                      px-4 py-2 safe-area-inset-bottom">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${isActive
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                  {tab.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0.5 w-1 h-1 bg-green-500 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Push notification prompt (desktop) */}
      {isPushSupported && !isSubscribed && !isPushLoading && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block fixed bottom-20 right-4 bg-white dark:bg-gray-800 
                      rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Activa las notificaciones
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Recibe recordatorios para tu diario y nuevos micro-retos.
              </p>
              <button
                onClick={handlePushToggle}
                className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white 
                           rounded-lg text-sm font-medium transition-colors"
              >
                Activar notificaciones
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
