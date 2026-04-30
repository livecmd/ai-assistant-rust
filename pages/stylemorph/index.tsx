
import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import { generateMorph } from './services/geminiService';
import { ImageState, GenerationConfig, HistoryItem } from './types';
import { UnifiedPreview } from '../../components/shared/UnifiedPreview';
import { UnifiedHistory } from '../../components/shared/UnifiedHistory';
import { loadHistory, saveHistory, deleteHistoryItem, STORES } from '../../utils/indexedDB';
import './index.less';

const StyleMorph: React.FC = () => {
  const [imageA, setImageA] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [imageB, setImageB] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [config, setConfig] = useState<GenerationConfig>({
    weight: 50,
    structuralDepth: 50,
    model: 'gemini-3-pro-image-preview',
    imageSize: '1K',
    aspectRatio: 'AUTO',
    batchSize: 1,
    refinementPrompt: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory<HistoryItem>(STORES.STYLEMORPH)
      .then((items) => {
        // Sort by timestamp descending
        const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedItems);
        if (sortedItems.length > 0) {
          setPreviewImage(sortedItems[0].url);
        }
      })
      .catch((error) => {
        console.error('Failed to load history:', error);
      });
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      saveHistory(STORES.STYLEMORPH, history, 50).catch((error) => {
        console.error('Failed to save history to IndexedDB:', error);
      });
    }
  }, [history]);

  const handleGenerate = async () => {
    if (!imageA.base64 || !imageB.base64) return;

    setIsGenerating(true);
    setPreviewImage(null);

    try {
      const results = await generateMorph(
        imageA.base64,
        imageB.base64,
        config,
        imageA.width,
        imageA.height,
        imageA.mask,
        imageA.lassoPath,
        imageB.mask,
        imageB.lassoPath
      );

      if (results.length > 0) {
        // Add all results to history
        const newHistoryItems: HistoryItem[] = results.map((url, index) => ({
          id: Math.random().toString(36).substr(2, 9),
          url,
          config: { ...config },
          timestamp: Date.now() + index // Ensure unique timestamps
        }));

        setHistory(prev => [...newHistoryItems, ...prev]);
        setPreviewImage(results[0]);
      }
    } catch (error) {
      console.error("Migration failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteHistoryItem(STORES.STYLEMORPH, id);
      setHistory(prev => prev.filter(item => item.id !== id));
      // If deleted item was current preview, show next one
      if (history.find(item => item.id === id)?.url === previewImage) {
        const remaining = history.filter(item => item.id !== id);
        setPreviewImage(remaining.length > 0 ? remaining[0].url : null);
      }
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  const handleSelectHistory = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      setPreviewImage(item.url);
    }
  };

  return (
    <div className="styleMorph">
      <div className="left">
        <UnifiedPreview
          type="image"
          src={previewImage}
          isLoading={isGenerating}
          emptyText="造型迁移"
          emptySubtext="转变您的设计基因"
          onDownload={() => {
            if (previewImage) {
              const link = document.createElement('a');
              link.href = previewImage;
              link.download = `stylemorph-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
        />

        <UnifiedHistory
          items={history.map(item => ({
            id: item.id,
            thumbnail: item.url,
            type: 'image' as const,
            timestamp: item.timestamp,
            isActive: previewImage === item.url
          })).sort((a, b) => b.timestamp - a.timestamp)}
          activeId={history.find(h => h.url === previewImage)?.id || null}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          emptyMessage="NO HISTORY YET"
        />
      </div>

      <div className="right right-panel-shell">
        <div className="control-panel-wrapper right-panel-body panel-compact">
          <ControlPanel
            imageA={imageA}
            setImageA={setImageA}
            imageB={imageB}
            setImageB={setImageB}
            config={config}
            setConfig={setConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onOpenKeySelector={() => { }}
          />
        </div>
      </div>
    </div>
  );
};

export default StyleMorph;
