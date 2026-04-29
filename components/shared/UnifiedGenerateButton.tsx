import React from 'react';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

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
    const { t } = useTranslation();

    const baseStyles = "relative w-full py-4 rounded-xl font-bold text-sm tracking-widest transition-all duration-300 overflow-hidden";

    const variantStyles = {
        default: isGenerating || disabled
            ? "bg-slate-700 cursor-not-allowed opacity-70"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 active:scale-[0.98]",
        gradient: isGenerating || disabled
            ? "bg-slate-700 cursor-not-allowed opacity-70 text-slate-400"
            : "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30 active:scale-[0.98] hover:shadow-xl hover:shadow-indigo-900/40",
        glow: isGenerating || disabled
            ? "bg-slate-700 cursor-not-allowed opacity-70 text-slate-400"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] active:scale-[0.98]"
    };

    return (
        <button
            onClick={onClick}
            disabled={isGenerating || disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={{ borderRadius: '36px 36px 36px 36px' }}
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
                            {processingLabel || t('common.processing') || "PROCESSING..."}
                        </span>
                    </>
                ) : (
                    <>
                        {icon || (variant === 'gradient' ? <Sparkles size={18} /> : <Zap size={18} />)}
                        <span>{label || t('common.generate') || "GENERATE"}</span>
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
