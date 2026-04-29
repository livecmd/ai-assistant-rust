
export type ModelType = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = 'AUTO' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageState {
  file: File | null;
  preview: string | null;
  base64: string | null;
  width?: number;
  height?: number;
  mask?: Rect | null;
  lassoPath?: Point[] | null;
}

export interface GenerationConfig {
  weight: number;
  structuralDepth: number;
  model: ModelType;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  batchSize: number;
  refinementPrompt: string;
}

// History item for persistent storage
export interface HistoryItem {
  id: string;
  url: string;
  config: GenerationConfig;
  timestamp: number;
}
