import React, { useEffect, useMemo } from "react";
import FileUpload from "./FileUpload";
import {
  AppState,
  ModelType,
  AspectRatio,
  ImageSize,
  GenerationConfig,
} from "../types";
import { useTranslation } from "../../../hooks/useTranslation";
import { ControlSection, UnifiedControlPanel } from "../../../components/shared/UnifiedControlPanel";
import { UnifiedGenerateButton } from "../../../components/shared/UnifiedGenerateButton";
import { CommonModelSelector } from "../../../components/shared/CommonModelSelector";
import { CommonAspectRatioSelector } from "../../../components/shared/CommonAspectRatioSelector";
import {
  ImageCountSelector,
  ImageCount,
} from "../../../components/shared/ImageCountSelector";
import { useModelCatalog } from "../../../hooks/useModelCatalog";

type WorkMode = "material" | "shape";

interface ControlPanelProps {
  mode: WorkMode;
  setMode: (m: WorkMode) => void;
  imageA: string | null;
  setImageA: (img: string | null) => void;
  handleUploadA: (file: File) => void;
  imageB: string | null;
  setImageB: (img: string | null) => void;
  handleUploadB: (file: File) => void;
  productName: string;
  setProductName: (val: string) => void;
  stylePrompt: string;
  setStylePrompt: (val: string) => void;
  strength: number;
  setStrength: (val: number) => void;
  selectedModel: ModelType;
  setSelectedModel: (m: ModelType) => void;
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  appState: AppState;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  onGenerate: () => void;
  imageCount: ImageCount;
  setImageCount: (count: ImageCount) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  setMode,
  imageA,
  setImageA,
  handleUploadA,
  imageB,
  setImageB,
  handleUploadB,
  productName,
  setProductName,
  stylePrompt,
  setStylePrompt,
  strength,
  setStrength,
  selectedModel,
  setSelectedModel,
  config,
  setConfig,
  appState,
  errorMessage,
  setErrorMessage,
  onGenerate,
  imageCount,
  setImageCount,
}) => {
  const { getConfig, formatPriceSummary } = useModelCatalog({ category: "image", provider: "vertex" });
  const modelOptions = useMemo(() => {
  const options = [
    { id: ModelType.NANO_BANANA, name: getConfig(ModelType.NANO_BANANA)?.display_name || "2.5 Image", description: "快速图片生成", price: formatPriceSummary([ModelType.NANO_BANANA]) },
    { id: ModelType.NANO_BANANA_PRO, name: getConfig(ModelType.NANO_BANANA_PRO)?.display_name || "3.0 Pro Image", description: "高质量图片生成", price: formatPriceSummary(["gemini-3-pro-image-preview-1k-2k", "gemini-3-pro-image-preview-4k"]) },
  ];
  const enabled = options.filter((item) => getConfig(item.id));
  return enabled.length > 0 ? enabled : options;
  }, [formatPriceSummary, getConfig]);

  useEffect(() => {
  if (!modelOptions.some((item) => item.id === selectedModel) && modelOptions.length > 0) {
    setSelectedModel(modelOptions[0].id as ModelType);
  }
  }, [modelOptions, selectedModel, setSelectedModel]);
  const { t } = useTranslation();
  const isGenerating = appState === AppState.GENERATING;
  const isAnalyzing = appState === AppState.ANALYZING;

  return (
    <div className="flex flex-col gap-6 medecal-ControlPanel">
      <UnifiedControlPanel className="flex-1 action-box">
        {/* Title */}
        {errorMessage && (
          <div className="shrink-0 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
            <span className="text-red-200 text-sm font-medium">
              {errorMessage}
            </span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mode Switch */}
        <ControlSection>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
            <button
              onClick={() => setMode("material")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "material"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {t("material.materialAndRender")}
            </button>
            <button
              onClick={() => setMode("shape")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "shape"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {t("material.shapeAndRedesign")}
            </button>
          </div>
        </ControlSection>

        {/* Uploads */}
        <ControlSection>
          <div className="flex gap-4">
            <FileUpload
              label={
                mode === "material"
                  ? t("material.sketchMold")
                  : t("material.productBase")
              }
              // subLabel={t("material.structure")}
              image={imageA}
              onUpload={handleUploadA}
            />
            <FileUpload
              label={
                mode === "material"
                  ? t("material.styleRef")
                  : t("material.shapeRef")
              }
              // subLabel={t("material.aesthetic")}
              image={imageB}
              onUpload={handleUploadB}
            />
          </div>
        </ControlSection>

        {/* Inputs */}
        <ControlSection>
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 tracking-widest block mb-2">
                {t("material.subjectName")}
              </label>
              <input
                type="text"
                placeholder={t("material.subjectPlaceholder")}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
              />
            </div>

            <div className="flex-1 flex flex-col gap-2 min-h-0">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 tracking-widest">
                  {t("material.designSummary")}
                </label>
                {isAnalyzing && (
                  <span className="text-xs text-indigo-400 animate-pulse">
                    {t("material.analyzing")}
                  </span>
                )}
              </div>
              <textarea
                className="w-full flex-1 min-h-[80px] bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed text-white"
                placeholder={t("material.designPlaceholder")}
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 tracking-widest">
                <span>{t("material.originalStructure")}</span>
                <span>
                  {t("material.aiInfluenceLabel")} ({strength}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </ControlSection>

        <ControlSection title={t("material.modelConfiguration")}>
          <CommonModelSelector
            selectedModel={selectedModel}
            onSelect={(m) => setSelectedModel(m as ModelType)}
            models={modelOptions}
          />

          {selectedModel === ModelType.NANO_BANANA_PRO && (
            <div className="mt-4 space-y-4 pt-4 border-t border-slate-700">
              <CommonAspectRatioSelector
                selectedRatio={config.aspectRatio as any}
                onSelect={(r) =>
                  setConfig((prev) => ({ ...prev, aspectRatio: r as any }))
                }
                options={["auto", "1:1", "3:4", "4:3", "9:16", "16:9"]}
              />
              <div>
                <label className="text-xs font-bold text-slate-300 tracking-wider mb-2 block">
                  图像分辨率(Image Resolution)
                </label>
                <div className="flex gap-2">
                  {(["1K", "2K", "4K"] as ImageSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, imageSize: size }))
                      }
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${config.imageSize === size
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-800 text-slate-400 border-slate-600 hover:border-indigo-400"
                        }`}
                    >
                      <span className="capitalize">{size}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ControlSection>

        <ControlSection title="生成数量(Generate quantity)">
          <ImageCountSelector
            value={imageCount}
            onChange={setImageCount}
            disabled={isGenerating}
            label=""
          />
        </ControlSection>
      </UnifiedControlPanel>
      <UnifiedGenerateButton
        onClick={onGenerate}
        disabled={isGenerating}
        isGenerating={isGenerating}
        label={
          isGenerating
            ? t("material.processing")
            : t("material.generateNewDesign")
        }
      />
    </div>
  );
};
