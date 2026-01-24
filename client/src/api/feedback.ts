export type FeedbackPayload = {
  rating: number;
  goal: string;
  issue?: string | null;
  freeformFeedback?: string | null;
  requestedFeature?: string | null;
  persona?: string | null;
  usageFrequency?: string | null;
  pricingPreference?: string | null;
  willingnessToPayRange?: string | null;
  watermarkPreference?: string | null;
  watermarkTextPreference?: string | null;
  canPublishTestimonial?: boolean;
  canShareBeforeAfter?: boolean;
  jobId?: string | null;
  planType?: string | null;
  roomType?: string | null;
  styleSelected?: string | null;
  deviceType?: string | null;
  country?: string | null;
  email?: string | null;
  source?: "post_render" | "post_download" | "post_purchase" | "nav_tab";
};

export async function submitFeedback(payload: FeedbackPayload) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error ?? "Failed to save feedback";
    throw new Error(message);
  }
  return data as { success: true; id: string };
}
