import { stagingRequestSchema, type StagingService } from "../../shared/staging/contracts";
import { prepareStagingInput } from "./input";
import type { StagingProvider } from "./providers/types";

export interface StagingArtifacts {
  bucket: string;
  prefix: string;
  put(path: string, bytes: Buffer, mime: string): Promise<void>;
}
export type StagingDependencies = {
  provider: StagingProvider;
  artifacts: StagingArtifacts;
  thumbnail(image: Buffer): Promise<Buffer>;
  now?: () => Date;
};

/** Framework-independent application boundary. No HTTP objects, links or credits. */
export function createStagingService(dependencies: StagingDependencies): StagingService {
  return async raw => {
    const parsed = stagingRequestSchema.safeParse(raw);
    if (!parsed.success) return { success: false, code: "INVALID_INPUT", error: "Choose a valid room photo and room type." };
    const input = parsed.data;
    let prepared;
    try { prepared = await prepareStagingInput(input); }
    catch { return { success: false, code: "INVALID_INPUT", error: "Use a supported photo and a matching edit selection." }; }
    const rendered = await dependencies.provider.render({ ...prepared, roomType: input.roomType, mode: input.mode });
    const metrics = { ...rendered.metrics, provider: dependencies.provider.id };
    if (!rendered.success) return { success: false, code: rendered.code, metrics, error: "We could not produce a complete, well-placed result." };
    const date = (dependencies.now?.() ?? new Date()).toISOString().slice(0, 7);
    const base = `${dependencies.artifacts.prefix}/results/${date}/${input.requestId}`;
    const originalStoragePath = `${base}/original.${prepared.extension}`;
    const stagedStoragePath = `${base}/staged.png`;
    // Storage errors propagate to the job's idempotent failure/refund path.
    // Do not retry image generation when an upload failed.
    await dependencies.artifacts.put(originalStoragePath, prepared.original, prepared.mime);
    await dependencies.artifacts.put(stagedStoragePath, rendered.image, "image/png");
    let thumbnailStoragePath: string | null = `${base}/thumbnail.webp`;
    try { await dependencies.artifacts.put(thumbnailStoragePath, await dependencies.thumbnail(rendered.image), "image/webp"); }
    catch { thumbnailStoragePath = null; }
    return { success: true, requestId: input.requestId, promptHash: metrics.promptHash, metrics,
      originalStoragePath, stagedStoragePath, thumbnailStoragePath, storageBucket: dependencies.artifacts.bucket };
  };
}
