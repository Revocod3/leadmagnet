/**
 * Progress View Component - Clara Premium
 * 
 * Shows user's phase, stats, trends, and achievements.
 * Uses unified brand palette: brand-green, purple, neutral, brand-cream
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  MessageCircle,
  BookOpen,
  Trophy,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Hand,
  Search,
  BarChart3,
  Star,
  UserCircle,
  Compass
} from 'lucide-react';
import { progressService, UserProgress, SubscriptionRequiredError } from '../../services/premium.service';
import { ChallengeCard } from './ChallengeCard';

// Phase configuration - using brand-green and purple only
const PHASES = {
  BIENVENIDA: {
    name: 'Bienvenida',
    Icon: Hand,
    color: 'from-brand-green-400 to-brand-green-600',
    description: 'Conociéndonos',
    progress: 10
  },
  RADIOGRAFIA: {
    name: 'Radiografía',
    Icon: Search,
    color: 'from-purple-400 to-purple-600',
    description: 'Evaluación inicial',
    progress: 30
  },
  SEGUIMIENTO: {
    name: 'Seguimiento',
    Icon: BarChart3,
    color: 'from-brand-green-500 to-brand-green-700',
    description: 'Acompañamiento diario',
    progress: 60
  },
  AVANZADO: {
    name: 'Avanzado',
    Icon: Star,
    color: 'from-purple-500 to-purple-700',
    description: 'Optimización continua',
    progress: 100
  }
};

// Stat card component
function StatCard({
  icon: Icon,
  value,
  label,
  variant = 'green'
}: {
  icon: any;
  value: number | string;
  label: string;
  variant?: 'green' | 'purple';
}) {
  const bgColor = variant === 'green' ? 'bg-brand-green-500' : 'bg-purple-500';

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 
                    dark:border-neutral-700 p-4 text-center">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${bgColor}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
    </div>
  );
}

interface ProgressViewProps {
  onSubscriptionExpired?: (() => void) | undefined;
}

export function ProgressView({ onSubscriptionExpired }: ProgressViewProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress data
  useEffect(() => {
    async function loadProgress() {
      setIsLoading(true);
      try {
        const data = await progressService.getProgress();
        setProgress(data);
      } catch (err: any) {
        console.error('Error loading progress:', err);
        // Check if subscription is required
        if (err instanceof SubscriptionRequiredError) {
          onSubscriptionExpired?.();
          return;
        }
        setError(err.message || 'Error al cargar el progreso');
      } finally {
        setIsLoading(false);
      }
    }
    loadProgress();
  }, [onSubscriptionExpired]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertTriangle className="w-12 h-12 text-purple-500 mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400">{error || 'Error al cargar'}</p>
      </div>
    );
  }

  const currentPhase = PHASES[progress.phase as keyof typeof PHASES] || PHASES.BIENVENIDA;

  return (
    <div className="h-full overflow-y-auto p-4 pb-20 space-y-6 bg-brand-cream-50 dark:bg-neutral-900">
      {/* Phase indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${currentPhase.color} rounded-2xl p-6 text-white shadow-lg`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm opacity-80">Tu fase actual</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <currentPhase.Icon className="w-6 h-6" />
              <span>{currentPhase.name}</span>
            </div>
          </div>
          {progress.radiographyComplete && (
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Radiografía completada
            </div>
          )}
        </div>

        <div className="text-sm opacity-80 mb-2">{currentPhase.description}</div>

        {/* Progress bar */}
        <div className="w-full bg-white/30 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentPhase.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-white rounded-full h-2"
          />
        </div>

        {/* Phase timeline */}
        <div className="flex justify-between mt-4 text-xs opacity-80">
          {Object.entries(PHASES).map(([key, phase]) => {
            const PhaseIcon = phase.Icon;
            return (
              <div
                key={key}
                className={`flex flex-col items-center ${key === progress.phase ? 'opacity-100' : 'opacity-50'
                  }`}
              >
                <PhaseIcon className="w-5 h-5" />
                <span className="hidden sm:block mt-1">{phase.name}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          icon={Calendar}
          value={progress.stats?.daysActive ?? 0}
          label="Días activa"
          variant="green"
        />
        <StatCard
          icon={MessageCircle}
          value={progress.stats?.conversationCount ?? 0}
          label="Conversaciones"
          variant="green"
        />
        <StatCard
          icon={BookOpen}
          value={progress.stats?.diaryEntries ?? 0}
          label="Entradas diario"
          variant="purple"
        />
        <StatCard
          icon={Trophy}
          value={progress.stats?.challengesCompleted ?? 0}
          label="Retos completados"
          variant="purple"
        />
      </motion.div>

      {/* Two column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Challenge card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ChallengeCard />
        </motion.div>

        {/* Right: Context insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 
                      dark:border-neutral-700 p-4"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-neutral-900 dark:text-white">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            Lo que Clara sabe de ti
          </h3>

          {progress.context ? (
            <div className="space-y-4 text-sm">
              {/* Main symptoms */}
              {progress.context.mainSymptoms && (
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1">Síntomas principales</div>
                  <div className="text-neutral-900 dark:text-white">
                    {progress.context.mainSymptoms}
                  </div>
                </div>
              )}

              {/* Dietary profile */}
              {progress.context.dietaryProfile && (
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1">Perfil alimentario</div>
                  <div className="text-neutral-900 dark:text-white">
                    {progress.context.dietaryProfile}
                  </div>
                </div>
              )}

              {/* Stress level */}
              {progress.context.stressLevel && (
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1">Nivel de estrés</div>
                  <div className="text-neutral-900 dark:text-white">
                    {progress.context.stressLevel}
                  </div>
                </div>
              )}

              {/* Goals */}
              {progress.context.digestiveGoals && (
                Array.isArray(progress.context.digestiveGoals) 
                  ? progress.context.digestiveGoals.length > 0 && (
                    <div>
                      <div className="text-neutral-500 dark:text-neutral-400 mb-1">Objetivos</div>
                      <div className="text-neutral-900 dark:text-white">
                        {progress.context.digestiveGoals.join(', ')}
                      </div>
                    </div>
                  )
                  : (
                    <div>
                      <div className="text-neutral-500 dark:text-neutral-400 mb-1">Objetivos</div>
                      <div className="text-neutral-900 dark:text-white">
                        {progress.context.digestiveGoals}
                      </div>
                    </div>
                  )
              )}

              {/* Known triggers */}
              {progress.context.knownTriggers && progress.context.knownTriggers.length > 0 && (
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1">Disparadores identificados</div>
                  <div className="flex flex-wrap gap-1">
                    {progress.context.knownTriggers.map((trigger, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 
                                   dark:text-purple-400 rounded-full text-xs"
                      >
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {progress.context.improvements && progress.context.improvements.length > 0 && (
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 mb-1">Mejoras notadas</div>
                  <div className="flex flex-wrap gap-1">
                    {progress.context.improvements.map((imp, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 
                                   dark:text-brand-green-400 rounded-full text-xs"
                      >
                        {imp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex p-3 bg-neutral-100 dark:bg-neutral-700 rounded-full mb-3">
                <MessageCircle className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 font-medium">Aún estamos conociéndonos</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Habla con Clara para que pueda conocerte mejor
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Tips section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-brand-cream-100 dark:bg-neutral-800 rounded-xl p-4 border border-brand-green-200 dark:border-neutral-700"
      >
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-brand-green-700 dark:text-brand-green-400">
          <div className="p-1.5 bg-brand-green-200 dark:bg-brand-green-900/30 rounded-lg">
            <Compass className="w-4 h-4 text-brand-green-700 dark:text-brand-green-400" />
          </div>
          Próximos pasos
        </h3>

        <div className="space-y-2">
          {!progress.radiographyComplete && (
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <ChevronRight className="w-4 h-4 text-brand-green-500" />
              Completa la radiografía digestiva hablando con Clara
            </div>
          )}

          {(progress.stats?.diaryEntries ?? 0) < 3 && (
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <ChevronRight className="w-4 h-4 text-brand-green-500" />
              Escribe en tu diario para identificar patrones
            </div>
          )}

          {(progress.stats?.challengesCompleted ?? 0) < 1 && (
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <ChevronRight className="w-4 h-4 text-brand-green-500" />
              Acepta tu primer micro-reto
            </div>
          )}

          {progress.radiographyComplete && (progress.stats?.diaryEntries ?? 0) >= 3 && (
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <ChevronRight className="w-4 h-4 text-brand-green-500" />
              ¡Sigue así! Mantén la constancia para ver resultados
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
