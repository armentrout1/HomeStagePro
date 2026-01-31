export type GenerateStagedRoomRequest = {
  image: string;
  roomType: string;
  mask?: string;
};

export type GenerateStagedRoomResponse = {
  requestId: string;
  promptHash: string;
  stagedSignedUrl?: string | null;
  imageUrl?: string | null;
  storageBucket?: string | null;
  originalStoragePath?: string | null;
  stagedStoragePath?: string | null;
  originalSignedUrl?: string | null;
};

export async function generateStagedRoom(
  req: GenerateStagedRoomRequest
): Promise<{ ok: true; data: GenerateStagedRoomResponse } | { ok: false; status: number; errorMessage: string }> {
  try {
    console.log("🚀 Starting generateStagedRoom request");
    console.log("📸 Request data:", { 
      hasImage: !!req.image, 
      imageLength: req.image?.length,
      roomType: req.roomType,
      hasMask: !!req.mask 
    });
    
    const requestBody = JSON.stringify(req);
    console.log("📦 Request body size:", requestBody.length, "bytes");
    
    console.log("🌐 Sending fetch to /api/generate-staged-room");
    const response = await fetch('/api/generate-staged-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    console.log("✅ Received response:", response.status, response.statusText);
    console.log("📄 Response headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("📊 Response data:", data);

    if (!response.ok) {
      if (response.status === 402) {
        return {
          ok: false,
          status: response.status,
          errorMessage: "Paid access required. Please choose a pack to continue."
        };
      } else {
        return {
          ok: false,
          status: response.status,
          errorMessage: data.error || 'Failed to generate staged image'
        };
      }
    }

    return {
      ok: true,
      data: data
    };
  } catch (error) {
    console.error("❌ Fetch error details:", error);
    console.error("❌ Error name:", error instanceof Error ? error.name : 'Unknown');
    console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    return {
      ok: false,
      status: 0,
      errorMessage: 'Failed to generate staged image'
    };
  }
}
