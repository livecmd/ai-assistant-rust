import React from 'react';
import { HistoryItem } from '../types';

interface HistoryStripProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const HistoryStrip: React.FC<HistoryStripProps> = ({ history, onSelect }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full h-32 flex flex-col gap-2 mt-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="text-xs font-semibold text-gray-500 tracking-wider pl-1">History & Gallery</div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-indigo-500 hover:scale-105 transition-all relative group"
            onClick={() => onSelect(item)}
          >
            <img
              src={item.generatedImage}
              alt="History"
              className="w-full h-full object-cover"
            />
            {/* Download Overlay Button */}
            <a
              href={item.generatedImage}
              download={`render-${item.id}.png`}
              className="absolute bottom-1 right-1 p-1 bg-black/60 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600"
              onClick={(e) => e.stopPropagation()}
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryStrip;