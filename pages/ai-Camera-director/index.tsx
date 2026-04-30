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

    try {
      // 生成多个图像的 Promise 数组
      const generatePromises = Array.from({ length: imageCount }).map(() =>
        generateScene(
          selectedModel, // modelId
          params, // camera params
          genState.promptOverride, // prompt override
          config, // generation config
          inputImage // input image (base64)
        )
      );

      // 使用 Promise.allSettled 等待所有请求完成
      const results = await Promise.allSettled(generatePromises);

      // 统计成功和失败的请求数量
      const successfulResults: string[] = [];
      let errorCount = 0;

      // results.forEach((result) => {
      //   if (result.status === "fulfilled") {
      //     successfulResults.push(result.value); // 成功的结果
      //   } else {
      //     errorCount++; // 失败的数量
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

      // 如果所有请求都失败，显示错误信息
      if (errorCount === imageCount) {
        setGenState((prev) => ({
          ...prev,
          isGenerating: false,
          error: "All requests failed. Please try again.",
        }));
        return;
      }

      // 设置第一个成功结果为当前输出
      if (successfulResults.length > 0) {
        setGenState((prev) => ({
          ...prev,
          isGenerating: false,
          resultImage: successfulResults[0],
        }));
      } else {
        setGenState((prev) => ({
          ...prev,
          isGenerating: false,
        }));
      }

      // 将所有成功的结果添加到历史记录中
      const newItems: HistoryItem[] = successfulResults.map(
        (result, index) => ({
          id: `${Date.now()}-${index}`, // 更具唯一性的 ID
          timestamp: Date.now() + index,
          image: result,
          params: { ...params },
        })
      );
      setHistory((prev) => [...newItems, ...prev]);

      // 如果有部分失败，提示用户
      if (errorCount > 0) {
        setGenState((prev) => ({
          ...prev,
          error: `${errorCount} of ${imageCount} requests failed.`,
        }));
      }
    } catch (error: any) {
      // 处理整体流程中的严重错误（例如 Promise.allSettled 本身抛出异常）
      console.error("Overall process failed:", error);
      setGenState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error.message || "Generation process failed",
      }));
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
          isLoading={genState.isGenerating}
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
        <h1 className="right-panel-header text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          CAMERA CONTROLS
        </h1>
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
