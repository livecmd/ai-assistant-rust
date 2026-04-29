import React from 'react';

export type ImageCount = 1 | 2 | 3 | 4;

interface ImageCountSelectorProps {
    value: ImageCount;
    onChange: (count: ImageCount) => void;
    label?: string;
    disabled?: boolean;
}

const counts: ImageCount[] = [1, 2, 3, 4];

export const ImageCountSelector: React.FC<ImageCountSelectorProps> = ({
    value,
    onChange,
    label = "生成数量(Generate quantity)",
    disabled = false
}) => {
    return (
        <div className="image-count-selector blobk-bg">
            {label && (
                <label className="block text-sm font-bold text-slate-300 mb-2 tracking-wider">
                    {label}
                </label>
            )}
            <div className="flex gap-2">
                {counts.map((count) => (
                    <button
                        key={count}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(count)}
                        className={`
                            flex-1 py-2 px-3 rounded-lg text-sm font-medium
                            transition-all duration-200 border
                            ${value === count
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {count}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ImageCountSelector;
