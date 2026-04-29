
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryGalleryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, onSelect }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50 flex-1 min-h-0 flex flex-col">
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        生成历史 ({history.length})
      </h2>
      <div className="grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar pr-1">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="aspect-square rounded-lg overflow-hidden border border-gray-700 cursor-pointer hover:border-primary hover:ring-2 hover:ring-primary/50 transition-all relative group bg-black"
          >
            <img 
              src={item.url} 
              alt="History" 
              className="w-full h-full object-cover" 
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] text-white font-medium bg-black/60 px-1.5 py-0.5 rounded">查看</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
