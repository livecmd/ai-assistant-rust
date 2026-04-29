import React from 'react';
import { Download, Video, Image as ImageIcon, Sparkles } from 'lucide-react';
import { message } from 'antd';
import LoadingIndicator from './LoadingIndicator';

interface UnifiedPreviewProps {
    type: 'image' | 'video';
    src: string | null;
    isLoading: boolean;
    loadingText?: string;
    emptyText?: string;
    emptySubtext?: string;
    placeholderIcon?: React.ReactNode;
    onDownload?: () => void;
    className?: string;
    children?: React.ReactNode; // Content override (e.g. comparison slider)
}

export const UnifiedPreview: React.FC<UnifiedPreviewProps> = ({
    type,
    src,
    isLoading,
    loadingText,
    emptyText = "Ready to Generate",
    emptySubtext = "Configure settings and click generate to start",
    placeholderIcon,
    onDownload,
    className = "",
    children
}) => {
    const handleDownload = () => {
        message.success(`${type === 'video' ? '视频' : '图片'}已开始下载，请查看您的下载文件夹`);
        if (onDownload) {
            onDownload();
        } else if (src) {
            const link = document.createElement('a');
            link.href = src;
            link.download = `generated-${Date.now()}.${type === 'video' ? 'mp4' : 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className={`dialogBox relative overflow-hidden ${className}`}>
            {/* Ambient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 animate-fadeIn">
                    <LoadingIndicator size="lg" showMessage={true} />
                    {loadingText && (
                        <p className="text-indigo-400 animate-pulse text-sm tracking-widest font-medium mt-4">{loadingText}</p>
                    )}
                </div>
            ) : children ? (
                <div className="preview-container w-full h-full flex items-center justify-center relative group animate-fadeIn">
                    {children}
                    {onDownload && (
                        <button
                            onClick={handleDownload}
                            className="absolute top-4 right-4 bg-slate-900/80 hover:bg-indigo-600 backdrop-blur-md text-white p-3 rounded-xl transition-all duration-300 border border-white/10 opacity-0 group-hover:opacity-100 shadow-xl z-20 hover:scale-110 active:scale-95"
                            title="Download"
                        >
                            <Download size={20} />
                        </button>
                    )}
                </div>
            ) : src ? (
                <div className="preview-container group relative w-full h-full flex items-center justify-center animate-scaleIn">
                    {type === 'video' ? (
                        <video
                            src={src}
                            controls
                            autoPlay
                            loop
                            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain ring-1 ring-white/10"
                        />
                    ) : (
                        <img
                            src={src}
                            alt="Result"
                            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                    )}

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>

                    <button
                        onClick={handleDownload}
                        className="absolute top-4 right-4 bg-slate-900/80 hover:bg-indigo-600 backdrop-blur-md text-white p-3 rounded-xl transition-all duration-300 border border-white/10 opacity-0 group-hover:opacity-100 shadow-xl z-10 hover:scale-110 active:scale-95"
                        title="Download"
                    >
                        <Download size={20} />
                    </button>
                </div>
            ) : (
                <div className="empty-state text-center py-16 animate-fadeIn">
                    {/* Animated Icon Container */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl animate-pulse"></div>
                        <div className="relative w-full h-full bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center justify-center backdrop-blur-sm">
                            {placeholderIcon || (type === 'video' ? (
                                <Video size={40} className="text-slate-500" />
                            ) : (
                                <ImageIcon size={40} className="text-slate-500" />
                            ))}
                        </div>
                        {/* Sparkle Effects */}
                        <Sparkles size={16} className="absolute -top-2 -right-2 text-indigo-400 animate-pulse" />
                        <Sparkles size={12} className="absolute -bottom-1 -left-1 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>

                    <p className="text-xl font-semibold text-slate-200 tracking-widest mb-2">{emptyText}</p>
                    <p className="text-xs text-slate-500 tracking-wider max-w-xs mx-auto">{emptySubtext}</p>

                    {/* Subtle Animated Line */}
                    <div className="mt-6 mx-auto w-16 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-pulse"></div>
                </div>
            )}
        </div>
    );
};
