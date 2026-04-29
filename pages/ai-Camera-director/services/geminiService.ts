import { assistantPost } from "@/api/assistant";
import { CameraParams, GenerationConfig } from "../types";

export const generateScene = async (
  modelId: string,
  params: CameraParams,
  promptOverride: string,
  config: GenerationConfig,
  inputImage?: string | null
): Promise<string> => {
  const data = await assistantPost<{ imageDataUrl: string }>("/api/ai/image/camera-director", {
    modelId,
    params,
    promptOverride,
    config,
    inputImage,
  });

  return data.imageDataUrl;
};
