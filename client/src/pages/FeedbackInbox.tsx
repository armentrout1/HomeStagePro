import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const MIN_RATING_OPTIONS = [
  { label: "All", value: 0 },
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
  { label: "5 only", value: 5 },
];

type FeedbackSubmissionRecord = {
  id: string;
  createdAt?: string;
  created_at?: string;
  rating?: number;
  goal?: string | null;
  issue?: string | null;
  requestedFeature?: string | null;
  requested_feature?: string | null;
  persona?: string | null;
  freeformFeedback?: string | null;
  freeform_feedback?: string | null;
  canPublishTestimonial?: boolean;
  can_publish_testimonial?: boolean;
  email?: string | null;
  [key: string]: unknown;
};

type LoadState = "loading" | "ready" | "missing" | "error";

const truncate = (value: string | null | undefined, length = 60) => {
  if (!value) return "—";
  return value.length > length ? `${value.slice(0, length)}…` : value;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function FeedbackInbox() {
  const [submissions, setSubmissions] = useState<FeedbackSubmissionRecord[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [requireTestimonial, setRequireTestimonial] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [selected, setSelected] = useState<FeedbackSubmissionRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState("loading");
      try {
        const response = await fetch("/api/feedback");
        if (response.status === 404) {
          if (!cancelled) {
            setState("missing");
          }
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to load feedback");
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Unexpected response");
        }
        if (!cancelled) {
          setSubmissions(data);
          setState("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Unknown error");
          setState("error");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return submissions
      .filter((item) => {
        const rating = item.rating ?? (item as any).rating ?? 0;
        if (minRating > 0 && (typeof rating !== "number" || rating < minRating)) {
          return false;
        }
        const hasConsent = item.canPublishTestimonial ?? (item as any).can_publish_testimonial ?? false;
        if (requireTestimonial && !hasConsent) {
          return false;
        }
        const hasEmail = Boolean(item.email);
        if (requireEmail && !hasEmail) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const tsA = new Date((a.createdAt ?? a.created_at) ?? 0).getTime();
        const tsB = new Date((b.createdAt ?? b.created_at) ?? 0).getTime();
        return tsB - tsA;
      });
  }, [submissions, minRating, requireTestimonial, requireEmail]);

  if (!import.meta.env.DEV) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-bold">Feedback Inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is only available during development.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Developer Panel</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Feedback Inbox</h1>
        <p className="mt-2 text-sm text-slate-600">
          Inspect feedback submissions gathered from the in-product drawer. Filters are client-only for now.
        </p>
      </header>

      {state === "missing" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Feedback Inbox requires <code className="font-mono text-xs">GET /api/feedback</code> endpoint (not enabled).
        </div>
      )}

      {state === "error" && errorMessage && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Failed to load feedback: {errorMessage}
        </div>
      )}

      <section className="flex flex-wrap gap-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="w-40 space-y-2">
          <Label htmlFor="filter-rating" className="text-xs uppercase tracking-wide text-slate-500">
            Min rating
          </Label>
          <Select value={String(minRating)} onValueChange={(value) => setMinRating(Number(value))}>
            <SelectTrigger id="filter-rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MIN_RATING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-testimonial"
            checked={requireTestimonial}
            onCheckedChange={(checked) => setRequireTestimonial(Boolean(checked))}
          />
          <Label htmlFor="filter-testimonial" className="text-sm text-slate-600">
            Has testimonial consent
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-email"
            checked={requireEmail}
            onCheckedChange={(checked) => setRequireEmail(Boolean(checked))}
          />
          <Label htmlFor="filter-email" className="text-sm text-slate-600">
            Has email
          </Label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Requested Feature</th>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Feedback</th>
                <th className="px-4 py-3">Testimonial?</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {state === "loading" && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    Loading submissions…
                  </td>
                </tr>
              )}

              {state === "ready" && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    No submissions match the current filters.
                  </td>
                </tr>
              )}

              {state === "ready" &&
                filtered.map((submission) => {
                  const created = submission.createdAt ?? submission.created_at ?? null;
                  const ratingValue = submission.rating ?? null;
                  const consent = submission.canPublishTestimonial ?? submission.can_publish_testimonial ?? false;
                  const feature = submission.requestedFeature ?? submission.requested_feature ?? null;
                  const freeform = submission.freeformFeedback ?? submission.freeform_feedback ?? null;

                  return (
                    <tr
                      key={submission.id}
                      className="cursor-pointer transition hover:bg-slate-50"
                      onClick={() => setSelected(submission)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">{formatDate(created)}</td>
                      <td className="px-4 py-3 font-semibold">{ratingValue ?? "—"}</td>
                      <td className="px-4 py-3">{submission.goal ?? "—"}</td>
                      <td className="px-4 py-3">{submission.issue ?? "—"}</td>
                      <td className="px-4 py-3">{feature ?? "—"}</td>
                      <td className="px-4 py-3">{submission.persona ?? "—"}</td>
                      <td className="px-4 py-3">{truncate(freeform)}</td>
                      <td className="px-4 py-3">{consent ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{submission.email ?? "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback details</DialogTitle>
            <DialogDescription>
              View the full payload captured for this submission.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="grid gap-3 text-sm">
              {Object.entries(selected).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-2 rounded border border-slate-100 bg-slate-50 p-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {key}
                  </span>
                  <span className="col-span-2 break-words text-slate-800">
                    {value === null || value === undefined || value === ""
                      ? "—"
                      : typeof value === "boolean"
                        ? value ? "true" : "false"
                        : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
