import { create } from 'zustand';
import { env } from '@/shared/config/env';
import type { ChatMessage, MaskingInfo } from './types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  sendMessage: async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg, assistantMsg],
      isLoading: true,
    }));

    try {
      const res = await fetch(`${env.AGENT_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: content,
          user_id: 0,
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.slice(6).trim();

            // 다음 data: 라인 처리는 아래에서 eventType 기반으로
            continue;
          }

          if (line.startsWith('data:')) {
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);

              // privacy 이벤트: PII 감지 정보
              if (parsed.pii_detected !== undefined) {
                const maskingInfo: MaskingInfo = {
                  piiDetected: parsed.pii_detected,
                  maskedCount: parsed.masked_count || 0,
                  categories: parsed.categories || [],
                };
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantId
                      ? { ...m, maskingInfo }
                      : m
                  ),
                }));
                continue;
              }

              // token 이벤트: 스트리밍 콘텐츠
              if (parsed.content) {
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.content }
                      : m
                  ),
                }));
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat stream error:', error);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: '죄송합니다. 응답을 받지 못했습니다. 서버 연결을 확인해주세요.' }
            : m
        ),
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
