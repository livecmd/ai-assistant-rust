import React, { useState, useEffect, useMemo } from "react";
import { Slider, Modal } from "antd";
import {
  ModelType,
  AspectRatio,
  GenerationConfig,
  HistoryItem,
  UploadedImage,
} from "./types";
import { Settings2, Trash2, AlertCircle } from "lucide-react";
import { loadHistory, saveHistory, STORES } from "../../utils/indexedDB";

import { useTranslation } from "../../hooks/useTranslation";
import { generateImage } from "./services/geminiService";
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import { UnifiedHistory } from "../../components/shared/UnifiedHistory";
import {
  UnifiedControlPanel,
  ControlSection,
} from "../../components/shared/UnifiedControlPanel";
import { UnifiedGenerateButton } from "../../components/shared/UnifiedGenerateButton";
import {
  ImageCountSelector,
  ImageCount,
} from "../../components/shared/ImageCountSelector";
import { CommonModelSelector } from "../../components/shared/CommonModelSelector";
import { useModelCatalog } from "../../hooks/useModelCatalog";

import "./index.less";
const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: "auto",
    imageSize: "1K",
  });
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    ModelType.NANO_BANANA
  );
  const [isProKeySelected, setIsProKeySelected] = useState(true);
  const [currentOutput, setCurrentOutput] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCount, setImageCount] = useState<ImageCount>(1);
  const { getConfig, formatPriceSummary } = useModelCatalog({ category: "image", provider: "vertex" });

  const isProModel = selectedModel === ModelType.NANO_BANANA_PRO;
  const modelOptions = useMemo(() => {
	const options = [
	  {
		id: ModelType.NANO_BANANA,
		name: "Base",
		description: "快速图片生成",
		price: formatPriceSummary([ModelType.NANO_BANANA]),
	  },
	  {
		id: ModelType.NANO_BANANA_PRO,
		name: "Pro",
		description: "高质量图片生成",
		price: formatPriceSummary(["gemini-3-pro-image-preview-1k-2k", "gemini-3-pro-image-preview-4k"]),
	  },
	];
	const enabled = options.filter((item) => getConfig(item.id));
	return enabled.length > 0 ? enabled : options;
  }, [formatPriceSummary, getConfig]);
  const resolutionOptions = ["1K", "2K", "4K"] as const;

  useEffect(() => {
	if (modelOptions.length > 0 && !modelOptions.some((item) => item.id === selectedModel)) {
		setSelectedModel(modelOptions[0].id as ModelType);
	}
  }, [modelOptions, selectedModel]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(t("genai.providePromptOrImage"));
      return;
    }

    if (selectedModel === ModelType.NANO_BANANA_PRO && !isProKeySelected) {
      setError(t("genai.proModelRequiresKey"));
      return;
    }

    setIsGenerating(true);
    setError(null);

    let settledCount = 0;
    let errorCount = 0;
    let hasResult = false;

    const onSettled = () => {
      settledCount++;
      if (settledCount === imageCount) {
        setIsGenerating(false);
        if (!hasResult) {
          setError("Generation process failed");
        } else if (errorCount > 0) {
          setError(`${errorCount} of ${imageCount} requests failed.`);
        }
      }
    };

    for (let i = 0; i < imageCount; i++) {
      generateImage(prompt, selectedModel, uploadedImages, config)
        .then((resultUrl) => {
          if (!hasResult) {
            setCurrentOutput(resultUrl);
          }
          hasResult = true;
          const newItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            url: resultUrl,
            prompt: prompt || "Image-to-Image Generation",
            model: selectedModel,
            timestamp: Date.now(),
            config:
              selectedModel === ModelType.NANO_BANANA_PRO ? config : undefined,
          };
          setHistory((prev) => [newItem, ...prev]);
          onSettled();
        })
        .catch((err: any) => {
          errorCount++;
          console.error("Request failed:", err);
          if (err.message?.includes("Requested entity was not found")) {
            setIsProKeySelected(false);
          }
          onSettled();
        });
    }
  };

  useEffect(() => {
    if (history.length > 0) {
      saveHistory(STORES.GENAI_IMAGE_STUDIO, history, 50).catch((error) => {
        console.error("Failed to save history to IndexedDB:", error);
      });
    }
  }, [history]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUploadedImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            base64: base64String,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeUploadedImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        const savedHistory = await loadHistory<HistoryItem>(
          STORES.GENAI_IMAGE_STUDIO
        );
        if (savedHistory && savedHistory.length > 0) {
          setHistory(savedHistory);
        }
      } catch (error) {
        console.error("Failed to load history from IndexedDB:", error);
      }
    };
    loadHistoryData();
  }, []);
  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete history item
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      // If we deleted the currently shown image, clear it
      const deletedItem = prev.find((item) => item.id === id);
      if (deletedItem && currentOutput === deletedItem.url) {
        setCurrentOutput(null);
      }
      return newHistory;
    });
  };

  return (
    <div className="genAIImageStudio">
      <div className="left">
        <UnifiedPreview
          type="image"
          src={currentOutput}
          isLoading={isGenerating && !currentOutput}
          emptyText="城市交通的未来"
          emptySubtext="概念电动滑板车设计作品集"
          onDownload={() =>
            currentOutput &&
            downloadImage(currentOutput, `generated-${Date.now()}.png`)
          }
        />

        <UnifiedHistory
          items={history
            .map((item) => ({
              id: item.id,
              thumbnail: item.url,
              type: "image" as const,
              label: item.prompt,
              isActive: currentOutput === item.url,
              timestamp: item.timestamp,
              onClick: () => { },
            }))
            .sort((a, b) => b.timestamp - a.timestamp)}
          activeId={history.find((h) => h.url === currentOutput)?.id}
          onSelect={(id) => {
            const item = history.find((h) => h.id === id);
            if (item) setCurrentOutput(item.url);
          }}
          onDelete={handleDeleteHistory}
          title="HISTORY"
        />
      </div>
      <div className="right right-panel-shell">
        <div className="right-panel-header text-center md:text-left">
          <h1>{"万能图片生成"}</h1>
          <p>{"Universal picture generation"}</p>
        </div>
        <UnifiedControlPanel className="flex-1 action-box">
          <ControlSection title="上传图片(Upload Images)">
            <div className="icon mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#e8f3ff] file:text-[#1677ff] hover:file:bg-[#d7eaff] transition-colors cursor-pointer"
              />
              {uploadedImages.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-500 group"
                    >
                      <img
                        src={img.base64}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeUploadedImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center pointer-events-none">
                  <svg
                    className="w-10 h-10 mb-3 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">
                    点击上传图片(Click or drag to upload)
                  </p>
                </div>
              )}
            </div>
          </ControlSection>

          <ControlSection title="提示词(Prompt)">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. Matte charceal with nion blue trim..."
              className="prompt-textarea w-full h-32 p-4 rounded-2xl border focus:ring-2 focus:ring-[#1677ff] focus:border-transparent outline-none transition-all resize-none text-sm"
            />
          </ControlSection>

          <ControlSection title="模型选择(Model Selection)">
            <CommonModelSelector
              selectedModel={selectedModel}
              onSelect={(id) => setSelectedModel(id as ModelType)}
              models={modelOptions}
            />
          </ControlSection>

          {isProModel && (
            <ControlSection title="Aspect Ratio & Resolution">
              <div className="space-y-2">
                <label className="genai-field-label text-xs font-bold tracking-wider flex justify-between">
                  长宽比(Aspect Ratio)
                </label>
                <div className="sizes flex flex-wrap gap-2">
                  {(
                    [
                      "auto",
                      "1:1",
                      "3:4",
                      "4:3",
                      "9:16",
                      "16:9",
                    ] as AspectRatio[]
                  ).map((ratio) => (
                    <button
                      type="button"
                      className={`genai-ratio-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${config.aspectRatio === ratio
                        ? "active"
                        : ""
                        }`}
                      key={ratio}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, aspectRatio: ratio }))
                      }
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-4"></div>

              <div className="space-y-2">
                <label className="genai-field-label text-xs font-bold tracking-wider flex justify-between">
                  Resolution
                </label>
                <div className="genai-resolution-bar flex p-1 rounded-lg border">
                  {resolutionOptions.map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, imageSize: res }))
                      }
                      className={`genai-resolution-btn flex-1 py-1.5 text-xs font-medium rounded-md border transition-all ${config.imageSize === res
                        ? "active"
                        : ""
                        }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </ControlSection>
          )}

          {/* <ControlSection title="Settings">
                        <div className='slider flex items-center gap-4'>
                            <Slider className="flex-1" />
                            <button
                                className='p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors'
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Settings2 size={20} className="text-slate-400" />
                            </button>
                        </div>
                    </ControlSection> */}

          <ControlSection title="生成数量(Generate quantity)">
            <ImageCountSelector
              value={imageCount}
              onChange={setImageCount}
              disabled={isGenerating}
              label=""
            />
          </ControlSection>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </UnifiedControlPanel>
        <div className="right-panel-footer">
          <UnifiedGenerateButton
            onClick={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      <Modal
        title="Basic Modal"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
      ></Modal>
    </div>
  );
};
export default App;
