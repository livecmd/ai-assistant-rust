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
                <label className="common-field-label mb-2 block">
                    {label}
                </label>
            )}
            <div className="common-segmented-bar flex gap-2">
                {counts.map((count) => (
                    <button
                        key={count}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(count)}
                        className={`
                            common-segmented-option flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium
                            ${value === count
                                ? 'is-selected'
                                : ''
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
