import React, { useEffect, useMemo } from "react";
import { ImageUploader } from "./ImageUploader";
import { Slider } from "./Slider";
import { UploadedImage, ModelType, GenerationImgConfig } from "../types";
import { useTranslation } from "../../../hooks/useTranslation";
import { ControlSection, UnifiedControlPanel } from "../../../components/shared/UnifiedControlPanel";
import { UnifiedGenerateButton } from "../../../components/shared/UnifiedGenerateButton";
import {
  ImageCountSelector,
  ImageCount,
} from "../../../components/shared/ImageCountSelector";
import { CommonModelSelector } from "../../../components/shared/CommonModelSelector";
import { CommonAspectRatioSelector } from "../../../components/shared/CommonAspectRatioSelector";
import { useModelCatalog } from "../../../hooks/useModelCatalog";

interface ControlPanelProps {
  targetImage: UploadedImage | null;
  setTargetImage: (img: UploadedImage | null) => void;
  refImage: UploadedImage | null;
  setRefImage: (img: UploadedImage | null) => void;
  adherenceLevel: number;
  setAdherenceLevel: (val: number) => void;
  feedback: string;
  setFeedback: (val: string) => void;
  onGenerate: () => void;
  isProcessing: boolean;
  imageCount: ImageCount;
  setImageCount: (count: ImageCount) => void;
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
  config: GenerationImgConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationImgConfig>>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  targetImage,
  setTargetImage,
  refImage,
  setRefImage,
  adherenceLevel,
  setAdherenceLevel,
  feedback,
  setFeedback,
  onGenerate,
  isProcessing,
  imageCount,
  setImageCount,
  selectedModel,
  setSelectedModel,
  config,
  setConfig,
}) => {
  const { t } = useTranslation();
  const { getConfig, formatPriceSummary } = useModelCatalog({ category: "image", provider: "vertex" });

  const isPro = selectedModel === ModelType.NANO_BANANA_PRO;
  const models = useMemo(() => {
    const options = [
    { id: ModelType.NANO_BANANA, name: getConfig(ModelType.NANO_BANANA)?.display_name || "2.5 Image", description: "快速图片生成", price: formatPriceSummary([ModelType.NANO_BANANA]) },
    { id: ModelType.NANO_BANANA_PRO, name: getConfig(ModelType.NANO_BANANA_PRO)?.display_name || "3.0 Pro Image", description: "高质量图片生成", price: formatPriceSummary(["gemini-3-pro-image-preview-1k-2k", "gemini-3-pro-image-preview-4k"]) },
    ];
    const enabled = options.filter((item) => getConfig(item.id));
    return enabled.length > 0 ? enabled : options;
  }, [formatPriceSummary, getConfig]);

  useEffect(() => {
    if (!models.some((item) => item.id === selectedModel) && models.length > 0) {
    setSelectedModel(models[0].id as ModelType);
    }
  }, [models, selectedModel, setSelectedModel]);

  const resolutionOptions = ["1K", "2K", "4K"] as const;

  return (
    <div className="panel-stack cmfai-ControlPanel">
      <UnifiedControlPanel className="flex-1 action-box">
        <ControlSection>
          <div className="flex gap-3">
            <ImageUploader
              id="ref-upload"
              label={t("cmf.uploadRef")}
              image={refImage}
              onImageChange={setRefImage}
              onRemove={() => setRefImage(null)}
            />
            <ImageUploader
              id="target-upload"
              label={t("cmf.uploadTarget")}
              image={targetImage}
              onImageChange={setTargetImage}
              onRemove={() => setTargetImage(null)}
            />
          </div>
        </ControlSection>

        {/* Model Selection */}
        <ControlSection>
          <CommonModelSelector
            selectedModel={selectedModel}
            onSelect={(id) => setSelectedModel(id as ModelType)}
            models={models}
          />
        </ControlSection>

        {/* Aspect Ratio & Resolution (Pro only) */}
        {isPro && (
          <ControlSection>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 tracking-wider flex justify-between">
                ASPECT RATIO
              </label>
              <div className="flex flex-wrap gap-2">
                {["auto", "1:1", "3:4", "4:3", "9:16", "16:9"].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        aspectRatio: ratio as any,
                      }))
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${config.aspectRatio === ratio
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-500"
                      }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4"></div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 tracking-wider flex justify-between">
                Resolution
              </label>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                {resolutionOptions.map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, imageSize: res }))
                    }
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${config.imageSize === res
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </ControlSection>
        )}

        <ControlSection title={t("cmf.paramAdjustment")}>
          <Slider
            value={adherenceLevel}
            onChange={setAdherenceLevel}
            disabled={isProcessing}
          />
        </ControlSection>

        <ControlSection title={t("cmf.feedback")}>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t("cmf.feedbackPlaceholder")}
            className="cmf-feedback-textarea w-full rounded-lg p-3 text-xs outline-none resize-none h-20"
            disabled={isProcessing}
          />
        </ControlSection>

        <ControlSection title="生成数量(Generate quantity)">
          <ImageCountSelector
            value={imageCount}
            onChange={setImageCount}
            disabled={isProcessing}
            label=""
          />
        </ControlSection>
      </UnifiedControlPanel>
      <UnifiedGenerateButton
        onClick={onGenerate}
        disabled={!targetImage || !refImage || isProcessing}
        isGenerating={isProcessing}
        label={isProcessing ? t("cmf.generating") : t("cmf.startGenerate")}
      />
    </div>
  );
};
