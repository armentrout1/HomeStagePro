/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import { useState, useEffect, useCallback } from "react";
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


  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="p-6 shadow-md bg-white">
        <h3 className="text-2xl font-bold mb-4 text-center">Transform Your Room with AI Staging</h3>
        <p className="text-gray-600 mb-3 text-center">
          Upload a photo of your empty room and our AI will transform it into a beautifully staged space in seconds!
        </p>
        <div className="mb-6">
          <p className="text-sm text-blue-600 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free usage: 2 room stagings per IP address
          </p>
          
          {/* Usage status */}
          <UsageStatusBanner usageStatus={usageStatus} isLoadingUsage={isLoadingUsage} />
        </div>
        
        {/* Room Type Selector */}
        <RoomTypeSelect roomType={roomType} onRoomTypeChange={setRoomType} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        
        <SavingIndicator isSaving={isSaving} />
      </Card>
    </div>
  );
}
