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
            <label className="text-xs font-bold text-gray-300 tracking-wider">
                {label}
            </label>
            <div className="grid grid-cols-6 gap-2">
                {options.map((ratio) => (
                    <button
                        key={ratio}
                        onClick={() => onSelect(ratio)}
                        className={`py-2 text-[10px] font-medium rounded-lg border transition-all ${selectedRatio === ratio
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-500 hover:border-indigo-300"
                            }`}
                    >
                        <span className="capitalize">{ratio}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
