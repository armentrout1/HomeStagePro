/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

import { roomTypes } from "./constants";
import { SaveImagePayload } from "./types";
import { fetchUsageStatus as fetchUsageStatusApi } from "./api/usageStatusApi";
import { generateStagedRoom } from "./api/stagingApi";
import { saveStagedImage } from "./api/stagedImagesApi";
import { useUsageStatus } from "./hooks/useUsageStatus";
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { usageStatus, isLoadingUsage, refreshUsageStatus } = useUsageStatus();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      toast.error(
        "Invalid file type",
        "Please upload an image file (JPG, PNG, etc.)"
      );
      return;
    }

    // Reset the staged image when a new file is uploaded
    setStagedImage(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setOriginalImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setStagedImage(null);
    setRoomType("living_room");
    
    toast.success("Reset complete", "All images have been cleared");
  };
  
  const handleStageImage = async () => {
    if (!originalImage) {
      toast.error(
        "No image selected",
        "Please upload an image before staging"
      );
      return;
    }

    setIsLoading(true);
    try {
      setProgressPhase("Preparing image…");
      // Remove the data URL prefix to get just the base64 data
      const base64Image = originalImage.split(',')[1];

      // Get the selected room type label for the prompt
      const selectedRoomTypeLabel = roomTypes.find(rt => rt.value === roomType)?.label || "Room";

      // Log the staging process
      console.log(`Starting staging process for ${selectedRoomTypeLabel}`);

      setProgressPhase("Generating staged image…");
      const result = await generateStagedRoom({
        imageBase64: base64Image,
        roomTypeLabel: selectedRoomTypeLabel
      });

      if (!result.ok) {
        throw new Error(result.errorMessage);
      }

      const data = result.data;

      setProgressPhase("Finalizing…");
      const stagedPreviewUrl = data.stagedSignedUrl ?? data.imageUrl ?? null;
      setStagedImage(stagedPreviewUrl);
      
      // Save the staged image to the database
      setProgressPhase("Saving…");
      await saveImageToDatabase({
        storageBucket: data.storageBucket,
        originalStoragePath: data.originalStoragePath,
        stagedStoragePath: data.stagedStoragePath,
        originalImageUrl: data.originalSignedUrl ?? null,
        stagedImageUrl: data.stagedSignedUrl ?? data.imageUrl ?? null,
      });
      
      toast.success("Success!", "Your staged room image is ready");
      
      // Refresh usage status after successful staging
      refreshUsageStatus();
    } catch (error) {
      console.error('Error staging image:', error);
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to generate staged image"
      );
      
      // Refresh usage status even after error (might be due to limit)
      refreshUsageStatus();
      setProgressPhase("");
    } finally {
      setIsLoading(false);
      setProgressPhase("");
    }
  };
  
  const saveImageToDatabase = async (payload: SaveImagePayload) => {
    if (!originalImage || !payload?.stagedStoragePath || !payload?.originalStoragePath) return;
    
    setIsSaving(true);
    try {
      const result = await saveStagedImage({
        storageBucket: payload.storageBucket,
        originalStoragePath: payload.originalStoragePath,
        stagedStoragePath: payload.stagedStoragePath,
        originalImageUrl: payload.originalImageUrl,
        stagedImageUrl: payload.stagedImageUrl,
        roomType: roomTypes.find(rt => rt.value === roomType)?.label || "Unknown",
      });
      
      if (!result.ok) {
        throw new Error(result.errorMessage);
      }
      
      // Invalidate any queries that might display staged images
      queryClient.invalidateQueries({ queryKey: ['/api/staged-images'] });
      
    } catch (error) {
      console.error('Error saving image to database:', error);
      // Don't show error toast since this is a background operation
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!stagedImage) return;
    
    const link = document.createElement('a');
    link.href = stagedImage;
    link.download = 'staged-room.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

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
          onStageClick={handleStageImage}
          onResetClick={handleReset}
          onDownloadClick={handleDownload}
        />
        
        <SavingIndicator isSaving={isSaving} />
      </Card>
    </div>
  );
}
