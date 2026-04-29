
export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type LogType = 'info' | 'success' | 'error' | 'warning';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: LogType;
}

export interface GenerationConfig {
  referenceImage: UploadedImage | null;
  targetProductImage: UploadedImage | null;
  adherenceLevel: number; // 0 - 100
  feedback?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  timestamp: Date;
}
