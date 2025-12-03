/**
 * Challenge Card Component - Clara Premium
 * 
 * Displays current challenge or recommends a new one.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  Clock,
  Loader2,
  Flame,
  Brain,
  Wind,
  Activity,
  Droplets,
  UtensilsCrossed,
  LucideIcon
} from 'lucide-react';
import {
  challengeService,
  UserChallenge,
  MicroChallenge,
  ChallengeStats
} from '../../services/premium.service';

// Category icons - using Lucide components
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'MINDFULNESS': Brain,
  'BREATHING': Wind,
  'MOVEMENT': Activity,
  'HYDRATION': Droplets,
  'EATING': UtensilsCrossed
};

// Difficulty colors
const DIFFICULTY_COLORS: Record<string, string> = {
  'easy': 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/50 dark:text-green-300',
  'medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  'hard': 'bg-red-100 text-red-700 dark:bg-purple-900/50 dark:text-red-300'
};

export function ChallengeCard() {
  const [currentChallenge, setCurrentChallenge] = useState<UserChallenge | null>(null);
  const [recommended, setRecommended] = useState<MicroChallenge | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load challenge data
  useEffect(() => {
    async function loadChallengeData() {
      setIsLoading(true);
      try {
        const [current, statsData] = await Promise.all([
          challengeService.getCurrent(),
          challengeService.getStats()
        ]);

        setCurrentChallenge(current);
        setStats(statsData);

        // If no current challenge, get recommendation
        if (!current) {
          const rec = await challengeService.getRecommended();
          setRecommended(rec);
        }
      } catch (error) {
        console.error('Error loading challenge data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadChallengeData();
  }, []);

  // Complete challenge
  const handleComplete = async () => {
    if (!currentChallenge) return;

    setActionLoading(true);
    try {
      const result = await challengeService.complete(currentChallenge.id);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setCurrentChallenge(null);

        // Get new recommendation
        const rec = await challengeService.getRecommended();
        setRecommended(rec);

        // Update stats
        const newStats = await challengeService.getStats();
        setStats(newStats);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al completar el reto' });
    } finally {
      setActionLoading(false);
    }
  };

  // Skip challenge
  const handleSkip = async () => {
    if (!currentChallenge) return;

    const reason = window.prompt('¿Por qué quieres saltar este reto? (opcional)');

    setActionLoading(true);
    try {
      const result = await challengeService.skip(currentChallenge.id, reason || undefined);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setCurrentChallenge(null);

        // Get new recommendation
        const rec = await challengeService.getRecommended();
        setRecommended(rec);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al saltar el reto' });
    } finally {
      setActionLoading(false);
    }
  };

  // Accept recommended challenge
  const handleAccept = async () => {
    if (!recommended) return;

    setActionLoading(true);
    try {
      const result = await challengeService.assign(recommended.id);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setRecommended(null);

        // Reload current challenge
        const current = await challengeService.getCurrent();
        setCurrentChallenge(current);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al aceptar el reto' });
    } finally {
      setActionLoading(false);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 
                      dark:border-neutral-700 p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const challenge = currentChallenge?.challenge || recommended;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 
                    dark:to-indigo-900/20 rounded-xl shadow-sm border border-purple-200 
                    dark:border-purple-800 overflow-hidden">
      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 py-2 text-sm ${message.type === 'success'
              ? 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/50 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-purple-900/50 dark:text-red-300'
              }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {/* Header with stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {currentChallenge ? 'Tu reto actual' : 'Nuevo micro-reto'}
            </span>
          </div>
          {stats && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Trophy className="w-4 h-4" />
                {stats.completed}
              </span>
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <Flame className="w-4 h-4" /> {stats.streak}
              </span>
            </div>
          )}
        </div>

        {challenge ? (
          <>
            {/* Challenge info */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const CategoryIcon = CATEGORY_ICONS[challenge.category] || Target;
                  return <CategoryIcon className="w-5 h-5 text-purple-500" />;
                })()}
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  {challenge.title}
                </h4>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {challenge.description}
              </p>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 text-xs rounded-full ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
                {challenge.difficulty === 'easy' ? 'Fácil' : challenge.difficulty === 'medium' ? 'Medio' : 'Difícil'}
              </span>
              <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                <Clock className="w-3 h-3" />
                {challenge.durationDays} día{challenge.durationDays > 1 ? 's' : ''}
              </span>
            </div>

            {/* Expandable instructions */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between py-2 text-sm text-purple-600 
                         dark:text-purple-400 hover:text-purple-700"
            >
              <span>Ver instrucciones</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-3 text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line 
                                  bg-white/50 dark:bg-neutral-800/50 rounded-lg p-3">
                    {challenge.instructions}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              {currentChallenge ? (
                <>
                  <button
                    onClick={handleComplete}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 bg-brand-green-500 hover:bg-brand-green-600 text-white 
                               rounded-lg font-medium flex items-center justify-center gap-2
                               disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    ¡Completado!
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={actionLoading}
                    className="py-2 px-3 border border-neutral-300 dark:border-neutral-600 
                               text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-50
                               dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-3 bg-purple-500 hover:bg-purple-600 text-white 
                             rounded-lg font-medium flex items-center justify-center gap-2
                             disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  Aceptar reto
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              ¡Has completado todos los retos disponibles! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
