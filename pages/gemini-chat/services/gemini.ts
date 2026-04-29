import { assistantPost } from "@/api/assistant";

export const sendMessageToGemini = async (
  modelName: string,
  prompt: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[]
) => {
  const data = await assistantPost<{ text: string }>("/api/ai/text/chat", {
    model: modelName,
    prompt,
    history,
  });

  return data.text;
};
