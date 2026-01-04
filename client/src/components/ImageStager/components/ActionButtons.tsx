import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UsageStatus } from "../types";

interface ActionButtonsProps {
  originalImage: string | null;
  stagedImage: string | null;
  isLoading: boolean;
  usageStatus: UsageStatus | null;
  onUploadClick: () => void;
  onStageClick: () => void;
  onResetClick: () => void;
  onDownloadClick: () => void;
}

export function ActionButtons({
  originalImage,
  stagedImage,
  isLoading,
  usageStatus,
  onUploadClick,
  onStageClick,
  onResetClick,
  onDownloadClick,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
      <Button 
        onClick={onUploadClick}
        variant="outline"
        className="flex-1 max-w-xs mx-auto"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
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
        Upload Photo
      </Button>
      {usageStatus && usageStatus.status !== 'premium' && usageStatus.remaining === 0 ? (
        <Link href="/upgrade">
          <Button 
            variant="default"
            className="flex-1 max-w-xs mx-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            Upgrade to Continue
          </Button>
        </Link>
      ) : (
        <Button 
          onClick={onStageClick}
          variant="default"
          className="flex-1 max-w-xs mx-auto"
          disabled={!originalImage || isLoading}
          title={!originalImage ? "Please upload a photo first" : ""}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
              Processing...
            </>
          ) : (
            <>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
              Stage Room
            </>
          )}
        </Button>
      )}
      {(originalImage || stagedImage) && (
        <Button 
          onClick={onResetClick}
          variant="destructive"
          className="flex-1 max-w-xs mx-auto"
          disabled={isLoading}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Reset
        </Button>
      )}
      {stagedImage && (
        <Button 
          onClick={onDownloadClick}
          variant="secondary"
          className="flex-1 max-w-xs mx-auto"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
          Download
        </Button>
      )}
    </div>
  );
}
