import React from 'react';

export interface ModelOption {
    id: string;
    name: string;
    description?: string;
    price?: string;
}

interface CommonModelSelectorProps {
    selectedModel: string;
    onSelect: (id: any) => void;
    models?: ModelOption[];
}

export const CommonModelSelector: React.FC<CommonModelSelectorProps> = ({
    selectedModel,
    onSelect,
    models = [
        { id: "nano-banana", name: "Base", description: "Fast & Efficient" },
        { id: "nano-banana-pro", name: "Pro", description: "High Quality (4K)" }
    ]
}) => {
    return (
        <div className="common-model-selector space-y-3">
            <label className="common-field-label flex items-center gap-2">
                模型选择(Model Selection)
            </label>
            <div className="grid grid-cols-2 gap-3">
                {models.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onSelect(m.id)}
                        className={`common-model-option flex h-full flex-col items-start p-3 text-left rounded-2xl border transition-all ${selectedModel === m.id
                            ? "is-selected"
                            : ""
                            }`}
                    >
                        <div className="common-model-option__content w-full">
                            <p
                                className={`common-model-option__name text-[12px] font-bold capitalize ${selectedModel === m.id ? "is-selected" : ""
                                    }`}
                            >
                                {m.name}
                            </p>
                            {m.description && (
                                <p
                                    className={`common-model-option__description text-[10px] leading-tight mt-1 ${selectedModel === m.id ? "is-selected" : ""}`}
                                >
                                    {m.description}
                                </p>
                            )}
                        </div>
                        {m.price && (
                            <p
                                className={`common-model-option__price text-[10px] leading-tight mt-2 font-medium ${selectedModel === m.id ? "is-selected" : ""}`}
                            >
                                {m.price}
                            </p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
