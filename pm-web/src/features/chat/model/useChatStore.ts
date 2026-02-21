import { create } from 'zustand';
import type { ChatMessage } from './types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (role, content) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    set((state) => ({ messages: [...state.messages, message] }));
  },

  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
}));
