
export enum ModelType {
  NANO_BANANA = 'gemini-2.5-flash-image',
  NANO_BANANA_PRO = 'gemini-3-pro-image-preview'
}

export type AspectRatio = 'auto' | '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  model: ModelType;
  timestamp: number;
  config?: GenerationConfig;
}

export interface UploadedImage {
  id: string;
  base64: string;
  mimeType: string;
}
