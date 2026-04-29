import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  image: string | null;
  onImageChange: (image: string | null) => void;
  required?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, image, onImageChange, required = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      onImageChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {image && (
          <button
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div
        onClick={handleClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ minHeight: '10rem' }}
        className={`
          relative flex-1 rounded-xl border hover:border-indigo-400 transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center overflow-hidden cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 hover:border-indigo-400'}
          ${image ? 'border-solid border-slate-700 bg-slate-900' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />

        {image ? (
          <div className="relative w-full h-full p-2 flex items-center justify-center">
            <img
              src={image}
              alt="Uploaded"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
              <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 p-4 text-center">
            <div className="p-4 rounded-full bg-slate-800 border border-slate-700">
              <Upload size={24} className="text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-slate-200">点击上传图片</p>
              <p className="text-xs text-slate-500 mt-1">Click to upload image</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
