
import React from 'react';
import { ArtStyle } from '../types';

interface StyleSelectorProps {
  selectedStyle: ArtStyle;
  onSelect: (style: ArtStyle) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect }) => {
  const styles = [
    {
      type: ArtStyle.MATCH_SOURCE,
      label: '和原图风格一致',
      icon: 'fa-clone',
      desc: 'Inherit original medium'
    },
    {
      type: ArtStyle.REALISTIC,
      label: '写实摄影',
      icon: 'fa-camera-retro',
      desc: 'Photorealistic output'
    },
    {
      type: ArtStyle.REFERENCE_AESTHETIC,
      label: '参考图风格',
      icon: 'fa-wand-magic-sparkles',
      desc: 'Enhanced ref aesthetic'
    },
  ];

  return (
    <div className="space-y-4 blobk-bg">
      <label className="block text-sm font-medium text-slate-400">生成风格(Generation Style)</label>
      <div className="flex flex-col gap-3">
        {styles.map((style) => (
          <button
            key={style.type}
            onClick={() => onSelect(style.type)}
            className={`flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${selectedStyle === style.type
              ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${selectedStyle === style.type ? 'bg-indigo-600' : 'bg-slate-800 group-hover:bg-slate-700'
              }`}>
              <i className={`fas ${style.icon} ${selectedStyle === style.type ? 'text-white' : 'text-slate-400'} text-lg`}></i>
            </div>
            <div>
              <span className={`block text-sm font-bold ${selectedStyle === style.type ? 'text-white' : 'text-slate-300'
                }`}>
                {style.label}
              </span>
              <span className="text-[10px] text-slate-500 font-bold tracking-tight">
                {style.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
