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
        <label className="lineart-upload-label">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {image && (
          <button
            onClick={handleClear}
            className="lineart-upload-clear"
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
        className={`lineart-upload-dropzone ${isDragging ? 'is-dragging' : ''} ${image ? 'has-image' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />

        {image ? (
          <div className="lineart-upload-preview">
            <img
              src={image}
              alt="Uploaded"
              className="lineart-upload-preview-image"
            />
            <div className="lineart-upload-overlay">
              <span className="lineart-upload-overlay-text">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="lineart-upload-empty">
            <div className="lineart-upload-empty-icon">
              <Upload size={24} className="text-[#5b7cff]" />
            </div>
            <div>
              <p className="lineart-upload-empty-title">点击上传图片</p>
              <p className="lineart-upload-empty-subtitle">Click to upload image</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
