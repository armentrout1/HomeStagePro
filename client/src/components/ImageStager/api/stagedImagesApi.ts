export type SaveStagedImageRequest = {
  storageBucket?: string | null;
  originalStoragePath?: string | null;
  stagedStoragePath?: string | null;
  originalImageUrl?: string | null;
  stagedImageUrl?: string | null;
  roomType: string;
};

export async function saveStagedImage(
  req: SaveStagedImageRequest
): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
  try {
    const response = await fetch('/api/staged-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        ok: false,
        errorMessage: errorData.error || 'Failed to save image to database'
      };
    }
    
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      errorMessage: 'Failed to save image to database'
    };
  }
}
