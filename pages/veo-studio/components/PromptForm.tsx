/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  AspectRatio,
  GenerateVideoParams,
  ImageFile,
  UploadedImage,
  Resolution,
  VeoModel,
  normalizeVideoModel,
} from "../types";
import { PlusIcon } from "./icons";
import { Trash2 } from "lucide-react";
import { UnifiedGenerateButton } from "../../../components/shared/UnifiedGenerateButton";
import { CommonAspectRatioSelector } from "../../../components/shared/CommonAspectRatioSelector";
import { CommonModelSelector } from "../../../components/shared/CommonModelSelector";
import { ControlSection } from "../../../components/shared/UnifiedControlPanel";
import { useModelCatalog } from "../../../hooks/useModelCatalog";

const fileToBase64 = <T extends { file: File; base64: string }>(
  file: File
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (base64) {
        resolve({ file, base64 } as T);
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);

const MAX_IMAGES = 2; // 最多上传两张图片

// 多图片上传组件
const MultiImageUpload: React.FC<{
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  label: React.ReactNode;
}> = ({ images, onImagesChange, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImagesChange([
          ...images,
          {
            id: Math.random().toString(36).substr(2, 9),
            base64: base64String,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input value
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    onImagesChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="w-full veo-upload-block">
      {label && (
        <div className="veo-field-label mb-2">
          {label}
        </div>
      )}
      <div className="icon mb-4">
        <input
          type="file"
          ref={inputRef}
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={images.length >= MAX_IMAGES}
          className="veo-file-input"
        />
        <p className="veo-helper-text mt-2">
          最多上传 {MAX_IMAGES} 张图片 (Max {MAX_IMAGES} images)
        </p>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="veo-upload-thumb relative aspect-video group"
              >
                <img
                  src={img.base64}
                  className="w-full h-full object-cover"
                  alt="Uploaded reference"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="veo-thumb-remove absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="veo-upload-empty relative w-full mt-4 flex flex-col items-center justify-center">
            <svg
              className="w-8 h-8 mb-2"
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
            <p className="text-xs">点击上方按钮上传参考图片</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
}> = ({ onSelect, onRemove, image, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onSelect(imageFile);
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }
    // Reset input value
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 text-xs font-bold text-slate-500 tracking-widest">
          {label}
        </div>
      )}
      <div
        onClick={() => !image && inputRef.current?.click()}
        className={`relative w-full h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${image
          ? "border-indigo-500 bg-slate-900"
          : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-indigo-500/50"
          }`}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {image ? (
          <>
            {/* Preview the base64 image (reconstruct data URI) */}
            <img
              src={`data:image/png;base64,${image.base64}`}
              alt="Extended"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
                className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-all"
              >
                <svg
                  className="w-4 h-4"
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
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <PlusIcon className="w-8 h-8 opacity-50" />
            <span className="text-xs font-semibold tracking-wider">
              Upload Reference
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues: GenerateVideoParams | null;
  isGenerating?: boolean;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
  isGenerating = false,
}) => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    AspectRatio.LANDSCAPE
  );
  const [resolution, setResolution] = useState<Resolution>(Resolution.HD);
  const [model, setModel] = useState<VeoModel>(normalizeVideoModel());
  const [referenceImage, setReferenceImage] = useState<ImageFile | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const { getConfig } = useModelCatalog({ category: "video", provider: "smartapi" });
  const videoModels = useMemo(() => {
    const options = [
      { id: VeoModel.SEEDANCE_2, name: getConfig(VeoModel.SEEDANCE_2)?.display_name || "Seedance 2.0", description: "高质量视频生成" },
      { id: VeoModel.SEEDANCE_2_FAST, name: getConfig(VeoModel.SEEDANCE_2_FAST)?.display_name || "Seedance 2.0 Fast", description: "更快的视频生成" },
      { id: VeoModel.VEO_3_1_FAST, name: getConfig(VeoModel.VEO_3_1_FAST)?.display_name || "VEO 3.1 Fast", description: "Google VEO 3.1 快速模式" },
      { id: VeoModel.VEO_3_1_QUALITY, name: getConfig(VeoModel.VEO_3_1_QUALITY)?.display_name || "VEO 3.1 Quality", description: "Google VEO 3.1 高品质模式" },
    ];
    const enabled = options.filter((item) => getConfig(item.id));
    return enabled.length > 0 ? enabled : options;
  }, [getConfig]);

  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt);
      setAspectRatio(initialValues.aspectRatio);
      setResolution(initialValues.resolution);
      setModel(normalizeVideoModel(initialValues.model));
      setReferenceImage(initialValues.referenceImage || null);
      setUploadedImages(initialValues.referenceImages || []);
    }
  }, [initialValues]);

  useEffect(() => {
    if (!videoModels.some((item) => item.id === model) && videoModels.length > 0) {
      setModel(normalizeVideoModel(videoModels[0].id));
    }
  }, [model, videoModels]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt) return;

    onGenerate({
      prompt,
      aspectRatio,
      resolution,
      model: normalizeVideoModel(model),
      referenceImage: referenceImage || undefined,
      referenceImages: uploadedImages.length > 0 ? uploadedImages : undefined,
    });
  };

  const isSubmitDisabled = !prompt || isGenerating;

  return (
    <div className="panel-stack veo-studio-panel">
      <div className="veo-studio-control panel-scroll-region">
        {/* 2. Upload (Optional) - 支持最多两张图片 */}
        <ControlSection>
          <MultiImageUpload
            label="上传参考图片 (Upload Reference Images)"
            images={uploadedImages}
            onImagesChange={setUploadedImages}
          />
        </ControlSection>

        {/* 1. Prompt Area */}
        <ControlSection title="提示词(Prompt)">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述您要创建的视频..."
            className="veo-prompt-textarea"
          />
        </ControlSection>

        {/* 3. Settings */}
        <ControlSection>
          <CommonModelSelector
            selectedModel={model}
            onSelect={(id) => setModel(normalizeVideoModel(String(id)))}
            models={videoModels}
          />

          <div className="h-4"></div>

          <CommonAspectRatioSelector
            selectedRatio={aspectRatio}
            onSelect={(r) => setAspectRatio(r as AspectRatio)}
            options={[AspectRatio.LANDSCAPE, AspectRatio.PORTRAIT]}
            label="视频长宽比(Aspect Ratio)"
          />

          <div className="h-4"></div>

          <label className="veo-field-label veo-field-label--compact mb-2 block">
            分辨率(Resolution)
          </label>
          <div className="veo-segment-group">
            {[Resolution.HD, Resolution.FHD].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setResolution(res)}
                className={`veo-segment-button ${resolution === res ? "is-active" : ""}`}
              >
                {res === Resolution.HD ? "720p" : "1080p"}
              </button>
            ))}
          </div>
        </ControlSection>
      </div>
      {/* 4. Generate Button */}
      <div className="panel-footer">
        <UnifiedGenerateButton
          onClick={handleSubmit}
          isGenerating={isGenerating}
          disabled={isSubmitDisabled}
          label="生成视频(Generate Video)"
          className="w-full"
        />
      </div>

      {/* <div className="text-center">
        <p className="text-xs text-slate-600">
          Veo is a paid-only model. Costs apply.
        </p>
      </div> */}
    </div>
  );
};

export default PromptForm;
