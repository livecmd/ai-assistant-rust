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
        <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                模型选择(Model Selection)
            </label>
            <div className="grid grid-cols-2 gap-3">
                {models.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onSelect(m.id)}
                        className={`p-3 text-left rounded-xl border-2 transition-all ${selectedModel === m.id
                            ? "bg-[linear-gradient(135deg,#1677ff,#4d9dff)] rounded-2xl border border-blue-500 text-white"
                            : "bg-white rounded-2xl border border-slate-200 text-slate-700 hover:border-blue-200"
                            }`}
                        style={selectedModel === m.id ? { color: "#ffffff" } : undefined}
                    >
                        <p
                            className={`text-[12px] font-bold capitalize ${selectedModel === m.id ? "text-white" : "text-slate-700"
                                }`}
                            style={selectedModel === m.id ? { color: "#ffffff" } : undefined}
                        >
                            {m.name}
                        </p>
                        {m.description && (
                            <p
                                className={`text-[10px] leading-tight mt-1 ${selectedModel === m.id ? "text-white/85" : "text-slate-500"}`}
                                style={selectedModel === m.id ? { color: "rgba(255, 255, 255, 0.85)" } : undefined}
                            >
                                {m.description}
                            </p>
                        )}
                        {m.price && (
                            <p
                                className={`text-[10px] leading-tight mt-2 font-medium ${selectedModel === m.id ? "text-white" : "text-[#1677ff]"}`}
                                style={selectedModel === m.id ? { color: "#ffffff" } : undefined}
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
