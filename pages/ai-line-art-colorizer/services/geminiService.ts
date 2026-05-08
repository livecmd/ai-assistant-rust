import { assistantPost, pickAssistantImageUrl, AssistantImageResult } from "@/api/assistant";
import { GenerationConfig, ModelVersion } from "../types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryablePreviewError(error: unknown): boolean {
  return error instanceof Error && /no image data/i.test(error.message);
}

export const generateColorizedImage = async (
  lineArt: string,
  styleRef: string | null,
  config: GenerationConfig
): Promise<string> => {
  if (config.model === ModelVersion.PRO && !config.apiKey) {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }
  }

  const maxAttempts = config.model === ModelVersion.FLASH ? 3 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const data = await assistantPost<AssistantImageResult>("/api/ai/image/line-art-colorizer", {
        lineArt,
        styleRef,
        config,
      });

      return pickAssistantImageUrl(data);
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryablePreviewError(error)) {
        throw error;
      }

      await sleep(600 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("生成失败");
};
