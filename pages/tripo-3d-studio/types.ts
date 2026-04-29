import { TripoTaskDetailData } from "@/api";

export type TripoMode =
  | "text-to-model"
  | "image-to-model"
  | "generate-multiview"
  | "multiview-to-model"
  | "refine-model"
  | "texture-model"
  | "mesh-segmentation"
  | "mesh-completion"
  | "highpoly-to-lowpoly"
  | "prerig-check"
  | "rig"
  | "retarget"
  | "stylize-model"
  | "convert-model";

export interface TripoHistoryItem {
  id: string;
  taskId: string;
  mode: TripoMode;
  title: string;
  thumbnail: string;
  timestamp: number;
  detail: TripoTaskDetailData;
}

export interface UploadedImageValue {
  base64: string;
  mimeType: string;
  name: string;
}