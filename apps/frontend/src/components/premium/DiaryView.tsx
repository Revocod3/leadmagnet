/**
 * Diary View Component - Clara Premium
 * 
 * Main diary page combining calendar, editor, and stats.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Calendar as CalendarIcon, Plus, RefreshCw, Flame, Smile, Meh, Frown } from 'lucide-react';
import { DiaryCalendar } from './DiaryCalendar';
import { DiaryEditor } from './DiaryEditor';
import { diaryService, DiaryEntry, DiaryStats } from '../../services/premium.service';

export function DiaryView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [stats, setStats] = useState<DiaryStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load stats and recent entries
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, entriesData] = await Promise.all([
        diaryService.getStats(),
        diaryService.getEntries(1, 5)
      ]);
      setStats(statsData);
      setRecentEntries(entriesData.entries);
    } catch (error) {
      console.error('Error loading diary data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle date selection from calendar
  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);

    // Try to load existing entry for this date
    try {
      const dateStr = date.toISOString().split('T')[0] as string;
      const entry = await diaryService.getEntryByDate(dateStr);
      setSelectedEntry(entry);
    } catch (error) {
      setSelectedEntry(null);
    }

    setIsEditorOpen(true);
  };

  // Handle entry save
  const handleEntrySave = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsEditorOpen(false);
    loadData(); // Refresh data
  };

  // Handle entry delete
  const handleEntryDelete = () => {
    setSelectedEntry(null);
    setIsEditorOpen(false);
    loadData();
  };

  // Open editor for today
  const openTodayEditor = () => {
    const today = new Date();
    setSelectedDate(today);
    handleDateSelect(today);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-y-auto">
      {/* Left column: Calendar and Stats */}
      <div className="md:w-1/3 space-y-4">
        {/* Quick action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openTodayEditor}
          className="w-full py-3 px-4 bg-gradient-to-r from-brand-green-500 to-brand-green-600 
                     text-white rounded-xl font-medium shadow-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Escribir entrada de hoy
        </motion.button>

        {/* Calendar */}
        <DiaryCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {/* Stats */}
        {stats && (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-green-500" />
              Estadísticas
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="text-2xl font-bold text-brand-green-500">{stats.totalEntries ?? 0}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Entradas</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-500 flex items-center justify-center gap-1">
                  {stats.currentStreak ?? 0}
                  <Flame className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Racha</div>
              </div>
            </div>

            {stats.avgMood != null && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Estado de ánimo promedio:</span>
                <span className="font-medium flex items-center gap-1">
                  {stats.avgMood >= 3.5 ? (
                    <Smile className="w-4 h-4 text-brand-green-500" />
                  ) : stats.avgMood >= 2.5 ? (
                    <Meh className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Frown className="w-4 h-4 text-neutral-500" />
                  )}
                  {Number(stats.avgMood).toFixed(1)}/5
                </span>
              </div>
            )}

            {stats.avgBloating != null && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Hinchazón promedio:</span>
                <span className="font-medium">{Number(stats.avgBloating).toFixed(1)}/5</span>
              </div>
            )}

            {Array.isArray(stats.commonTriggers) && stats.commonTriggers.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Disparadores frecuentes:</div>
                <div className="flex flex-wrap gap-1">
                  {stats.commonTriggers.slice(0, 3).map(({ trigger, count }) => (
                    <span
                      key={trigger}
                      className="px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-900/20 
                                 text-purple-600 dark:text-purple-400 rounded-full"
                    >
                      {trigger} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-600">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Tendencia semanal: <span className="font-medium">{stats.weeklyTrend || 'Sin datos aún'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right column: Editor or Recent Entries */}
      <div className="md:w-2/3">
        <AnimatePresence mode="wait">
          {isEditorOpen ? (
            <DiaryEditor
              key="editor"
              date={selectedDate}
              existingEntry={selectedEntry}
              onSave={handleEntrySave}
              onDelete={handleEntryDelete}
              onClose={() => setIsEditorOpen(false)}
            />
          ) : (
            <motion.div
              key="entries"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-green-500" />
                  Entradas recientes
                </h2>
                <button
                  onClick={loadData}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Recent entries list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : recentEntries.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Aún no tienes entradas en tu diario
                  </p>
                  <button
                    onClick={openTodayEditor}
                    className="px-4 py-2 bg-brand-green-500 text-white rounded-lg hover:bg-brand-green-600 transition-colors"
                  >
                    Crear primera entrada
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map(entry => (
                    <motion.div
                      key={entry.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedDate(new Date(entry.date));
                        setSelectedEntry(entry);
                        setIsEditorOpen(true);
                      }}
                      className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 
                                 dark:border-neutral-700 p-4 cursor-pointer hover:border-brand-green-300 
                                 dark:hover:border-brand-green-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium">
                          {new Date(entry.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.mood && (
                            <span className="text-lg">
                              {entry.mood >= 4 ? '😊' : entry.mood >= 3 ? '🙂' : entry.mood >= 2 ? '😕' : '😣'}
                            </span>
                          )}
                          {entry.bloating && entry.bloating >= 3 && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 
                                           text-purple-700 dark:text-purple-300 rounded-full">
                              Hinchazón {entry.bloating}/5
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                        {entry.content}
                      </p>

                      {entry.triggers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {entry.triggers.slice(0, 3).map(trigger => (
                            <span
                              key={trigger}
                              className="px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-900/20 
                                         text-purple-600 dark:text-purple-400 rounded-full"
                            >
                              {trigger}
                            </span>
                          ))}
                          {entry.triggers.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-neutral-500">
                              +{entry.triggers.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
