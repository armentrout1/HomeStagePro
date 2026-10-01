import { z } from "zod";

export const stagingRequestSchema = z.object({
  requestId: z.string().uuid(),
  image: z.string().min(20).max(14_000_000),
  mask: z.string().max(14_000_000).optional(),
  roomType: z.enum(["Living Room", "Bedroom", "Kitchen", "Dining Room", "Bathroom", "Home Office", "Outdoor Space", "Entry / Foyer", "Other"]),
  mode: z.enum(["furnish", "replace", "remove"]).default("furnish"),
});
export type StagingRequest = z.infer<typeof stagingRequestSchema>;
export type StagingMetrics = { promptHash: string; [key: string]: unknown };
export type StagingFailure = {
  success: false;
  code: string;
  error: string;
  metrics?: StagingMetrics;
};
export type SavedStagingResult = {
  success: true;
  requestId: string;
  promptHash: string;
  storageBucket: string;
  originalStoragePath: string;
  stagedStoragePath: string;
  thumbnailStoragePath: string | null;
  metrics: StagingMetrics;
};
// The service neither debits nor refunds credits. The job owns that transaction.
export type StagingService = (input: StagingRequest) => Promise<SavedStagingResult | StagingFailure>;
