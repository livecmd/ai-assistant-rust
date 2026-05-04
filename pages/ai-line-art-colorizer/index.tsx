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

    if (config.model === ModelVersion.FLASH && imageCount > 1) {
      let errorCount = 0;
      let hasResult = false;

      for (let index = 0; index < imageCount; index += 1) {
        try {
          const generatedImage = await generateColorizedImage(lineArt, styleRef, config);
          if (!hasResult) {
            setResultImage(generatedImage);
          }
          hasResult = true;
          const newItem: HistoryItem = {
            id: Date.now().toString() + index,
            url: generatedImage,
            timestamp: Date.now(),
            prompt: config.prompt,
          };
          setHistory((prev) => [newItem, ...prev]);
        } catch (reason) {
          errorCount++;
          console.error("Request failed:", reason);
        }

        if (index < imageCount - 1) {
          await sleep(600);
        }
      }

      setIsLoading(false);
      if (!hasResult) {
        setError('All requests failed. Please try again.');
      } else if (errorCount > 0) {
        setError(`${errorCount} of ${imageCount} requests failed.`);
      }
    } else {
      let settledCount = 0;
      let errorCount = 0;
      let hasResult = false;

      const onSettled = () => {
        settledCount++;
        if (settledCount === imageCount) {
          setIsLoading(false);
          if (!hasResult) {
            setError('All requests failed. Please try again.');
          } else if (errorCount > 0) {
            setError(`${errorCount} of ${imageCount} requests failed.`);
          }
        }
      };

      for (let i = 0; i < imageCount; i++) {
        generateColorizedImage(lineArt, styleRef, config)
          .then((generatedImage) => {
            if (!hasResult) {
              setResultImage(generatedImage);
            }
            hasResult = true;
            const newItem: HistoryItem = {
              id: Date.now().toString() + i,
              url: generatedImage,
              timestamp: Date.now(),
              prompt: config.prompt,
            };
            setHistory((prev) => [newItem, ...prev]);
            onSettled();
          })
          .catch((reason) => {
            errorCount++;
            console.error("Request failed:", reason);
            onSettled();
          });
      }
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
          isLoading={isLoading && !resultImage}
          emptyText={t("lineart.title")}
          emptySubtext={t("lineart.subtitle")}
          onDownload={handleDownload}
        />

        {/* Unified History */}
        <UnifiedHistory
          items={history.map((item) => ({
            id: item.id,
            thumbnail: item.url,
            type: "image" as const,
            isActive: resultImage === item.url,
            timestamp: item.timestamp,
            onClick: () => {}, // Logic handled by onSelect parent
          })).sort((a, b) => b.timestamp - a.timestamp)}
          activeId={history.find((h) => h.url === resultImage)?.id}
          onSelect={handleHistorySelect}
          onDelete={handleDeleteHistory}
        />
      </div>

      <div className="right right-panel-shell">
        <div className="right-panel-header">
          <h1>{t("lineart.title")}</h1>
          <p>{t("lineart.subtitle")}</p>
        </div>

        <div className="control-panel-wrapper right-panel-body panel-compact">
          <div className="panel-scroll-region">
            {/* Image Inputs Area */}
            <div className="lineart-upload-grid">
              <div className="lineart-upload-card">
                <ImageUpload
                  label="Line Art"
                  image={lineArt}
                  onImageChange={setLineArt}
                  required
                />
              </div>
              <div className="lineart-upload-card">
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
              <div className="lineart-error-banner">
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Generate Button */}
        <div className="right-panel-footer">
          <UnifiedGenerateButton
            onClick={handleGenerate}
            disabled={!lineArt || isLoading}
            isGenerating={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
