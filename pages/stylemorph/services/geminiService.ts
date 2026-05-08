import { assistantPost, normalizeAssistantMediaUrl } from "@/api/assistant";
import { GenerationConfig, Rect, Point } from "../types";

/**
 * Maps a numerical aspect ratio to the closest supported Gemini aspect ratio string.
 */
function getClosestSupportedRatio(width: number, height: number): string {
  const target = width / height;
  const supported = [
    { name: "1:1", value: 1 / 1 },
    { name: "16:9", value: 16 / 9 },
    { name: "9:16", value: 9 / 16 },
    { name: "4:3", value: 4 / 3 },
    { name: "3:4", value: 3 / 4 },
  ];

  let closest = supported[0];
  let minDiff = Math.abs(target - closest.value);

  for (let i = 1; i < supported.length; i++) {
    const diff = Math.abs(target - supported[i].value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = supported[i];
    }
  }
  return closest.name;
}

async function singleGenerate(
  imageA: string,
  imageB: string,
  config: GenerationConfig,
  prompt: string,
  calculatedRatio: string
): Promise<string> {
  const data = await assistantPost<{ images: string[] }>("/api/ai/image/stylemorph", {
    imageA,
    imageB,
    config: {
      ...config,
      aspectRatio: calculatedRatio,
      batchSize: 1,
    },
    widthA: 0,
    heightA: 0,
  });

  if (!data.images.length) {
    throw new Error("模型未返回生成的图像。");
  }

  return normalizeAssistantMediaUrl(data.images[0]);
}

export async function generateSingleMorph(
  imageA: string,
  imageB: string,
  config: GenerationConfig,
  widthA: number = 1000,
  heightA: number = 1000,
  maskA?: Rect | null,
  lassoPathA?: Point[] | null,
  maskB?: Rect | null,
  lassoPathB?: Point[] | null
): Promise<string> {
  try {
    const data = await assistantPost<{ images: string[] }>("/api/ai/image/stylemorph", {
      imageA,
      imageB,
      config: {
        ...config,
        batchSize: 1,
      },
      widthA,
      heightA,
      maskA,
      lassoPathA,
      maskB,
      lassoPathB,
    });

    if (!data.images.length) {
      throw new Error("模型未返回生成的图像。");
    }

    return normalizeAssistantMediaUrl(data.images[0]);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("PRO_KEY_ERROR");
    }
    throw error;
  }
}

export async function generateMorph(
  imageA: string,
  imageB: string,
  config: GenerationConfig,
  widthA: number = 1000,
  heightA: number = 1000,
  maskA?: Rect | null,
  lassoPathA?: Point[] | null,
  maskB?: Rect | null,
  lassoPathB?: Point[] | null
): Promise<string[]> {
  const hasSelectionA = !!(maskA || (lassoPathA && lassoPathA.length > 2));

  // Weight Logic: Shape evolution intensity
  const weightDescription = config.weight < 25
    ? "微弱形态融合：仅在结构图 A 的选区内引入极少量参考图 B 的几何细节。"
    : config.weight < 50
      ? "均衡设计融合：将 A 的主结构与 B 的次要设计语言（如圆角、切线）结合。"
      : config.weight < 75
        ? "深度造型重构：使用参考图 B 的设计逻辑和形态基因大规模重塑选区内的几何形状。"
        : "彻底造型重塑：完全采用参考图 B 的造型方案，将 A 的选区内容替换为全新的 B 式结构。";

  // Structural Control Logic (Higher = Weaker Control)
  const depthDescription = config.structuralDepth < 30
    ? "强力结构保留：必须严格维持图 A 选区的原始物理轮廓。造型修改只能在内部发生。"
    : config.structuralDepth < 70
      ? "动态结构适配：尊重图 A 的大体量，但允许边缘和几何体进行形变以契合图 B 的流动感。"
      : "结构自由释放：图 A 的轮廓仅作占位参考，允许 AI 根据图 B 的基因进行大幅度的几何创造。";

  let selectionAreaA = "结构图 A 的全局区域。";
  if (lassoPathA && lassoPathA.length > 2) {
    selectionAreaA = "结构图 A 中套索工具勾选的不规则局部区域。";
  } else if (maskA) {
    selectionAreaA = "结构图 A 中矩形选框所覆盖的局部区域。";
  }

  const prompt = `
    角色：资深工业设计可视化专家。
    任务：将参考图 B 的【造型方案】合理融合到结构图 A 的【指定区域】上。

    核心设计准则：
    1. 【造型优先，忽略颜色】：从参考图 B 中提取几何语言、圆角半径、分件线、特征孔位等造型方案。必须严格忽略图 B 的所有颜色、材质、贴图（CMF）。
    2. 【匹配图 A 的 CMF】：生成的内容必须在颜色（Color）、材质（Material）、表面处理（Finish）以及环境光效上，与结构图 A 保持 100% 的视觉统一。
    3. 【局部重绘严苛边界】：
       - 目标选区：${selectionAreaA}
       ${hasSelectionA ? `
       - 像素级锁定：选区之外的结构图 A 区域必须保持原样，严禁发生任何像素偏移或改变。
       - 无缝融合：选区内部的新造型必须与选区外部的原始部分在色彩、光影和物理结构上实现像素级的自然融合与过渡。
       ` : "对整体对象进行造型重塑，但需保持原始背景环境。"}

    设计参数控制：
    - 结构保留深度 (${100 - config.structuralDepth}% 强度)：${depthDescription}
    - 造型迁移权重 (${config.weight}% 强度)：${weightDescription}
    
    技术要求：
    - 分辨率：${config.imageSize}。
    - 比例适配：${config.aspectRatio === 'AUTO' ? getClosestSupportedRatio(widthA, heightA) : config.aspectRatio}。
    - 结果必须是极致真实的、专业级的工业渲染图，严禁出现任何水印、UI 标记或噪点。
    ${config.refinementPrompt ? `- 额外修正指令：${config.refinementPrompt}` : ""}
  `;

  try {
    const data = await assistantPost<{ images: string[] }>("/api/ai/image/stylemorph", {
      imageA,
      imageB,
      config,
      widthA,
      heightA,
      maskA,
      lassoPathA,
      maskB,
      lassoPathB,
    });

    return data.images.map(normalizeAssistantMediaUrl);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    // Forward the specific error message to the UI
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("PRO_KEY_ERROR");
    }
    throw error;
  }
}
