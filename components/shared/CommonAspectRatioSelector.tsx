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
        <div className="common-aspect-ratio-selector space-y-3">
            <label className="common-field-label tracking-wider">
                {label}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
                {options.map((ratio) => (
                    <button
                        key={ratio}
                        onClick={() => onSelect(ratio)}
                        className={`common-aspect-ratio-option py-1.5 text-[10px] font-medium rounded-lg border transition-all ${selectedRatio === ratio
                            ? "is-selected"
                            : ""
                            }`}
                    >
                        <span className="capitalize">{ratio}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
