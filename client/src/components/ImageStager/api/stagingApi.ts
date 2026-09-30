export type GenerateStagedRoomRequest = {
  image: string;
  roomType: string;
  mask?: string;
  mode?: string;
  requestId: string;
};
export type GenerateStagedRoomResponse = {
  requestId: string;
  promptHash: string;
  stagedSignedUrl?: string;
  originalSignedUrl?: string;
  imageUrl?: string;
};
export const pendingJobKey = "roomstager.pendingJob";
export async function getJob(id: string, signal?: AbortSignal) {
  const res = await fetch(`/api/staging-jobs/${encodeURIComponent(id)}`, {
    signal,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    if ([401, 402, 404].includes(res.status))
      sessionStorage.removeItem(pendingJobKey);
    throw new Error(data.error || "Unable to load your image. Please retry.");
  }
  return data;
}
export async function generateStagedRoom(req: GenerateStagedRoomRequest) {
  sessionStorage.setItem(pendingJobKey, req.requestId);
  const res = await fetch("/api/generate-staged-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    sessionStorage.removeItem(pendingJobKey);
    throw new Error(data.error || "Unable to start staging.");
  }
  sessionStorage.setItem(pendingJobKey, data.jobId);
  return data.jobId as string;
}
