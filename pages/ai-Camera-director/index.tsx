import React, { useState, useEffect } from "react";
import ControlPanel from "./components/ControlPanel";
import {
  CameraParams,
  GenerationConfig,
  GenerationState,
  HistoryItem,
  ModelType,
} from "./types";
import { generateScene } from "./services/geminiService";
import { loadHistory, saveHistory, STORES } from "../../utils/indexedDB";
import { useTranslation } from "../../hooks/useTranslation";
import { ImageCount } from "../../components/shared/ImageCountSelector";
import "./index.less";

// Shared Components
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import {
  UnifiedHistory,
  HistoryItemProps,
} from "../../components/shared/UnifiedHistory";

const App: React.FC = () => {
  const { t } = useTranslation();
  // --- State Management ---
  const [params, setParams] = useState<CameraParams>({
    rotationH: -45,
    rotationV: 0,
    zoom: 0,
    distortion: false,
  });

  const [inputImage, setInputImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    resultImage: null,
    error: null,
    promptOverride: "",
  });

  // Load history from IndexedDB
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        const savedHistory = await loadHistory<HistoryItem>(
          STORES.AI_CAMERA_DIRECTOR
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
      saveHistory(STORES.AI_CAMERA_DIRECTOR, history, 50).catch((error) => {
        console.error("Failed to save history to IndexedDB:", error);
      });
    }
  }, [history]);

  const handleExecute = async (
    selectedModel: ModelType,
    config: GenerationConfig,
    imageCount: ImageCount = 1
  ) => {
    if (!inputImage) {
      alert(t("camera.uploadAssetFirst"));
      return;
    }

    setGenState((prev) => ({ ...prev, isGenerating: true, error: null }));

    let settledCount = 0;
    let errorCount = 0;
    let hasResult = false;

    const onSettled = () => {
      settledCount++;
      if (settledCount === imageCount) {
        if (!hasResult) {
          setGenState((prev) => ({
            ...prev,
            isGenerating: false,
            error: "All requests failed. Please try again.",
          }));
        } else if (errorCount > 0) {
          setGenState((prev) => ({
            ...prev,
            isGenerating: false,
            error: `${errorCount} of ${imageCount} requests failed.`,
          }));
        } else {
          setGenState((prev) => ({ ...prev, isGenerating: false }));
        }
      }
    };

    for (let i = 0; i < imageCount; i++) {
      generateScene(
        selectedModel,
        params,
        genState.promptOverride,
        config,
        inputImage
      )
        .then((result) => {
          if (!hasResult) {
            setGenState((prev) => ({ ...prev, resultImage: result }));
          }
          hasResult = true;
          const newItem: HistoryItem = {
            id: `${Date.now()}-${i}`,
            timestamp: Date.now(),
            image: result,
            params: { ...params },
          };
          setHistory((prev) => [newItem, ...prev]);
          onSettled();
        })
        .catch((error: any) => {
          errorCount++;
          console.error("Request failed:", error);
          onSettled();
        });
    }
  };

  const handleDownload = () => {
    if (!genState.resultImage) return;
    const link = document.createElement("a");
    link.href = genState.resultImage;
    link.download = `camera-shot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectHistoryItem = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;

    // Restore state from history item
    setGenState((prev) => ({ ...prev, resultImage: item.image }));
    if (item.params) {
      setParams(item.params);
    }
  };

  // Delete history item
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      // If we deleted the currently shown image, clear it
      const deletedItem = prev.find((item) => item.id === id);
      if (deletedItem && genState.resultImage === deletedItem.image) {
        setGenState((prevState) => ({ ...prevState, resultImage: null }));
      }
      return newHistory;
    });
  };

  return (
    <div className="cameraDirector">
      <div className="left">
        <UnifiedPreview
          type="image"
          src={genState.resultImage}
          isLoading={genState.isGenerating && !genState.resultImage}
          emptyText="AI CAMERA DIRECTOR"
          emptySubtext="PRO VISUALIZATION SYSTEM"
          onDownload={handleDownload}
        />

        <UnifiedHistory
          items={history
            .map((item) => ({
              id: item.id,
              thumbnail: item.image,
              type: "image" as const,
              isActive: genState.resultImage === item.image,
              timestamp: item.timestamp,
              onClick: () => {},
            }))
            .sort((a, b) => b.timestamp - a.timestamp)}
          activeId={history.find((h) => h.image === genState.resultImage)?.id}
          onSelect={selectHistoryItem}
          onDelete={handleDeleteHistory}
        />
      </div>

      <div className="right right-panel-shell">
        <div className="right-panel-header">
          <h1>{t("camera.title")}</h1>
          <p>{t("camera.subtitle")}</p>
        </div>
        <div className="control-panel-wrapper right-panel-body panel-compact">
          <ControlPanel
            params={params}
            setParams={setParams}
            onExecute={handleExecute}
            isGenerating={genState.isGenerating}
            inputImage={inputImage}
            setInputImage={setInputImage}
          />

          {genState.error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-xs">
              {genState.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
