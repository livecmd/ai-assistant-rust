import React from 'react';
import { Loader2, Sparkles, Zap } from 'lucide-react';

interface UnifiedGenerateButtonProps {
    onClick: () => void;
    isGenerating: boolean;
    disabled?: boolean;
    label?: string;
    processingLabel?: string;
    className?: string;
    variant?: 'default' | 'gradient' | 'glow';
    icon?: React.ReactNode;
}

export const UnifiedGenerateButton: React.FC<UnifiedGenerateButtonProps> = ({
    onClick,
    isGenerating,
    disabled = false,
    label,
    processingLabel,
    className = "",
    variant = 'gradient',
    icon
}) => {
    const baseStyles = "relative flex min-h-[56px] w-full items-center justify-center overflow-hidden rounded-[28px] px-6 py-3.5 text-sm font-bold tracking-[0.2em] transition-all duration-300";

    const variantStyles = {
        default: isGenerating || disabled
            ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500 shadow-sm"
            : "bg-[#1677ff] hover:bg-[#0d63db] text-white active:scale-[0.98]",
        gradient: isGenerating || disabled
            ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500 shadow-sm"
            : "bg-gradient-to-r from-[#1677ff] to-[#4d9dff] hover:from-[#0d63db] hover:to-[#3a91fa] text-white active:scale-[0.98]",
        glow: isGenerating || disabled
            ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500 shadow-sm"
            : "bg-[#1677ff] hover:bg-[#0d63db] text-white active:scale-[0.98]"
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isGenerating || disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {/* Animated Background Shine Effect */}
            {!isGenerating && !disabled && variant === 'gradient' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
            )}

            {/* Content */}
            <span className="relative flex items-center justify-center gap-3">
                {isGenerating ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        <span className="animate-pulse">
                            {processingLabel || "生成中..."}
                        </span>
                    </>
                ) : (
                    <>
                        {icon || (variant === 'gradient' ? <Sparkles size={18} /> : <Zap size={18} />)}
                        <span>{label || "生成"}</span>
                    </>
                )}
            </span>

            {/* Ripple Effect Container */}
            {!isGenerating && !disabled && (
                <span className="absolute inset-0 overflow-hidden rounded-xl">
                    <span className="absolute inset-0 bg-white/5 scale-0 group-active:scale-100 transition-transform duration-300 origin-center rounded-full"></span>
                </span>
            )}
        </button>
    );
};
