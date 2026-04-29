import React from 'react';

interface SliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center text-sm font-medium text-gray-300">
        <span>版花还原度设置</span>
        <span className="text-primary">{value}%</span>
      </div>
      
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-secondary disabled:opacity-50"
      />

      <div className="flex justify-between text-xs text-gray-500 px-1">
        <div className="text-left w-1/3">
          <span className="block font-bold text-gray-400">严格遵循</span>
          (复制纹理)
        </div>
        <div className="text-center w-1/3">
          <span className="block font-bold text-gray-400">平衡</span>
          (自然融合)
        </div>
        <div className="text-right w-1/3">
          <span className="block font-bold text-gray-400">创意适配</span>
          (根据产品重绘)
        </div>
      </div>
    </div>
  );
};