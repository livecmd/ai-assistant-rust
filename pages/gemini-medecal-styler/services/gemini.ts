import { assistantPost, pickAssistantImageUrl, AssistantImageResult } from "@/api/assistant";
import { GenerationConfig } from "../types";

export const analyzeReferenceStyle = async (
  modelId: string,
  referenceImageBase64: string
): Promise<string> => {
  const data = await assistantPost<{ text: string }>("/api/ai/image/medical-styler/analyze", {
    modelId,
    referenceImageBase64,
  });
  return data.text || "Could not analyze style.";
};

export const generateProductRender = async (
  modelId: string,
  structureImageBase64: string,
  productName: string,
  stylePrompt: string,
  strength: number,
  mode: "material" | "shape",
  config: GenerationConfig
): Promise<string> => {
  const data = await assistantPost<AssistantImageResult>("/api/ai/image/medical-styler/generate", {
    modelId,
    structureImageBase64,
    productName,
    stylePrompt,
    strength,
    mode,
    config,
  });
  return pickAssistantImageUrl(data);
};
