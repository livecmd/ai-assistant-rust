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
        { id: "nano-banana", name: "base", description: "Fast & Efficient" },
        { id: "nano-banana-pro", name: "pro", description: "High Quality (4K)" }
    ]
}) => {
    return (
        <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                模型选择(Model Selection)
            </label>
            <div className="grid grid-cols-2 gap-3">
                {models.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onSelect(m.id)}
                        className={`p-4 text-left rounded-xl border-2 transition-all ${selectedModel === m.id
                            ? "bg-indigo-800/30 p-4 rounded-2xl border border-indigo-300/50"
                            : "bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50"
                            }`}
                    >
                        <p className={`text-sm font-bold capitalize ${selectedModel === m.id ? "text-indigo-300" : "text-gray-400"
                            }`}>
                            {m.name}
                        </p>
                        {m.description && (
                            <p className="text-[11px] text-gray-300 leading-tight mt-1">
                                {m.description}
                            </p>
                        )}
                        {m.price && (
                            <p className="text-[11px] text-emerald-300 leading-tight mt-2 font-medium">
                                {m.price}
                            </p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
