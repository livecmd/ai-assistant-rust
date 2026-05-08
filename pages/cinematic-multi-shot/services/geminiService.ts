import { assistantPost, pickAssistantImageUrl, AssistantImageResult } from "@/api/assistant";
import { ArtStyle, ShotConfig, ImageQuality } from "../types";

function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image format detected.");
  }
  return { mimeType: matches[1], data: matches[2] };
}

export async function generateShot(
  sourceImages: string[],
  style: ArtStyle,
  prompt: string,
  shot: ShotConfig,
  quality: ImageQuality,
  styleImage?: string
): Promise<string> {
  const data = await assistantPost<AssistantImageResult>("/api/ai/image/cinematic-multi-shot", {
    sourceImages,
    style,
    prompt,
    shot,
    quality,
    styleImage,
  });

  return pickAssistantImageUrl(data);
}
