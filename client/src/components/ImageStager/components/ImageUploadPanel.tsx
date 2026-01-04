import { ChangeEvent } from "react";

interface ImageUploadPanelProps {
  originalImage: string | null;
  onTriggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUploadPanel({ 
  originalImage, 
  onTriggerFileInput, 
  fileInputRef, 
  onFileChange 
}: ImageUploadPanelProps) {
  return (
    <div className="flex flex-col">
      <p className="font-medium mb-2 text-center">Original Room</p>
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer bg-gray-50 h-64 mb-4 overflow-hidden"
        onClick={onTriggerFileInput}
      >
        {originalImage ? (
          <img 
            src={originalImage} 
            alt="Original room" 
            className="max-h-64 max-w-full object-contain" 
          />
        ) : (
          <div className="text-center p-6">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-gray-400 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="text-gray-500">Click to upload room photo</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 10MB)</p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={onFileChange} 
          className="hidden" 
          accept="image/*"
        />
      </div>
    </div>
  );
}
