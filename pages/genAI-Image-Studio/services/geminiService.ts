import { assistantPost } from "@/api/assistant";
import { ModelType, GenerationConfig, UploadedImage } from "../types";

export const generateImage = async (
  prompt: string,
  model: ModelType,
  images: UploadedImage[],
  config: GenerationConfig
): Promise<string> => {
  const data = await assistantPost<{ imageDataUrl: string }>("/api/ai/image/genai-studio", {
    prompt,
    model,
    images,
    config,
  });

  return data.imageDataUrl;
};
