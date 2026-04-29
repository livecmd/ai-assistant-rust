
import React from 'react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  label: string;
  image: UploadedImage | null;
  onImageChange: (img: UploadedImage) => void;
  onRemove: () => void;
  id: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  image,
  onImageChange,
  onRemove,
  id,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if image
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const base64Data = base64String.split(',')[1];

      onImageChange({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: base64Data,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-bold text-gray-400 tracking-wider flex justify-between items-center">
        {label}
        {image && <span className="text-green-500 text-[10px]">已加载</span>}
      </label>

      {!image ? (
        <div className="relative group w-full h-32 border border-dashed border-gray-600 rounded-lg bg-gray-800/30 hover:bg-gray-800 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden">
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="text-gray-500 group-hover:text-primary transition-colors flex flex-col items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">点击上传</span>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-600 group bg-black/40">
          <img
            src={image.previewUrl}
            alt={label}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label
              htmlFor={id}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded backdrop-blur-sm cursor-pointer transition-colors border border-white/10"
            >
              更换
              <input
                id={id}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button
              onClick={onRemove}
              className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded backdrop-blur-sm transition-colors border border-red-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
