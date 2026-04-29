// d:\nodejs\AI_Assistant\pages\gemini-medecal-styler\index.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { AppState, HistoryItem, ModelType, GenerationConfig } from "./types";
import {
  generateProductRender,
  analyzeReferenceStyle,
} from "./services/gemini";
import { loadHistory, saveHistory, STORES } from "../../utils/indexedDB";
import { fileToBase64, generateId } from "./utils";
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import { UnifiedHistory } from "../../components/shared/UnifiedHistory";
import { ControlPanel } from "./components/ControlPanel";
import { ImageCount } from "../../components/shared/ImageCountSelector";
import "./index.less";

const DEFAULT_CONFIG: GenerationConfig = {
  aspectRatio: "1:1",
  size: "1024x1024",
  imageSize: "1K",
  guidanceScale: 7.5,
  stepCount: 30,
  negativePrompt: "low quality, bad anatomy, worst quality, text, watermark",
};

const GeminiMedicalStyler: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [imageA, setImageA] = useState<string | null>(null); // Primary / White model
  const [imageB, setImageB] = useState<string | null>(null); // Style ref / Material
  const [productName, setProductName] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [strength, setStrength] = useState<number>(0.75);
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    ModelType.NANO_BANANA_PRO
  );
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"material" | "shape">("material");
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [imageCount, setImageCount] = useState<ImageCount>(1);

  // Initial load
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        const data = (await loadHistory(
          STORES.GEMINI_MEDECAL_STYLER
        )) as HistoryItem[];
        if (data && data.length > 0) {
          setHistory(data);
          // Load most recent
          const lat = data[0];
          if (lat) {
            setGeneratedImage(lat.generatedImage);
            setImageA(lat.originalImage);
            if (lat.referenceImage) setImageB(lat.referenceImage);
            if (lat.prompt) setStylePrompt(lat.prompt);
          }
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
      saveHistory(STORES.GEMINI_MEDECAL_STYLER, history, 50).catch(
        console.error
      );
    }
  }, [history]);

  // Handlers
  const handleUploadA = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setImageA(base64);
    } catch (e) {
      setErrorMessage("Error reading primary image.");
    }
  };

  const handleUploadB = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setImageB(base64);
      setErrorMessage(null);

      // Auto-analyze structure or material if in material mode?
      setAppState(AppState.ANALYZING);
      try {
        const description = await analyzeReferenceStyle(selectedModel, base64);
        setStylePrompt(description);
        setAppState(AppState.IDLE);
      } catch (err: any) {
        setAppState(AppState.ERROR);
        setErrorMessage(err.message || "Analysis failed");
        setStylePrompt("Style analysis failed. Please describe manually.");
      }
    } catch (e) {
      setErrorMessage("Error reading reference image.");
    }
  };

  const handleGenerate = async () => {
    setErrorMessage(null);

    // Validation
    if (!imageA || (mode === "material" && !stylePrompt && !imageB)) {
      // Loose validation
    }
    if (!imageA || !stylePrompt) {
      setErrorMessage(t("material.uploadAndProvideStyle" as any));
      return;
    }

    setAppState(AppState.GENERATING);
    setGeneratedImage(null);

    try {
      // Generate multiple images based on imageCount
      const generatePromises = Array.from({ length: imageCount }).map(() =>
        generateProductRender(
          selectedModel,
          imageA,
          productName,
          stylePrompt,
          strength,
          mode,
          config
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
        setAppState(AppState.ERROR);
        setErrorMessage("All requests failed. Please try again.");
        return;
      }

      // Set the first successful result as current output
      if (successfulResults.length > 0) {
        setGeneratedImage(successfulResults[0]);
      }
      setAppState(AppState.SUCCESS);

      // Add all successful results to history
      const newItems: HistoryItem[] = successfulResults.map(
        (resultImage, index) => ({
          id: generateId() + index,
          originalImage: imageA,
          referenceImage: imageB || null,
          generatedImage: resultImage,
          prompt: stylePrompt,
          timestamp: Date.now() + index,
        })
      );
      setHistory((prev) => [...newItems, ...prev]);

      // Notify user about partial failures
      if (errorCount > 0) {
        setErrorMessage(`${errorCount} of ${imageCount} requests failed.`);
      }
    } catch (error: any) {
      // Handle unexpected errors in the overall process
      setAppState(AppState.ERROR);
      setErrorMessage(error.message || "Generation process failed");
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setGeneratedImage(item.generatedImage);
    setImageA(item.originalImage);
    setImageB(item.referenceImage || null);
    setStylePrompt(item.prompt);
    setAppState(AppState.IDLE);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (history.length === 1) {
      // We just deleted the last one
      setGeneratedImage(null);
      setImageA(null);
      setImageB(null);
      setStylePrompt("");
    }
  };

  return (
    <div className="medecalStyler">
      <div className="left flex-1 flex flex-col min-w-0">
        <UnifiedPreview
          type="image"
          src={generatedImage}
          isLoading={
            appState === AppState.GENERATING || appState === AppState.ANALYZING
          }
          loadingText={
            appState === AppState.ANALYZING ? "Analyzing..." : "Generating..."
          }
          emptyText={t("material.title")}
          emptySubtext={t("material.subtitle")}
          onDownload={() => {
            if (generatedImage) {
              const link = document.createElement("a");
              link.href = generatedImage;
              link.download = `medical-styler-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
        />

        <UnifiedHistory
          items={history
            .map((item) => ({
              id: item.id,
              thumbnail: item.generatedImage,
              timestamp: item.timestamp,
              label: item.prompt.substring(0, 30) + "...",
              type: "image",
              onClick: () => {},
            }))
            .sort((a, b) => b.timestamp - a.timestamp)}
          activeId={null} // We could track this if needed
          onSelect={(id) => {
            const item = history.find((h) => h.id === id);
            if (item) handleSelectHistory(item);
          }}
          onDelete={handleDeleteHistory}
          title="History"
          emptyMessage="No history yet"
        />
      </div>

      <div className="right">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {t("material.title")}
          </h1>
          <p className="text-slate-400 text-sm">{t("material.subtitle")}</p>
        </div>

        <div className="control-panel-wrapper">
          <ControlPanel
            mode={mode}
            setMode={setMode}
            imageA={imageA}
            setImageA={setImageA}
            handleUploadA={handleUploadA}
            imageB={imageB}
            setImageB={setImageB}
            handleUploadB={handleUploadB}
            productName={productName}
            setProductName={setProductName}
            stylePrompt={stylePrompt}
            setStylePrompt={setStylePrompt}
            strength={strength}
            setStrength={setStrength}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            config={config}
            setConfig={setConfig}
            appState={appState}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
            onGenerate={handleGenerate}
            imageCount={imageCount}
            setImageCount={setImageCount}
          />
        </div>
      </div>
    </div>
  );
};

export default GeminiMedicalStyler;
