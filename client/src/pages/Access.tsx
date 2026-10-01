import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getJob, pendingJobKey } from "@/components/ImageStager/api/stagingApi";
type SavedJob = { id: string; state: "processing" | "completed" | "failed"; created_at: string };
export default function Access() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [more, setMore] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const loadJobs = async (before?: string) => {
    setLoadingHistory(true);
    try {
      const r = await fetch(`/api/staging-jobs${before ? `?before=${encodeURIComponent(before)}` : ""}`, { cache: "no-store" });
      if (!r.ok) { if (r.status !== 401 && r.status !== 403) throw new Error("Could not load your images. Please retry."); return; }
      const rows: SavedJob[] = await r.json();
      setJobs((old) => before ? [...old, ...rows.filter((row) => !old.some((j) => j.id === row.id))] : rows);
      setMore(rows.length === 30);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not load your images."); }
    finally { setLoadingHistory(false); }
  };
  const download = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const job = await getJob(selectedId);
      if (job.state !== "completed") throw new Error("This image is not ready.");
      const url = job.data.stagedSignedUrl;
      setImage(url);
      const response = await fetch(url);
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Download unavailable. Please retry.");
      const blob = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blob; link.download = "virtually-staged-room.png";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(blob), 1000);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Download unavailable. Please retry."); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    window.history.replaceState(null, "", "/access");
    const load = async () => {
      if (token) {
        setBusy(true);
        try {
          const r = await fetch("/api/access/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setMessage(
            "Your pack is open on this device. You can start staging or reopen a saved image.",
          );
        } catch (e) {
          setMessage(
            e instanceof Error ? e.message : "Could not open this link.",
          );
        } finally {
          setBusy(false);
        }
      }
      await loadJobs();
    };
    void load();
  }, []);
  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setMessage(d.message || d.error);
    } catch {
      setMessage("Unable to request your link. Please retry.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mx-auto max-w-2xl px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">My access & saved images</h1>
      <p>
        Use the private link in your purchase email to reopen your pack on any
        device. No password needed. Keep the link private because anyone with it
        can use your credits.
      </p>
      <p className="text-sm text-slate-600">Download the images you want to keep before your pack expires. Your purchase email includes its expiry date.</p>
      <p role="status" className="text-sm font-medium">
        {busy ? "Please wait…" : message}
      </p>
      <Link
        href="/#ai-stager"
        className="inline-block rounded bg-amber-400 px-5 py-3 font-semibold"
      >
        Open the room stager
      </Link>
      {jobs.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your saved images</h2>
            <button disabled={loadingHistory} onClick={() => void loadJobs()} className="rounded border px-3 py-2">{loadingHistory ? "Loading…" : "Refresh status"}</button>
          </div>
          {jobs.map((j) => (
            <button
              key={j.id}
              className="block w-full rounded border p-3 text-left"
              onClick={async () => {
                if (j.state === "processing") {
                  sessionStorage.setItem(pendingJobKey, j.id);
                  window.location.href = "/#ai-stager";
                  return;
                }
                try {
                  const d = await getJob(j.id);
                  if (d.state === "completed") { setImage(d.data.stagedSignedUrl); setSelectedId(j.id); }
                  else setMessage(d.error);
                } catch (e) {
                  setMessage(
                    e instanceof Error ? e.message : "Could not open image.",
                  );
                }
              }}
            >
              {new Date(j.created_at).toLocaleString()} — {j.state === "completed" ? "Ready · open image" : j.state === "processing" ? "Processing · reconnect" : "Not completed · credit restored"}
            </button>
          ))}
          {more && <button disabled={loadingHistory} onClick={() => void loadJobs(jobs[jobs.length - 1].id)} className="rounded border px-4 py-3">{loadingHistory ? "Loading…" : "Load older images"}</button>}
        </section>
      )}
      {image && (
        <div>
          <img src={image} alt="Your saved virtually staged room" onError={() => setMessage("This preview link may have expired. Select the image again to refresh it.")} />
          <button disabled={busy} onClick={() => void download()} className="mr-4 rounded bg-amber-400 px-4 py-3 font-semibold">Download image</button>
          <a
            href={image}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open full image
          </a>
        </div>
      )}
      <form onSubmit={request} className="space-y-3 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">Email my access links</h2>
        <label className="block">
          Email used at checkout
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 block w-full rounded border p-3"
          />
        </label>
        <button
          disabled={busy}
          className="rounded bg-slate-900 px-4 py-3 text-white"
        >
          Send my links
        </button>
      </form>
    </section>
  );
}
