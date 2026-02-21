'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-end gap-2 bg-zinc-800 rounded-xl px-4 py-2 border border-border focus-within:border-accent transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-zinc-500 focus:outline-none py-1.5"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="p-1.5 rounded-lg text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="text-xs text-zinc-600 mt-2 text-center">
        Shift + Enter로 줄바꿈, Enter로 전송
      </p>
    </div>
  );
}
