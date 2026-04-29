/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useState } from "react";
// import {CurvedArrowDownIcon} from './components/icons'; // Removed (unused or replaced)
// import LoadingIndicator from './components/LoadingIndicator'; // Replaced by UnifiedPreview's internal loader
import PromptForm from "./components/PromptForm";
// import VideoResult from './components/VideoResult'; // Replaced by UnifiedPreview
// import HistoryGallery from './components/HistoryGallery'; // Replaced by UnifiedHistory
import { generateVideo } from "./services/geminiService";
import { AppState, GenerateVideoParams, HistoryItem } from "./types";
import { loadHistory, saveHistory, STORES } from "../../utils/indexedDB";
import "./index.less";

// Shared Components
import { UnifiedPreview } from "../../components/shared/UnifiedPreview";
import {
  UnifiedHistory,
  HistoryItemProps,
} from "../../components/shared/UnifiedHistory";
import { UnifiedControlPanel } from "../../components/shared/UnifiedControlPanel";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null
  );
  const [lastVideoObject, setLastVideoObject] = useState<any | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // A single state to hold the initial values for the prompt form
  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  // Load history from IndexedDB
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        const savedHistory = await loadHistory<HistoryItem>(STORES.VEO_STUDIO);
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
      saveHistory(STORES.VEO_STUDIO, history, 20).catch((error) => {
        console.error("Failed to save history to IndexedDB:", error);
      });
    }
  }, [history]);

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    // Reset initial form values for the next fresh start
    setInitialFormValues(null);

    try {
      const { objectUrl, blob, video } = await generateVideo(params);
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);

      // Convert blob to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          videoData: base64data,
          timestamp: Date.now(),
          prompt: params.prompt,
          model: params.model,
          aspectRatio: params.aspectRatio,
          resolution: params.resolution,
          hasReferenceImage: !!params.referenceImage || (params.referenceImages?.length ?? 0) > 0,
          referenceImageCount: params.referenceImages?.length ?? (params.referenceImage ? 1 : 0),
        };
        setHistory((prev) => [newItem, ...prev]);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Video generation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";

      let userFriendlyMessage = `Video generation failed: ${errorMessage}`;
      if (typeof errorMessage === "string") {
        if (errorMessage.includes("Requested entity was not found.")) {
          userFriendlyMessage =
            "Model not found. This can be caused by an invalid API key or permission issues. Please check your API key.";
        } else if (
          errorMessage.includes("API_KEY_INVALID") ||
          errorMessage.includes("API key not valid") ||
          errorMessage.toLowerCase().includes("permission denied")
        ) {
          userFriendlyMessage =
            "Your API key is invalid or lacks permissions. Please select a valid, billing-enabled API key.";
        }
      }

      setErrorMessage(userFriendlyMessage);
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null); // Clear the form state
  }, []);

  const handleHistorySelect = useCallback(async (item: HistoryItem) => {
    // Convert base64 back to object URL for display
    try {
      const res = await fetch(item.videoData);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setVideoUrl(url);
      setLastVideoBlob(blob);
      setAppState(AppState.SUCCESS);
      setLastConfig({
        prompt: item.prompt,
        model: item.model,
        aspectRatio: item.aspectRatio,
        resolution: item.resolution,
        referenceImage: null,
        referenceImages: [],
      });
      setLastVideoObject(null);
    } catch (error) {
      console.error("Failed to load video from history:", error);
    }
  }, []);

  // Delete history item
  const handleDeleteHistory = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setHistory((prev) => {
        const newHistory = prev.filter((item) => item.id !== id);
        // If we deleted the currently shown video, clear it
        const deletedItem = prev.find((item) => item.id === id);
        if (deletedItem && lastConfig?.prompt === deletedItem.prompt) {
          setVideoUrl(null);
          setLastConfig(null);
          setAppState(AppState.IDLE);
        }
        return newHistory;
      });
    },
    [lastConfig]
  );

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      // Fallback to a fresh start if there's no last config
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="veoStudio">
      <div className="left">
        <UnifiedPreview
          type="video"
          src={videoUrl}
          isLoading={appState === AppState.LOADING}
          emptyText={
            appState === AppState.ERROR ? "GENERATION FAILED" : "视频生成"
          }
          emptySubtext={
            appState === AppState.ERROR
              ? errorMessage || "UNKNOWN ERROR"
              : "AI VIDEO GENERATION"
          }
          onDownload={() => {
            if (videoUrl) {
              const link = document.createElement("a");
              link.href = videoUrl;
              link.download = `veo-video-${Date.now()}.mp4`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
        />

        <UnifiedHistory
          items={history.map((item) => ({
            id: item.id,
            thumbnail: item.videoData, // Assuming videoData is a playable blob URL or base64
            type: "video",
            timestamp: item.timestamp,
            onClick: () => handleHistorySelect(item),
          })).sort((a, b) => b.timestamp - a.timestamp)}
          activeId={
            lastConfig
              ? history.find((h) => h.prompt === lastConfig.prompt)?.id
              : undefined
          }
          onSelect={(id) => {
            const h = history.find((x) => x.id === id);
            if (h) handleHistorySelect(h);
          }}
          onDelete={handleDeleteHistory}
          isVideo={true}
        />
      </div>

      <div className="right">
        <UnifiedControlPanel
          className="action-box"
          titleKey="视频生成" // Or use hardcoded string if translation key missing
        >
          <PromptForm
            onGenerate={handleGenerate}
            initialValues={initialFormValues}
            isGenerating={appState === AppState.LOADING}
          />
        </UnifiedControlPanel>
      </div>
    </div>
  );
};

export default App;
