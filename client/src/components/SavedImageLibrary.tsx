import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Trash2 } from "lucide-react";
import { getJob, pendingJobKey } from "@/components/ImageStager/api/stagingApi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
type SavedJob = {
  id: string;
  state: "processing" | "completed" | "failed";
  created_at: string;
  room_type?: string;
  mode?: string;
  thumbnailUrl?: string | null;
  purge_started_at?: string | null;
};
const modeLabel: Record<string, string> = {
  furnish: "Furnished",
  replace: "Restyled",
  remove: "Furniture removed",
};
const statusLabel = (j: SavedJob) =>
  j.state === "completed"
    ? "Ready · open image"
    : j.state === "processing"
      ? "Processing · reconnect"
      : "Not completed · credit restored";

export default function SavedImageLibrary() {
  const [view, setView] = useState<"saved" | "trash">("saved");
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<{ id: string; url: string } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SavedJob | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const sequence = useRef(0);
  const loadJobs = useCallback(
    async (before?: string) => {
      const seq = ++sequence.current;
      setLoading(true);
      const query = new URLSearchParams({ view });
      if (before) query.set("before", before);
      try {
        const r = await fetch(`/api/staging-jobs?${query}`, {
          cache: "no-store",
        });
        if (seq !== sequence.current) return;
        if ([401, 402, 403].includes(r.status)) {
          setAuthorized(false);
          setJobs([]);
          setMore(false);
          return;
        }
        if (!r.ok) throw Error("Could not load your images. Please retry.");
        const rows: SavedJob[] = await r.json();
        if (seq !== sequence.current) return;
        setAuthorized(true);
        setJobs((old) =>
          before
            ? [
                ...old,
                ...rows.filter((row) => !old.some((j) => j.id === row.id)),
              ]
            : rows,
        );
        setMore(rows.length === 30);
      } catch (e) {
        if (seq === sequence.current)
          setMessage(
            e instanceof Error ? e.message : "Could not load your images.",
          );
      } finally {
        if (seq === sequence.current) setLoading(false);
      }
    },
    [view],
  );
  useEffect(() => {
    setJobs([]);
    setMore(false);
    setSelected(null);
    setMessage("");
    void loadJobs();
    return () => {
      sequence.current++;
    };
  }, [loadJobs]);

  const open = async (j: SavedJob) => {
    if (j.state === "processing") {
      sessionStorage.setItem(pendingJobKey, j.id);
      window.location.href = "/#ai-stager";
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const d = await getJob(j.id);
      if (d.state === "completed")
        setSelected({ id: j.id, url: d.data.stagedSignedUrl });
      else setMessage(d.error);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not open image.");
    } finally {
      setBusy(false);
    }
  };
  const download = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const job = await getJob(selected.id);
      if (job.state !== "completed") throw Error("This image is not ready.");
      const url = job.data.stagedSignedUrl;
      setSelected({ id: selected.id, url });
      const r = await fetch(url);
      if (!r.ok || !r.headers.get("content-type")?.startsWith("image/"))
        throw Error("Download unavailable. Please retry.");
      const blob = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = blob;
      a.download = "virtually-staged-room.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blob), 1000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Download unavailable.");
    } finally {
      setBusy(false);
    }
  };
  const change = async (
    j: SavedJob,
    action: "trash" | "restore" | "delete",
  ) => {
    setBusy(true);
    setMessage("");
    setDeleteError("");
    try {
      const r = await fetch(
        `/api/staging-jobs/${j.id}${action === "delete" ? "" : "/" + action}`,
        {
          method: action === "delete" ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "delete" ? { confirm: true } : {}),
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Could not update this image.");
      setSelected(null);
      setDeleteTarget(null);
      await loadJobs();
      setMessage(
        action === "trash"
          ? "Moved to Trash. You can restore it there."
          : action === "restore"
            ? "Restored to saved images."
            : "The stored original, result and preview were permanently deleted. Your credit balance is unchanged.",
      );
    } catch (e) {
      const text =
        e instanceof Error ? e.message : "Could not update this image.";
      if (action === "delete") setDeleteError(text);
      else setMessage(text);
      await loadJobs();
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="Saved image library" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Your saved images</h2>
        <button
          disabled={loading || busy}
          onClick={() => void loadJobs()}
          className="rounded border px-3 py-2"
        >
          {loading ? "Loading…" : "Refresh status"}
        </button>
      </div>
      <div className="flex gap-2" role="group" aria-label="Image history view">
        {(["saved", "trash"] as const).map((v) => (
          <button
            key={v}
            disabled={busy}
            aria-pressed={view === v}
            onClick={() => {
              if (v === view) return;
              sequence.current++;
              setJobs([]);
              setMore(false);
              setLoading(true);
              setSelected(null);
              setView(v);
            }}
            className={`rounded-full border px-4 py-2 ${view === v ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            {v === "saved" ? "Saved images" : "Trash"}
          </button>
        ))}
      </div>
      {view === "trash" && (
        <p className="text-sm text-slate-600">
          Items stay in Trash until you restore them or confirm permanent
          deletion. Moving to Trash does not erase files or immediately
          invalidate a download link already issued.
        </p>
      )}
      <p role="status" className="text-sm" aria-live="polite">
        {message}
      </p>
      {!loading && !jobs.length && (
        <p className="rounded-xl border border-dashed p-6 text-slate-600">
          {!authorized
            ? "Open your private email link to view this pack’s images."
            : view === "trash"
              ? "Trash is empty."
              : "Your completed images will appear here after you stage a room."}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {jobs.map((j) => (
          <article
            key={j.id}
            className="overflow-hidden rounded-xl border bg-white"
          >
            {view === "saved" ? (
              <button
                disabled={busy}
                onClick={() => void open(j)}
                className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              >
                <div
                  className={`relative flex items-center justify-center bg-slate-100 text-slate-400 ${j.thumbnailUrl ? "aspect-[3/2]" : "h-24"}`}
                >
                  <ImageIcon aria-hidden="true" className="h-9 w-9" />
                  {j.thumbnailUrl && (
                    <img
                      src={j.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width="384"
                      height="256"
                      className="absolute inset-0 h-full w-full object-cover"
                      onLoad={(e) => {
                        e.currentTarget.style.visibility = "visible";
                      }}
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="font-semibold">
                    {j.room_type || "Room photo"}
                    {j.mode ? ` · ${modeLabel[j.mode] || j.mode}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(j.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm">{statusLabel(j)}</p>
                </div>
              </button>
            ) : (
              <div className="p-3">
                <p className="font-semibold">{j.room_type || "Room photo"}</p>
                <p className="text-sm text-slate-500">
                  {new Date(j.created_at).toLocaleString()}
                </p>
                {j.purge_started_at && (
                  <p className="mt-2 text-sm text-amber-800">
                    Deletion started. Retry to finish removing the files.
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t p-3">
              {view === "saved" ? (
                <button
                  disabled={busy || j.state === "processing"}
                  onClick={() => void change(j, "trash")}
                  className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Move to Trash
                </button>
              ) : (
                <>
                  <button
                    disabled={busy || Boolean(j.purge_started_at)}
                    onClick={() => void change(j, "restore")}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Restore image
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setDeleteError("");
                      setDeleteTarget(j);
                    }}
                    className="rounded border border-red-200 px-3 py-2 text-sm text-red-700"
                  >
                    Delete permanently
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {more && (
        <button
          disabled={loading || busy}
          onClick={() => void loadJobs(jobs[jobs.length - 1].id)}
          className="rounded border px-4 py-3"
        >
          {loading ? "Loading…" : "Load older images"}
        </button>
      )}
      {selected && (
        <div className="space-y-3 rounded-xl border bg-white p-3">
          <img
            src={selected.url}
            alt="Your saved virtually staged room"
            onError={() =>
              setMessage(
                "This preview link may have expired. Select the image again to refresh it.",
              )
            }
          />
          <div className="flex flex-wrap items-center gap-4">
            <button
              disabled={busy}
              onClick={() => void download()}
              className="rounded bg-amber-400 px-4 py-3 font-semibold"
            >
              Download image
            </button>
            <a
              href={selected.url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Open full image
            </a>
            <button onClick={() => setSelected(null)} className="underline">
              Close preview
            </button>
          </div>
        </div>
      )}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the stored original photo, staged result and preview
              for this attempt. You cannot restore them afterward. Downloaded
              copies are unaffected, and deletion does not restore a staging
              credit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-red-700">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep in Trash</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-red-700 hover:bg-red-800"
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) void change(deleteTarget, "delete");
              }}
            >
              {busy ? "Deleting…" : "Delete these files permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
