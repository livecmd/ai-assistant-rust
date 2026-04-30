import React, { useCallback } from 'react';

interface FileUploadProps {
  label: string;
  image: string | null;
  onUpload: (file: File) => void;
  accept?: string;
  subLabel?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, image, onUpload, accept = "image/*", subLabel }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="medecal-upload flex flex-1 flex-col gap-2 h-full">
      <div className="medecal-upload-label-row flex justify-center items-end">
        <label className="medecal-upload-label text-sm font-semibold text-slate-700 tracking-wide">{label}</label>
        {subLabel && <span className="medecal-upload-sub-label text-xs text-slate-400">{subLabel}</span>}
      </div>

      <div
        className={`
          medecal-upload-dropzone relative flex-1 min-h-[156px] rounded-[20px] border transition-all duration-300 overflow-hidden group
          ${image
            ? 'medecal-upload-dropzone--filled border-blue-200 bg-white'
            : 'border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,246,250,0.94))] hover:border-[#1677ff]'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {image ? (
          <div className="relative w-full h-full">
            <img
              src={image}
              alt="Uploaded"
              className="w-full h-full object-contain p-2"
            />
            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="medecal-upload-overlay-label text-slate-900 text-sm font-medium bg-white/88 px-3 py-1 rounded-full">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="medecal-upload-empty absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center pointer-events-none">
            <svg className="w-10 h-10 mb-3 text-[#1677ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="medecal-upload-empty-text text-sm text-slate-500">点击上传图片(Click or drag to upload)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
