import { useRef, useCallback, ChangeEvent } from "react";
import { trackEvent } from "@/analytics/events";

/**
 * Resize and compress an image file using canvas
 * Returns a data URL with the resized image
 */
async function fileToResizedDataUrl(
  file: File,
  maxDim: number = 1280,
  quality: number = 0.85,
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
        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to JPEG at specified quality
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
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

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      void (async () => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1) type validation (same as before)
        if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type) && !/\.hei[cf]$/i.test(file.name)) {
          trackEvent("upload_failed", { reason: "file_type" });
          args.toast.error(
            "Invalid file type",
            "Use JPG, PNG or WebP. For iPhone HEIC photos, export as JPEG first.",
          );
          return;
        }

        // 2) NEW: size validation (10MB)
        const limit = args.maxBytes ?? 10 * 1024 * 1024;
        if (file.size > limit) {
          trackEvent("upload_failed", { reason: "file_size" });
          args.toast.error(
            "File too large",
            "Please upload an image under 10MB.",
          );
          // optional: clear the input so the same file can be re-selected
          e.target.value = "";
          return;
        }

        // Reset staged image when a new file is uploaded (same behavior)
        args.resetStagedImage();

        try {
          // Try to resize and compress the image
          const resizedDataUrl = await fileToResizedDataUrl(file, 1536, 0.95);
          args.setOriginalImage(resizedDataUrl);
          trackEvent("upload_complete");
        } catch (resizeError) {
          trackEvent("upload_failed", { reason: "decode" });
          args.toast.error(
            "Unable to open this photo",
            "This browser cannot decode this photo. For iPhone HEIC, export a JPEG from Photos, or use Settings → Camera → Formats → Most Compatible for new photos.",
          );
          e.target.value = "";
        }
      })();
    },
    [args.toast, args.setOriginalImage, args.resetStagedImage, args.maxBytes],
  );

  return { fileInputRef, triggerFileInput, handleFileChange };
}
