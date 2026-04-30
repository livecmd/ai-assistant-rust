import React from 'react';

interface CommonAspectRatioSelectorProps {
    selectedRatio: string;
    onSelect: (ratio: string) => void;
    options?: string[];
    label?: string;
}

export const CommonAspectRatioSelector: React.FC<CommonAspectRatioSelectorProps> = ({
    selectedRatio,
    onSelect,
    options = ["auto", "1:1", "3:4", "4:3", "9:16", "16:9"],
    label = "长宽比(Aspect Ratio)"
}) => {
    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600 tracking-wider">
                {label}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
                {options.map((ratio) => (
                    <button
                        key={ratio}
                        onClick={() => onSelect(ratio)}
                        className={`py-1.5 text-[10px] font-medium rounded-lg border transition-all ${selectedRatio === ratio
                            ? "bg-[#1677ff] text-white border-[#1677ff] shadow-lg shadow-[#1677ff]/20"
                            : "bg-[#f5f7fb] text-slate-600 border-slate-200 hover:border-[#1677ff] hover:text-[#1677ff]"
                            }`}
                    >
                        <span className="capitalize">{ratio}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
