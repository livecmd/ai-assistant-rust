import React, { useEffect, useMemo } from 'react';
import { ModelVersion, AspectRatio, ImageResolution, GenerationConfig, ThinkingMode } from '../types';
import { Settings2, Zap, Brain } from 'lucide-react';
import { ControlSection } from '../../../components/shared/UnifiedControlPanel';
import { CommonModelSelector } from '../../../components/shared/CommonModelSelector';
import { CommonAspectRatioSelector } from '../../../components/shared/CommonAspectRatioSelector';
import { UnifiedGenerateButton } from '../../../components/shared/UnifiedGenerateButton';
import { ImageCountSelector, ImageCount } from '../../../components/shared/ImageCountSelector';
import { useModelCatalog } from '../../../hooks/useModelCatalog';

interface ControlPanelProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  isLoading: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
  imageCount: ImageCount;
  setImageCount: (count: ImageCount) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, isLoading, onGenerate, canGenerate, imageCount, setImageCount }) => {

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig(prev => ({ ...prev, prompt: e.target.value }));
  };

  const isPro = config.model === ModelVersion.PRO;
  const { getConfig, formatPriceSummary } = useModelCatalog({ category: 'image', provider: 'vertex' });
  const models = useMemo(() => {
    const options = [
      { id: ModelVersion.FLASH, name: getConfig(ModelVersion.FLASH)?.display_name || '2.5 Image', description: '快速图片生成', price: formatPriceSummary([ModelVersion.FLASH]) },
      { id: ModelVersion.PRO, name: getConfig(ModelVersion.PRO)?.display_name || '3.0 Pro Image', description: '高质量图片生成', price: formatPriceSummary(['gemini-3-pro-image-preview-1k-2k', 'gemini-3-pro-image-preview-4k']) },
    ];
    const enabled = options.filter((item) => getConfig(item.id));
    return enabled.length > 0 ? enabled : options;
  }, [formatPriceSummary, getConfig]);

  useEffect(() => {
    if (!models.some((item) => item.id === config.model) && models.length > 0) {
      setConfig(prev => ({ ...prev, model: models[0].id as ModelVersion }));
    }
  }, [config.model, models, setConfig]);

  return (
    <div className="panel-compact flex flex-col gap-4">
      {/* 1. Prompt */}
      <ControlSection title="提示词(Prompt)">
        <textarea
          value={config.prompt}
          onChange={handlePromptChange}
          placeholder="描述一下颜色和款式...(Describe the colors and style...)"
          className="lineart-prompt-field"
        />
      </ControlSection>

      {/* 2. Model & Thinking Mode */}
      <ControlSection>
        <CommonModelSelector
          selectedModel={config.model}
          onSelect={(id) => setConfig(prev => ({ ...prev, model: id as ModelVersion }))}
          models={models}
        />

        <div className="h-4"></div>

        {/* <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1">
            Thinking Mode
          </label>
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setConfig(prev => ({ ...prev, thinkingMode: ThinkingMode.FAST }))}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${config.thinkingMode === ThinkingMode.FAST
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Zap size={14} /> Fast
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, thinkingMode: ThinkingMode.DEEP }))}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${config.thinkingMode === ThinkingMode.DEEP
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Brain size={14} /> Deep
            </button>
          </div>
        </div> */}
      </ControlSection>

      {/* 3. Aspect Ratio & Resolution (Pro only) */}
      {isPro && (
        <ControlSection>
          <CommonAspectRatioSelector
            selectedRatio={config.aspectRatio}
            onSelect={(r) => setConfig(prev => ({ ...prev, aspectRatio: r as AspectRatio }))}
            options={[AspectRatio.SQUARE, AspectRatio.PORTRAIT, AspectRatio.LANDSCAPE, AspectRatio.TALL, AspectRatio.WIDE]}
            label="长宽比(Aspect Ratio)"
          />

          <div className="h-4"></div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 tracking-wider flex justify-between">
              Resolution
            </label>
            <div className="lineart-segmented">
              {[ImageResolution.RES_1K, ImageResolution.RES_2K, ImageResolution.RES_4K].map(res => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, resolution: res }))}
                  className={`lineart-segmented__button ${config.resolution === res
                    ? "is-active"
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

      {/* 4. Image Count */}
      <ControlSection title="生成数量(Generate quantity)">
        <ImageCountSelector
          value={imageCount}
          onChange={setImageCount}
          disabled={isLoading}
          label=""
        />
      </ControlSection>
    </div>
  );
};

export default ControlPanel;
