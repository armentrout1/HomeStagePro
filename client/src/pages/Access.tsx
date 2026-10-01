import { useEffect, useState } from "react";
import { Link } from "wouter";
import SavedImageLibrary from "@/components/SavedImageLibrary";
export default function Access() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [packVersion, setPackVersion] = useState(0);
  useEffect(() => {
    const load = async (token: string | null) => {
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
      setPackVersion((v) => v + 1);
    };
    // Email links may target an already-open /access tab. Hash-only navigation
    // does not remount this component, so consume both initial and later links.
    let pending = Promise.resolve();
    const openLink = () => {
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        "token",
      );
      if (token) window.history.replaceState(null, "", "/access");
      pending = pending.then(() => load(token));
    };
    openLink();
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
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
    <section className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">My access & saved images</h1>
      <p>
        Use the private link in your purchase email to reopen your pack on any
        device. No password needed. Keep the link private because anyone with it
        can use your credits.
      </p>
      <p className="text-sm text-slate-600">
        Download the images you want to keep before your pack expires. Your
        purchase email includes its expiry date.
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
      {!busy && <SavedImageLibrary key={packVersion} />}
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
