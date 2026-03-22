'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '../model';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { fetchSuggestions } from '../api/fetchSuggestions';
import type { SuggestedQuestionResponse } from '@/shared/api/types';

interface ChatPanelProps {
  projectId?: number | null;
  projectName?: string | null;
}

export function ChatPanel({ projectId = null, projectName = null }: ChatPanelProps) {
  const { messages, isLoading, sendMessage, clearMessages } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<SuggestedQuestionResponse[]>([]);
  const prevProjectRef = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 프로젝트 변경 시 메시지 초기화 + 추천 질문 로드
  useEffect(() => {
    if (prevProjectRef.current !== undefined && prevProjectRef.current !== projectId) {
      clearMessages();
    }
    prevProjectRef.current = projectId;

    if (projectId != null) {
      fetchSuggestions(projectId).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [projectId, clearMessages]);

  const handleSend = useCallback(async (content: string) => {
    await sendMessage(content, projectId);
  }, [sendMessage, projectId]);

  const handleSuggestionClick = useCallback((question: string) => {
    handleSend(question);
  }, [handleSend]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare size={18} className="text-accent" />
          AI 채팅
          {projectName && (
            <span className="text-sm font-normal text-muted ml-1">— {projectName}</span>
          )}
        </h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <MessageSquare size={48} className="mb-3 opacity-30" />
            <p className="text-sm">AI 어시스턴트에게 질문하세요</p>
            <p className="text-xs mt-1">
              {projectId != null
                ? '선택한 프로젝트의 문서를 기반으로 답변합니다'
                : '전체 문서를 기반으로 답변합니다'}
            </p>

            {/* 추천 질문 */}
            {suggestions.length > 0 && (
              <div className="mt-6 w-full max-w-md">
                <p className="text-xs text-muted mb-2">추천 질문</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSuggestionClick(s.question)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent hover:text-accent transition-colors cursor-pointer text-left"
                    >
                      {s.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center shrink-0">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
