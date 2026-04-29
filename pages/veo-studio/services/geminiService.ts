import { assistantPost } from "@/api/assistant";
import { GenerateVideoParams } from "../types";

interface VideoGenerateResponse {
  downloadUrl: string;
  taskId: string;
  video: {
    task_id: string;
    status: string;
    model: string;
    url: string;
  };
}

export const generateVideo = async (
  params: GenerateVideoParams
): Promise<{ objectUrl: string; blob: Blob; uri: string; video: any }> => {
  const data = await assistantPost<VideoGenerateResponse>("/api/ai/video/generate", params);
  const response = await fetch(data.downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  return {
    objectUrl,
    blob,
    uri: data.taskId,
    video: data.video,
  };
};
