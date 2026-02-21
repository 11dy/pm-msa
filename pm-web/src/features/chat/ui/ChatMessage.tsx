'use client';

import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../model';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center shrink-0
        ${isUser ? 'bg-accent/20 text-accent' : 'bg-zinc-700 text-zinc-300'}
      `}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`
        max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
        ${isUser
          ? 'bg-accent text-white rounded-br-md'
          : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
        }
      `}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
