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
    <div className="cinema-uploader space-y-3 blobk-bg">
      <div className="flex justify-between items-end">
        <div>
          <label className="cinema-section-label">{label}</label>
          {helperText && (
            <p className="cinema-section-helper mt-1">{helperText}</p>
          )}
        </div>
        {maxImages > 1 && (
          <span className="cinema-counter">
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
            className="cinema-upload-tile relative aspect-square group overflow-hidden"
          >
            <img
              src={img}
              alt={`${label} ${idx}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removeImage(idx)}
              className="cinema-upload-remove absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200"
            >
              <i className="fas fa-trash-alt text-white text-sm"></i>
            </button>
          </div>
        ))}

        {selectedImages.length < maxImages && (
          <label className="cinema-upload-input aspect-square flex flex-col items-center justify-center cursor-pointer transition-all group">
            <input
              type="file"
              multiple={maxImages > 1}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="cinema-upload-placeholder flex flex-col items-center gap-1 transition-colors">
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
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
