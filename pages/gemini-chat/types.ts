export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

// 定义支持的模型版本
export type GeminiModelVersion = 'gemini-3-flash' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
