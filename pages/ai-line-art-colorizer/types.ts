export enum ModelVersion {
  FLASH = 'gemini-2.5-flash-image', // Nano Banana
  PRO = 'gemini-3-pro-image-preview', // Nano Banana Pro
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  TALL = '9:16',
  WIDE = '16:9',
}

export enum ImageResolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K',
}

export enum ThinkingMode {
  FAST = 'fast',
  DEEP = 'deep',
}

export interface GenerationConfig {
  model: ModelVersion;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  prompt: string;
  thinkingMode: ThinkingMode;
  apiKey: string;
}

export interface GeneratedImageResult {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  url: string;
  timestamp: number;
  prompt: string;
}
