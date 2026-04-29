import React, { useState, useEffect } from "react";
import {
  ModelVersion,
  AspectRatio,
  ImageResolution,
  GenerationConfig,
  ThinkingMode,
  HistoryItem,
} from "./types";
import { generateColorizedImage } from "./services/geminiService";
import ImageUpload from "./components/ImageUpload";
import ControlPanel from "./components/ControlPanel";
import { loadHistory, saveHistory, STORES } from "../../utils/indexedDB";
import { useTranslation } from "../../hooks/useTranslation";
import { ImageCount } from "../../components/shared/ImageCountSelector";
import "./index.less";

// Shared Components Import
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import {
  UnifiedHistory,
  HistoryItemProps,
} from "../../components/shared/UnifiedHistory";
import { UnifiedGenerateButton } from "@/components/shared/UnifiedGenerateButton";

// Global types for window extension
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const App: React.FC = () => {
  const { t } = useTranslation();
  // State for images
  const [lineArt, setLineArt] = useState<string | null>(null);
  const [styleRef, setStyleRef] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // State for History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // State for logic
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration State
  const [config, setConfig] = useState<GenerationConfig>({
    model: ModelVersion.FLASH,
    aspectRatio: AspectRatio.SQUARE,
    resolution: ImageResolution.RES_1K,
    prompt: "",
    thinkingMode: ThinkingMode.FAST,
    apiKey: "",
  });
  const [imageCount, setImageCount] = useState<ImageCount>(1);

  // Load history from IndexedDB
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        const savedHistory = await loadHistory<HistoryItem>(
          STORES.AI_LINE_ART_COLORIZER
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

  // Save history to IndexedDB whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      saveHistory(STORES.AI_LINE_ART_COLORIZER, history, 50).catch((error) => {
        console.error("Failed to save history to IndexedDB:", error);
      });
    }
  }, [history]);

  const handleGenerate = async () => {
    if (!lineArt) return;

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      let results: PromiseSettledResult<string>[];

      if (config.model === ModelVersion.FLASH && imageCount > 1) {
        results = [];

        for (let index = 0; index < imageCount; index += 1) {
          try {
            const generatedImage = await generateColorizedImage(lineArt, styleRef, config);
            results.push({ status: "fulfilled", value: generatedImage });
          } catch (reason) {
            results.push({ status: "rejected", reason });
          }

          if (index < imageCount - 1) {
            await sleep(600);
          }
        }
      } else {
        const generatePromises = Array.from({ length: imageCount }).map(() =>
          generateColorizedImage(lineArt, styleRef, config)
        );

        results = await Promise.allSettled(generatePromises);
      }

      // Separate successful and failed results
      const successfulResults: string[] = [];
      let errorCount = 0;

      // results.forEach((result) => {
      //   if (result.status === "fulfilled") {
      //     successfulResults.push(result.value); // Successful result
      //   } else {
      //     errorCount++; // Failed request count
      //     console.error("Request failed:", result.reason);
      //   }
      // });

      for (const result of results) {
        if (result.status === "fulfilled") {
          successfulResults.push(result.value); // 成功的结果
        } else {
          errorCount++; // 失败的请求数量
          console.error("Request failed:", result.reason);
        }
      }
      

      // If all requests failed, show error message
      if (errorCount === imageCount) {
        setError('All requests failed. Please try again.'); // Display error only if all requests fail
        return;
      }

      // Set the first successful result as current output
      if (successfulResults.length > 0) {
        setResultImage(successfulResults[0]);
      }

      // Add all successful results to history
      const newItems: HistoryItem[] = successfulResults.map(
        (generatedImage, index) => ({
          id: Date.now().toString() + index,
          url: generatedImage,
          timestamp: Date.now() + index,
          prompt: config.prompt,
        })
      );
      setHistory((prev) => [...newItems, ...prev]);

      // Notify user about partial failures
      if (errorCount > 0) {
        setError(`${errorCount} of ${imageCount} requests failed.`); // Partial failure notification
      }
    } catch (err: any) {
      // Handle unexpected errors in the overall process
      console.error("Overall process failed:", err);
      setError(err.message || t("lineart.failedToGenerate"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `nanocolor-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleHistorySelect = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setResultImage(item.url);
  };

  // Delete history item
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      // If we deleted the currently shown image, clear it
      const deletedItem = prev.find((item) => item.id === id);
      if (deletedItem && resultImage === deletedItem.url) {
        setResultImage(null);
      }
      return newHistory;
    });
  };

  return (
    <div className="lineArt">
      <div className="left">
        {/* Unified Preview */}
        <UnifiedPreview
          type="image"
          src={resultImage}
          isLoading={isLoading}
          emptyText={t("lineart.title")}
          emptySubtext={t("lineart.subtitle")}
          onDownload={handleDownload}
        />

        {/* Unified History */}
        <UnifiedHistory
          items={history.map((item) => ({
            id: item.id,
            thumbnail: item.url,
            type: "image",
            isActive: resultImage === item.url,
            timestamp: item.timestamp,
            onClick: () => {}, // Logic handled by onSelect parent
          })).sort((a, b) => b.timestamp - a.timestamp)}
          activeId={history.find((h) => h.url === resultImage)?.id}
          onSelect={handleHistorySelect}
          onDelete={handleDeleteHistory}
        />
      </div>

      <div className="right">
        {/* Title kept as per original layout, but maybe should be moved? Original had it above ControlPanel */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {t("lineart.title")}
        </h1>

        <div className="control-panel-wrapper">
          {/* Image Inputs Area */}
          <div className="mb-4 flex gap-4">
            <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800">
              <ImageUpload
                label="Line Art"
                image={lineArt}
                onImageChange={setLineArt}
                required
              />
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800">
              <ImageUpload
                label="Style Ref"
                image={styleRef}
                onImageChange={setStyleRef}
              />
            </div>
          </div>

          <ControlPanel
            config={config}
            setConfig={setConfig}
            isLoading={isLoading}
            onGenerate={handleGenerate}
            canGenerate={!!lineArt}
            imageCount={imageCount}
            setImageCount={setImageCount}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 5. Generate Button */}
        <UnifiedGenerateButton
          onClick={handleGenerate}
          disabled={!lineArt || isLoading}
          isGenerating={isLoading}
          label="COLORIZE IMAGE"
        />
      </div>
    </div>
  );
};

export default App;
