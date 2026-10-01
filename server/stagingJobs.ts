import { registerImageHistory, type ImageHistoryFiles } from "./imageHistory";
import { createHash } from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import { stagingRequestSchema as schema, type StagingRequest, type StagingService, type StagingFailure } from "../shared/staging/contracts";
import { validateStagingInput } from "./staging/input";
import { client } from "./db";
import {
  checkAccessToken,
  requirePaidAccess,
  attachEntitlement,
  getTokenIdFromRequest,
} from "./tokenManager";
import { stagingRateLimiter } from "./middleware/stagingRateLimiter";
import { stageRoom } from "./staging/production";
import { getSignedImageUrl } from "./supabase";
import { jobFiles, storagePrefix, type JobFiles } from "./jobFiles";

export async function refundFailed(id: string, message: string, lease?: string) {
  await client.begin(async (tx) => {
    const [job] =
      await tx`UPDATE staging_jobs SET state='failed', error=${message}, completed_at=now()
      WHERE id=${id} AND state='processing'
      AND (${lease ?? null}::uuid IS NULL OR EXISTS (SELECT 1 FROM staging_work WHERE job_id=${id} AND lease=${lease ?? null}::uuid AND phase='running')) RETURNING token_id`;
    if (job)
      await tx`UPDATE usage_entitlements SET paid_used=GREATEST(0,paid_used-1),updated_at=now() WHERE token_id=${job.token_id}`;
  });
}
export async function recoverStaleJobs() {
  const rows =
    await client`SELECT id FROM staging_jobs WHERE state='processing' AND created_at<now()-interval '15 minutes'
      AND NOT EXISTS (SELECT 1 FROM staging_work WHERE job_id=staging_jobs.id) LIMIT 100`;
  for (const row of rows)
    await refundFailed(
      row.id,
      "This staging was interrupted. Your credit was restored; please try again.",
    );
}
export async function runJob(input: StagingRequest, id: string, generate: StagingService = stageRoom, lease?: string) {
  let failure: StagingFailure | undefined;
  try {
    const result = await generate(input);
    if (!result.success) {
      failure = result;
      throw new Error(result.error);
    }
    // Store paths, not expiring URLs or image payloads; signed links are regenerated on read.
    await client`UPDATE staging_jobs SET state='completed', completed_at=now(), result=${JSON.stringify(
      {
        requestId: result.requestId,
        promptHash: result.promptHash,
        originalStoragePath: result.originalStoragePath,
        stagedStoragePath: result.stagedStoragePath,
        thumbnailStoragePath: result.thumbnailStoragePath,
        storageBucket: result.storageBucket,
        roomType: input.roomType,
        mode: input.mode,
        metrics: result.metrics,
      },
    )}::jsonb WHERE id=${id} AND state='processing'
      AND (${lease ?? null}::uuid IS NULL OR EXISTS (SELECT 1 FROM staging_work WHERE job_id=${id} AND lease=${lease ?? null}::uuid AND phase='running'))`;
  } catch (error) {
    console.error("Staging job failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    await refundFailed(
      id,
      failure?.code === "QUALITY_REVIEW_FAILED"
        ? "We could not produce a clean, complete result. Your credit was restored. Try another photo or adjust the editable area; no result was saved."
        : failure?.code === "NO_REMOVABLE_ITEMS"
        ? "No removable furniture was found in the selected area. Your credit was restored."
        : failure?.code === "REMOVAL_SELECTION_INCOMPLETE"
        ? "The selection cuts through furniture. Include the entire item and its shadow, while protecting windows and fixtures. Your credit was restored."
        : failure?.code === "REMOVAL_PLAN_UNCERTAIN"
        ? "We could not confidently identify the furniture and original flooring. Your credit was restored. Try a clearer photo or selection."
        : "We couldn’t finish this image. Your credit was restored. Please try again.",
      lease,
    );
    if (failure?.metrics) await client`UPDATE staging_jobs SET result=${JSON.stringify({ metrics: failure.metrics, roomType: input.roomType, mode: input.mode })}::jsonb WHERE id=${id} AND state='failed'`;
  }
}
export function registerStagingJobs(
  app: Express,
  generate: StagingService = stageRoom,
  sign = getSignedImageUrl,
  files: JobFiles = jobFiles,
  historyFiles?: ImageHistoryFiles,
) {
  app.post(
    "/api/generate-staged-room",
    checkAccessToken,
    requirePaidAccess,
    attachEntitlement,
    stagingRateLimiter,
    async (req, res) => {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ error: "Choose a valid room photo and room type." });
      const payload = parsed.data;
      try {
        await validateStagingInput(payload);
      } catch {
        return res.status(400).json({
          error:
            "Use a still JPG, PNG or WebP image under 10 MB, at most 2048 pixels per side, and a matching edit selection. The upload tool resizes photos automatically.",
        });
      }
      const tokenId = getTokenIdFromRequest(req)!;
      const hash = createHash("sha256")
        .update(JSON.stringify({ ...payload, requestId: undefined }))
        .digest("hex");
      try {
        const outcome = await client.begin(async (tx) => {
          await tx`SELECT pg_advisory_xact_lock(hashtextextended(${payload.requestId}, 2))`;
          const [old] =
            await tx`SELECT token_id,input_hash,deleted_at,purged_at FROM staging_jobs WHERE id=${payload.requestId}`;
          if (old) {
            if (old.token_id !== tokenId) return "conflict";
            if (old.deleted_at || old.purged_at) return "removed";
            return old.input_hash === hash ? "existing" : "conflict";
          }
          const durable = process.env.STAGING_DURABLE_QUEUE === "true";
          const inputPath = `${storagePrefix()}/inputs/${payload.requestId}/${hash}`;
          const [credit] =
            await tx`UPDATE usage_entitlements SET paid_used=paid_used+1, updated_at=now()
          WHERE token_id=${tokenId} AND paid_used<paid_granted RETURNING token_id`;
          if (!credit) return "empty";
          if (durable) await files.put(inputPath, payload);
          await tx`INSERT INTO staging_jobs(id,token_id,input_hash,state) VALUES (${payload.requestId},${tokenId},${hash},'processing')`;
          if (durable) await tx`INSERT INTO staging_work(job_id,input_path,room_type,edit_mode,has_mask) VALUES (${payload.requestId},${inputPath},${payload.roomType},${payload.mode},${Boolean(payload.mask)})`;
          return "created";
        });
        if (outcome === "removed") return res.status(410).json({error:"This attempt was removed. Restore it from Trash if available, or start a new staging request."});
        if (outcome === "empty")
          return res.status(402).json({
            error:
              "This pack has no credits remaining. Choose another pack to continue.",
          });
        if (outcome === "conflict")
          return res
            .status(409)
            .json({ error: "This request identifier is already in use." });
        if (outcome === "created" && process.env.STAGING_DURABLE_QUEUE !== "true") {
          void runJob(payload, payload.requestId, generate).catch(() =>
            console.error(
              "Staging persistence failed; recovery will reconcile the credit",
            ),
          );
        }
        return res
          .status(202)
          .json({ jobId: payload.requestId, state: "processing" });
      } catch {
        return res
          .status(503)
          .json({ error: "Staging is temporarily unavailable. Please retry." });
      }
    },
  );
  app.get(
    "/api/staging-jobs/:id",
    checkAccessToken,
    requirePaidAccess,
    async (req, res) => {
      res.set("Cache-Control", "no-store");
      if (!z.string().uuid().safeParse(req.params.id).success)
        return res.status(404).json({ error: "Image not found" });
      try {
        const [job] =
          await client`SELECT * FROM staging_jobs WHERE id=${req.params.id} AND token_id=${getTokenIdFromRequest(req)!} AND deleted_at IS NULL AND purged_at IS NULL`;
        if (!job) return res.status(404).json({ error: "Image not found" });
        if (job.state !== "completed")
          return res.json({
            jobId: job.id,
            state: job.state,
            error: job.error,
          });
        const data = job.result;
        const [originalSignedUrl, stagedSignedUrl] = await Promise.all([
          sign(data.storageBucket, data.originalStoragePath, 3600),
          sign(data.storageBucket, data.stagedStoragePath, 3600),
        ]);
        return res.json({
          state: "completed",
          data: {
            ...data,
            originalSignedUrl,
            stagedSignedUrl,
            imageUrl: stagedSignedUrl,
          },
        });
      } catch {
        return res.status(503).json({
          error: "Your image is temporarily unavailable. Please retry.",
        });
      }
    },
  );
  registerImageHistory(app, historyFiles);
}
