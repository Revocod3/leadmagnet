/**
 * Diary Entry Editor Component - Clara Premium
 * 
 * Form for creating/editing diary entries with mood and bloating selectors.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, X, Loader2 } from 'lucide-react';
import { diaryService, DiaryEntry } from '../../services/premium.service';

interface DiaryEditorProps {
  date: Date;
  existingEntry?: DiaryEntry | null;
  onSave: (entry: DiaryEntry) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const MOOD_EMOJIS = [
  { value: 1, emoji: '😣', label: 'Muy mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😊', label: 'Muy bien' },
];

const BLOATING_LEVELS = [
  { value: 1, label: 'Nada', icon: '○' },
  { value: 2, label: 'Poco', icon: '◔' },
  { value: 3, label: 'Moderado', icon: '◑' },
  { value: 4, label: 'Bastante', icon: '◕' },
  { value: 5, label: 'Mucho', icon: '●' },
];

const COMMON_TRIGGERS = [
  'Lácteos', 'Gluten', 'Legumbres', 'Crucíferas', 'Azúcar',
  'Alcohol', 'Café', 'Comida rápida', 'Estrés', 'Poco sueño'
];

const IMPROVEMENTS = [
  'Mejor digestión', 'Menos gases', 'Menos hinchazón', 'Más energía',
  'Mejor sueño', 'Menos dolor', 'Evacuación regular'
];

export function DiaryEditor({ date, existingEntry, onSave, onDelete, onClose }: DiaryEditorProps) {
  const [content, setContent] = useState(existingEntry?.content || '');
  const [mood, setMood] = useState<number | null>(existingEntry?.mood || null);
  const [bloating, setBloating] = useState<number | null>(existingEntry?.bloating || null);
  const [triggers, setTriggers] = useState<string[]>(existingEntry?.triggers || []);
  const [improvements, setImprovements] = useState<string[]>(existingEntry?.improvements || []);
  const [customTrigger, setCustomTrigger] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Toggle trigger selection
  const toggleTrigger = (trigger: string) => {
    setTriggers(prev =>
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  // Toggle improvement selection
  const toggleImprovement = (imp: string) => {
    setImprovements(prev =>
      prev.includes(imp)
        ? prev.filter(i => i !== imp)
        : [...prev, imp]
    );
  };

  // Add custom trigger
  const addCustomTrigger = () => {
    if (customTrigger.trim() && !triggers.includes(customTrigger.trim())) {
      setTriggers(prev => [...prev, customTrigger.trim()]);
      setCustomTrigger('');
    }
  };

  // Save entry
  const handleSave = async () => {
    if (!content.trim()) {
      setError('Escribe algo sobre cómo te has sentido hoy');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const dateStr = date.toISOString().split('T')[0] as string;
      let entry: DiaryEntry;

      if (existingEntry) {
        entry = await diaryService.updateEntry(existingEntry.id, {
          content,
          ...(mood !== null && { mood }),
          ...(bloating !== null && { bloating }),
          triggers,
          improvements
        });
      } else {
        entry = await diaryService.createEntry({
          date: dateStr,
          content,
          ...(mood !== null && { mood }),
          ...(bloating !== null && { bloating }),
          triggers,
          improvements
        });
      }

      onSave(entry);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!existingEntry) return;

    const confirmed = window.confirm('¿Eliminar esta entrada del diario?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await diaryService.deleteEntry(existingEntry.id);
      onDelete?.();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold capitalize">{formattedDate}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">¿Cómo te has sentido hoy?</label>
        <div className="flex gap-2 justify-between">
          {MOOD_EMOJIS.map(({ value, emoji, label }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMood(mood === value ? null : value)}
              className={`
                flex-1 py-2 rounded-lg text-center transition-colors
                ${mood === value
                  ? 'bg-green-100 dark:bg-green-900/50 ring-2 ring-green-500'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
              title={label}
            >
              <span className="text-2xl">{emoji}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bloating selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Nivel de hinchazón</label>
        <div className="flex gap-2 justify-between">
          {BLOATING_LEVELS.map(({ value, label, icon }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBloating(bloating === value ? null : value)}
              className={`
                flex-1 py-2 px-1 rounded-lg text-center transition-colors text-sm
                ${bloating === value
                  ? 'bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-500'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
            >
              <div className="text-lg">{icon}</div>
              <div className="text-xs mt-1">{label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">¿Qué ha pasado hoy?</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe cómo te has sentido, qué has comido, cómo has dormido..."
          className="w-full h-32 p-3 rounded-lg border border-gray-200 dark:border-gray-600 
                     bg-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-green-500
                     focus:border-transparent outline-none"
        />
      </div>

      {/* Triggers */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Posibles disparadores</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {COMMON_TRIGGERS.map(trigger => (
            <button
              key={trigger}
              onClick={() => toggleTrigger(trigger)}
              className={`
                px-3 py-1 rounded-full text-sm transition-colors
                ${triggers.includes(trigger)
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {trigger}
            </button>
          ))}
        </div>
        {/* Custom trigger input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTrigger}
            onChange={(e) => setCustomTrigger(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomTrigger()}
            placeholder="Añadir otro..."
            className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-green-500
                       focus:border-transparent outline-none"
          />
          <button
            onClick={addCustomTrigger}
            disabled={!customTrigger.trim()}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm
                       hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            +
          </button>
        </div>
        {/* Selected custom triggers */}
        {triggers.filter(t => !COMMON_TRIGGERS.includes(t)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {triggers.filter(t => !COMMON_TRIGGERS.includes(t)).map(trigger => (
              <span
                key={trigger}
                className="px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/50 
                           text-red-700 dark:text-red-300 flex items-center gap-1"
              >
                {trigger}
                <button onClick={() => toggleTrigger(trigger)} className="ml-1">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Improvements */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Mejoras notadas</label>
        <div className="flex flex-wrap gap-2">
          {IMPROVEMENTS.map(imp => (
            <button
              key={imp}
              onClick={() => toggleImprovement(imp)}
              className={`
                px-3 py-1 rounded-full text-sm transition-colors
                ${improvements.includes(imp)
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {imp}
            </button>
          ))}
        </div>
      </div>

      {/* Clara's notes (if existing entry) */}
      {existingEntry?.claraNotes && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💚</span>
            <span className="font-medium text-green-700 dark:text-green-300">Nota de Clara</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{existingEntry.claraNotes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {existingEntry && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 
                       text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                       transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Eliminar
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 
                     text-white font-medium transition-colors flex items-center justify-center gap-2
                     disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
