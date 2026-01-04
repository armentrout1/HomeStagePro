/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Image as ImageIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { fetchUsageStatus as fetchUsageStatusApi } from "./api/usageStatusApi";
import { useUsageStatus } from "./hooks/useUsageStatus";
import { useImageUpload } from "./hooks/useImageUpload";
import { useStageRoom } from "./hooks/useStageRoom";
import { UsageStatusBanner } from "./components/UsageStatusBanner";
import { RoomTypeSelect } from "./components/RoomTypeSelect";
import { ImageUploadPanel } from "./components/ImageUploadPanel";
import { StagedPreviewPanel } from "./components/StagedPreviewPanel";
import { ActionButtons } from "./components/ActionButtons";
import { SavingIndicator } from "./components/SavingIndicator";

export default function ImageStager() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roomType, setRoomType] = useState("living_room");
  const [progressPhase, setProgressPhase] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"original" | "staged">("original");
  const previousStagedImageRef = useRef<string | null>(null);

  const { toast } = useToast();
  
  const { usageStatus, isLoadingUsage, refreshUsageStatus } = useUsageStatus();

  const { fileInputRef, triggerFileInput, handleFileChange } = useImageUpload({
    toast,
    setOriginalImage,
    resetStagedImage: () => setStagedImage(null),
    // maxBytes omitted to use default 10MB
  });

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setStagedImage(null);
    setRoomType("living_room");
    
    toast.success("Reset complete", "All images have been cleared");
  }, [toast, setOriginalImage, setStagedImage, setRoomType]);
  
  const { stageRoom } = useStageRoom({
    originalImage,
    roomType,
    setStagedImage,
    setIsLoading,
    setIsSaving,
    setProgressPhase,
    toast,
    refreshUsageStatus,
  });

  const handleDownload = useCallback(() => {
    if (!stagedImage) return;
    
    const link = document.createElement('a');
    link.href = stagedImage;
    link.download = 'staged-room.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [stagedImage]);

  useEffect(() => {
    if (stagedImage && stagedImage !== previousStagedImageRef.current) {
      setActiveTab("staged");
      previousStagedImageRef.current = stagedImage;
      return;
    }

    if (!stagedImage) {
      previousStagedImageRef.current = null;
      setActiveTab("original");
    }
  }, [stagedImage]);


  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="p-6 shadow-md bg-white pp-card">
        <div className="space-y-6 pb-36 md:pb-0">
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold">Transform Your Room with AI Staging</h3>
            <p className="text-gray-600">
              Upload a photo of your empty room and our AI will transform it into a beautifully staged space in seconds!
            </p>
            <div>
              <p className="text-sm text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free usage: 2 room stagings per IP address
              </p>
              <UsageStatusBanner usageStatus={usageStatus} isLoadingUsage={isLoadingUsage} />
            </div>
          </div>

          <RoomTypeSelect roomType={roomType} onRoomTypeChange={setRoomType} />

          <div className="w-full space-y-4 md:space-y-6 md:max-w-4xl md:mx-auto">
            <div className="md:hidden space-y-4">
              <div
                className="pp-panel w-full rounded-2xl border border-slate-300/90 bg-slate-200/70 p-1.5 shadow-inner flex gap-1.5"
                role="tablist"
                aria-label="Image preview mode"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("original")}
                  className={`relative flex-1 rounded-xl px-4 py-3 min-h-[44px] text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                    activeTab === "original"
                      ? "bg-white text-slate-900 shadow-md font-semibold ring-1 ring-slate-200"
                      : "text-slate-600 font-medium hover:bg-white/40"
                  }`}
                  aria-selected={activeTab === "original"}
                  role="tab"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    <span>Original</span>
                  </span>
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-0.5 rounded-full bg-slate-900/70 transition-opacity ${
                      activeTab === "original" ? "opacity-90" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("staged")}
                  className={`relative flex-1 rounded-xl px-4 py-3 min-h-[44px] text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                    activeTab === "staged"
                      ? "bg-white text-slate-900 shadow-md font-semibold ring-1 ring-slate-200"
                      : "text-slate-600 font-medium hover:bg-white/40"
                  }`}
                  aria-selected={activeTab === "staged"}
                  role="tab"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Staged</span>
                  </span>
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-0.5 rounded-full bg-slate-900/70 transition-opacity ${
                      activeTab === "staged" ? "opacity-90" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div>
                {activeTab === "original" ? (
                  <ImageUploadPanel
                    originalImage={originalImage}
                    onTriggerFileInput={triggerFileInput}
                    fileInputRef={fileInputRef}
                    onFileChange={handleFileChange}
                  />
                ) : (
                  <StagedPreviewPanel
                    stagedImage={stagedImage}
                    isLoading={isLoading}
                    progressPhase={progressPhase}
                  />
                )}
              </div>
            </div>

            <div className="hidden md:grid gap-6 md:grid-cols-2 items-stretch">
              <ImageUploadPanel
                originalImage={originalImage}
                onTriggerFileInput={triggerFileInput}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
              />

              <StagedPreviewPanel
                stagedImage={stagedImage}
                isLoading={isLoading}
                progressPhase={progressPhase}
              />
            </div>

            <ActionButtons
              originalImage={originalImage}
              stagedImage={stagedImage}
              isLoading={isLoading}
              usageStatus={usageStatus}
              onUploadClick={triggerFileInput}
              onStageClick={stageRoom}
              onResetClick={handleReset}
              onDownloadClick={handleDownload}
            />
          </div>

          <SavingIndicator isSaving={isSaving} />
        </div>
      </Card>
    </div>
  );
}
