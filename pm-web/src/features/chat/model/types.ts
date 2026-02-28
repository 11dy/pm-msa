export interface MaskingInfo {
  piiDetected: boolean;
  maskedCount: number;
  categories: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  maskingInfo?: MaskingInfo;
}
