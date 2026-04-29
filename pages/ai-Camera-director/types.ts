export interface CameraParams {
  rotationH: number; // Horizontal Rotation: -180 to 180
  rotationV: number; // Vertical Angle: -1 to 1 (which maps to approx -45 to 45 deg)
  zoom: number; // Zoom Intensity: 0 to 10
  distortion: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp?: number;
  image: string;
  params: CameraParams;
}

export interface GenerationState {
  isGenerating: boolean;
  resultImage: string | null;
  error: string | null;
  promptOverride: string;
}

export enum ModelType {
  NANO_BANANA = "gemini-2.5-flash-image",
  NANO_BANANA_PRO = "gemini-3-pro-image-preview",
}

export type AspectRatio = "auto" | "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}
