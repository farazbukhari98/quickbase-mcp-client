export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tool?: string;
    args?: Record<string, any>;
    result?: any;
    error?: string;
    dataType?: 'table' | 'record' | 'field' | 'app' | 'query';
    quickbaseData?: any;
  };
}

export interface ChatSuggestion {
  text: string;
  action: string;
  icon?: string;
}