export const criticalChecks = ["completeFurniture", "architecturePreserved", "noClippedOrFadedObjects", "realisticScaleAndPerspective", "floorContactAndShadows", "accessClear"] as const;
export type VisualReview = {
  reviewer: string;
  reviewedAt: string;
  checks: Partial<Record<typeof criticalChecks[number], "pass" | "fail" | "uncertain">>;
  notes: string[];
};
// A provider success or an AI reviewer approval is not benchmark acceptance.
export function evaluateVisualReview(review?: VisualReview) {
  if (!review || !review.reviewer.trim() || !Number.isFinite(Date.parse(review.reviewedAt))) return "unreviewed" as const;
  if (criticalChecks.some(key => review.checks[key] === "fail")) return "rejected" as const;
  if (criticalChecks.some(key => review.checks[key] !== "pass")) return "uncertain" as const;
  return "accepted" as const;
}
