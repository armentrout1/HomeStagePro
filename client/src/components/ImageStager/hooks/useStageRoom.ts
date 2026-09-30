import { useCallback, useEffect, useRef, useState } from "react";
import { roomTypes } from "../constants";
import { generateStagedRoom, getJob, pendingJobKey } from "../api/stagingApi";
export type UseStageRoomArgs = {
  originalImage: string | null;
  roomType: string;
  mode: string;
  setStagedImage: (url: string | null) => void;
  setIsLoading: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
  setProgressPhase: (s: string) => void;
  toast: {
    success: (t: string, d?: string) => void;
    error: (t: string, d?: string) => void;
  };
  refreshUsageStatus: () => Promise<void>;
};
export function useStageRoom(args: UseStageRoomArgs) {
  const latest = useRef(args);
  latest.current = args;
  const [requestId, setRequestId] = useState<string | null>(null);
  const [promptHash, setPromptHash] = useState<string | null>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const watch = useCallback(async (id: string) => {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    latest.current.setIsLoading(true);
    latest.current.setProgressPhase(
      "Staging your room. This can take a few minutes; your result is saved automatically.",
    );
    try {
      for (;;) {
        const job = await getJob(id, ac.signal);
        if (job.state === "failed") {
          sessionStorage.removeItem(pendingJobKey);
          throw new Error(job.error);
        }
        if (job.state === "completed") {
          sessionStorage.removeItem(pendingJobKey);
          latest.current.setStagedImage(
            job.data.stagedSignedUrl || job.data.imageUrl,
          );
          setRequestId(job.data.requestId);
          setPromptHash(job.data.promptHash);
          latest.current.toast.success(
            "Your staged image is ready",
            "Review the room details before publishing. Label it as virtually staged.",
          );
          window.gtag?.("event", "staging_complete", {
            room_type: latest.current.roomType,
          });
          break;
        }
        await new Promise<void>((resolve, reject) => {
          const abort = () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          };
          const timer = setTimeout(() => {
            ac.signal.removeEventListener("abort", abort);
            resolve();
          }, 2000);
          ac.signal.addEventListener("abort", abort, { once: true });
        });
      }
    } catch (e) {
      if (!ac.signal.aborted)
        latest.current.toast.error(
          "Staging update",
          e instanceof Error
            ? e.message
            : "Open My access to recover your image.",
        );
    } finally {
      if (!ac.signal.aborted) {
        busy.current = false;
        latest.current.setIsLoading(false);
        latest.current.setProgressPhase("");
        void latest.current.refreshUsageStatus();
      }
    }
  }, []);
  useEffect(() => {
    const id = sessionStorage.getItem(pendingJobKey);
    if (id) {
      busy.current = true;
      void watch(id);
    }
    return () => controller.current?.abort();
  }, [watch]);
  const stageRoom = useCallback(
    async (mask?: string | null) => {
      if (busy.current) return;
      const a = latest.current;
      if (!a.originalImage) return;
      busy.current = true;
      a.setIsLoading(true);
      try {
        const id = await generateStagedRoom({
          requestId: crypto.randomUUID(),
          image: a.originalImage.split(",")[1],
          roomType:
            roomTypes.find((r) => r.value === a.roomType)?.label ||
            "Living Room",
          mask: mask || undefined,
          mode: a.mode,
        });
        window.gtag?.("event", "staging_start", {
          room_type: a.roomType,
          edit_mode: a.mode,
        });
        await watch(id);
      } catch (e) {
        busy.current = false;
        a.setIsLoading(false);
        a.toast.error(
          "Couldn’t start staging",
          e instanceof Error ? e.message : "Please retry.",
        );
        void a.refreshUsageStatus();
      }
    },
    [watch],
  );
  return { stageRoom, requestId, promptHash };
}
