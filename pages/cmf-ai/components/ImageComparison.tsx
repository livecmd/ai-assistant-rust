import React, { useState, useRef, useEffect } from 'react';

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "Generated"
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return;

    // Calculate position relative to the container
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;

    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Track container size for proper image sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Add global event listeners for smoother dragging even if mouse leaves container
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        handleMouseMove(e);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Also support simple hover mode if not dragging, for "move mouse to see comparison" effect
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) {
      handleMouseMove(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden cursor-crosshair group select-none border border-slate-700/50"
      onMouseMove={handleContainerMouseMove}
      onMouseDown={handleMouseDown}
    >
      {/* Background Image (After/Result) - centered with object-contain */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={afterImage}
          alt="After"
          className="max-w-full max-h-full object-contain"
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Label for After */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded border border-white/20 z-20">
        {afterLabel}
      </div>

      {/* Foreground Image (Before/Target) - Clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <div className="absolute inset-0 flex items-center justify-center" style={{ width: containerSize.width || '100%' }}>
          <img
            src={beforeImage}
            alt="Before"
            className="max-w-full max-h-full object-contain"
            style={{ maxWidth: containerSize.width || '100%' }}
          />
        </div>
        {/* Label for Before */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded border border-white/20 z-20">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
          </svg>
        </div>
      </div>
    </div>
  );
};