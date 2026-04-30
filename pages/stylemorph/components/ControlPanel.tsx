import React, { useState, useRef } from "react";
import {
  ImageState,
  GenerationConfig,
  Rect,
  Point,
  AspectRatio,
  ImageSize,
} from "../types";
import { UnifiedControlPanel } from "../../../components/shared/UnifiedControlPanel";
import { UnifiedGenerateButton } from "../../../components/shared/UnifiedGenerateButton";

interface ControlPanelProps {
  imageA: ImageState;
  setImageA: (img: ImageState) => void;
  imageB: ImageState;
  setImageB: (img: ImageState) => void;
  config: GenerationConfig;
  setConfig: (config: GenerationConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onOpenKeySelector: () => void;
}

type ToolType = "rect" | "lasso";
type TargetType = "A" | "B";

const ControlPanel: React.FC<ControlPanelProps> = ({
  imageA,
  setImageA,
  imageB,
  setImageB,
  config,
  setConfig,
  onGenerate,
  isGenerating,
  onOpenKeySelector,
}) => {
  const [modalTarget, setModalTarget] = useState<TargetType | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("rect");
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const [isDrawingLasso, setIsDrawingLasso] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (img: ImageState) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        const base64 = preview.split(",")[1];

        const img = new Image();
        img.onload = () => {
          setter({
            file,
            preview,
            base64,
            width: img.naturalWidth,
            height: img.naturalHeight,
            mask: null,
            lassoPath: null,
          });
        };
        img.src = preview;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const getRelativePos = (e: React.MouseEvent) => {
    if (!modalContainerRef.current) return { x: 0, y: 0 };
    const rect = modalContainerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const pos = getRelativePos(e);
    if (activeTool === "rect") {
      setStartPos(pos);
      setCurrentPos(pos);
    } else {
      setIsDrawingLasso(true);
      setLassoPoints([pos]);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const pos = getRelativePos(e);
    if (activeTool === "rect" && startPos) {
      setCurrentPos(pos);
    } else if (activeTool === "lasso" && isDrawingLasso) {
      const lastPoint = lassoPoints[lassoPoints.length - 1];
      const dist = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);
      if (dist > 2) {
        setLassoPoints([...lassoPoints, pos]);
      }
    }
  };

  const onMouseUp = () => {
    if (!modalContainerRef.current || !modalTarget) return;
    const widthPx = modalContainerRef.current.offsetWidth;
    const heightPx = modalContainerRef.current.offsetHeight;

    const currentImg = modalTarget === "A" ? imageA : imageB;
    const setImg = modalTarget === "A" ? setImageA : setImageB;

    if (activeTool === "rect" && startPos && currentPos) {
      const x = Math.max(0, Math.min(startPos.x, currentPos.x));
      const y = Math.max(0, Math.min(startPos.y, currentPos.y));
      const w = Math.min(widthPx - x, Math.abs(startPos.x - currentPos.x));
      const h = Math.min(heightPx - y, Math.abs(startPos.y - currentPos.y));

      if (w > 5 && h > 5) {
        const normalizedMask: Rect = {
          x: Math.round((x / widthPx) * 1000),
          y: Math.round((y / heightPx) * 1000),
          width: Math.round((w / widthPx) * 1000),
          height: Math.round((h / heightPx) * 1000),
        };
        setImg({ ...currentImg, mask: normalizedMask, lassoPath: null });
      }
      setStartPos(null);
      setCurrentPos(null);
    } else if (activeTool === "lasso" && isDrawingLasso) {
      if (lassoPoints.length > 5) {
        const normalizedPath = lassoPoints.map((p) => ({
          x: Math.round((p.x / widthPx) * 1000),
          y: Math.round((p.y / heightPx) * 1000),
        }));
        setImg({ ...currentImg, lassoPath: normalizedPath, mask: null });
      }
      setIsDrawingLasso(false);
      setLassoPoints([]);
    }
  };

  const clearMask = (target: TargetType) => {
    if (target === "A") setImageA({ ...imageA, mask: null, lassoPath: null });
    else setImageB({ ...imageB, mask: null, lassoPath: null });
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageAspectRatio(img.naturalWidth / img.naturalHeight);
  };

  const formatLassoSvgPath = (points: Point[], scale: number = 1) => {
    if (points.length === 0) return "";
    return (
      `M ${points[0].x * scale} ${points[0].y * scale} ` +
      points
        .slice(1)
        .map((p) => `L ${p.x * scale} ${p.y * scale}`)
        .join(" ") +
      " Z"
    );
  };

  const formatNormalizedLassoPathData = (path: Point[]) => {
    if (!path || path.length === 0) return "";
    return (
      `M ${path[0].x} ${path[0].y} ` +
      path
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(" ") +
      " Z"
    );
  };

  const getWeightDescription = (w: number) => {
    if (w < 25) return "Conservative: Focus on texture only";
    if (w < 50) return "Balanced: Blend A and B elements";
    if (w < 75) return "Aggressive: Deep redesign with B style";
    return "Total Freedom: AI completely reworks the style";
  };

  const getDepthDescription = (d: number) => {
    if (d < 30) return "Rigid: Locked to A's structure";
    if (d < 70) return "Medium: Allows some deformation";
    return "Loose: Image A is just a guideline";
  };

  const activeImage = modalTarget === "A" ? imageA : imageB;
  const ratios: AspectRatio[] = ["AUTO", "1:1", "16:9", "9:16", "4:3", "3:4"];
  const sizes: ImageSize[] = ["1K", "2K", "4K"];
  const batchSizes = [1, 2, 3, 4];

  return (
    <div className="panel-stack stylemorph-control">
      <h1 className="stylemorph-page-title">
        造型迁移
      </h1>
      <UnifiedControlPanel className="flex-1 action-box">
        {false && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200">模型选择(Model Selection)</h2>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-xl">
              {/* <button
            onClick={() => setConfig({ ...config, model: 'gemini-2.5-flash-image' })}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${config.model === 'gemini-2.5-flash-image' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Flash
          </button> */}
              <button
                onClick={() =>
                  setConfig({ ...config, model: "gemini-3-pro-image-preview" })
                }
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${config.model === "gemini-3-pro-image-preview"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                Pro 3.0
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="stylemorph-block-title">
            1. 上传图像与选区
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative text-center">
              <label className="stylemorph-upload-label">
                结构图 (A)
              </label>
              <input
                type="file"
                ref={fileInputARef}
                className="hidden"
                onChange={(e) => handleFileChange(e, setImageA)}
                accept="image/*"
              />
              <div
                onClick={() =>
                  !imageA.preview && fileInputARef.current?.click()
                }
                className="relative group aspect-square rounded-2xl border-2 border-dashed overflow-hidden transition-all cursor-pointer flex items-center justify-center stylemorph-upload-card stylemorph-upload-card--a"
              >
                {imageA.preview ? (
                  <>
                    <img
                      src={imageA.preview}
                      alt="A"
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 pointer-events-none p-2">
                      <svg viewBox="0 0 1000 1000" className="w-full h-full">
                        {imageA.mask && (
                          <rect
                            x={imageA.mask.x}
                            y={imageA.mask.y}
                            width={imageA.mask.width}
                            height={imageA.mask.height}
                            className="fill-blue-500/20 stroke-blue-500 stroke-[8px]"
                          />
                        )}
                        {imageA.lassoPath && (
                          <path
                            d={formatNormalizedLassoPathData(imageA.lassoPath)}
                            className="fill-blue-500/20 stroke-blue-500 stroke-[8px]"
                          />
                        )}
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none stylemorph-upload-placeholder">
                    <svg
                      className="w-10 h-10 mb-3 stylemorph-upload-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="stylemorph-upload-copy">点击上传图片(Click to upload image)</p>
                  </div>
                )}
              </div>
              {imageA.preview && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex gap-1.5">
                    {/* <button
                      onClick={() => setModalTarget("A")}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 text-[10px] font-bold text-blue-400 border border-slate-700 hover:bg-blue-900/20 hover:border-blue-500 transition-all"
                    >
                      选区工具
                    </button> */}
                    <button
                      onClick={() => fileInputARef.current?.click()}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all stylemorph-mini-button"
                    >
                      替换图片
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center">
              <label className="stylemorph-upload-label">
                风格图 (B)
              </label>
              <input
                type="file"
                ref={fileInputBRef}
                className="hidden"
                onChange={(e) => handleFileChange(e, setImageB)}
                accept="image/*"
              />
              <div
                onClick={() =>
                  !imageB.preview && fileInputBRef.current?.click()
                }
                className="relative group aspect-square rounded-2xl border-2 border-dashed overflow-hidden transition-all cursor-pointer flex items-center justify-center stylemorph-upload-card stylemorph-upload-card--b"
              >
                {imageB.preview ? (
                  <>
                    <img
                      src={imageB.preview}
                      alt="B"
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 pointer-events-none p-2">
                      <svg viewBox="0 0 1000 1000" className="w-full h-full">
                        {imageB.mask && (
                          <rect
                            x={imageB.mask.x}
                            y={imageB.mask.y}
                            width={imageB.mask.width}
                            height={imageB.mask.height}
                            className="fill-pink-500/20 stroke-pink-500 stroke-[8px]"
                          />
                        )}
                        {imageB.lassoPath && (
                          <path
                            d={formatNormalizedLassoPathData(imageB.lassoPath)}
                            className="fill-pink-500/20 stroke-pink-500 stroke-[8px]"
                          />
                        )}
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none stylemorph-upload-placeholder">
                    <svg
                      className="w-10 h-10 mb-3 stylemorph-upload-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="stylemorph-upload-copy">点击上传图片(Click to upload image)</p>
                  </div>
                )}
              </div>
              {imageB.preview && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setModalTarget("B")}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all stylemorph-mini-button stylemorph-mini-button--accent"
                    >
                      特征提取
                    </button>
                    <button
                      onClick={() => fileInputBRef.current?.click()}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all stylemorph-mini-button"
                    >
                      替换图片
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="stylemorph-block-title">
            2. 生成设置
          </h2>
          <div className="grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="stylemorph-field-label">
                画面比例
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 stylemorph-segmented">
                {ratios.map((r) => (
                  <button
                    key={r}
                    onClick={() => setConfig({ ...config, aspectRatio: r })}
                    className={`py-1 text-[10px] font-black stylemorph-segmented__button ${config.aspectRatio === r
                      ? "is-active"
                      : ""
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="stylemorph-field-label">
                输出分辨率
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 stylemorph-segmented">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setConfig({ ...config, imageSize: s })}
                    className={`py-1 text-[10px] font-black stylemorph-segmented__button ${config.imageSize === s
                      ? "is-active"
                      : ""
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="stylemorph-field-label">
              生成数量(Generate quantity)
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 stylemorph-segmented">
              {batchSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setConfig({ ...config, batchSize: size })}
                  className={`py-1 text-[10px] font-black stylemorph-segmented__button ${config.batchSize === size
                    ? "is-active"
                    : ""
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="stylemorph-block-title">
                3. 结构保留深度
              </h2>
              <span className="stylemorph-value-tag stylemorph-value-tag--warm">
                {config.structuralDepth}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.structuralDepth}
              onChange={(e) =>
                setConfig({
                  ...config,
                  structuralDepth: parseInt(e.target.value),
                })
              }
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] stylemorph-range-scale">
              <span>Rigid (锁定)</span>
              <span>Loose (释放)</span>
            </div>
            <p className="stylemorph-range-note stylemorph-range-note--warm">
              {getDepthDescription(config.structuralDepth)}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="stylemorph-block-title">
                4. 风格融合权重
              </h2>
              <span className="stylemorph-value-tag stylemorph-value-tag--cool">
                {config.weight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.weight}
              onChange={(e) =>
                setConfig({ ...config, weight: parseInt(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="stylemorph-range-note stylemorph-range-note--cool">
              {getWeightDescription(config.weight)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="stylemorph-block-title">
            5. 修正指令
          </h2>
          <textarea
            value={config.refinementPrompt}
            onChange={(e) =>
              setConfig({ ...config, refinementPrompt: e.target.value })
            }
            placeholder="例如: 改变选区内的材质为碳纤维..."
            className="w-full h-20 p-3 text-xs focus:outline-none transition-all resize-none stylemorph-textarea"
          />
        </div>

        {modalTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-6 animate-in fade-in duration-300">
            <div className="relative max-w-7xl w-full h-full flex flex-col items-center bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="w-full flex justify-between items-center px-12 py-6 border-b border-slate-800">
                <div className="flex items-center gap-6">
                  <h3 className="text-lg font-black text-white">
                    {modalTarget === "A"
                      ? "指定重绘区域 (图 A)"
                      : "特征提取区域 (图 B)"}
                  </h3>
                  <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setActiveTool("rect")}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === "rect"
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                      矩形框
                    </button>
                    <button
                      onClick={() => setActiveTool("lasso")}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === "lasso"
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                      自由套索
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setModalTarget(null)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 w-full relative flex items-center justify-center p-8 bg-black/40 overflow-hidden">
                <div
                  ref={modalContainerRef}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  style={{ aspectRatio: imageAspectRatio }}
                  className="relative max-w-full max-h-full bg-slate-800 shadow-2xl cursor-crosshair border border-slate-700 rounded-lg overflow-hidden"
                >
                  <img
                    src={activeImage.preview!}
                    alt="Target"
                    onLoad={handleImageLoad}
                    className="w-full h-full object-contain select-none pointer-events-none"
                  />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {activeImage.mask && modalContainerRef.current && (
                      <rect
                        x={
                          (activeImage.mask.x / 1000) *
                          modalContainerRef.current.offsetWidth
                        }
                        y={
                          (activeImage.mask.y / 1000) *
                          modalContainerRef.current.offsetHeight
                        }
                        width={
                          (activeImage.mask.width / 1000) *
                          modalContainerRef.current.offsetWidth
                        }
                        height={
                          (activeImage.mask.height / 1000) *
                          modalContainerRef.current.offsetHeight
                        }
                        className="fill-blue-500/20 stroke-blue-500 stroke-2"
                      />
                    )}
                    {activeImage.lassoPath && modalContainerRef.current && (
                      <path
                        d={formatLassoSvgPath(
                          activeImage.lassoPath.map((p) => ({
                            x:
                              (p.x / 1000) *
                              modalContainerRef.current!.offsetWidth,
                            y:
                              (p.y / 1000) *
                              modalContainerRef.current!.offsetHeight,
                          }))
                        )}
                        className="fill-blue-500/20 stroke-blue-500 stroke-2"
                      />
                    )}
                    {startPos && currentPos && activeTool === "rect" && (
                      <rect
                        x={Math.min(startPos.x, currentPos.x)}
                        y={Math.min(startPos.y, currentPos.y)}
                        width={Math.abs(startPos.x - currentPos.x)}
                        height={Math.abs(startPos.y - currentPos.y)}
                        className="fill-white/10 stroke-white stroke-2"
                        strokeDasharray="4 4"
                      />
                    )}
                    {isDrawingLasso &&
                      activeTool === "lasso" &&
                      lassoPoints.length > 0 && (
                        <path
                          d={formatLassoSvgPath(lassoPoints)}
                          className="fill-white/10 stroke-white stroke-2"
                          strokeDasharray="4 4"
                        />
                      )}
                  </svg>
                </div>
              </div>
              <div className="w-full px-12 py-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end gap-4">
                <button
                  onClick={() => clearMask(modalTarget)}
                  className="px-8 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-black border border-slate-700 hover:bg-slate-700 transition-colors tracking-widest"
                >
                  重置选区
                </button>
                <button
                  onClick={() => setModalTarget(null)}
                  className="px-12 py-3 rounded-xl bg-blue-600 text-white text-xs font-black shadow-lg hover:bg-blue-500 transition-colors tracking-widest"
                >
                  确认选定
                </button>
              </div>
            </div>
          </div>
        )}
      </UnifiedControlPanel>
      <div className="panel-footer">
        <UnifiedGenerateButton
          onClick={onGenerate}
          disabled={!imageA.base64 || !imageB.base64 || isGenerating}
          isGenerating={isGenerating}
          label="开始造型迁移"
          processingLabel="正在进化造型..."
        />
      </div>
    </div>
  );
};

export default ControlPanel;
