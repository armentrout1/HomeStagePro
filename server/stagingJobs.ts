import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import sharp from "sharp";
import { client } from "./db";
import {
  checkAccessToken,
  requirePaidAccess,
  attachEntitlement,
  getTokenIdFromRequest,
} from "./tokenManager";
import { stagingRateLimiter } from "./middleware/stagingRateLimiter";
import { generateStagedRoom } from "./openai";
import { getSignedImageUrl } from "./supabase";
import { jobFiles, storagePrefix, type JobFiles } from "./jobFiles";

const schema = z.object({
  requestId: z.string().uuid(),
  image: z.string().min(20).max(14_000_000),
  mask: z.string().max(14_000_000).optional(),
  roomType: z.enum([
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Dining Room",
    "Bathroom",
    "Home Office",
    "Outdoor Space",
    "Entry / Foyer",
    "Other",
  ]),
  mode: z.enum(["furnish", "replace", "remove"]).default("furnish"),
});
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
export async function runJob(req: Request, id: string, generate = generateStagedRoom, lease?: string) {
  let status = 200;
  let result: any;
  const receiver = {
    status(code: number) {
      status = code;
      return this;
    },
    json(body: any) {
      result = body;
      return this;
    },
  };
  try {
    await generate({ ...req, body: { ...req.body, resultPathsOnly: true } } as Request, receiver as Response);
    if (status >= 400 || !result?.success)
      throw new Error(result?.error || "Staging failed. Please try again.");
    // Store paths, not expiring URLs or image payloads; signed links are regenerated on read.
    await client`UPDATE staging_jobs SET state='completed', completed_at=now(), result=${JSON.stringify(
      {
        requestId: result.requestId,
        promptHash: result.promptHash,
        originalStoragePath: result.originalStoragePath,
        stagedStoragePath: result.stagedStoragePath,
        storageBucket: result.storageBucket,
        roomType: req.body.roomType,
        mode: req.body.mode,
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
      status === 422 && result?.code === "QUALITY_REVIEW_FAILED"
        ? "The image did not pass review. Your credit was restored. Expand the editable area to include the full furniture area, protect permanent fixtures, and try again."
        : "We couldn’t finish this image. Your credit was restored. Please try again.",
      lease,
    );
    if (result?.metrics) await client`UPDATE staging_jobs SET result=${JSON.stringify({ metrics: result.metrics, roomType: req.body.roomType, mode: req.body.mode })}::jsonb WHERE id=${id} AND state='failed'`;
  }
}
export function registerStagingJobs(
  app: Express,
  generate = generateStagedRoom,
  sign = getSignedImageUrl,
  files: JobFiles = jobFiles,
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
        // Decode before reserving a credit or making any billable call.
        const input = Buffer.from(payload.image, "base64");
        const metadata = await sharp(input, {
          limitInputPixels: 40_000_000,
        }).metadata();
        if (
          !metadata.width ||
          !metadata.height ||
          !["png", "jpeg", "webp"].includes(metadata.format || "") ||
          (metadata.pages || 1) > 1 ||
          input.length > 10 * 1024 * 1024
          || metadata.width / metadata.height > 3 || metadata.width / metadata.height < 1 / 3
        )
          throw new Error("invalid_image");
        if (payload.mask) {
          const mask = await sharp(Buffer.from(payload.mask, "base64"), {
            limitInputPixels: 40_000_000,
          }).metadata();
          const { data: alpha } = await sharp(
            Buffer.from(payload.mask, "base64"),
          )
            .ensureAlpha()
            .extractChannel(3)
            .raw()
            .toBuffer({ resolveWithObject: true });
          if (!alpha.some((v: number) => v < 255))
            throw new Error("empty_mask");
          if (
            mask.format !== "png" ||
            !mask.hasAlpha ||
            mask.width !== metadata.width ||
            mask.height !== metadata.height
          )
            throw new Error("invalid_mask");
        }
      } catch {
        return res.status(400).json({
          error:
            "Use a still JPG, PNG or WebP image under 10 MB and a matching edit selection.",
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
            await tx`SELECT token_id,input_hash FROM staging_jobs WHERE id=${payload.requestId}`;
          if (old)
            return old.token_id === tokenId && old.input_hash === hash
              ? "existing"
              : "conflict";
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
          req.body = payload;
          void runJob(req, payload.requestId, generate).catch(() =>
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
          await client`SELECT * FROM staging_jobs WHERE id=${req.params.id} AND token_id=${getTokenIdFromRequest(req)!}`;
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
  app.get(
    "/api/staging-jobs",
    checkAccessToken,
    requirePaidAccess,
    async (req, res) => {
      res.set("Cache-Control", "no-store");
      const before = req.query.before;
      if (before !== undefined && !z.string().uuid().safeParse(before).success)
        return res.status(400).json({ error: "Invalid image-history cursor." });
      try {
        const tokenId = getTokenIdFromRequest(req)!;
        const rows = before
          ? await client`SELECT id,state,created_at FROM staging_jobs
              WHERE token_id=${tokenId} AND (created_at,id)<(SELECT created_at,id FROM staging_jobs WHERE id=${before as string} AND token_id=${tokenId})
              ORDER BY created_at DESC,id DESC LIMIT 30`
          : await client`SELECT id,state,created_at FROM staging_jobs WHERE token_id=${tokenId} ORDER BY created_at DESC,id DESC LIMIT 30`;
        res.json(rows);
      } catch {
        res.status(503).json({ error: "Could not load your images." });
      }
    },
  );
}
