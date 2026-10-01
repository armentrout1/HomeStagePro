import type { StagingMetrics, StagingRequest } from "../../../shared/staging/contracts";

export type RenderInput = {
  original: Buffer;
  mime: string;
  mask: Buffer;
  roomType: StagingRequest["roomType"];
  mode: StagingRequest["mode"];
};
export type RenderResult =
  | { success: true; image: Buffer; metrics: StagingMetrics }
  | { success: false; code: string; metrics: StagingMetrics };
export interface StagingProvider {
  id: string;
  capabilities: {
    completeArrangements: boolean;
    measuredGeometry: boolean;
    removal: boolean;
    exactUncoveredPixels: boolean;
  };
  render(input: RenderInput): Promise<RenderResult>;
}
