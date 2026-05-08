import { assistantPost, pickAssistantImageUrl, AssistantImageResult } from "@/api/assistant";
import { ModelType, GenerationConfig, UploadedImage } from "../types";

export const generateImage = async (
  prompt: string,
  model: ModelType,
  images: UploadedImage[],
  config: GenerationConfig
): Promise<string> => {
  const data = await assistantPost<AssistantImageResult>("/api/ai/image/genai-studio", {
    prompt,
    model,
    images,
    config,
  });

  return pickAssistantImageUrl(data);
};
