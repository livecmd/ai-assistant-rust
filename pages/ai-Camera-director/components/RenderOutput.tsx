
import React, { useState, useRef, useEffect } from 'react';
import { GenerationState } from '../types';
import { useTranslation } from '../../../hooks/useTranslation';

interface RenderOutputProps {
    generationState: GenerationState;
    setPromptOverride: (val: string) => void;
    onDownload: (image: string, filename: string) => void;
}

const RenderOutput: React.FC<RenderOutputProps> = ({ generationState, setPromptOverride, onDownload }) => {
    const { t } = useTranslation();
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset view when a new image is generated
    useEffect(() => {
        if (generationState.resultImage) {
            resetView();
        }
    }, [generationState.resultImage]);

    const resetView = () => {
        setScale(1);
        setPan({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!generationState.resultImage) return;
        e.stopPropagation(); // Stop parent scroll
        // Determine zoom direction
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        // Clamp zoom level
        const newScale = Math.min(Math.max(0.5, scale * delta), 8);
        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!generationState.resultImage) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPan({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleDownload = () => {
        if (generationState.resultImage) {
            onDownload(generationState.resultImage, `render_${Date.now()}.png`);
        }
    };

    const hasResult = generationState.resultImage;

    return (
        <div className="flex flex-col flex-grow h-[65%] border-b border-hud-border border-gray-400 relative bg-hud-dark/20">

            {/* Header */}
            <div className="absolute top-0 left-4 z-10 pointer-events-none">
                <h2 className="text-sm font-bold text-slate-300 tracking-widest">03. {t('camera.renderOutputResult')}</h2>
            </div>

            {/* Controls Overlay */}
            {hasResult && (
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="bg-[#0f172a] border border-slate-600 text-[12px] text-slate-300 px-2 py-1 hover:text-slate-100 hover:border-indigo-400 transition-colors font-bold flex items-center gap-1"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        {t('camera.downloadResult')}
                    </button>
                    <button
                        onClick={resetView}
                        className="bg-[#0f172a] border border-slate-600 text-[12px] text-slate-300 px-2 py-1 hover:text-slate-100 hover:border-indigo-400 transition-colors font-bold"
                    >
                        {t('camera.resetView')}
                    </button>
                    <div className="bg-[#0f172a] border border-slate-600 text-[12px] text-slate-300 px-2 py-1 font-bold tabular-nums">
                        {Math.round(scale * 100)}%
                    </div>
                </div>
            )}

            {/* Main Display Area */}
            <div
                ref={containerRef}
                onWheel={handleWheel}
                className="flex-grow w-full h-full relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: isDragging ? 'grabbing' : hasResult ? 'grab' : 'default' }}
            >

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-grid-pattern bg-[length:50px_50px] opacity-10 pointer-events-none"></div>

                {generationState.resultImage ? (
                    <div
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                        className="flex items-center justify-center max-w-full max-h-full"
                    >
                        <img
                            src={generationState.resultImage}
                            alt="Generated Output"
                            className="max-h-[90vh] max-w-[90vw] shadow-[0_0_30px_rgba(6,182,212,0.15)] border border-hud-border/50 pointer-events-none select-none"
                        />
                    </div>
                ) : (
                    <div className="text-hud-text/20 text-4xl font-bold tracking-tighter select-none">
                        {generationState.isGenerating ? "正在处理数据..." : "无数据源 (NO DATA)"}
                    </div>
                )}

                {/* Loading Overlay */}
                {generationState.isGenerating && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm pointer-events-auto cursor-wait">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-1 bg-hud-blue/30 overflow-hidden relative">
                                <div className="absolute inset-0 text-slate-300 animate-linear-progress origin-left"></div>
                            </div>
                            <span className="text-[12px] text-slate-300 animate-pulse">
                                正在渲染场景...
                            </span>
                        </div>
                    </div>
                )}

                {/* Error Overlay */}
                {generationState.error && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 pointer-events-auto">
                        <div className="border border-red-500/50 bg-red-900/20 p-4 max-w-md text-center">
                            <h3 className="text-red-500 font-bold text-xs mb-2">系统错误 (SYSTEM ERROR)</h3>
                            <p className="text-red-300/70 text-[10px]">{generationState.error}</p>
                        </div>
                    </div>
                )}

            </div>

            {/* Command Log / Prompt Override */}
            <div className="h-16 border-t border-hud-border border-gray-400 bg-[#0f172a] flex flex-col p-2 px-4 justify-center z-30">
                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-300 mb-1">
                    <span>➜</span> <span>命令日志 / 提示词覆盖 (COMMAND LOG)</span>
                </div>
                <input
                    type="text"
                    value={generationState.promptOverride}
                    onChange={(e) => setPromptOverride(e.target.value)}
                    placeholder="等待输入... (waiting for input)"
                    className="bg-transparent border-none outline-none text-[12px] text-slate-400 w-full placeholder-text-slate-400"
                />
            </div>

            <style>{`
        @keyframes linear-progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-linear-progress {
            animation: linear-progress 1.5s infinite linear;
        }
      `}</style>
        </div>
    );
};

export default RenderOutput;
