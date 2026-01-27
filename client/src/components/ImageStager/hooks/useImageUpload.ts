import { useRef, useCallback, ChangeEvent } from "react";

/**
 * Resize and compress an image file using canvas
 * Returns a data URL with the resized image
 */
async function fileToResizedDataUrl(
  file: File, 
  maxDim: number = 1280, 
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // Calculate new dimensions preserving aspect ratio
        const { width, height } = img;
        let newWidth = width;
        let newHeight = height;
        
        if (width > height) {
          if (width > maxDim) {
            newWidth = maxDim;
            newHeight = Math.round((height * maxDim) / width);
          }
        } else {
          if (height > maxDim) {
            newHeight = maxDim;
            newWidth = Math.round((width * maxDim) / height);
          }
        }
        
        // Ensure dimensions are at least 1px
        newWidth = Math.max(1, newWidth);
        newHeight = Math.max(1, newHeight);
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to JPEG at specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * Fallback: read file as data URL without resizing
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

type UseImageUploadArgs = {
  toast: { error: (title: string, description?: string) => void };
  setOriginalImage: (val: string | null) => void;
  resetStagedImage: () => void;
  maxBytes?: number; // default: 10 * 1024 * 1024
};

export function useImageUpload(args: UseImageUploadArgs) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    void (async () => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 1) type validation (same as before)
      if (!file.type.includes("image/")) {
        args.toast.error("Invalid file type", "Please upload an image file (JPG, PNG, etc.)");
        return;
      }

      // 2) NEW: size validation (10MB)
      const limit = args.maxBytes ?? 10 * 1024 * 1024;
      if (file.size > limit) {
        args.toast.error("File too large", "Please upload an image under 10MB.");
        // optional: clear the input so the same file can be re-selected
        e.target.value = "";
        return;
      }

      // Reset staged image when a new file is uploaded (same behavior)
      args.resetStagedImage();

      try {
        // Try to resize and compress the image
        const resizedDataUrl = await fileToResizedDataUrl(file, 1280, 0.85);
        args.setOriginalImage(resizedDataUrl);
      } catch (resizeError) {
        console.warn('Image resize failed, falling back to original:', resizeError);
        // Fallback to original FileReader behavior
        try {
          const originalDataUrl = await fileToDataUrl(file);
          args.setOriginalImage(originalDataUrl);
        } catch (fallbackError) {
          console.error('Both resize and fallback failed:', fallbackError);
          args.toast.error("Processing failed", "Unable to process the selected image.");
        }
      }
    })();
  }, [
    args.toast,
    args.setOriginalImage,
    args.resetStagedImage,
    args.maxBytes,
  ]);

  return { fileInputRef, triggerFileInput, handleFileChange };
}
