import React from 'react';

export type ImageCount = 1 | 2 | 3 | 4;

interface ImageCountSelectorProps {
    value: ImageCount;
    onChange: (count: ImageCount) => void;
    label?: string;
    disabled?: boolean;
}

const counts: ImageCount[] = [1, 2, 3, 4];
const selectedBlueClass =
    'bg-[linear-gradient(90deg,#1677ff,#4d9dff)] border-[#1677ff] text-white shadow-lg shadow-[#1677ff]/25';

export const ImageCountSelector: React.FC<ImageCountSelectorProps> = ({
    value,
    onChange,
    label = "生成数量(Generate quantity)",
    disabled = false
}) => {
    return (
        <div className="image-count-selector blobk-bg">
            {label && (
                <label className="block text-xs font-bold text-slate-600 mb-2 tracking-wider">
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
                            flex-1 py-1.5 px-2 rounded-lg text-xs font-medium
                            transition-all duration-200 border
                            ${value === count
                                ? selectedBlueClass
                                : 'bg-[#f5f7fb] border-slate-200 text-slate-600 hover:border-[#1677ff] hover:text-[#1677ff]'
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
