import { assistantPost, pickAssistantImageUrl, AssistantImageResult } from "@/api/assistant";
import { CameraParams, GenerationConfig } from "../types";

export const generateScene = async (
  modelId: string,
  params: CameraParams,
  promptOverride: string,
  config: GenerationConfig,
  inputImage?: string | null
): Promise<string> => {
  const data = await assistantPost<AssistantImageResult>("/api/ai/image/camera-director", {
    modelId,
    params,
    promptOverride,
    config,
    inputImage,
  });

  return pickAssistantImageUrl(data);
};
