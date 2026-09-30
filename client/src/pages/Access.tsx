import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getJob, pendingJobKey } from "@/components/ImageStager/api/stagingApi";
export default function Access() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [image, setImage] = useState<string | null>(null);
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
      try {
        const r = await fetch("/api/staging-jobs");
        if (r.ok) setJobs(await r.json());
      } catch {}
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
          <h2 className="text-xl font-semibold">Your recent images</h2>
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
                  if (d.state === "completed") setImage(d.data.stagedSignedUrl);
                  else setMessage(d.error);
                } catch (e) {
                  setMessage(
                    e instanceof Error ? e.message : "Could not open image.",
                  );
                }
              }}
            >
              {new Date(j.created_at).toLocaleString()} — {j.state}
            </button>
          ))}
        </section>
      )}
      {image && (
        <div>
          <img src={image} alt="Your saved virtually staged room" />
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
