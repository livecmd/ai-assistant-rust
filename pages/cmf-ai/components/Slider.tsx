import React from 'react';

interface SliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="cmf-adherence-slider w-full flex flex-col gap-3 p-4 rounded-xl">
      <div className="cmf-adherence-slider__header flex justify-between items-center text-sm font-medium">
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
        className="cmf-adherence-slider__range w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
      />

      <div className="cmf-adherence-slider__legend flex justify-between text-xs px-1">
        <div className="text-left w-1/3">
          <span className="block font-bold">严格遵循</span>
          (复制纹理)
        </div>
        <div className="text-center w-1/3">
          <span className="block font-bold">平衡</span>
          (自然融合)
        </div>
        <div className="text-right w-1/3">
          <span className="block font-bold">创意适配</span>
          (根据产品重绘)
        </div>
      </div>
    </div>
  );
};
