import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

interface AssistantEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AssistantImageResult {
  imageDataUrl?: string;
  assetUrl?: string;
  taskId?: string;
}

const assistantBaseUrl = process.env.AI_ASSISTANT_GO_BASE_URL || "https://api.yuzhengdesign.com";

const runtimeFetch: typeof fetch =
  typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)
    ? window.fetch.bind(window)
    : (tauriFetch as typeof fetch);

const buildHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

export async function assistantPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await runtimeFetch(`${assistantBaseUrl}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  let body: AssistantEnvelope<T> | null = null;
  try {
    body = (await response.json()) as AssistantEnvelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("gemini-key");
    }
    throw new Error(body?.error || `Request failed with status ${response.status}`);
  }

  if (!body?.success || body.data === undefined) {
    throw new Error(body?.error || "Assistant backend request failed.");
  }

  return body.data;
}

export function normalizeAssistantMediaUrl(value?: string | null): string {
  const url = value?.trim();
  if (!url) return "";

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (/^(https?:|data:|blob:|file:|asset:|tauri:)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${assistantBaseUrl}${url}`;
  }

  if (/^[A-Za-z0-9+/]+={0,2}$/.test(url) && url.length > 100) {
    return `data:image/png;base64,${url}`;
  }

  return url;
}

export function pickAssistantImageUrl(data: AssistantImageResult): string {
  const imageUrl = normalizeAssistantMediaUrl(data.imageDataUrl || data.assetUrl);

  if (!imageUrl) {
    throw new Error("Assistant backend did not return an image URL.");
  }

  return imageUrl;
}
