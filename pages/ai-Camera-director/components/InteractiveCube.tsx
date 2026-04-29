import React, { useRef, useEffect, useState } from 'react';
import { CameraParams } from '../types';

interface InteractiveCubeProps {
  params: CameraParams;
  setParams: React.Dispatch<React.SetStateAction<CameraParams>>;
}

// Updated to include full 360 degree rotation range
const ROT_H_STEPS = [-180, -135, -90, -45, 0, 45, 90, 135, 180];
const ROT_V_STEPS = [-1, 0, 1];
const ZOOM_STEPS = [0, 5, 10];

const snapTo = (val: number, steps: number[]) => {
  return steps.reduce((prev, curr) =>
    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
  );
};

const InteractiveCube: React.FC<InteractiveCubeProps> = ({ params, setParams }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number, y: number, h: number, v: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Store initial values at start of drag to allow for continuous feel before snapping
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      h: params.rotationH,
      v: params.rotationV
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom control with discrete steps
    const direction = Math.sign(e.deltaY); // +1 for down (zoom out/decrease), -1 for up (zoom in/increase)

    setParams(prev => {
      const currentIndex = ZOOM_STEPS.indexOf(prev.zoom);
      let nextIndex = currentIndex === -1 ? 0 : currentIndex;

      // Wheel up = increase zoom (closer), Wheel down = decrease zoom (further)
      // Note: standard mouse wheel down is +Y.
      if (direction < 0) {
        nextIndex = Math.min(ZOOM_STEPS.length - 1, nextIndex + 1);
      } else if (direction > 0) {
        nextIndex = Math.max(0, nextIndex - 1);
      }

      return { ...prev, zoom: ZOOM_STEPS[nextIndex] };
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStart.current) return;

      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      // Calculate raw "virtual" values based on drag distance
      // Sensitivity: 0.8 deg per pixel for H (increased from 0.5 to cover wider range), 0.01 unit per pixel for V
      const rawH = dragStart.current.h + deltaX * 0.8;
      const rawV = dragStart.current.v + deltaY * 0.01;

      // Snap to nearest allowed step
      const snappedH = snapTo(rawH, ROT_H_STEPS);
      const snappedV = snapTo(rawV, ROT_V_STEPS);

      setParams(prev => {
        if (prev.rotationH === snappedH && prev.rotationV === snappedV) return prev;
        return {
          ...prev,
          rotationH: snappedH,
          rotationV: snappedV
        };
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStart.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setParams]);

  // Visual parameters derived from state
  const rotX = params.rotationV * 45; // Map -1..1 to -45deg..45deg
  const rotY = params.rotationH;
  // Visual zoom scale
  const scale = 0.8 + (params.zoom / 20);

  return (
    <div className="flex w-full h-full border-hud-border border-gray-400 bg-[#0f172a] relative overflow-hidden">
      {/* Label */}
      <div className="absolute top-4 left-4 text-[12px] font-bold text-slate-300 z-10">
        <span className="text-hud-blue mr-2">■</span>交互式魔方 (INTERACTIVE_CUBE)
      </div>

      {/* Right side zoom slider visualizer */}
      <div className="absolute right-0 top-0 bottom-0 w-12 border-l border-gray-400 border-hud-border flex flex-col items-center justify-center py-4 z-10 bg-[#0f172a]">
        {/* <span className="text-[12px] text-slate-300 mb-2 mr-20 writing-vertical-rl rotate-180 translate-x-[2px] whitespace-nowrap">[拖动立方体 // 滑动缩放]</span> */}
        <div className="h-full w-[1px] bg-hud-border relative">
          <div
            className="absolute w-2 h-2 bg-hud-blue -left-[3px] transition-all duration-300"
            style={{ bottom: `${(params.zoom / 10) * 100}%` }}
          ></div>
          {/* Zoom ticks */}
          <div className="absolute w-full h-full left-0 top-0 pointer-events-none">
            <div className="absolute left-1 bottom-0 w-1 h-[1px] bg-hud-text/20"></div>
            <div className="absolute left-1 bottom-1/2 w-1 h-[1px] bg-hud-text/20"></div>
            <div className="absolute left-1 bottom-full w-1 h-[1px] bg-hud-text/20"></div>
          </div>
        </div>
        <div className="mt-2 text-[8px] text-hud-white">{params.zoom.toFixed(0)}</div>
      </div>

      {/* 3D Stage */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing perspective-container bg-grid-pattern bg-[length:40px_40px] opacity-80"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <div
          className="cube-3d relative w-[100px] h-[100px] transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${-rotX}deg) rotateY(${rotY}deg) scale3d(${scale}, ${scale}, ${scale})`
          }}
        >
          <div className="cube-face face-front">前</div>
          <div className="cube-face face-back">后</div>
          <div className="cube-face face-right">右</div>
          <div className="cube-face face-left">左</div>
          <div className="cube-face face-top">上</div>
          <div className="cube-face face-bottom">下</div>

          {/* Internal Core for visual effect */}
          <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-hud-cyan/20 blur-md transform -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
        </div>
      </div>

      {/* Floating Params Display in Cube Area */}
      <div className="absolute bottom-4 left-4 text-[12px] text-slate-300 space-y-1 pointer-events-none">
        <div>旋转 (ROT): {params.rotationH}°</div>
        <div>倾斜 (TILT): {params.rotationV}</div>
      </div>

      {/* Gemini Credits */}
      {/* <div className="absolute bottom-2 right-14 text-[12px] text-slate-300 tracking-widest">
             Gemini 视觉模型 2.5 // Flash Attention // 构建版本 89234
        </div> */}
    </div>
  );
};

export default InteractiveCube;