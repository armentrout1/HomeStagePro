import { z } from "zod";
export const qualityVerdictSchema = z.object({
  observations: z.array(z.object({ region: z.string(), evidence: z.string(), defect: z.boolean() })).min(1).max(30),
  uncertain: z.boolean(),
  acceptable: z.boolean(),
});
export function normalizeQualityVerdict(raw: unknown) {
  const verdict = qualityVerdictSchema.parse(raw);
  const acceptable = verdict.acceptable && !verdict.uncertain && !verdict.observations.some(o => o.defect);
  return { ...verdict, acceptable, reason: acceptable ? "none" : verdict.uncertain ? "uncertain" : "visual_defect" };
}
