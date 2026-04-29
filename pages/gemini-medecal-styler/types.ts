export type AspectRatio = "auto" | "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  aspectRatio: AspectRatio;
  size: string;
  imageSize: ImageSize;
  guidanceScale: number;
  stepCount: number;
  negativePrompt: string;
}

export interface HistoryItem {
  id: string;
  originalImage: string | null;
  referenceImage: string | null;
  generatedImage: string; // Base64
  prompt: string;
  timestamp: number;
}

export interface AnalysisResult {
  description: string;
  tags: string[];
}

export enum AppState {
  IDLE = "IDLE",
  ANALYZING = "ANALYZING",
  GENERATING = "GENERATING",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}

export enum ModelType {
  NANO_BANANA = "gemini-2.5-flash-image",
  NANO_BANANA_PRO = "gemini-3-pro-image-preview",
}
