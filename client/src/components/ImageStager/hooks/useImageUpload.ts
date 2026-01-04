import { useRef, useCallback, ChangeEvent } from "react";

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

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        args.setOriginalImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, [
    args.toast,
    args.setOriginalImage,
    args.resetStagedImage,
    args.maxBytes,
  ]);

  return { fileInputRef, triggerFileInput, handleFileChange };
}
