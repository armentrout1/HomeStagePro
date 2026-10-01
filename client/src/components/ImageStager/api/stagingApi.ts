import { loadLocal, saveLocal } from "@/lib/localDraft";
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
    throw Object.assign(new Error(data.error || "Unable to load your image. Please retry."), { status: res.status });
  }
  return data;
}
export async function generateStagedRoom(req: GenerateStagedRoomRequest) {
  await saveLocal("pending", req);
  sessionStorage.setItem(pendingJobKey, req.requestId);
  const res = await fetch("/api/generate-staged-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status < 500) await clearPending();
    throw new Error(data.error || "Unable to start staging.");
  }
  sessionStorage.setItem(pendingJobKey, data.jobId);
  return data.jobId as string;
}
export async function clearPending() {
  sessionStorage.removeItem(pendingJobKey);
  await saveLocal("pending", null);
}
export async function pendingRequest() { return loadLocal<GenerateStagedRoomRequest>("pending"); }
