import React from 'react';
import { Download, Clock } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryGalleryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, onSelect }) => {
  const handleDownload = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `nanocolor-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (history.length === 0) return null;

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-4 text-slate-400">
        <Clock size={18} />
        <h2 className="text-sm font-semibold tracking-wider">Generation History</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="group relative aspect-square bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 cursor-pointer transition-all"
          >
            <img
              src={item.url}
              alt="History item"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
              <button
                onClick={(e) => handleDownload(e, item)}
                className="w-full bg-slate-800/80 hover:bg-blue-600 text-white text-xs font-medium py-2 rounded-lg backdrop-blur-sm flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;
