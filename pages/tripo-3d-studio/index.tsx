import React, { useEffect, useMemo, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { Button, Input, Progress, Select, Switch, message } from "antd";
import { Box } from "lucide-react";
import {
  getTripoConfigCheckApi,
  getTripoTaskApi,
  TripoConfigCheckData,
  TripoTaskCreateData,
  TripoTaskDetailData,
  tripoConvertModelApi,
  tripoGenerateMultiviewApi,
  tripoHighpolyToLowpolyApi,
  tripoImageToModelApi,
  tripoMeshCompletionApi,
  tripoMeshSegmentationApi,
  tripoMultiviewToModelApi,
  tripoPreRigCheckApi,
  tripoRefineModelApi,
  tripoRetargetApi,
  tripoRigApi,
  tripoStylizeModelApi,
  tripoTextToModelApi,
  tripoTextureModelApi,
} from "@/api";
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import { UnifiedHistory } from "../../components/shared/UnifiedHistory";
import { UnifiedGenerateButton } from "../../components/shared/UnifiedGenerateButton";
import {
  ControlSection,
  UnifiedControlPanel,
} from "../../components/shared/UnifiedControlPanel";
import { loadHistory, saveHistory, STORES } from "../../utils/indexedDB";
import TripoModelViewer from "./TripoModelViewer";
import { TripoHistoryItem, TripoMode, UploadedImageValue } from "./types";
import { useModelCatalog } from "../../hooks/useModelCatalog";
import "./index.less";

const { TextArea } = Input;

const modeOptions: Array<{ value: TripoMode; title: string; description: string }> = [
  // { value: "text-to-model", title: "文本生模", description: "从提示词生成 3D 草模" },
  { value: "image-to-model", title: "图片生模", description: "从单张参考图生成模型" },
  // { value: "generate-multiview", title: "生成多视图", description: "先从单图补出四视图" },
  { value: "multiview-to-model", title: "多视图转模", description: "把多视图结果继续转成模型" },
  { value: "refine-model", title: "模型精修", description: "基于草模任务提高几何质量" },
  { value: "texture-model", title: "模型贴图", description: "补纹理、PBR 与局部贴图" },
  { value: "mesh-segmentation", title: "网格分件", description: "把模型拆成可编辑部件" },
  { value: "mesh-completion", title: "网格补全", description: "指定部件做网格补齐" },
  { value: "highpoly-to-lowpoly", title: "高模转低模", description: "控制面数并导出轻量版本" },
  // { value: "prerig-check", title: "绑定预检", description: "先检查模型是否适合自动绑定" },
  // { value: "rig", title: "自动绑定", description: "生成骨骼和可动画模型" },
  // { value: "retarget", title: "动作重定向", description: "套用预设动作导出动画结果" },
  // { value: "stylize-model", title: "模型风格化", description: "转 LEGO / Voxel / Minecraft 风格" },
  { value: "convert-model", title: "格式转换", description: "导出 GLTF / FBX / OBJ / STL 等格式" },
];

const generationModelVersionOptions = [
  // { label: "标准版 v2.5", value: "v2.5-20250123" },
  // { label: "标准版 v2.0", value: "v2.0-20240919" },
  // { label: "标准版 v3.0", value: "v3.0-20250812" },
  { label: "标准版 v3.1", value: "v3.1-20260211" },
  { label: "Turbo 加速版", value: "Turbo-v1.0-20250506" },
  { label: "P1 专业版", value: "P1-20260311" },
];

const meshModelVersionOptions = [
  { label: "默认", value: "" },
  { label: "v1.0", value: "v1.0-20250506" },
];

const lowpolyVersionOptions = [
  { label: "默认", value: "" },
  { label: "P-v2.0", value: "P-v2.0-20251225" },
  { label: "P-v1.0", value: "P-v1.0-20250506" },
];

const textureQualityOptions = [
  { label: "默认", value: "" },
  { label: "标准", value: "standard" },
  { label: "高清", value: "detailed" },
];

const geometryQualityOptions = [
  { label: "默认", value: "" },
  { label: "标准", value: "standard" },
  { label: "超清", value: "detailed" },
];

const orientationOptions = [
  { label: "默认", value: "" },
  { label: "标准朝向", value: "default" },
  { label: "贴合参考图", value: "align_image" },
];

const textureAlignmentOptions = [
  { label: "默认", value: "" },
  { label: "沿用原图", value: "original_image" },
  { label: "贴合几何", value: "geometry" },
];

const rigOutFormatOptions = [
  { label: "GLB", value: "glb" },
  { label: "FBX", value: "fbx" },
];

const rigModelVersionOptions = [
  { label: "默认", value: "" },
  { label: "v2.5", value: "v2.5-20260210" },
  { label: "v2.0", value: "v2.0-20250506" },
  { label: "v1.0", value: "v1.0-20240301" },
];

const rigTypeOptions = [
  { label: "双足", value: "biped" },
  { label: "四足", value: "quadruped" },
  { label: "鸟类", value: "avian" },
  { label: "水生", value: "aquatic" },
  { label: "蛇形", value: "serpentine" },
];

const rigSpecOptions = [
  { label: "A 骨骼", value: "tripo" },
  { label: "B 骨骼", value: "mixamo" },
];

const stylizeStyleOptions = [
  { label: "乐高风", value: "lego" },
  { label: "体素风", value: "voxel" },
  { label: "沃罗诺伊风", value: "voronoi" },
  { label: "我的世界风", value: "minecraft" },
];

const convertFormatOptions = [
  { label: "GLTF 模型", value: "GLTF" },
  { label: "USDZ 模型", value: "USDZ" },
  { label: "FBX 模型", value: "FBX" },
  { label: "OBJ 模型", value: "OBJ" },
  { label: "STL 模型", value: "STL" },
  { label: "3MF 模型", value: "3MF" },
];

const textureFormatOptions = [
  { label: "默认", value: "" },
  { label: "PNG", value: "PNG" },
  { label: "WEBP", value: "WEBP" },
  { label: "JPEG", value: "JPEG" },
  { label: "TIFF", value: "TIFF" },
];

const exportOrientationOptions = [
  { label: "默认", value: "" },
  { label: "+x", value: "+x" },
  { label: "-x", value: "-x" },
  { label: "+y", value: "+y" },
  { label: "-y", value: "-y" },
];

const fbxPresetOptions = [
  { label: "默认", value: "" },
  { label: "blender", value: "blender" },
  { label: "3dsmax", value: "3dsmax" },
  { label: "mixamo", value: "mixamo" },
];

const terminalStatuses = new Set(["success", "completed", "succeeded", "failed", "fail", "error", "cancelled"]);
const successStatuses = new Set(["success", "completed", "succeeded"]);
const generationModes = new Set<TripoMode>(["text-to-model", "image-to-model", "multiview-to-model"]);
const originalModelModes = new Set<TripoMode>([
  "texture-model",
  "mesh-segmentation",
  "mesh-completion",
  "highpoly-to-lowpoly",
  "prerig-check",
  "rig",
  "retarget",
  "stylize-model",
  "convert-model",
]);

const emptyThumbnail =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#173b7a"/><stop offset="100%" stop-color="#0f7c82"/></linearGradient></defs><rect width="400" height="400" rx="32" fill="url(#g)"/><g fill="none" stroke="#dce8ff" stroke-width="14" opacity="0.9"><path d="M200 70 304 130 304 260 200 320 96 260 96 130Z"/><path d="M200 70 200 200 96 260"/><path d="M200 200 304 260"/></g></svg>'
  );

type MultiviewInputMode = "task" | "files";
type MultiviewImageSlot = "front" | "left" | "back" | "right";

interface CachedTripoAssetResult {
  localPath: string;
}

interface DownloadRemoteAssetResult {
  localPath: string;
}

