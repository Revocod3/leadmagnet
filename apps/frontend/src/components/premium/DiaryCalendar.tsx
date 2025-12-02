/**
 * Diary Calendar Component - Clara Premium
 * 
 * Monthly calendar view showing diary entries with mood/bloating colors.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { diaryService, CalendarData } from '../../services/premium.service';

interface DiaryCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Get mood color based on value (1-5)
function getMoodColor(mood: number | null): string {
  if (mood === null) return 'bg-gray-100 dark:bg-gray-700';
  if (mood >= 4) return 'bg-green-100 dark:bg-green-900/50';
  if (mood >= 3) return 'bg-yellow-100 dark:bg-yellow-900/50';
  return 'bg-red-100 dark:bg-red-900/50';
}

// Get bloating indicator
function getBloatingIndicator(bloating: number | null): string {
  if (bloating === null) return '';
  if (bloating >= 4) return '🎈'; // High bloating
  if (bloating >= 3) return '○';  // Medium
  return ''; // Low/none
}

export function DiaryCalendar({ selectedDate, onDateSelect }: DiaryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [, setIsLoading] = useState(false);

  // Load calendar data when month changes
  useEffect(() => {
    async function loadCalendar() {
      setIsLoading(true);
      try {
        const data = await diaryService.getCalendar(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1
        );
        setCalendarData(data);
      } catch (error) {
        console.error('Error loading calendar:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCalendar();
  }, [currentMonth]);

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const now = new Date();
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= now) {
      setCurrentMonth(next);
    }
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Adjust for Monday start (0 = Sunday in JS)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days: Array<{ day: number | null; hasEntry: boolean; mood: number | null; bloating: number | null }> = [];

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, hasEntry: false, mood: null, bloating: null });
    }

    // Days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const entryData = calendarData?.entries.find(e => e.day === d);
      days.push({
        day: d,
        hasEntry: entryData?.hasEntry || false,
        mood: entryData?.mood || null,
        bloating: entryData?.bloating || null
      });
    }

    return days;
  };

  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();
  const canGoNext = !isCurrentMonth;

  const calendarDays = generateCalendarDays();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="font-semibold text-lg">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          onClick={nextMonth}
          disabled={!canGoNext}
          className={`p-2 rounded-lg transition-colors ${canGoNext
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
              : 'opacity-30 cursor-not-allowed'
            }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayData, index) => {
          if (dayData.day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayData.day);
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === today.toDateString();
          const isFuture = date > today;

          return (
            <motion.button
              key={dayData.day}
              whileHover={{ scale: isFuture ? 1 : 1.1 }}
              whileTap={{ scale: isFuture ? 1 : 0.95 }}
              onClick={() => !isFuture && onDateSelect(date)}
              disabled={isFuture}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative
                transition-colors
                ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected ? 'ring-2 ring-green-500' : ''}
                ${isToday ? 'font-bold' : ''}
                ${dayData.hasEntry ? getMoodColor(dayData.mood) : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              <span className={isToday ? 'text-green-600 dark:text-green-400' : ''}>
                {dayData.day}
              </span>
              {dayData.hasEntry && (
                <span className="text-[10px] absolute bottom-0.5">
                  {getBloatingIndicator(dayData.bloating)}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/50" />
          <span>Bien</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/50" />
          <span>Regular</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/50" />
          <span>Mal</span>
        </div>
      </div>
    </div>
  );
}
