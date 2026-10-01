import { ExternalLink } from "lucide-react";

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
          <div className="w-full" role="status">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-primary mb-3" aria-hidden="true" />
            <p className="text-slate-700 font-medium md:text-lg">{progressPhase || "Working…"}</p>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Your result is saved automatically.</p>
          </div>
        ) : stagedImage ? (
          <a href={stagedImage} target="_blank" rel="noreferrer" className="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="View staged room at full size in a new tab">
            <img src={stagedImage} alt="Staged room" className="max-h-[320px] md:max-h-[260px] w-full object-contain rounded-lg transition-opacity group-hover:opacity-90" />
            <span className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-700"><ExternalLink className="h-4 w-4" aria-hidden="true" /> View full size</span>
            <span className="mt-1 block text-xs text-slate-500">Use Download below to save a fresh copy.</span>
          </a>
        ) : (
          <div className="text-slate-500">
            <p className="text-base md:text-lg font-medium">Your staged room will appear here</p>
            <p className="text-xs md:text-sm mt-1">Upload a photo and click Stage</p>
          </div>
        )}
      </div>
    </div>
  );
}
