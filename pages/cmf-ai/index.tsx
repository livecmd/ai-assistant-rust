import React, { useState, useCallback, useEffect } from "react";
import {
  UploadedImage,
  ProcessStatus,
  LogEntry,
  LogType,
  HistoryItem,
  ModelType,
  GenerationImgConfig,
} from "./types";
import { generateProductDesign } from "./services/geminiService";
import { ControlPanel } from "./components/ControlPanel";
import { ImageComparison } from "./components/ImageComparison";
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import { UnifiedHistory } from "../../components/shared/UnifiedHistory";
import { loadHistory, saveHistory, STORES } from "../../utils/indexedDB";
import { useTranslation } from "../../hooks/useTranslation";
import { ImageCount } from "../../components/shared/ImageCountSelector";
import "./index.less";
import { v4 as uuidv4 } from "uuid";

const App: React.FC = () => {
  const { t } = useTranslation();
  const [targetImage, setTargetImage] = useState<UploadedImage | null>(null);
  const [refImage, setRefImage] = useState<UploadedImage | null>(null);
  const [adherenceLevel, setAdherenceLevel] = useState<number>(50);
  const [feedback, setFeedback] = useState<string>("");

  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Model and config state
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    ModelType.NANO_BANANA
  );
  const [config, setConfig] = useState<GenerationImgConfig>({
    aspectRatio: "auto",
    imageSize: "1K",
  });
  const [imageCount, setImageCount] = useState<ImageCount>(1);

  // Load history
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        const savedHistory = await loadHistory<HistoryItem>(STORES.CMF_AI);
        if (savedHistory && savedHistory.length > 0) {
          setHistory(savedHistory);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    };
    loadHistoryData();
  }, []);

  // Save history
  useEffect(() => {
    if (history.length > 0) {
      saveHistory(STORES.CMF_AI, history, 50).catch(console.error);
    }
  }, [history]);

  const addLog = useCallback((message: string, type: LogType = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: uuidv4(),
        timestamp: new Date(),
        message,
        type,
      },
    ]);
  }, []);

  const handleGenerate = async () => {
    if (!targetImage || !refImage) return;

    setStatus(ProcessStatus.GENERATING);
    setResultImage(null);
    addLog(t("cmf.log.startGeneration" as any));

    try {
      // Generate multiple images based on imageCount
      const generatePromises = Array.from({ length: imageCount }).map(() =>
        generateProductDesign(
          selectedModel,
          targetImage,
          refImage,
          adherenceLevel,
          config,
          feedback
        )
      );

      // Use Promise.allSettled to wait for all requests to complete
      const results = await Promise.allSettled(generatePromises);

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
        setStatus(ProcessStatus.ERROR);
        addLog(`${t("cmf.log.error" as any)}: All requests failed.`, "error");
        return;
      }

      // Set the first successful result as current output
      if (successfulResults.length > 0) {
        setResultImage(successfulResults[0]);
      }
      setStatus(ProcessStatus.SUCCESS);
      addLog(t("cmf.log.generationSuccess" as any), "success");

      // Add all successful results to history
      const newItems: HistoryItem[] = successfulResults.map(
        (resultUrl, index) => ({
          id: Date.now().toString() + index,
          url: resultUrl,
          timestamp: Date.now() + index,
          prompt: `Adherence: ${adherenceLevel}, Feedback: ${feedback}`,
          targetImage: targetImage.file.name,
          refImage: refImage.file.name,
        })
      );
      setHistory((prev) => [...newItems, ...prev]);

      // Notify user about partial failures
      if (errorCount > 0) {
        addLog(`${errorCount} of ${imageCount} requests failed.`, "warning");
      }
    } catch (error: any) {
      // Handle unexpected errors in the overall process
      console.error("Overall process failed:", error);
      setStatus(ProcessStatus.ERROR);
      addLog(`${t("cmf.log.error" as any)}: ${error.message}`, "error");
    }
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

  const isProcessing = status === ProcessStatus.GENERATING;
  const showComparison = !!(targetImage && resultImage && !isProcessing);

  return (
    <div className="cmfAi">
      <div className="left">
        <UnifiedPreview
          type="image"
          src={resultImage}
          isLoading={isProcessing}
          emptyText={t("cmf.waitingForResult")}
          emptySubtext={t("cmf.configureAndGenerate")}
          onDownload={() => {
            if (resultImage) {
              const link = document.createElement("a");
              link.href = resultImage;
              link.download = `cmf-design-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
        >
          {showComparison && (
            <ImageComparison
              beforeImage={targetImage!.previewUrl}
              afterImage={resultImage!}
              beforeLabel={t("cmf.originalProduct")}
              afterLabel={t("cmf.generateResult")}
            />
          )}
        </UnifiedPreview>

        <UnifiedHistory
          items={history
            .map((item) => ({
              id: item.id,
              thumbnail: item.url,
              type: "image" as const,
              isActive: resultImage === item.url,
              timestamp: item.timestamp,
              onClick: () => {},
            }))
            .sort((a, b) => b.timestamp - a.timestamp)}
          activeId={history.find((h) => h.url === resultImage)?.id}
          onSelect={(id) => {
            const h = history.find((x) => x.id === id);
            if (h) setResultImage(h.url);
          }}
          onDelete={handleDeleteHistory}
        />
      </div>

      <div className="right right-panel-shell">
        <h1 className="right-panel-header text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {t("cmf.title")}
        </h1>
        <div className="control-panel-wrapper">
          <ControlPanel
            targetImage={targetImage}
            setTargetImage={setTargetImage}
            refImage={refImage}
            setRefImage={setRefImage}
            adherenceLevel={adherenceLevel}
            setAdherenceLevel={setAdherenceLevel}
            feedback={feedback}
            setFeedback={setFeedback}
            onGenerate={handleGenerate}
            isProcessing={isProcessing}
            imageCount={imageCount}
            setImageCount={setImageCount}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            config={config}
            setConfig={setConfig}
          />

          {/* Logs or extra UI could go here */}
        </div>
      </div>
    </div>
  );
};

export default App;
