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
    <div className="pp-panel h-full min-h-[320px] md:min-h-[280px] rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 md:p-6 flex flex-col">
      <p className="text-lg md:text-xl font-semibold text-slate-800 mb-3 text-center md:text-left">Original Room</p>
      <div 
        className="flex-1 min-h-[240px] md:min-h-[220px] rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-center cursor-pointer text-center px-6 py-8 transition hover:border-slate-400 focus-within:border-slate-400"
        onClick={onTriggerFileInput}
      >
        {originalImage ? (
          <img 
            src={originalImage} 
            alt="Original room" 
            className="max-h-[320px] md:max-h-[260px] w-full object-contain" 
          />
        ) : (
          <div className="text-slate-500">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-slate-400 mb-3" 
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
            <p className="text-base md:text-lg font-medium">Click to upload room photo</p>
            <p className="text-xs md:text-sm text-slate-400 mt-1">JPG or PNG up to 10MB</p>
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
