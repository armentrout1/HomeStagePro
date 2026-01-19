import { useCallback, useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { roomTypes } from "../constants";
import { SaveImagePayload } from "../types";
import { generateStagedRoom } from "../api/stagingApi";
import { saveStagedImage } from "../api/stagedImagesApi";

export type UseStageRoomArgs = {
  originalImage: string | null;
  roomType: string;
  setStagedImage: (url: string | null) => void;
  setIsLoading: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
  setProgressPhase: (v: string) => void;
  toast: { success: (t: string, d?: string) => void; error: (t: string, d?: string) => void };
  refreshUsageStatus: () => Promise<void>;
};

export function useStageRoom(args: UseStageRoomArgs) {
  const {
    originalImage,
    roomType,
    setStagedImage,
    setIsLoading,
    setIsSaving,
    setProgressPhase,
    toast,
    refreshUsageStatus,
  } = args;

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const ifMounted = useCallback((fn: () => void) => {
    if (isMountedRef.current) {
      fn();
    }
  }, []);

  const saveImageToDatabase = useCallback(async (payload: SaveImagePayload) => {
    if (!originalImage || !payload?.stagedStoragePath || !payload?.originalStoragePath) return;
    
    ifMounted(() => setIsSaving(true));
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
      ifMounted(() => setIsSaving(false));
    }
  }, [
    originalImage,
    roomType,
    setIsSaving,
    ifMounted,
  ]);

  const stageRoom = useCallback(async () => {
    if (!originalImage) {
      toast.error("No image selected", "Please upload an image before staging");
      return;
    }

    ifMounted(() => setIsLoading(true));
    try {
      ifMounted(() => setProgressPhase("Preparing image…"));
      // Remove the data URL prefix to get just the base64 data
      const base64Image = originalImage.split(',')[1];

      // Get the selected room type label for the prompt
      const selectedRoomTypeLabel = roomTypes.find(rt => rt.value === roomType)?.label || "Room";

      // Log the staging process
      console.log(`Starting staging process for ${selectedRoomTypeLabel}`);

      ifMounted(() => setProgressPhase("Generating staged image…"));
      const result = await generateStagedRoom({
        imageBase64: base64Image,
        roomTypeLabel: selectedRoomTypeLabel
      });

      if (!result.ok) {
        throw new Error(result.errorMessage);
      }

      const data = result.data;

      ifMounted(() => setProgressPhase("Finalizing…"));
      const stagedPreviewUrl = data.stagedSignedUrl ?? data.imageUrl ?? null;
      ifMounted(() => setStagedImage(stagedPreviewUrl));
      
      // Save the staged image to the database
      ifMounted(() => setProgressPhase("Saving…"));
      await saveImageToDatabase({
        storageBucket: data.storageBucket,
        originalStoragePath: data.originalStoragePath,
        stagedStoragePath: data.stagedStoragePath,
        originalImageUrl: data.originalSignedUrl ?? null,
        stagedImageUrl: data.stagedSignedUrl ?? data.imageUrl ?? null,
      });
      
      toast.success("Success!", "Your staged room image is ready");
      
      // Fire Google Ads conversion event for successful staging
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-11090220613/Te5ZCLnx5JgYEMWsnagp'
        });
      }
      
      // Refresh usage status after successful staging
      await refreshUsageStatus();
    } catch (err) {
      console.error('Error staging image:', err);
      toast.error("Error", err instanceof Error ? err.message : "Failed to generate staged image");
      
      // Refresh usage status even after error (might be due to limit)
      await refreshUsageStatus();
      ifMounted(() => setProgressPhase(""));
    } finally {
      ifMounted(() => setIsLoading(false));
      ifMounted(() => setProgressPhase(""));
      ifMounted(() => setIsSaving(false)); // ensure saving always clears if an early throw happens
    }
  }, [
    originalImage,
    roomType,
    setStagedImage,
    setIsLoading,
    setIsSaving,
    setProgressPhase,
    toast,
    refreshUsageStatus,
    saveImageToDatabase,
    ifMounted,
  ]);

  return { stageRoom };
}
