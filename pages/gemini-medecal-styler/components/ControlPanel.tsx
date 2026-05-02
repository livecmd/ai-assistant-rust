import React, { useEffect, useMemo } from "react";
import FileUpload from "./FileUpload";
import {
  AppState,
  ModelType,
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
      { id: ModelType.NANO_BANANA, name: "Base", description: "快速图片生成", price: formatPriceSummary([ModelType.NANO_BANANA]) },
      { id: ModelType.NANO_BANANA_PRO, name: "Pro", description: "高质量图片生成", price: formatPriceSummary(["gemini-3-pro-image-preview-1k-2k", "gemini-3-pro-image-preview-4k"]) },
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
    <div className="panel-stack medecal-ControlPanel">
      <UnifiedControlPanel className="flex-1 action-box">
        {/* Title */}
        {errorMessage && (
          <div className="shrink-0 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
            <span className="text-red-600 text-sm font-medium">
              {errorMessage}
            </span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mode Switch */}
        <ControlSection>
          <div className="medecal-mode-switch flex bg-[#edf2f7] p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setMode("material")}
              className={`medecal-mode-button flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "material"
                ? "bg-[#1677ff] text-white shadow-lg"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {t("material.materialAndRender")}
            </button>
            <button
              onClick={() => setMode("shape")}
              className={`medecal-mode-button flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "shape"
                ? "bg-[#1677ff] text-white shadow-lg"
                : "text-slate-500 hover:text-slate-800"
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
          <div className="flex flex-col gap-5 medecal-fields">
            <div className="medecal-field">
              <label className="medecal-field-label text-xs font-bold text-slate-500 tracking-widest block mb-2">
                {t("material.subjectName")}
              </label>
              <input
                type="text"
                placeholder={t("material.subjectPlaceholder")}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="medecal-field-input w-full bg-[#f5f7fb] border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#1677ff] outline-none text-slate-700"
              />
            </div>

            <div className="medecal-field flex-1 flex flex-col gap-2 min-h-0">
              <div className="flex justify-between items-center">
                <label className="medecal-field-label text-xs font-bold text-slate-500 tracking-widest">
                  {t("material.designSummary")}
                </label>
                {isAnalyzing && (
                  <span className="text-xs text-[#1677ff] animate-pulse">
                    {t("material.analyzing")}
                  </span>
                )}
              </div>
              <textarea
                className="medecal-field-input medecal-field-textarea w-full flex-1 min-h-[96px] bg-[#f5f7fb] border border-slate-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-[#1677ff] outline-none leading-relaxed text-slate-700"
                placeholder={t("material.designPlaceholder")}
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
              />
            </div>

            <div className="medecal-field">
              <div className="medecal-range-labels flex justify-between text-xs font-bold text-slate-500 mb-2 tracking-widest">
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1677ff]"
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
            <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
              <CommonAspectRatioSelector
                selectedRatio={config.aspectRatio as any}
                onSelect={(r) =>
                  setConfig((prev) => ({ ...prev, aspectRatio: r as any }))
                }
                options={["auto", "1:1", "3:4", "4:3", "9:16", "16:9"]}
              />
              <div>
                <label className="text-xs font-bold text-slate-600 tracking-wider mb-2 block">
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
                        ? "bg-[#1677ff] text-white border-[#1677ff]"
                        : "bg-[#f5f7fb] text-slate-500 border-slate-200 hover:border-[#1677ff] hover:text-[#1677ff]"
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
      />
    </div>
  );
};
