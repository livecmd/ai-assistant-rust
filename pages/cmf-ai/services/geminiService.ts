import { assistantPost } from "@/api/assistant";
import { GenerationImgConfig, UploadedImage } from "../types";

export const generateProductDesign = async (
  modelId: string,
  targetProduct: UploadedImage,
  referencePattern: UploadedImage,
  adherenceLevel: number,
  config: GenerationImgConfig,
  feedback?: string
): Promise<string> => {
  const data = await assistantPost<{ imageDataUrl: string }>("/api/ai/image/cmf", {
    modelId,
    targetProduct,
    referencePattern,
    adherenceLevel,
    config,
    feedback,
  });

  return data.imageDataUrl;
};
