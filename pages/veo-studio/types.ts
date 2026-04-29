/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum VeoModel {
  SEEDANCE_2 = 'doubao-seedance-2.0',
  SEEDANCE_2_FAST = 'doubao-seedance-2.0-fast',
  VEO_3_1_FAST = 'veo3.1-fast-official',
  VEO_3_1_QUALITY = 'veo3.1-quality-official',
}

const MODEL_ALIASES: Record<string, VeoModel> = {
  'doubao-seedance-2.0': VeoModel.SEEDANCE_2,
  'doubao-seedance-2.0-fast': VeoModel.SEEDANCE_2_FAST,
  'seedance 2.0': VeoModel.SEEDANCE_2,
  'seedance 2.0 fast': VeoModel.SEEDANCE_2_FAST,
  'veo3.1-fast-official': VeoModel.VEO_3_1_FAST,
  'veo3.1-quality-official': VeoModel.VEO_3_1_QUALITY,
  'veo 3.1 fast': VeoModel.VEO_3_1_FAST,
  'veo 3.1 quality': VeoModel.VEO_3_1_QUALITY,
  // Legacy aliases
  'doubao-seedance-1-5-pro-251215': VeoModel.SEEDANCE_2,
  'seedance-1.5-pro': VeoModel.SEEDANCE_2,
  'seedance 1.5 pro': VeoModel.SEEDANCE_2,
  'seedance-1.5-fast': VeoModel.SEEDANCE_2_FAST,
  'seedance 1.5 fast': VeoModel.SEEDANCE_2_FAST,
  'veo_3_1': VeoModel.SEEDANCE_2,
  'veo_3_1-fast': VeoModel.SEEDANCE_2_FAST,
};

export const normalizeVideoModel = (model?: string | null): VeoModel => {
  if (!model) {
    return VeoModel.SEEDANCE_2;
  }

  const normalizedModel = model.trim().toLowerCase();
  return MODEL_ALIASES[normalizedModel] ?? VeoModel.SEEDANCE_2;
};

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  HD = '720p',
  FHD = '1080p',
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface UploadedImage {
  id: string;
  base64: string;
  mimeType: string;
}

export interface GenerateVideoParams {
  prompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  referenceImage?: ImageFile | null;
  referenceImages?: UploadedImage[];
}

export interface HistoryItem {
  id: string;
  videoData: string; // base64 encoded video data
  timestamp: number;
  prompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  hasReferenceImage: boolean;
  referenceImageCount?: number;
}
