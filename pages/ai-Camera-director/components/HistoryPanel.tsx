
import React from 'react';
import { HistoryItem } from '../types';
import { useTranslation } from '../../../hooks/useTranslation';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectItem: (image: string) => void;
  onDownload: (image: string, filename: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectItem, onDownload }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full border-l border-hud-border border-gray-400 bg-[#0f172a] p-4 gap-4 flex-shrink-0 relative overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-300 tracking-widest uppercase">04. {t('camera.history')}</h2>
        <span className="text-[9px] bg-hud-border/50 px-1.5 py-0.5 rounded text-hud-text/80">{history.length}</span>
      </div>

      <div className="flex flex-col gap-3">
        {history.length === 0 ? (
          <div className="h-32 bg-gray-800/30 border text-gray-300 border-slate-600 rounded-lg flex items-center justify-center">
            <span className="text-[12px] uppercase">{t('camera.noRecords')}</span>
          </div>
        ) : (
          history.slice().reverse().map((item) => (
            <div
              key={item.id}
              className="group relative border text-gray-300 border-slate-600 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer"
              onClick={() => onSelectItem(item.image)}
            >
              <div className="aspect-square w-full overflow-hidden bg-black/40">
                <img src={item.image} alt="History" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-2 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[12px] text-slate-300">
                  <span>{item.timestamp}</span>
                </div>
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(item.image, `shot_${item.id}.png`);
                    }}
                    className="flex-grow rounded-sm text-sm tracking-widest transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 text-[12px] py-1"
                  >
                    {t('camera.download')}
                  </button>
                </div>
              </div>

              {/* Hover effect highlight */}
              <div className="absolute top-0 right-0 w-1 h-1 bg-hud-cyan opacity-0 group-hover:opacity-100"></div>
              <div className="absolute bottom-0 left-0 w-1 h-1 bg-hud-cyan opacity-0 group-hover:opacity-100"></div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-4 border-t border-hud-border/30 text-[10px] text-slate-300">
        {t('camera.storageBuffer')}
      </div>
    </div>
  );
};

export default HistoryPanel;
