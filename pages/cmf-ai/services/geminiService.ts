import { assistantPost, pickAssistantImageUrl, AssistantImageResult } from "@/api/assistant";
import { GenerationImgConfig, UploadedImage } from "../types";
import { normalizeAdherenceLevel } from "../adherence";

export const generateProductDesign = async (
  modelId: string,
  targetProduct: UploadedImage,
  referencePattern: UploadedImage,
  adherenceLevel: number,
  config: GenerationImgConfig,
  feedback?: string
): Promise<string> => {
  const normalizedAdherenceLevel = normalizeAdherenceLevel(adherenceLevel);

  const data = await assistantPost<AssistantImageResult>("/api/ai/image/cmf", {
    modelId,
    targetProduct,
    referencePattern,
    adherenceLevel: normalizedAdherenceLevel,
    config,
    feedback,
  });

  return pickAssistantImageUrl(data);
};
