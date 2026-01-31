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
    const response = await fetch('/api/generate-staged-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    const data = await response.json();

    if (!response.ok) {
      // Check specifically for payment required (402) status
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
    return {
      ok: false,
      status: 0,
      errorMessage: 'Failed to generate staged image'
    };
  }
}
