import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  AspectRatio,
  CameraParams,
  GenerationConfig,
  ImageSize,
  ModelType,
} from "../types";
import { useTranslation } from "../../../hooks/useTranslation";
import {
  ControlSection,
  UnifiedControlPanel,
} from "../../../components/shared/UnifiedControlPanel";
import { UnifiedGenerateButton } from "../../../components/shared/UnifiedGenerateButton";
import { CommonModelSelector } from "../../../components/shared/CommonModelSelector";
import { CommonAspectRatioSelector } from "../../../components/shared/CommonAspectRatioSelector";
import {
  ImageCountSelector,
  ImageCount,
} from "../../../components/shared/ImageCountSelector";
import { PlusIcon, XMarkIcon } from "../../veo-studio/components/icons"; // Re-use icons or lucide
import InteractiveCube from "./InteractiveCube";
import { useModelCatalog } from "../../../hooks/useModelCatalog";

interface ControlPanelProps {
  params: CameraParams;
  setParams: React.Dispatch<React.SetStateAction<CameraParams>>;
  onExecute: (
    selectedModel: ModelType,
    config: GenerationConfig,
    imageCount: ImageCount
  ) => void;
  isGenerating: boolean;
  inputImage: string | null;
  setInputImage: React.Dispatch<React.SetStateAction<string | null>>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  setParams,
  onExecute,
  isGenerating,
  inputImage,
  setInputImage,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    ModelType.NANO_BANANA
  );
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: "auto",
    imageSize: "1K",
  });
  const [imageCount, setImageCount] = useState<ImageCount>(1);
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
  }, [modelOptions, selectedModel]);

  // Helper to read file and set state
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setInputImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Global Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            readFile(file);
            e.preventDefault();
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [setInputImage]);

  const handleBoxClick = () => {
    if (!inputImage) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      readFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted_image", { type: imageType });
          readFile(file);
          return;
        }
      }
      alert(t("camera.clipboardNoImage" as any));
    } catch (err) {
      console.error("Clipboard access failed:", err);
      alert(t("camera.clipboardAccessFailed" as any));
    }
  };

  return (
    <div className="panel-stack relative camera-control">
      <UnifiedControlPanel className="flex-1 action-box">
        {/* 01. Input Source */}
        <ControlSection title={`01. ${t("camera.inputSource")}`}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <div
            onClick={handleBoxClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`camera-upload-surface relative flex h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${inputImage ? "has-image" : ""
              }`}
          >
            {inputImage ? (
              <>
                <img
                  src={inputImage}
                  alt="Input"
                  className="w-full h-full object-contain opacity-80"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="camera-upload-empty-state flex flex-col items-center gap-2">
                <PlusIcon className="w-6 h-6 opacity-50" />
                <span className="text-xs font-bold uppercase">
                  {t("camera.uploadAsset")}
                </span>
                {/* <button
                  onClick={handlePasteClick}
                  className="mt-2 px-2 py-1 text-[10px] border border-slate-600 rounded bg-slate-800 hover:bg-slate-700 hover:border-indigo-400 transition-all uppercase"
                >
                  {t("camera.pasteClipboard")}
                </button> */}
              </div>
            )}
          </div>
        </ControlSection>

        {/* Interactive 3D Cube */}
        <div className="cube-container">
          <InteractiveCube params={params} setParams={setParams} />
        </div>

        {/* 02. Model & Settings */}
        <ControlSection title={`02. ${t("camera.modelConfig")}`}>
          <CommonModelSelector
            selectedModel={selectedModel}
            onSelect={(m) => setSelectedModel(m as ModelType)}
            models={modelOptions}
          />

          {selectedModel === ModelType.NANO_BANANA_PRO && (
            <div className="camera-pro-settings mt-4 space-y-4 pt-4">
              <CommonAspectRatioSelector
                selectedRatio={config.aspectRatio as any} // Cast to any because type defs might differ slightly
                onSelect={(r) =>
                  setConfig((prev) => ({ ...prev, aspectRatio: r as any }))
                }
                options={["auto", "1:1", "3:4", "4:3", "9:16", "16:9"]}
                label={t("genai.aspectRatio")}
              />

              <div>
                <label className="common-field-label mb-2 block">
                  {t("genai.imageResolution")}
                </label>
                <div className="common-segmented-bar flex gap-2">
                  {(["1K", "2K", "4K"] as ImageSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, imageSize: size }))
                      }
                      className={`common-segmented-option flex-1 rounded border px-2 py-1 text-xs ${config.imageSize === size
                        ? "is-selected"
                        : ""
                        }`}
                    >
                      {size}
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
        onClick={() => onExecute(selectedModel, config, imageCount)}
        disabled={isGenerating}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default ControlPanel;
