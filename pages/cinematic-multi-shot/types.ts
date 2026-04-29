
export enum ArtStyle {
  MATCH_SOURCE = 'Match Original',
  REALISTIC = 'Realistic Photography',
  REFERENCE_AESTHETIC = 'Reference Style'
}

export type ImageQuality = "1K" | "2K" | "4K";

export interface ShotConfig {
  id: string;
  name: string;
  description: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}

export interface GenerationResult {
  shotId: string;
  imageUrl: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

// History item for persistent storage
export interface HistoryItem {
  id: string;
  url: string;
  shotName: string;
  shotId: string;
  style: ArtStyle;
  prompt: string;
  timestamp: number;
}

export const SHOTS: ShotConfig[] = [
  { id: 'ecu', name: 'Extreme Close-up', description: 'Tight frame on facial features', aspectRatio: '3:4' },
  { id: 'cu', name: 'Close-up', description: 'Head and shoulders', aspectRatio: '3:4' },
  { id: 'fb', name: 'Full Body Shot', description: 'Subject visible head-to-toe', aspectRatio: '9:16' },
  { id: 'la', name: 'Low Angle Shot', description: 'Looking up from below', aspectRatio: '9:16' },
  { id: 'ots', name: 'Over-the-Shoulder', description: 'Cinematic perspective', aspectRatio: '16:9' },
  { id: 'els', name: 'Scene image, objects centered', description: 'Wide view of the scene with objects perfectly centered', aspectRatio: '16:9' }
];

export const STYLE_CONFIGS: Record<ArtStyle, string> = {
  [ArtStyle.MATCH_SOURCE]: "Maintain the exact artistic medium and style found in the subject reference photos.",
  [ArtStyle.REALISTIC]: "Professional photorealistic photography style. Real-world lighting and textures.",
  [ArtStyle.REFERENCE_AESTHETIC]: "Ignore the style of the subject photos. Instead, strictly adopt the aesthetic, color palette, lighting, and mood of the provided Style Reference image."
};
