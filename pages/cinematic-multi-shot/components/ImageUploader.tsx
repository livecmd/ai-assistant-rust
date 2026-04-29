import React from "react";

interface ImageUploaderProps {
  label: string;
  maxImages: number;
  onImagesChange: (images: string[]) => void;
  selectedImages: string[];
  helperText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  maxImages,
  onImagesChange,
  selectedImages,
  helperText,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = maxImages - selectedImages.length;
      const filesToProcess = Array.from(files).slice(
        0,
        remainingSlots
      ) as File[];

      Promise.all(
        filesToProcess.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ).then((newImageUrls) => {
        onImagesChange([...selectedImages, ...newImageUrls]);
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3 blobk-bg">
      <div className="flex justify-between items-end">
        <div>
          <label className="block text-sm font-bold text-slate-300">
            {label}
          </label>
          {helperText && (
            <p className="text-[10px] text-slate-500 mt-0.5">{helperText}</p>
          )}
        </div>
        {maxImages > 1 && (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            {selectedImages.length} / {maxImages}
          </span>
        )}
      </div>

      <div
        className={`grid ${
          maxImages === 1 ? "grid-cols-1" : "grid-cols-3"
        } gap-2`}
      >
        {selectedImages.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shadow-inner"
          >
            <img
              src={img}
              alt={`${label} ${idx}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removeImage(idx)}
              className="absolute inset-0 bg-rose-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200"
            >
              <i className="fas fa-trash-alt text-white text-sm"></i>
            </button>
          </div>
        ))}

        {selectedImages.length < maxImages && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group">
            <input
              type="file"
              multiple={maxImages > 1}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-gray-500 group-hover:text-primary transition-colors flex flex-col items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs font-medium">点击上传</span>
            </div>
            {/* <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <i className="fas fa-plus text-slate-500 group-hover:text-indigo-400"></i>
            </div> */}
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
