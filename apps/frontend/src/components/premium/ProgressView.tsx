/**
 * Progress View Component - Clara Premium
 * 
 * Shows user's phase, stats, trends, and achievements.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Calendar,
  MessageCircle,
  BookOpen,
  Trophy,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { progressService, UserProgress } from '../../services/premium.service';
import { ChallengeCard } from './ChallengeCard';

// Phase configuration
const PHASES = {
  BIENVENIDA: {
    name: 'Bienvenida',
    icon: '👋',
    color: 'from-blue-400 to-blue-600',
    description: 'Conociéndonos',
    progress: 10
  },
  RADIOGRAFIA: {
    name: 'Radiografía',
    icon: '🔍',
    color: 'from-purple-400 to-purple-600',
    description: 'Evaluación inicial',
    progress: 30
  },
  SEGUIMIENTO: {
    name: 'Seguimiento',
    icon: '📊',
    color: 'from-green-400 to-green-600',
    description: 'Acompañamiento diario',
    progress: 60
  },
  AVANZADO: {
    name: 'Avanzado',
    icon: '🌟',
    color: 'from-amber-400 to-amber-600',
    description: 'Optimización continua',
    progress: 100
  }
};

// Stat card component
function StatCard({
  icon: Icon,
  value,
  label,
  color
}: {
  icon: any;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 
                    dark:border-gray-700 p-4 text-center">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export function ProgressView() {
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
        setError(err.message || 'Error al cargar el progreso');
      } finally {
        setIsLoading(false);
      }
    }
    loadProgress();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">{error || 'Error al cargar'}</p>
      </div>
    );
  }

  const currentPhase = PHASES[progress.phase as keyof typeof PHASES] || PHASES.BIENVENIDA;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
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
              <span>{currentPhase.icon}</span>
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
          {Object.entries(PHASES).map(([key, phase]) => (
            <div
              key={key}
              className={`flex flex-col items-center ${key === progress.phase ? 'opacity-100' : 'opacity-50'
                }`}
            >
              <span className="text-lg">{phase.icon}</span>
              <span className="hidden sm:block">{phase.name}</span>
            </div>
          ))}
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
          color="bg-blue-500"
        />
        <StatCard
          icon={MessageCircle}
          value={progress.stats?.conversationCount ?? 0}
          label="Conversaciones"
          color="bg-green-500"
        />
        <StatCard
          icon={BookOpen}
          value={progress.stats?.diaryEntries ?? 0}
          label="Entradas diario"
          color="bg-purple-500"
        />
        <StatCard
          icon={Trophy}
          value={progress.stats?.challengesCompleted ?? 0}
          label="Retos completados"
          color="bg-amber-500"
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 
                      dark:border-gray-700 p-4"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-500" />
            Lo que Clara sabe de ti
          </h3>

          {progress.context ? (
            <div className="space-y-4 text-sm">
              {/* Main symptoms */}
              {progress.context.mainSymptoms && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Síntomas principales</div>
                  <div className="text-gray-900 dark:text-white">
                    {progress.context.mainSymptoms}
                  </div>
                </div>
              )}

              {/* Dietary profile */}
              {progress.context.dietaryProfile && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Perfil alimentario</div>
                  <div className="text-gray-900 dark:text-white">
                    {progress.context.dietaryProfile}
                  </div>
                </div>
              )}

              {/* Stress level */}
              {progress.context.stressLevel && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Nivel de estrés</div>
                  <div className="text-gray-900 dark:text-white">
                    {progress.context.stressLevel}
                  </div>
                </div>
              )}

              {/* Goals */}
              {progress.context.digestiveGoals && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Objetivos</div>
                  <div className="text-gray-900 dark:text-white">
                    {progress.context.digestiveGoals}
                  </div>
                </div>
              )}

              {/* Known triggers */}
              {progress.context.knownTriggers && progress.context.knownTriggers.length > 0 && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Disparadores identificados</div>
                  <div className="flex flex-wrap gap-1">
                    {progress.context.knownTriggers.map((trigger, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 
                                   dark:text-red-400 rounded-full text-xs"
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
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Mejoras notadas</div>
                  <div className="flex flex-wrap gap-1">
                    {progress.context.improvements.map((imp, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 
                                   dark:text-green-400 rounded-full text-xs"
                      >
                        {imp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              <p>Aún estamos conociéndonos.</p>
              <p className="mt-1">Habla con Clara para que pueda conocerte mejor.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Tips section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 
                    dark:to-emerald-900/20 rounded-xl p-4"
      >
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
          <Target className="w-5 h-5" />
          Próximos pasos
        </h3>

        <div className="space-y-2">
          {!progress.radiographyComplete && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <ChevronRight className="w-4 h-4 text-green-500" />
              Completa la radiografía digestiva hablando con Clara
            </div>
          )}

          {(progress.stats?.diaryEntries ?? 0) < 3 && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <ChevronRight className="w-4 h-4 text-green-500" />
              Escribe en tu diario para identificar patrones
            </div>
          )}

          {(progress.stats?.challengesCompleted ?? 0) < 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <ChevronRight className="w-4 h-4 text-green-500" />
              Acepta tu primer micro-reto
            </div>
          )}

          {progress.radiographyComplete && (progress.stats?.diaryEntries ?? 0) >= 3 && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <ChevronRight className="w-4 h-4 text-green-500" />
              ¡Sigue así! Mantén la constancia para ver resultados
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
