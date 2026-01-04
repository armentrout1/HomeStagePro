interface StagedPreviewPanelProps {
  stagedImage: string | null;
  isLoading: boolean;
  progressPhase: string;
}

export function StagedPreviewPanel({ stagedImage, isLoading, progressPhase }: StagedPreviewPanelProps) {
  return (
    <div className="pp-panel h-full min-h-[320px] md:min-h-[280px] rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 md:p-6 flex flex-col">
      <p className="text-lg md:text-xl font-semibold text-slate-800 mb-3 text-center md:text-left">Staged Room</p>
      <div className="flex-1 min-h-[240px] md:min-h-[220px] rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-center text-center px-6 py-8">
        {isLoading ? (
          <div className="w-full">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-primary mb-3"></div>
            <p className="text-slate-700 font-medium md:text-lg">{progressPhase || "Working…"}</p>
            <p className="text-xs md:text-sm text-slate-400 mt-1">This may take a minute</p>
            <div className="mt-4 relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-primary animate-[progress_1.2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        ) : stagedImage ? (
          <img 
            src={stagedImage} 
            alt="Staged room" 
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
            <p className="text-base md:text-lg font-medium">Your staged room will appear here</p>
            <p className="text-xs md:text-sm text-slate-400 mt-1">Upload a photo and click Stage</p>
          </div>
        )}
      </div>
    </div>
  );
}
