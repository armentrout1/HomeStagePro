import { renderStaging, PIPELINE_VERSION } from "../../stagingPipeline";
import type { StagingProvider } from "./types";

// Explicit baseline, not a fallback for a failed complete-room engine.
export const legacyProvider: StagingProvider = {
  id: PIPELINE_VERSION,
  capabilities: { completeArrangements: false, measuredGeometry: false, removal: true, exactUncoveredPixels: true },
  render: renderStaging,
};