const isTauriRuntime = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const API_BASE =
  (typeof process !== "undefined" && process.env?.AI_ASSISTANT_GO_BASE_URL) ||
  "https://api.yuzhengdesign.com";

/** Route remote Tripo URLs through our own proxy to avoid CORS and enforce auth. */
function proxyUrl(url: string): string {
  if (!url) return url;
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("/") ||
    url.startsWith("asset:") ||
    url.includes("asset.localhost")
  ) {
    return url;
  }
  return `${API_BASE}/api/ai/3d/model-proxy?url=${encodeURIComponent(url)}`;
}

const multiviewImageSlots: Array<{ key: MultiviewImageSlot; label: string }> = [
  { key: "front", label: "前视图" },
  { key: "left", label: "左视图" },
  { key: "back", label: "后视图" },
  { key: "right", label: "右视图" },
];

function getUploadFileType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}

function fileToDataURL(file: File): Promise<UploadedImageValue> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        base64: String(reader.result || ""),
        mimeType: file.type || "image/png",
        name: file.name,
      });
    };
    reader.onerror = () => reject(reader.error || new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

function getPreviewImage(detail: TripoTaskDetailData | null): string | null {
  if (!detail) {
    return null;
  }
  return (
    resolveAssetUrl(detail.renderedImageUrl, detail.localRenderedImagePath) ||
    resolveAssetUrl(detail.generatedImageUrl, detail.localGeneratedImagePath) ||
    resolveAssetUrl(detail.multiview?.frontViewUrl, detail.localMultiview?.frontViewPath) ||
    resolveAssetUrl(detail.multiview?.leftViewUrl, detail.localMultiview?.leftViewPath) ||
    null
  );
}

function getHistoryThumbnail(detail: TripoTaskDetailData): string {
  return getPreviewImage(detail) || emptyThumbnail;
}

function resolveLocalAssetUrl(localPath?: string): string | null {
  if (!localPath || !isTauriRuntime) {
    return null;
  }

  try {
    return convertFileSrc(localPath);
  } catch (error) {
    console.warn("Failed to convert local asset path", error);
    return null;
  }
}

function resolveAssetUrl(remoteUrl?: string, localPath?: string): string | null {
  return resolveLocalAssetUrl(localPath) || remoteUrl || null;
}

function shouldCacheRemoteAsset(url?: string): url is string {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function getPrimaryModelAsset(detail: TripoTaskDetailData | null): string | null {
  if (!detail) {
    return null;
  }

  return (
    resolveAssetUrl(detail.pbrModelUrl, detail.localPbrModelPath) ||
    resolveAssetUrl(detail.modelUrl, detail.localModelPath) ||
    resolveAssetUrl(detail.baseModelUrl, detail.localBaseModelPath) ||
    null
  );
}

function getModeTitle(mode: TripoMode): string {
  return modeOptions.find((item) => item.value === mode)?.title || mode;
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function parseCommaList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseInteger(value: string): number | undefined {
  return value.trim() ? Number(value) : undefined;
}

function parseFloatValue(value: string): number | undefined {
  return value.trim() ? Number(value) : undefined;
}

function getOriginalModelLabel(mode: TripoMode): string {
  switch (mode) {
    case "prerig-check":
      return "待检测模型任务 ID";
    case "rig":
      return "待绑定模型任务 ID";
    case "retarget":
      return "已绑定模型任务 ID";
    case "convert-model":
      return "待转换模型任务 ID";
    default:
      return "原模型任务 ID";
  }
}

function buildGenerationOptions(mode: TripoMode, values: {
  modelVersion: string;
  textureEnabled: boolean;
  pbrEnabled: boolean;
  autoSize: boolean;
  orientation: string;
  textureAlignment: string;
  textureQuality: string;
  geometryQuality: string;
  faceLimit?: number;
  quadEnabled: boolean;
}) {
  const supportsUltraGeometry =
    mode === "multiview-to-model" &&
    ["P1-20260311", "v3.1-20260211", "v3.0-20250812"].includes(values.modelVersion);

  if (generationModes.has(mode)) {
    return {
      modelVersion: values.modelVersion,
      texture: values.textureEnabled,
      pbr: values.pbrEnabled,
      autoSize: values.autoSize,
      orientation: mode === "text-to-model" ? undefined : values.orientation,
      textureQuality: values.textureQuality,
      textureAlignment: mode === "multiview-to-model" ? values.textureAlignment : undefined,
      geometryQuality: mode === "multiview-to-model"
        ? supportsUltraGeometry
          ? values.geometryQuality || "detailed"
          : undefined
        : "detailed",
    };
  }

  return {
    modelVersion: values.modelVersion,
    texture: values.textureEnabled,
    pbr: values.pbrEnabled,
    autoSize: values.autoSize,
    orientation: mode === "text-to-model" ? undefined : values.orientation,
    textureQuality: values.textureQuality,
    geometryQuality: values.geometryQuality,
    faceLimit: values.faceLimit,
    quad: values.quadEnabled,
  };
}

type FaceLimitRule = {
  enabled: boolean;
  min?: number;
  max?: number;
  defaultValue: string;
  placeholder: string;
  hint: string;
};

function getFaceLimitRule(mode: TripoMode, modelVersion: string): FaceLimitRule {
  if (generationModes.has(mode)) {
    return {
      enabled: false,
      defaultValue: "",
      placeholder: "Ultra Mode 自动控制面数",
      hint: "生成模式固定走 Ultra 几何质量，不再传 faceLimit，避免回落到低模分支。",
    };
  }

  if (mode === "highpoly-to-lowpoly") {
    return {
      enabled: true,
      min: 1000,
      max: 20000,
      defaultValue: "20000",
      placeholder: "1000 - 20000，默认 20000",
      hint: "高模转低模必须填写 1000 到 20000 之间的面数上限。",
    };
  }

  if (mode === "convert-model") {
    return {
      enabled: true,
      min: 1,
      defaultValue: "",
      placeholder: "可选，需大于 0",
      hint: "格式转换的 faceLimit 为可选项；留空则使用默认行为。",
    };
  }

  return {
    enabled: false,
    defaultValue: "",
    placeholder: "",
    hint: "",
  };
}

function normalizeFaceLimitForRule(value: string, rule: FaceLimitRule): string {
  const digits = value.replace(/[^\d]/g, "").trim();
  if (!digits) {
    return rule.defaultValue;
  }

  let numeric = Number(digits);
  if (rule.min !== undefined && numeric < rule.min) {
    numeric = rule.min;
  }
  if (rule.max !== undefined && numeric > rule.max) {
    numeric = rule.max;
  }

  return String(numeric);
}

function sanitizeFaceLimitInput(value: string, rule: FaceLimitRule): string {
  const digits = value.replace(/[^\d]/g, "").trim();
  if (!digits) {
    return "";
  }

  const numeric = Number(digits);
  if (rule.max !== undefined && numeric > rule.max) {
    return String(rule.max);
  }

  return digits;
}

function resolveFaceLimitValue(value: string, rule: FaceLimitRule): number | undefined {
  if (!rule.enabled) {
    return undefined;
  }

  const normalized = value.trim() || rule.defaultValue;
  if (!normalized) {
    return undefined;
  }

  return Number(normalized);
}

function validateFaceLimitValue(value: number | undefined, rule: FaceLimitRule): string | undefined {
  if (!rule.enabled || value === undefined) {
    return undefined;
  }

  if (rule.min !== undefined && value < rule.min) {
    return `面数上限必须大于等于 ${rule.min}`;
  }

  if (rule.max !== undefined && value > rule.max) {
    return `面数上限必须小于等于 ${rule.max}`;
  }

  return undefined;
}

function getTripoConfigSummary(status: TripoConfigCheckData | null): string {
  if (!status) {
    return "尚未检查 Tripo 配置。";
  }

  if (status.authenticated) {
    return "Tripo 配置可用，鉴权通过。";
  }

  if (!status.apiKeyConfigured) {
    return "Tripo API Key 未配置。";
  }

  if (status.statusCode === 401) {
    return "Tripo API Key 鉴权失败，当前 key 已失效或填写错误。";
  }

  if (!status.reachable) {
    return `Tripo 配置检查失败：${status.message || "无法连接上游服务"}`;
  }

  return `Tripo 配置检查未通过：${status.message || "未知错误"}`;
}

async function downloadUrl(url: string, filename: string) {
  const proxied = proxyUrl(url);
  const token = localStorage.getItem("token");

  if (isTauriRuntime) {
    try {
      await invoke<DownloadRemoteAssetResult>("download_remote_asset", {
        payload: {
          url: proxied,
          filename,
          token: token || undefined,
        },
      });
      return;
    } catch (error) {
      console.warn("Failed to download via Tauri, fallback to browser download", error);
    }
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(proxied, { headers });
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const link = document.createElement("a");
    link.href = proxied;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.warn("Failed to force download filename, fallback to direct link", error);
  }
}

function extractFilenameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const value = parsed.pathname.split("/").filter(Boolean).pop();
    return value ? decodeURIComponent(value) : null;
  } catch {
    const normalized = url.split("?")[0].split("#")[0];
    const value = normalized.split("/").filter(Boolean).pop();
    return value ? decodeURIComponent(value) : null;
  }
}

function normalizeDownloadedFilename(filename: string): string {
  return filename.replace(/^tripo_pbr_/i, "");
}

function buildDownloadFilename(url: string, fallback: string): string {
  const extracted = extractFilenameFromUrl(url);
  if (!extracted) {
    return fallback;
  }

  const normalized = normalizeDownloadedFilename(extracted);
  return normalized || fallback;
}

async function cacheRemoteAsset(url: string, taskId: string, assetKey: string): Promise<string> {
  const response = await invoke<CachedTripoAssetResult>("cache_remote_asset", {
    payload: {
      url,
      taskId,
      assetKey,
    },
  });

  return response.localPath;
}

async function ensureLocalAssets(detail: TripoTaskDetailData): Promise<TripoTaskDetailData> {
  if (!isTauriRuntime || !detail.taskId) {
    return detail;
  }

  let nextDetail = detail;

  const ensureMutableDetail = () => {
    if (nextDetail === detail) {
      nextDetail = {
        ...detail,
        multiview: detail.multiview ? { ...detail.multiview } : undefined,
        localMultiview: detail.localMultiview ? { ...detail.localMultiview } : undefined,
      };
    }

    return nextDetail;
  };

  const persistAsset = async (
    remoteUrl: string | undefined,
    localPath: string | undefined,
    assetKey: string,
    assign: (target: TripoTaskDetailData, cachedPath: string) => void
  ) => {
    if (!shouldCacheRemoteAsset(remoteUrl) || localPath) {
      return;
    }

    try {
      const cachedPath = await cacheRemoteAsset(remoteUrl, detail.taskId, assetKey);
      if (!cachedPath) {
        return;
      }

      assign(ensureMutableDetail(), cachedPath);
    } catch (error) {
      console.warn(`Failed to cache Tripo asset: ${assetKey}`, error);
    }
  };

  await Promise.all([
    persistAsset(detail.modelUrl, detail.localModelPath, "model", (target, cachedPath) => {
      target.localModelPath = cachedPath;
    }),
    persistAsset(detail.baseModelUrl, detail.localBaseModelPath, "base-model", (target, cachedPath) => {
      target.localBaseModelPath = cachedPath;
    }),
    persistAsset(detail.pbrModelUrl, detail.localPbrModelPath, "pbr-model", (target, cachedPath) => {
      target.localPbrModelPath = cachedPath;
    }),
    persistAsset(detail.generatedImageUrl, detail.localGeneratedImagePath, "generated-image", (target, cachedPath) => {
      target.localGeneratedImagePath = cachedPath;
    }),
    persistAsset(detail.renderedImageUrl, detail.localRenderedImagePath, "rendered-image", (target, cachedPath) => {
      target.localRenderedImagePath = cachedPath;
    }),
    persistAsset(detail.multiview?.frontViewUrl, detail.localMultiview?.frontViewPath, "multiview-front", (target, cachedPath) => {
      target.localMultiview = { ...(target.localMultiview || {}), frontViewPath: cachedPath };
    }),
    persistAsset(detail.multiview?.leftViewUrl, detail.localMultiview?.leftViewPath, "multiview-left", (target, cachedPath) => {
      target.localMultiview = { ...(target.localMultiview || {}), leftViewPath: cachedPath };
    }),
    persistAsset(detail.multiview?.backViewUrl, detail.localMultiview?.backViewPath, "multiview-back", (target, cachedPath) => {
      target.localMultiview = { ...(target.localMultiview || {}), backViewPath: cachedPath };
    }),
    persistAsset(detail.multiview?.rightViewUrl, detail.localMultiview?.rightViewPath, "multiview-right", (target, cachedPath) => {
      target.localMultiview = { ...(target.localMultiview || {}), rightViewPath: cachedPath };
    }),
  ]);

  return nextDetail;
}

const TripoStudio: React.FC = () => {
  const [mode, setMode] = useState<TripoMode>("text-to-model");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [sourceImage, setSourceImage] = useState<UploadedImageValue | null>(null);
  const [styleImage, setStyleImage] = useState<UploadedImageValue | null>(null);
  const [multiviewInputMode, setMultiviewInputMode] = useState<MultiviewInputMode>("task");
  const [multiviewImages, setMultiviewImages] = useState<Record<MultiviewImageSlot, UploadedImageValue | null>>({
    front: null,
    left: null,
    back: null,
    right: null,
  });
  const [originalTaskId, setOriginalTaskId] = useState("");
  const [draftModelTaskId, setDraftModelTaskId] = useState("");
  const [originalModelTaskId, setOriginalModelTaskId] = useState("");
  const [texturePrompt, setTexturePrompt] = useState("");
  const [partNames, setPartNames] = useState("");
  const [modelVersion, setModelVersion] = useState("v3.1-20260211");
  const [meshModelVersion, setMeshModelVersion] = useState("");
  const [lowpolyModelVersion, setLowpolyModelVersion] = useState("");
  const [orientation, setOrientation] = useState("");
  const [textureQuality, setTextureQuality] = useState("");
  const [geometryQuality, setGeometryQuality] = useState("detailed");
  const [textureAlignment, setTextureAlignment] = useState("");
  const [faceLimit, setFaceLimit] = useState("");
  const [textureSize, setTextureSize] = useState("");
  const [flattenBottomThreshold, setFlattenBottomThreshold] = useState("");
  const [scaleFactor, setScaleFactor] = useState("");
  const [blockSize, setBlockSize] = useState("");
  const [textureEnabled, setTextureEnabled] = useState(true);
  const [pbrEnabled, setPbrEnabled] = useState(true);
  const [autoSize, setAutoSize] = useState(true);
  const [quadEnabled, setQuadEnabled] = useState(false);
  const [bakeEnabled, setBakeEnabled] = useState(false);
  const [enableImageAutofix, setEnableImageAutofix] = useState(true);
  const [bakeAnimation, setBakeAnimation] = useState(false);
  const [exportWithGeometry, setExportWithGeometry] = useState(true);
  const [animateInPlace, setAnimateInPlace] = useState(false);
  const [forceSymmetry, setForceSymmetry] = useState(false);
  const [flattenBottom, setFlattenBottom] = useState(false);
  const [pivotToCenterBottom, setPivotToCenterBottom] = useState(false);
  const [withAnimation, setWithAnimation] = useState(false);
  const [packUv, setPackUv] = useState(false);
  const [exportVertexColors, setExportVertexColors] = useState(false);
  const [rigOutFormat, setRigOutFormat] = useState("glb");
  const [rigModelVersion, setRigModelVersion] = useState("");
  const [rigType, setRigType] = useState("biped");
  const [rigSpec, setRigSpec] = useState("tripo");
  const [retargetAnimation, setRetargetAnimation] = useState("preset:walk");
  const [retargetAnimations, setRetargetAnimations] = useState("");
  const [stylizeStyle, setStylizeStyle] = useState("lego");
  const [convertFormat, setConvertFormat] = useState("GLTF");
  const [textureFormat, setTextureFormat] = useState("");
  const [exportOrientation, setExportOrientation] = useState("");
  const [fbxPreset, setFbxPreset] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState("");
  const [currentDetail, setCurrentDetail] = useState<TripoTaskDetailData | null>(null);
  const [statusText, setStatusText] = useState("等待提交");
  const [history, setHistory] = useState<TripoHistoryItem[]>([]);
  const [previewMode, setPreviewMode] = useState<"model" | "image">("image");
  const [tripoConfigStatus, setTripoConfigStatus] = useState<TripoConfigCheckData | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);
  const { formatPriceSummary } = useModelCatalog({ category: "3d", provider: "tripo" });

  const faceLimitRule = useMemo(() => getFaceLimitRule(mode, modelVersion), [mode, modelVersion]);
  const modePriceText = useMemo(() => {
	if (mode === "image-to-model") {
		return formatPriceSummary(["tripo-image-to-model"]);
	}
	if (mode === "generate-multiview") {
		return formatPriceSummary(["tripo-generate-multiview"]);
	}
	return "";
  }, [formatPriceSummary, mode]);

  useEffect(() => {
    const load = async () => {
      const saved = await loadHistory<TripoHistoryItem>(STORES.TRIPO_3D_STUDIO);
      if (saved.length > 0) {
        const normalized = saved.map((item) => ({
          ...item,
          thumbnail: getHistoryThumbnail(item.detail),
        }));
        setHistory(normalized);
        setCurrentTaskId(normalized[0].taskId);
        setCurrentDetail(normalized[0].detail);
        setStatusText(`已载入历史任务 ${normalized[0].taskId}`);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadConfigStatus = async () => {
      setIsCheckingConfig(true);
      try {
        const response = await getTripoConfigCheckApi();
        if (response.success && response.data) {
          setTripoConfigStatus(response.data);
        }
      } finally {
        setIsCheckingConfig(false);
      }
    };

    void loadConfigStatus();
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      void saveHistory(STORES.TRIPO_3D_STUDIO, history, 40);
    }
  }, [history]);

  useEffect(() => {
    setFaceLimit((previous) => normalizeFaceLimitForRule(previous, faceLimitRule));
  }, [faceLimitRule]);

  useEffect(() => {
    if (!generationModes.has(mode)) {
      return;
    }

    if (mode === "multiview-to-model") {
      setGeometryQuality((previous) => previous || "detailed");
      setTextureAlignment((previous) => previous || "original_image");
      setTextureQuality((previous) => previous || "detailed");
    } else {
      setGeometryQuality("detailed");
    }
    setFaceLimit("");
    setQuadEnabled(false);
  }, [mode]);

  useEffect(() => {
    if (!currentTaskId || !isPolling) {
      return;
    }

    let stopped = false;

    const poll = async () => {
      const response = await getTripoTaskApi(currentTaskId);
      if (!response.success || !response.data || stopped) {
        if (!stopped && response.error) {
          setStatusText(response.error);
          setIsPolling(false);
        }
        return;
      }

      let detail = response.data;
      if (successStatuses.has(normalizeStatus(detail.status))) {
        detail = await ensureLocalAssets(detail);
      }
      setCurrentDetail(detail);
      setStatusText(`任务 ${detail.taskId} 状态: ${detail.status}`);
      upsertHistory(detail);

      if (terminalStatuses.has(normalizeStatus(detail.status))) {
        setIsPolling(false);
        if (successStatuses.has(normalizeStatus(detail.status))) {
          message.success(`任务完成: ${detail.taskId}`);
        } else {
          message.error(`任务失败: ${detail.status}`);
        }
        return;
      }

      window.setTimeout(() => {
        if (!stopped) {
          void poll();
        }
      }, 3000);
    };

    void poll();

    return () => {
      stopped = true;
    };
  }, [currentTaskId, isPolling, mode]);

  const previewImage = useMemo(() => getPreviewImage(currentDetail), [currentDetail]);
  const modelAsset = useMemo(() => getPrimaryModelAsset(currentDetail), [currentDetail]);

  useEffect(() => {
    if (!currentDetail || !successStatuses.has(normalizeStatus(currentDetail.status))) {
      return;
    }

    let cancelled = false;

    const syncLocalAssets = async () => {
      const localizedDetail = await ensureLocalAssets(currentDetail);
      if (cancelled || localizedDetail === currentDetail) {
        return;
      }

      setCurrentDetail(localizedDetail);
      setHistory((prev) =>
        prev.map((item) =>
          item.taskId === localizedDetail.taskId
            ? {
                ...item,
                detail: localizedDetail,
                thumbnail: getHistoryThumbnail(localizedDetail),
              }
            : item
        )
      );
    };

    void syncLocalAssets();

    return () => {
      cancelled = true;
    };
  }, [currentDetail]);

  useEffect(() => {
    if (modelAsset) {
      setPreviewMode("model");
      return;
    }
    setPreviewMode("image");
  }, [modelAsset, previewImage]);

  const upsertHistory = (detail: TripoTaskDetailData, currentMode: TripoMode = mode) => {
    const titleBase =
      prompt.trim() ||
      texturePrompt.trim() ||
      originalTaskId.trim() ||
      draftModelTaskId.trim() ||
      originalModelTaskId.trim() ||
      getModeTitle(currentMode);

    setHistory((prev) => {
      const next = prev.filter((item) => item.taskId !== detail.taskId);
      const item: TripoHistoryItem = {
        id: detail.taskId,
        taskId: detail.taskId,
        mode: currentMode,
        title: titleBase,
        thumbnail: getHistoryThumbnail(detail),
        timestamp: Date.now(),
        detail,
      };
      return [item, ...next];
    });
  };

  const readImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (value: UploadedImageValue | null) => void
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      setter(await fileToDataURL(file));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "读取图片失败");
    }
  };

  const setMultiviewImage = (slot: MultiviewImageSlot, value: UploadedImageValue | null) => {
    setMultiviewImages((previous) => ({ ...previous, [slot]: value }));
  };

  const refreshTripoConfigStatus = async (silent: boolean = false) => {
    setIsCheckingConfig(true);
    try {
      const response = await getTripoConfigCheckApi();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Tripo 配置检查失败");
      }

      setTripoConfigStatus(response.data);
      if (!silent) {
        if (response.data.authenticated) {
          message.success("Tripo 配置检查通过");
        } else {
          message.warning(getTripoConfigSummary(response.data));
        }
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Tripo 配置检查失败";
      if (!silent) {
        message.error(messageText);
      }
    } finally {
      setIsCheckingConfig(false);
    }
  };

  const submitTask = async () => {
    setIsSubmitting(true);
    setStatusText("正在提交任务...");

    try {
      let response: { success: boolean; data: TripoTaskCreateData | null; error?: string };
      const partNameList = parseCommaList(partNames);
      const multipleAnimations = parseCommaList(retargetAnimations);
      const parsedFaceLimit = resolveFaceLimitValue(faceLimit, faceLimitRule);
      const faceLimitError = validateFaceLimitValue(parsedFaceLimit, faceLimitRule);
      if (faceLimitError) {
        throw new Error(faceLimitError);
      }
      const generationOptions = buildGenerationOptions(mode, {
        modelVersion,
        textureEnabled,
        pbrEnabled,
        autoSize,
        orientation,
        textureAlignment,
        textureQuality,
        geometryQuality,
        faceLimit: parsedFaceLimit,
        quadEnabled,
      });

      switch (mode) {
        case "text-to-model":
          if (!prompt.trim()) {
            throw new Error("请填写文本提示词");
          }
          response = await tripoTextToModelApi({ prompt, negativePrompt, options: generationOptions });
          break;
        case "image-to-model":
          if (!sourceImage) {
            throw new Error("请先上传参考图片");
          }
          response = await tripoImageToModelApi({
            image: { base64: sourceImage.base64, mimeType: sourceImage.mimeType },
            enableImageAutofix,
            options: generationOptions,
          });
          break;
        case "generate-multiview":
          if (!sourceImage) {
            throw new Error("请先上传参考图片");
          }
          response = await tripoGenerateMultiviewApi({
            image: { base64: sourceImage.base64, mimeType: sourceImage.mimeType },
          });
          break;
        case "multiview-to-model":
      if (multiviewInputMode === "task") {
      if (!originalTaskId.trim()) {
        throw new Error("请输入多视图任务 ID");
      }
      response = await tripoMultiviewToModelApi({ originalTaskId, options: generationOptions });
      } else {
      const uploadedCount = multiviewImageSlots.filter(({ key }) => Boolean(multiviewImages[key])).length;
      if (uploadedCount < 3) {
        throw new Error("请至少上传 3 张视图");
      }
      response = await tripoMultiviewToModelApi({
        type: "multiview_to_model",
        model_version: modelVersion || undefined,
        geometry_quality: generationOptions.geometryQuality,
        texture_quality: generationOptions.textureQuality,
        texture_alignment: generationOptions.textureAlignment,
        texture: generationOptions.texture,
        pbr: generationOptions.pbr,
        auto_size: generationOptions.autoSize,
        orientation: generationOptions.orientation,
        files: multiviewImageSlots.map(({ key }) => {
          const image = multiviewImages[key];
          if (!image) {
            return {};
          }

          return {
            type: getUploadFileType(image.mimeType),
            base64: image.base64,
            mimeType: image.mimeType,
          };
        }),
        options: generationOptions,
      });
      }
          break;
        case "refine-model":
          if (!draftModelTaskId.trim()) {
            throw new Error("请输入草模任务 ID");
          }
          response = await tripoRefineModelApi({ draftModelTaskId });
          break;
        case "texture-model":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入模型任务 ID");
          }
          response = await tripoTextureModelApi({
            originalModelTaskId,
            texturePrompt: {
              text: texturePrompt,
              styleImage: styleImage ? { base64: styleImage.base64, mimeType: styleImage.mimeType } : undefined,
            },
            texture: textureEnabled,
            pbr: pbrEnabled,
            textureAlignment,
            textureQuality,
            partNames: partNameList,
            modelVersion,
            bake: bakeEnabled,
          });
          break;
        case "mesh-segmentation":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入原始模型任务 ID");
          }
          response = await tripoMeshSegmentationApi({ originalModelTaskId, modelVersion: meshModelVersion });
          break;
        case "mesh-completion":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入原始模型任务 ID");
          }
          response = await tripoMeshCompletionApi({
            originalModelTaskId,
            modelVersion: meshModelVersion,
            partNames: partNameList,
          });
          break;
        case "highpoly-to-lowpoly":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入原始模型任务 ID");
          }
          response = await tripoHighpolyToLowpolyApi({
            originalModelTaskId,
            modelVersion: lowpolyModelVersion,
            quad: quadEnabled,
            partNames: partNameList,
            faceLimit: parsedFaceLimit,
            bake: bakeEnabled,
          });
          break;
        case "prerig-check":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入原始模型任务 ID");
          }
          response = await tripoPreRigCheckApi({ originalModelTaskId });
          break;
        case "rig":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入原始模型任务 ID");
          }
          response = await tripoRigApi({
            originalModelTaskId,
            outFormat: rigOutFormat,
            modelVersion: rigModelVersion,
            rigType,
            spec: rigSpec,
          });
          break;
        case "retarget":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入已绑定模型任务 ID");
          }
          if (!retargetAnimation.trim() && multipleAnimations.length === 0) {
            throw new Error("请至少填写一个动作预设，例如 preset:walk");
          }
          response = await tripoRetargetApi({
            originalModelTaskId,
            outFormat: rigOutFormat,
            bakeAnimation,
            exportWithGeometry,
            animation: multipleAnimations.length === 0 ? retargetAnimation : undefined,
            animations: multipleAnimations.length > 0 ? multipleAnimations : undefined,
            animateInPlace,
          });
          break;
        case "stylize-model":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入模型任务 ID");
          }
          response = await tripoStylizeModelApi({
            originalModelTaskId,
            style: stylizeStyle,
            blockSize: stylizeStyle === "minecraft" ? parseInteger(blockSize) : undefined,
          });
          break;
        case "convert-model":
          if (!originalModelTaskId.trim()) {
            throw new Error("请输入模型任务 ID");
          }
          response = await tripoConvertModelApi({
            format: convertFormat,
            originalModelTaskId,
            quad: quadEnabled,
            forceSymmetry,
            faceLimit: parsedFaceLimit,
            flattenBottom,
            flattenBottomThreshold: flattenBottom ? parseFloatValue(flattenBottomThreshold) : undefined,
            textureSize: parseInteger(textureSize),
            textureFormat,
            pivotToCenterBottom,
            scaleFactor: parseFloatValue(scaleFactor),
            withAnimation,
            packUv,
            bake: bakeEnabled,
            partNames: partNameList,
            animateInPlace,
            exportVertexColors,
            exportOrientation,
            fbxPreset,
          });
          break;
      }

      if (!response.success || !response.data) {
        throw new Error(response.error || "任务提交失败");
      }

      setCurrentTaskId(response.data.taskId);
      setCurrentDetail(null);
      setIsPolling(true);
      setStatusText(`任务已提交: ${response.data.taskId}`);
      message.success(`已提交任务 ${response.data.taskId}`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "任务提交失败";
      setStatusText(messageText);
      message.error(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modelLinks = [
    { label: "GLB/主模型", href: resolveAssetUrl(currentDetail?.modelUrl, currentDetail?.localModelPath) },
    { label: "Base 模型", href: resolveAssetUrl(currentDetail?.baseModelUrl, currentDetail?.localBaseModelPath) },
    { label: "PBR 模型", href: resolveAssetUrl(currentDetail?.pbrModelUrl, currentDetail?.localPbrModelPath) },
    { label: "生成图", href: resolveAssetUrl(currentDetail?.generatedImageUrl, currentDetail?.localGeneratedImagePath) },
    { label: "渲染图", href: resolveAssetUrl(currentDetail?.renderedImageUrl, currentDetail?.localRenderedImagePath) },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));

  const hasPreviewToggle = Boolean(modelAsset && previewImage);

  return (
    <div className="tripoStudio">
      <div className="left">
        <UnifiedPreview
          type="image"
          src={previewImage}
          isLoading={isSubmitting || isPolling}
          emptyText="3D 工作台"
          emptySubtext="提交 3D 任务后，这里会显示模型预览、渲染图、多视图和下载入口"
          onDownload={
            modelAsset || previewImage
              ? () => {
                  const target = previewMode === "model" && modelAsset ? modelAsset : previewImage;
                  if (target) {
                    void downloadUrl(target, buildDownloadFilename(target, `tripo-${previewMode}-${Date.now()}`));
                  }
                }
              : undefined
          }
        >
          {currentDetail ? (
            <div className="tripo-preview">
              <div className="tripo-preview-main">
                <div className="preview-toolbar">
                  <div>
                    <div className="field-label">预览面板</div>
                    <div className="status-text">{modelAsset ? "可直接旋转查看模型" : "当前任务还没有可预览的模型文件"}</div>
                  </div>
                  {hasPreviewToggle && (
                    <div className="preview-tabs">
                      <button className={`preview-tab ${previewMode === "model" ? "active" : ""}`} onClick={() => setPreviewMode("model")}>
                        模型预览
                      </button>
                      <button className={`preview-tab ${previewMode === "image" ? "active" : ""}`} onClick={() => setPreviewMode("image")}>
                        渲染图
                      </button>
                    </div>
                  )}
                </div>

                <div className={`viewer-stage ${previewMode === "model" && modelAsset ? "viewer-stage-model" : "viewer-stage-image"}`}>
                  {previewMode === "model" && modelAsset ? (
                    <TripoModelViewer src={modelAsset} poster={previewImage} />
                  ) : (
                    <img src={previewImage || emptyThumbnail} alt="preview" />
                  )}
                </div>
              </div>

              <div className="tripo-preview-side">
                <div className="status-card">
                  <div className="field-label">任务状态</div>
                  <div className="status-text">任务 ID：{currentDetail.taskId}</div>
                  <div className="status-text">任务类型：{currentDetail.type || "-"}</div>
                  <div className="status-text">当前状态：{currentDetail.status}</div>
                  <div className="status-text">消耗额度：{currentDetail.consumedCredit ?? 0}</div>
                  <Progress
                    percent={currentDetail.progress || 0}
                    size="small"
                    status={successStatuses.has(normalizeStatus(currentDetail.status)) ? "success" : undefined}
                  />
                </div>

                {modelLinks.length > 0 && (
                  <div className="asset-card">
                    <div className="field-label">结果文件</div>
                    <div className="asset-links">
                      {modelLinks.map((item) => (
                        <a
                          className="asset-link"
                          key={item.label}
                          href={item.href}
                          onClick={(event) => {
                            event.preventDefault();
                            void downloadUrl(item.href, buildDownloadFilename(item.href, `${item.label}-${currentDetail?.taskId || Date.now()}`));
                          }}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {currentDetail.multiview && (
                  <div className="multiview-card">
                    <div className="field-label">多视图结果</div>
                    <div className="multiview-grid">
                      {Object.entries({
                        front: resolveAssetUrl(currentDetail.multiview.frontViewUrl, currentDetail.localMultiview?.frontViewPath),
                        left: resolveAssetUrl(currentDetail.multiview.leftViewUrl, currentDetail.localMultiview?.leftViewPath),
                        back: resolveAssetUrl(currentDetail.multiview.backViewUrl, currentDetail.localMultiview?.backViewPath),
                        right: resolveAssetUrl(currentDetail.multiview.rightViewUrl, currentDetail.localMultiview?.rightViewPath),
                      })
                        .filter(([, value]) => value)
                        .map(([key, value]) => (
                          <a className="multiview-item" href={value} target="_blank" rel="noreferrer" key={key}>
                            <img src={value} alt={key} />
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : undefined}
        </UnifiedPreview>

        <UnifiedHistory
          title="历史记录"
          items={history.map((item) => ({
            id: item.id,
            thumbnail: item.thumbnail,
            type: "image",
            label: `${getModeTitle(item.mode)} · ${item.detail.status}`,
            isActive: currentTaskId === item.taskId,
            timestamp: item.timestamp,
          }))}
          activeId={currentTaskId || null}
          onSelect={(id) => {
            const hit = history.find((item) => item.id === id);
            if (!hit) {
              return;
            }
            setCurrentTaskId(hit.taskId);
            setCurrentDetail(hit.detail);
            setStatusText(`已切换到任务 ${hit.taskId}`);
          }}
          onDelete={(id, e) => {
            e.stopPropagation();
            setHistory((prev) => prev.filter((item) => item.id !== id));
            if (currentTaskId === id) {
              setCurrentTaskId("");
              setCurrentDetail(null);
            }
          }}
        />
      </div>

      <div className="right right-panel-shell">
        <div className="panel-title-block right-panel-header animate-fadeInDown">
          <h1>3D 工作台</h1>
          <p>3D 建模、贴图、绑定与格式转换</p>
		  {modePriceText ? <p>当前模式价格：{modePriceText}</p> : null}
        </div>

        <UnifiedControlPanel className="action-box" icon={<Box size={22} color="#1677ff" />}>
          <ControlSection title="模式选择">
            <div className="mode-grid">
              {modeOptions.map((item) => (
                <button
                  key={item.value}
                  className={`mode-chip ${mode === item.value ? "active" : ""}`}
                  onClick={() => setMode(item.value)}
                >
                  <span className="mode-title">{item.title}</span>
                  <span className="mode-desc">{item.description}</span>
          {(item.value === "image-to-model" && formatPriceSummary(["tripo-image-to-model"])) ? (
          <span className="mode-desc">价格：{formatPriceSummary(["tripo-image-to-model"])}</span>
          ) : null}
          {(item.value === "generate-multiview" && formatPriceSummary(["tripo-generate-multiview"])) ? (
          <span className="mode-desc">价格：{formatPriceSummary(["tripo-generate-multiview"])}</span>
          ) : null}
                </button>
              ))}
            </div>
          </ControlSection>

          <ControlSection title="主输入">
            <div className="field-stack">
              {mode === "text-to-model" && (
                <>
                  <div>
                    <span className="field-label">提示词</span>
                    <TextArea value={prompt} rows={4} onChange={(event) => setPrompt(event.target.value)} placeholder="描述你想生成的 3D 模型，例如：低多边形木凳，干净拓扑，工作室灯光" />
                  </div>
                  <div>
                    <span className="field-label">反向提示词</span>
                    <TextArea value={negativePrompt} rows={3} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="可选，填写不希望出现的元素" />
                  </div>
                </>
              )}

              {(mode === "image-to-model" || mode === "generate-multiview") && (
                <div className="upload-card">
                  <span className="field-label">参考图片</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void readImage(event, setSourceImage)} />
                  <div className="upload-meta">{sourceImage ? `${sourceImage.name} · ${sourceImage.mimeType}` : "支持 png / jpg / webp"}</div>
                </div>
              )}

              {mode === "multiview-to-model" && (
        <>
          <div>
          <span className="field-label">多视图输入来源</span>
          <div className="preview-tabs multiview-source-tabs">
            <button className={`preview-tab ${multiviewInputMode === "task" ? "active" : ""}`} onClick={() => setMultiviewInputMode("task")}>
            任务 ID
            </button>
            <button className={`preview-tab ${multiviewInputMode === "files" ? "active" : ""}`} onClick={() => setMultiviewInputMode("files")}>
            四视图上传
            </button>
          </div>
          </div>

          {multiviewInputMode === "task" ? (
          <div>
            <span className="field-label">多视图任务 ID</span>
            <Input value={originalTaskId} onChange={(event) => setOriginalTaskId(event.target.value)} placeholder="输入 generate-multiview 返回的任务 ID" />
          </div>
          ) : (
          <>
          <div className="multiview-upload-grid">
            {multiviewImageSlots.map((slot) => {
            const image = multiviewImages[slot.key];
            return (
              <div className="upload-card multiview-upload-card" key={slot.key}>
              <span className="field-label">{slot.label}</span>
              <label className="multiview-upload-surface">
                <input
                  className="upload-input-hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => void readImage(event, (value) => setMultiviewImage(slot.key, value))}
                />
                {image ? (
                  <>
                    <img className="multiview-upload-preview" src={image.base64} alt={slot.label} />
                    <div className="multiview-upload-overlay">点击更换</div>
                  </>
                ) : (
                  <div className="multiview-upload-placeholder">
                    <span className="multiview-upload-placeholder-title">上传{slot.label}</span>
                    <span className="multiview-upload-placeholder-desc">支持 png / jpg / webp</span>
                  </div>
                )}
              </label>
              <div className="upload-meta">{image ? `${image.name} · ${image.mimeType}` : `尚未上传${slot.label}`}</div>
              </div>
            );
            })}
          </div>
          <div className="status-text">文件上传模式支持 3 张起传；任意缺 1 张都可以，缺失位会按顺序用空对象占位发送。</div>
          </>
          )}
        </>
              )}

              {mode === "refine-model" && (
                <div>
                  <span className="field-label">草模任务 ID</span>
                  <Input value={draftModelTaskId} onChange={(event) => setDraftModelTaskId(event.target.value)} placeholder="输入草模任务 ID" />
                </div>
              )}

              {originalModelModes.has(mode) && (
                <div>
                  <span className="field-label">{getOriginalModelLabel(mode)}</span>
                  <Input value={originalModelTaskId} onChange={(event) => setOriginalModelTaskId(event.target.value)} placeholder="输入上一步模型任务 ID" />
                </div>
              )}

              {mode === "texture-model" && (
                <>
                  <div>
                    <span className="field-label">贴图提示词</span>
                    <TextArea value={texturePrompt} rows={4} onChange={(event) => setTexturePrompt(event.target.value)} />
                  </div>
                  <div className="upload-card">
                    <span className="field-label">风格参考图</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void readImage(event, setStyleImage)} />
                    <div className="upload-meta">{styleImage ? `${styleImage.name} · ${styleImage.mimeType}` : "可选，用于辅助贴图风格"}</div>
                  </div>
                </>
              )}

              {(mode === "texture-model" || mode === "mesh-completion" || mode === "highpoly-to-lowpoly" || mode === "convert-model") && (
                <div>
                  <span className="field-label">部件名称</span>
                  <Input value={partNames} onChange={(event) => setPartNames(event.target.value)} placeholder="逗号分隔，例如 body,wheel,seat" />
                </div>
              )}

              {mode === "retarget" && (
                <>
                  <div>
                    <span className="field-label">单个动作预设</span>
                    <Input value={retargetAnimation} onChange={(event) => setRetargetAnimation(event.target.value)} placeholder="例如 preset:walk" />
                  </div>
                  <div>
                    <span className="field-label">批量动作预设</span>
                    <Input value={retargetAnimations} onChange={(event) => setRetargetAnimations(event.target.value)} placeholder="可选，逗号分隔多个 preset:*，填写后会覆盖单个动作" />
                  </div>
                </>
              )}

              {mode === "stylize-model" && (
                <div className="compact-row">
                  <div>
                    <span className="field-label">风格化类型</span>
                    <Select value={stylizeStyle} options={stylizeStyleOptions} onChange={setStylizeStyle} />
                  </div>
                  {stylizeStyle === "minecraft" && (
                    <div>
                      <span className="field-label">方块尺寸</span>
                      <Input value={blockSize} onChange={(event) => setBlockSize(event.target.value.replace(/[^\d]/g, ""))} placeholder="32 - 128" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </ControlSection>

          <ControlSection title="模型选项">
            <div className="field-stack">
              {generationModes.has(mode) && (
                <>
                  <div className="compact-row">
                    <div>
                      <span className="field-label">模型版本</span>
                      <Select value={modelVersion} options={generationModelVersionOptions} onChange={setModelVersion} />
                    </div>
                    {mode !== "text-to-model" && (
                      <div>
                        <span className="field-label">模型朝向</span>
                        <Select value={orientation} options={orientationOptions} onChange={setOrientation} />
                      </div>
                    )}
                  </div>

                  <div className="compact-row">
                    <div>
                      <span className="field-label">纹理质量</span>
                      <Select value={textureQuality} options={textureQualityOptions} onChange={setTextureQuality} />
                    </div>
                    <div>
                      <span className="field-label">几何精度</span>
                      <Select
                        value={geometryQuality}
                        options={geometryQualityOptions}
                        onChange={setGeometryQuality}
                        disabled={mode !== "multiview-to-model" || !["P1-20260311", "v3.1-20260211", "v3.0-20250812"].includes(modelVersion)}
                      />
                    </div>
                  </div>

                  {mode === "multiview-to-model" && (
                    <div className="compact-row">
                      <div>
                        <span className="field-label">纹理对齐</span>
                        <Select value={textureAlignment} options={textureAlignmentOptions} onChange={setTextureAlignment} />
                      </div>
                      <div>
                        <span className="field-label">超清几何说明</span>
                        <div className="status-text">
                          仅 model_version 为 v3.0 / v3.1 / P1 时支持几何精度调节；选择 超清 会提交 geometry_quality=detailed。
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="field-label">Ultra Mode</span>
                    <div className="status-text">
                      {mode === "multiview-to-model"
                        ? "多视图转模支持 高清纹理 与 超清几何；仍然不会发送 faceLimit、quad、smart_low_poly、generate_parts。"
                        : "生成模式固定走 Ultra 几何质量，不再发送 faceLimit、quad、smart_low_poly、generate_parts。"}
                    </div>
                  </div>

                  <div className="switch-row">
                    <span>生成贴图</span>
                    <Switch checked={textureEnabled} onChange={setTextureEnabled} />
                  </div>
                  <div className="switch-row">
                    <span>PBR 材质</span>
                    <Switch checked={pbrEnabled} onChange={setPbrEnabled} />
                  </div>
                  <div className="switch-row">
                    <span>自动尺寸</span>
                    <Switch checked={autoSize} onChange={setAutoSize} />
                  </div>
                  {mode === "image-to-model" && (
                    <div className="switch-row">
                      <span>自动修复图片</span>
                      <Switch checked={enableImageAutofix} onChange={setEnableImageAutofix} />
                    </div>
                  )}
                </>
              )}

              {mode === "texture-model" && (
                <>
                  <div className="compact-row">
                    <div>
                      <span className="field-label">模型版本</span>
                      <Select value={modelVersion} options={generationModelVersionOptions} onChange={setModelVersion} />
                    </div>
                    <div>
                      <span className="field-label">贴图对齐方式</span>
                      <Select value={textureAlignment} options={textureAlignmentOptions} onChange={setTextureAlignment} />
                    </div>
                  </div>

                  <div>
                    <span className="field-label">贴图质量</span>
                    <Select value={textureQuality} options={textureQualityOptions} onChange={setTextureQuality} />
                  </div>

                  <div className="switch-row">
                    <span>生成贴图</span>
                    <Switch checked={textureEnabled} onChange={setTextureEnabled} />
                  </div>
                  <div className="switch-row">
                    <span>PBR 材质</span>
                    <Switch checked={pbrEnabled} onChange={setPbrEnabled} />
                  </div>
                  <div className="switch-row">
                    <span>烘焙贴图</span>
                    <Switch checked={bakeEnabled} onChange={setBakeEnabled} />
                  </div>
                </>
              )}

              {(mode === "mesh-segmentation" || mode === "mesh-completion") && (
                <div>
                  <span className="field-label">网格模型版本</span>
                  <Select value={meshModelVersion} options={meshModelVersionOptions} onChange={setMeshModelVersion} />
                </div>
              )}

              {mode === "highpoly-to-lowpoly" && (
                <>
                  <div className="compact-row">
                    <div>
                      <span className="field-label">低模版本</span>
                      <Select value={lowpolyModelVersion} options={lowpolyVersionOptions} onChange={setLowpolyModelVersion} />
                    </div>
                    <div>
                      <span className="field-label">面数上限</span>
                      <Input value={faceLimit} onChange={(event) => setFaceLimit(sanitizeFaceLimitInput(event.target.value, faceLimitRule))} placeholder={faceLimitRule.placeholder} />
                      <div className="status-text">{faceLimitRule.hint}</div>
                    </div>
                  </div>
                  <div className="switch-row">
                    <span>四边面输出</span>
                    <Switch checked={quadEnabled} onChange={setQuadEnabled} />
                  </div>
                  <div className="switch-row">
                    <span>烘焙贴图</span>
                    <Switch checked={bakeEnabled} onChange={setBakeEnabled} />
                  </div>
                </>
              )}

              {mode === "rig" && (
                <>
                  <div className="compact-row">
                    <div>
                      <span className="field-label">输出格式</span>
                      <Select value={rigOutFormat} options={rigOutFormatOptions} onChange={setRigOutFormat} />
                    </div>
                    <div>
                      <span className="field-label">绑定版本</span>
                      <Select value={rigModelVersion} options={rigModelVersionOptions} onChange={setRigModelVersion} />
                    </div>
                  </div>
                  <div className="compact-row">
                    <div>
                      <span className="field-label">骨骼类型</span>
                      <Select value={rigType} options={rigTypeOptions} onChange={setRigType} />
                    </div>
                    <div>
                      <span className="field-label">骨骼规范</span>
                      <Select value={rigSpec} options={rigSpecOptions} onChange={setRigSpec} />
                    </div>
                  </div>
                </>
              )}

              {mode === "retarget" && (
                <>
                  <div>
                    <span className="field-label">输出格式</span>
                    <Select value={rigOutFormat} options={rigOutFormatOptions} onChange={setRigOutFormat} />
                  </div>
                  <div className="switch-row">
                    <span>烘焙动画</span>
                    <Switch checked={bakeAnimation} onChange={setBakeAnimation} />
                  </div>
                  <div className="switch-row">
                    <span>导出几何体</span>
                    <Switch checked={exportWithGeometry} onChange={setExportWithGeometry} />
                  </div>
                  <div className="switch-row">
                    <span>原地动画</span>
                    <Switch checked={animateInPlace} onChange={setAnimateInPlace} />
                  </div>
                </>
              )}

              {mode === "convert-model" && (
                <>
                  <div className="compact-row">
                    <div>
                      <span className="field-label">导出格式</span>
                      <Select value={convertFormat} options={convertFormatOptions} onChange={setConvertFormat} />
                    </div>
                    <div>
                      <span className="field-label">面数上限</span>
                      <Input value={faceLimit} onChange={(event) => setFaceLimit(sanitizeFaceLimitInput(event.target.value, faceLimitRule))} placeholder={faceLimitRule.placeholder} />
                      <div className="status-text">{faceLimitRule.hint}</div>
                    </div>
                  </div>

                  <div className="compact-row">
                    <div>
                      <span className="field-label">贴图格式</span>
                      <Select value={textureFormat} options={textureFormatOptions} onChange={setTextureFormat} />
                    </div>
                    <div>
                      <span className="field-label">贴图尺寸</span>
                      <Input value={textureSize} onChange={(event) => setTextureSize(event.target.value.replace(/[^\d]/g, ""))} placeholder="例如 2048" />
                    </div>
                  </div>

                  <div className="compact-row">
                    <div>
                      <span className="field-label">缩放系数</span>
                      <Input value={scaleFactor} onChange={(event) => setScaleFactor(event.target.value.replace(/[^\d.]/g, ""))} placeholder="例如 1.0" />
                    </div>
                    <div>
                      <span className="field-label">导出朝向</span>
                      <Select value={exportOrientation} options={exportOrientationOptions} onChange={setExportOrientation} />
                    </div>
                  </div>

                  <div>
                    <span className="field-label">底部压平阈值</span>
                    <Input value={flattenBottomThreshold} onChange={(event) => setFlattenBottomThreshold(event.target.value.replace(/[^\d.]/g, ""))} placeholder="启用 Flatten Bottom 后可选" />
                  </div>

                  {convertFormat === "FBX" && (
                    <div>
                      <span className="field-label">FBX 预设</span>
                      <Select value={fbxPreset} options={fbxPresetOptions} onChange={setFbxPreset} />
                    </div>
                  )}

                  <div className="switch-row">
                    <span>四边面输出</span>
                    <Switch checked={quadEnabled} onChange={setQuadEnabled} />
                  </div>
                  <div className="switch-row">
                    <span>强制对称</span>
                    <Switch checked={forceSymmetry} onChange={setForceSymmetry} />
                  </div>
                  <div className="switch-row">
                    <span>压平底部</span>
                    <Switch checked={flattenBottom} onChange={setFlattenBottom} />
                  </div>
                  <div className="switch-row">
                    <span>枢轴居中到底部</span>
                    <Switch checked={pivotToCenterBottom} onChange={setPivotToCenterBottom} />
                  </div>
                  <div className="switch-row">
                    <span>包含动画</span>
                    <Switch checked={withAnimation} onChange={setWithAnimation} />
                  </div>
                  <div className="switch-row">
                    <span>打包 UV</span>
                    <Switch checked={packUv} onChange={setPackUv} />
                  </div>
                  <div className="switch-row">
                    <span>烘焙贴图</span>
                    <Switch checked={bakeEnabled} onChange={setBakeEnabled} />
                  </div>
                  <div className="switch-row">
                    <span>原地动画</span>
                    <Switch checked={animateInPlace} onChange={setAnimateInPlace} />
                  </div>
                  <div className="switch-row">
                    <span>导出顶点颜色</span>
                    <Switch checked={exportVertexColors} onChange={setExportVertexColors} />
                  </div>
                </>
              )}
            </div>
          </ControlSection>

          <ControlSection title="任务控制">
            <div className="field-stack">
              <Button disabled={!currentTaskId} onClick={() => setIsPolling(true)}>
                继续轮询当前任务
              </Button>
              <div className="status-card">
                <div className="field-label">运行状态</div>
                <div className="status-text">{statusText}</div>
              </div>
            </div>
          </ControlSection>

          {/* <ControlSection title="Tripo 诊断">
            <div className="field-stack">
              <Button loading={isCheckingConfig} onClick={() => void refreshTripoConfigStatus()}>
                检查 Tripo 配置
              </Button>
              <div className="status-card">
                <div className="field-label">配置状态</div>
                <div className="status-text">{getTripoConfigSummary(tripoConfigStatus)}</div>
                {tripoConfigStatus?.baseUrl && <div className="status-text">服务地址：{tripoConfigStatus.baseUrl}</div>}
                {tripoConfigStatus?.apiKeyPreview && <div className="status-text">当前 Key：{tripoConfigStatus.apiKeyPreview}</div>}
                {tripoConfigStatus?.statusCode ? <div className="status-text">响应状态：{tripoConfigStatus.statusCode}</div> : null}
                {tripoConfigStatus?.message && tripoConfigStatus.message !== "ok" ? <div className="status-text">详细信息：{tripoConfigStatus.message}</div> : null}
              </div>
            </div>
          </ControlSection> */}

          <ControlSection title="使用建议">
            <div className="helper-card">
              <div>1. 单图工作流建议先跑“生成多视图”，确认四视图可用后再转模型。</div>
              <div>2. 生成链路通常是 草模 → 精修 → 贴图 → 绑定/动作 → 转格式。</div>
              <div>3. 左侧已经内置 GLB 交互查看器，拿到模型后可以直接旋转检查结构。</div>
              <div>4. 动作预设建议从 preset:walk、preset:run、preset:idle 开始验证。</div>
            </div>
          </ControlSection>
        </UnifiedControlPanel>
        <div className="right-panel-footer">
          <UnifiedGenerateButton
            onClick={() => void submitTask()}
            isGenerating={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default TripoStudio;
