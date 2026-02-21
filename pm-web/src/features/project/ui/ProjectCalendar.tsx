'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, FileText, Upload } from 'lucide-react';
import type { Project, ProjectFile } from '../model';

// 목 데이터
const MOCK_FILES: Record<string, ProjectFile[]> = {
  '2026-02-17': [
    { id: 1, name: '주간보고서_0217.pdf', type: 'pdf', size: 245000, uploadedAt: '2026-02-17' },
  ],
  '2026-02-19': [
    { id: 2, name: '회의록_0219.docx', type: 'docx', size: 128000, uploadedAt: '2026-02-19' },
    { id: 3, name: '기획안_v2.pdf', type: 'pdf', size: 512000, uploadedAt: '2026-02-19' },
  ],
  '2026-02-21': [
    { id: 4, name: '일일보고.txt', type: 'txt', size: 4200, uploadedAt: '2026-02-21' },
  ],
};

interface ProjectCalendarProps {
  project: Project;
  onBack: () => void;
}

export function ProjectCalendar({ project, onBack }: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const selectedFiles = selectedDate ? (MOCK_FILES[selectedDate] || []) : [];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-card-hover transition-colors cursor-pointer">
          <ArrowLeft size={18} className="text-muted" />
        </button>
        <h2 className="font-semibold">{project.name}</h2>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Calendar */}
        <div className="flex-1 p-4">
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
              const hasFiles = !!MOCK_FILES[dateStr];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    relative py-2 rounded-lg text-sm transition-colors cursor-pointer
                    ${isSelected ? 'bg-accent text-white' : 'hover:bg-card-hover'}
                    ${isToday && !isSelected ? 'text-accent font-semibold' : ''}
                  `}
                >
                  {day}
                  {hasFiles && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* File List */}
        <div className="w-72 border-l border-border p-4 overflow-auto">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted">{selectedDate}</h3>
                <button className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-foreground transition-colors cursor-pointer">
                  <Upload size={14} />
                </button>
              </div>
              {selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                      <FileText size={16} className="text-accent mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted">{formatSize(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">업로드된 파일이 없습니다</p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">날짜를 선택하세요</p>
          )}
        </div>
      </div>
    </div>
  );
}
