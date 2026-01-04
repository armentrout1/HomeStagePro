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
  const requiresUpgrade =
    usageStatus && usageStatus.status !== "premium" && usageStatus.remaining === 0;

  return (
    <>
      <div className="hidden md:block">
        <div className="mt-6 pp-panel rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
            <div className="w-full md:flex-1 min-w-[180px]">
              <Button
                onClick={onUploadClick}
                variant="outline"
                className="w-full h-12 text-base font-medium border-slate-300 text-slate-700 hover:bg-slate-50"
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
            </div>

            <div className="w-full md:flex-1 min-w-[200px]">
              {requiresUpgrade ? (
                <Link href="/upgrade" className="block w-full">
                  <Button
                    variant="default"
                    className="w-full h-12 text-base font-semibold shadow-sm"
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
                  className="w-full h-12 text-base font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!originalImage || isLoading}
                  title={!originalImage ? "Please upload a photo first" : ""}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-slate-200 border-t-white"></div>
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
            </div>

            {(originalImage || stagedImage) && (
              <div className="w-full md:flex-1 min-w-[180px]">
                <Button
                  onClick={onResetClick}
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
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
              </div>
            )}

            {stagedImage && (
              <div className="w-full md:flex-1 min-w-[180px]">
                <Button
                  onClick={onDownloadClick}
                  variant="secondary"
                  className="w-full h-12 text-base font-medium text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
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
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
        <div className="pp-panel rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl ring-1 ring-white/80 backdrop-blur-sm p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onUploadClick}
              variant="outline"
              className="flex-1 min-w-[140px] h-11 text-sm font-medium border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
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
              Upload
            </Button>

            {requiresUpgrade ? (
              <Link href="/upgrade" className="flex-1 min-w-[140px]">
                <Button
                  variant="default"
                  className="w-full h-11 text-sm font-semibold shadow-md transition-shadow"
                >
                  Upgrade
                </Button>
              </Link>
            ) : (
              <Button
                onClick={onStageClick}
                variant="default"
                className="flex-1 min-w-[140px] h-11 text-sm font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-shadow"
                disabled={!originalImage || isLoading}
                title={!originalImage ? "Please upload a photo first" : ""}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-slate-200 border-t-white"></div>
                    Working
                  </>
                ) : (
                  "Stage"
                )}
              </Button>
            )}

            {(originalImage || stagedImage) && (
              <Button
                onClick={onResetClick}
                variant="outline"
                className="flex-1 min-w-[140px] h-11 text-sm font-medium border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Reset
              </Button>
            )}

            {stagedImage && (
              <Button
                onClick={onDownloadClick}
                variant="secondary"
                className="flex-1 min-w-[140px] h-11 text-sm font-medium text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
