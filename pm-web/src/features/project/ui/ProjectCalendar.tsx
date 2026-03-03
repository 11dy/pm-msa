'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectCalendarProps {
  datesWithDocs: Set<string>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

export function ProjectCalendar({ datesWithDocs, selectedDate, onDateSelect }: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let i = 1; i <= daysInMonth; i++) result.push(i);
    return result;
  }, [year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatDate = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-card-hover transition-colors cursor-pointer">
          <ChevronLeft size={18} className="text-muted" />
        </button>
        <span className="font-medium">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-card-hover transition-colors cursor-pointer">
          <ChevronRight size={18} className="text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = formatDate(day);
          const hasDocs = datesWithDocs.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`
                relative py-2 rounded-lg text-sm transition-colors cursor-pointer
                ${isSelected ? 'bg-accent text-white' : 'hover:bg-card-hover'}
                ${isToday && !isSelected ? 'text-accent font-semibold' : ''}
              `}
            >
              {day}
              {hasDocs && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
