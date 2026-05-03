
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
  adherenceLevel: number; // preset values: 0 | 50 | 100
  feedback?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  timestamp?: number;
  prompt?: string;
  targetImage?: string;
  refImage?: string;
}

export enum ModelType {
  NANO_BANANA = "gemini-2.5-flash-image",
  NANO_BANANA_PRO = "gemini-3-pro-image-preview",
}

export type AspectRatio = "auto" | "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface GenerationImgConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

