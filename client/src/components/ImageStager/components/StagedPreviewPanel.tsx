interface StagedPreviewPanelProps {
  stagedImage: string | null;
  isLoading: boolean;
  progressPhase: string;
}

export function StagedPreviewPanel({ stagedImage, isLoading, progressPhase }: StagedPreviewPanelProps) {
  return (
    <div className="flex flex-col">
      <p className="font-medium mb-2 text-center">Staged Room</p>
      <div className="border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 h-64 mb-4 overflow-hidden">
        {isLoading ? (
          <div className="text-center p-6 w-full">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-primary mb-3"></div>
            <p className="text-gray-700 font-medium">{progressPhase || "Working…"}</p>
            <p className="text-xs text-gray-400 mt-1">This may take a minute</p>
            <div className="mt-4 relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-primary animate-[progress_1.2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        ) : stagedImage ? (
          <img 
            src={stagedImage} 
            alt="Staged room" 
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
            <p className="text-gray-500">Your staged room will appear here</p>
            <p className="text-xs text-gray-400 mt-1">Upload a photo and click Stage</p>
          </div>
        )}
      </div>
    </div>
  );
}
