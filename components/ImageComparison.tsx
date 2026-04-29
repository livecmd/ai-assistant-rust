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
      // If we are not actively dragging (clicking), we still update on hover for a "scan" effect
      // unless the user prefers click-to-drag. 
      // The requirement said "mouse move up" (hover), so we update on hover.
      if (!isResizing) {
        handleMouseMove(e);
      }
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden cursor-crosshair group select-none bg-black border border-gray-700"
        onMouseMove={handleContainerMouseMove}
        onMouseDown={handleMouseDown}
    >
      {/* Background Image (After/Result) */}
      <img
        src={afterImage}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain"
      />
      
      {/* Label for After */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded border border-white/20">
        {afterLabel}
      </div>

      {/* Foreground Image (Before/Target) - Clipped */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-primary bg-black"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 w-[100vw] max-w-none h-full object-contain"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
        />
         {/* Label for Before */}
         <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded border border-white/20">
            {beforeLabel}
        </div>
      </div>

      {/* Slider Handle Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)] z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
          </svg>
        </div>
      </div>
    </div>
  );
};