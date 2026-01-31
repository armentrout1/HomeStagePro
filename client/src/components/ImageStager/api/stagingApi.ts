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
    
    // Debug each parameter individually
    console.log("🔍 Debugging req parameters:");
    console.log("- req.image type:", typeof req.image);
    console.log("- req.image length:", req.image?.length);
    console.log("- req.roomType type:", typeof req.roomType);
    console.log("- req.roomType value:", req.roomType);
    console.log("- req.mask type:", typeof req.mask);
    console.log("- req.mask value:", req.mask);
    console.log("- req.mask is null?", req.mask === null);
    console.log("- req.mask is undefined?", req.mask === undefined);
    
    // Test JSON.stringify on each part individually
    try {
      JSON.stringify(req.image);
      console.log("✅ req.image stringifies OK");
    } catch (e) {
      console.error("❌ req.image stringify error:", e);
    }
    
    try {
      JSON.stringify(req.roomType);
      console.log("✅ req.roomType stringifies OK");
    } catch (e) {
      console.error("❌ req.roomType stringify error:", e);
    }
    
    try {
      JSON.stringify(req.mask);
      console.log("✅ req.mask stringifies OK");
    } catch (e) {
      console.error("❌ req.mask stringify error:", e);
    }
    
    // Create clean request object to avoid circular references
    const cleanRequest = {
      image: req.image,
      roomType: req.roomType,
      mask: (typeof req.mask === 'string' && req.mask.length > 0) ? req.mask : undefined
    };
    
    console.log("📸 Request data:", { 
      hasImage: !!cleanRequest.image, 
      imageLength: cleanRequest.image?.length,
      roomType: cleanRequest.roomType,
      hasMask: !!cleanRequest.mask 
    });
    
    console.log("🧪 Testing cleanRequest stringify...");
    try {
      const requestBody = JSON.stringify(cleanRequest);
      console.log("✅ cleanRequest stringifies OK");
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
    } catch (stringifyError) {
      console.error("❌ Stringify failed:", stringifyError);
      throw stringifyError;
    }
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
