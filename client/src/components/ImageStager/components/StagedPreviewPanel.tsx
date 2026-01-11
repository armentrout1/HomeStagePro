import { ExternalLink } from "lucide-react";

interface StagedPreviewPanelProps {
  stagedImage: string | null;
  isLoading: boolean;
  progressPhase: string;
}

export function StagedPreviewPanel({ stagedImage, isLoading, progressPhase }: StagedPreviewPanelProps) {
  const openImageInNewTab = () => {
    if (!stagedImage) return;
    
    // Create a new HTML page with the image and download button
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staged Room - HomeStagePro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    h1 {
      color: white;
      font-size: 1.5rem;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 0.875rem;
    }
    .image-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      margin-bottom: 20px;
    }
    img {
      max-width: 100%;
      max-height: calc(100vh - 200px);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .download-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      padding: 14px 32px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
    }
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
    }
    .download-btn svg {
      width: 20px;
      height: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Staged Room</h1>
    <p class="subtitle">Right-click to save or use the download button below</p>
  </div>
  <div class="image-container">
    <img src="${stagedImage}" alt="Staged Room" />
  </div>
  <button class="download-btn" onclick="downloadImage()">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    Download Image
  </button>
  <script>
    function downloadImage() {
      const link = document.createElement('a');
      link.href = '${stagedImage}';
      link.download = 'staged-room.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  </script>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };
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
          <div 
            className="relative group cursor-pointer"
            onClick={openImageInNewTab}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openImageInNewTab()}
            aria-label="Click to view full size and download"
          >
            <img 
              src={stagedImage} 
              alt="Staged room" 
              className="max-h-[320px] md:max-h-[260px] w-full object-contain rounded-lg transition-opacity group-hover:opacity-90" 
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
              <div className="bg-white/95 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <ExternalLink className="h-4 w-4 text-slate-700" />
                <span className="text-sm font-medium text-slate-700">View Full Size</span>
              </div>
            </div>
          </div>
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
