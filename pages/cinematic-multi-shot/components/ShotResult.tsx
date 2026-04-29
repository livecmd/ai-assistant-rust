
import React from 'react';
import { GenerationResult, ShotConfig } from '../types';

interface ShotResultProps {
  config: ShotConfig;
  result?: GenerationResult;
  onRetry?: () => void;
}

const ShotResult: React.FC<ShotResultProps> = ({ config, result, onRetry }) => {
  const isLoading = result?.status === 'loading';
  const isError = result?.status === 'error';
  const isSuccess = result?.status === 'success';

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800/50 overflow-hidden group">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
        <div>
          <h3 className="text-xs font-bold text-slate-200 tracking-wider">{config.name}</h3>
          <p className="text-[10px] text-slate-500 font-mono">{config.aspectRatio}</p>
        </div>
        <div className="flex gap-2">
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
              title="Retry this shot"
            >
              <i className="fas fa-redo text-xs"></i>
            </button>
          )}
          {isSuccess && (
            <a
              href={result?.imageUrl}
              download={`${config.id}-shot.png`}
              className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
            >
              <i className="fas fa-download text-sm"></i>
            </a>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-[350px] flex items-center justify-center overflow-hidden bg-slate-950">
        {isLoading && (
          <div className="flex flex-col items-center px-6 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-slate-400 font-medium">Composing Lens...</p>
            <p className="text-[10px] text-slate-600 mt-2 italic">Pro model takes longer for higher quality</p>
          </div>
        )}

        {isError && (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <i className="fas fa-triangle-exclamation text-rose-500"></i>
            </div>
            <p className="text-xs text-rose-400 font-medium mb-2 leading-relaxed">
              {result.error?.includes("Model Refusal") ? "Subject filter check failed" : (result.error || 'Generation error')}
            </p>
            <p className="text-[9px] text-slate-500 max-w-[200px]">
              {result.error?.includes("Model Refusal") ? "The model may have detected sensitive content or likeness restrictions for the provided subject." : "Try adjusting your prompt or checking your connection."}
            </p>
          </div>
        )}

        {isSuccess && result.imageUrl && (
          <img
            src={result.imageUrl}
            alt={config.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}

        {!result && (
          <div className="flex flex-col items-center opacity-10">
            <i className="fas fa-camera text-4xl mb-4"></i>
            <p className="text-[10px] font-black tracking-widest uppercase">Perspective Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShotResult;
