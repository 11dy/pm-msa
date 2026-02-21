'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '../model';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string) => {
    addMessage('user', content);
    setLoading(true);

    // TODO: pm-agent chat API 연동
    // 현재는 목업 응답
    setTimeout(() => {
      addMessage('assistant',
        '안녕하세요! 업로드된 문서를 기반으로 답변드리겠습니다.\n\n' +
        '현재 RAG 파이프라인이 연동되지 않은 상태입니다. ' +
        'Phase 3 구현 완료 후 문서 기반 답변이 가능합니다.'
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare size={18} className="text-accent" />
          AI 채팅
        </h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <MessageSquare size={48} className="mb-3 opacity-30" />
            <p className="text-sm">AI 어시스턴트에게 질문하세요</p>
            <p className="text-xs mt-1">업로드한 문서를 기반으로 답변합니다</p>
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

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
