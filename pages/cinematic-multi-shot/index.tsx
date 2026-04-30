import React, { useState, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import StyleSelector from "./components/StyleSelector";
import { generateShot } from "./services/geminiService";
import {
  ArtStyle,
  SHOTS,
  GenerationResult,
  ShotConfig,
  HistoryItem,
} from "./types";
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import { UnifiedHistory } from "../../components/shared/UnifiedHistory";
import { UnifiedControlPanel } from "../../components/shared/UnifiedControlPanel";
import { UnifiedGenerateButton } from "../../components/shared/UnifiedGenerateButton";
import {
  ImageCountSelector,
  ImageCount,
} from "../../components/shared/ImageCountSelector";
import {
  loadHistory,
  saveHistory,
  deleteHistoryItem,
  STORES,
} from "../../utils/indexedDB";
import "./index.less";
import { AlertCircle } from "lucide-react";

const CinematicMultiShot: React.FC = () => {
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(
    ArtStyle.MATCH_SOURCE
  );
  const [styleReferenceImages, setStyleReferenceImages] = useState<string[]>(
    []
  ); // For reference style
  const [prompt, setPrompt] = useState("");
  const [generationResults, setGenerationResults] = useState<
    Record<string, GenerationResult>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState<string>(SHOTS[0].id);
  const [imageCount, setImageCount] = useState<ImageCount>(1);
  const [errorText, setErrorText] = useState("");

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentOutput, setCurrentOutput] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory<HistoryItem>(STORES.CINEMATIC_MULTI_SHOT)
      .then((items) => {
        // Sort by timestamp descending
        const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedItems);
        if (sortedItems.length > 0) {
          setCurrentOutput(sortedItems[0].url);
        }
      })
      .catch((error) => {
        console.error("Failed to load history:", error);
      });
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      saveHistory(STORES.CINEMATIC_MULTI_SHOT, history, 50).catch((error) => {
        console.error("Failed to save history to IndexedDB:", error);
      });
    }
  }, [history]);

  // Helper to update a single result
  const updateResult = (id: string, update: Partial<GenerationResult>) => {
    setGenerationResults((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...update },
    }));
  };

  const handleGenerateShot = async () => {
    if (sourceImages.length === 0) return;

    setIsGenerating(true);

    try {
      const styleImg =
        selectedStyle === ArtStyle.REFERENCE_AESTHETIC
          ? styleReferenceImages[0]
          : undefined;

      // Generate multiple images based on count
      const generatePromises = SHOTS.map((shot) =>
        generateShot(sourceImages, selectedStyle, prompt, shot, "2K", styleImg)
      );

      // Use Promise.allSettled to wait for all requests to complete
      const results = await Promise.allSettled(generatePromises);

      // Separate successful and failed results
      const successfulResults: string[] = [];

      let errorCount = 0;

      for (const result of results) {
        if (result.status === "fulfilled") {
          successfulResults.push(result.value); // 成功的结果
        } else {
          errorCount++; // 失败的请求数量
        }
      }

      // Add all successful results to history
      const newHistoryItems: HistoryItem[] = successfulResults.map(
        (imageUrl, index) => ({
          id: Math.random().toString(36).substr(2, 9),
          url: imageUrl,
          shotName: currentShot.name,
          shotId: currentShot.id,
          style: selectedStyle,
          prompt: prompt,
          timestamp: Date.now() + index,
        })
      );
      setHistory((prev) => [...newHistoryItems, ...prev]);
      if (errorCount > 0) {
        setErrorText(`${errorCount} of 6 requests failed.`); // Partial failure notification
      }
      setCurrentOutput(successfulResults[0]);
      setIsGenerating(false);
      return successfulResults;
    } catch (error: any) {
      setIsGenerating(false);
      return null;
    }
  };

  const handleGenerateAll = async () => {
    setErrorText("");
    if (sourceImages.length === 0) return;

    // Initialize results for all shots
    const newResults: Record<string, GenerationResult> = {};
    SHOTS.forEach((shot) => {
      newResults[shot.id] = {
        shotId: shot.id,
        imageUrl: "",
        status: "loading",
      };
    });
    setGenerationResults(newResults);

    // Run all generations (concurrently), each shot generates imageCount images
    // await Promise.allSettled(
    //   SHOTS.map((shot) => handleGenerateShot(shot, imageCount))
    // );
    handleGenerateShot();
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteHistoryItem(STORES.CINEMATIC_MULTI_SHOT, id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      // If deleted item was current output, show next one
      if (history.find((item) => item.id === id)?.url === currentOutput) {
        const remaining = history.filter((item) => item.id !== id);
        setCurrentOutput(remaining.length > 0 ? remaining[0].url : null);
      }
    } catch (error) {
      console.error("Failed to delete history item:", error);
    }
  };

  const handleSelectHistory = (id: string) => {
    const item = history.find((h) => h.id === id);
    console.log("Selected history item:", item);
    if (item) {
      setCurrentOutput(item.url);
    }
  };

  const currentShot = SHOTS.find((s) => s.id === selectedShotId) || SHOTS[0];
  const currentResult = generationResults[selectedShotId];

  // Determine what to show in preview: current generation result or history item
  const previewSrc = currentOutput || currentResult?.imageUrl;

  return (
    <div className="cinematicMultiShot">
      <div className="left">
        <UnifiedPreview
          type="image"
          src={previewSrc}
          isLoading={isGenerating}
          loadingText={isGenerating ? "生成图片中..." : undefined}
          emptyText="一键场景生成"
          emptySubtext="上传主体图片并生成场景"
          onDownload={() => {
            if (previewSrc) {
              const link = document.createElement("a");
              link.href = previewSrc;
              link.download = `cinematic-${currentShot.id}-${Date.now()}.png`;
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
              thumbnail: item.url,
              label: item.shotName,
              type: "image" as const,
              isActive: currentOutput === item.url,
              timestamp: item.timestamp,
            }))
            .sort((a, b) => b.timestamp - a.timestamp)}
          activeId={history.find((h) => h.url === currentOutput)?.id || null}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          emptyMessage="NO HISTORY YET"
        />
      </div>

      <div className="right right-panel-shell">
        <div className="right-panel-header">
          <h1>一键场景生成</h1>
          <p>上传主体图片并生成场景</p>
        </div>
        <UnifiedControlPanel className="flex-1 cinema-control">
          <div className="space-y-8">
            {/* 1. Source Images */}
            <ImageUploader
              label="1. 上传图片(Upload Images)"
              helperText="Upload 1-4 photos of the subject"
              maxImages={4}
              selectedImages={sourceImages}
              onImagesChange={setSourceImages}
            />

            {/* 2. Style Selection */}
            <StyleSelector
              selectedStyle={selectedStyle}
              onSelect={setSelectedStyle}
            />

            {/* Reference Image Upload (Conditional) */}
            {selectedStyle === ArtStyle.REFERENCE_AESTHETIC && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <ImageUploader
                  label="Style Reference"
                  helperText="Upload an image to copy style/lighting from"
                  maxImages={1}
                  selectedImages={styleReferenceImages}
                  onImagesChange={setStyleReferenceImages}
                />
              </div>
            )}

            {/* 3. Scene Description */}
            <div className="space-y-2 blobk-bg">
              <label className="cinema-section-label">
                2. 场景描述(Scene Description)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the scene, lighting, or action..."
                className="cinema-textarea w-full h-24 resize-none"
              />
            </div>
            {/* 4. Image Count Selector */}
            {/* <ImageCountSelector
              value={imageCount}
              onChange={setImageCount}
              label="生成数量(Generate quantity)"
              disabled={isGenerating}
            /> */}
            {errorText && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{errorText}</span>
              </div>
            )}
          </div>
        </UnifiedControlPanel>
        {/* Generate Button */}
        <div className="right-panel-footer">
          <UnifiedGenerateButton
            onClick={handleGenerateAll}
            disabled={sourceImages.length === 0 || isGenerating}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

export default CinematicMultiShot;
