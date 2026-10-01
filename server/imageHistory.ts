import type { Express } from "express";
import { z } from "zod";
import { client } from "./db";
import {
  checkAccessToken,
  requirePaidAccess,
  getTokenIdFromRequest,
} from "./tokenManager";
import { supabase } from "./supabase";
import { jobBucket, storagePrefix } from "./jobFiles";

export interface ImageHistoryFiles {
  sign(paths: string[]): Promise<Map<string, string>>;
  remove(paths: string[]): Promise<void>;
}
export const imageHistoryFiles: ImageHistoryFiles = {
  async sign(paths) {
    if (!paths.length) return new Map();
    const { data, error } = await supabase.storage
      .from(jobBucket)
      .createSignedUrls(paths, 300);
    if (error) throw new Error("Preview signing unavailable");
    return new Map(
      (data || [])
        .filter((x) => x.path && x.signedUrl && !x.error)
        .map((x) => [x.path!, x.signedUrl]),
    );
  },
  async remove(paths) {
    if (!paths.length) return;
    const { error } = await supabase.storage.from(jobBucket).remove(paths);
    if (error) throw new Error("Image removal unavailable");
  },
};

/** Accept only this environment's known result filenames under this exact job. */
export function ownedResultPath(path: unknown, jobId: string): path is string {
  if (typeof path !== "string" || !z.string().uuid().safeParse(jobId).success)
    return false;
  const prefix = storagePrefix() + "/results/";
  if (!path.startsWith(prefix)) return false;
  return new RegExp(
    `^\\d{4}-\\d{2}/${jobId}/(?:original\\.(?:jpg|png|webp)|staged\\.png|thumbnail\\.webp|mask\\.png)$`,
  ).test(path.slice(prefix.length));
}

export function registerImageHistory(
  app: Express,
  files: ImageHistoryFiles = imageHistoryFiles,
) {
  const auth = [checkAccessToken, requirePaidAccess];
  app.get("/api/staging-jobs", ...auth, async (req, res) => {
    res.set("Cache-Control", "no-store");
    const before = req.query.before as string | undefined;
    const trash = req.query.view === "trash";
    if (
      (before !== undefined && !z.string().uuid().safeParse(before).success) ||
      (req.query.view !== undefined &&
        !["saved", "trash"].includes(String(req.query.view)))
    )
      return res.status(400).json({ error: "Invalid image-history filter." });
    try {
      const token = getTokenIdFromRequest(req)!;
      const rows =
        await client`SELECT id,state,created_at,deleted_at,purge_started_at,
        result->>'roomType' AS room_type,result->>'mode' AS mode,
        result->>'thumbnailStoragePath' AS thumbnail_path,result->>'storageBucket' AS bucket
        FROM staging_jobs WHERE token_id=${token} AND purged_at IS NULL
        AND (deleted_at IS NOT NULL)=${trash}
        AND (${before ?? null}::uuid IS NULL OR (created_at,id)<(SELECT created_at,id FROM staging_jobs WHERE id=${before ?? null}::uuid AND token_id=${token}))
        ORDER BY created_at DESC,id DESC LIMIT 30`;
      const paths = rows
        .filter(
          (r) =>
            !trash &&
            r.state === "completed" &&
            r.bucket === jobBucket &&
            ownedResultPath(r.thumbnail_path, r.id),
        )
        .map((r) => r.thumbnail_path as string);
      let urls = new Map<string, string>();
      try {
        urls = await files.sign(paths);
      } catch {
        /* History remains usable if previews are unavailable. */
      }
      res.json(
        rows.map(({ thumbnail_path, bucket, ...row }) => ({
          ...row,
          thumbnailUrl: urls.get(thumbnail_path) || null,
        })),
      );
    } catch {
      res
        .status(503)
        .json({ error: "Could not load your images. Please retry." });
    }
  });

  app.post("/api/staging-jobs/:id/trash", ...auth, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success)
      return res.status(404).json({ error: "Image not found." });
    try {
      const [row] =
        await client`UPDATE staging_jobs SET deleted_at=COALESCE(deleted_at,now())
        WHERE id=${req.params.id} AND token_id=${getTokenIdFromRequest(req)!} AND state<>'processing' AND purged_at IS NULL RETURNING id`;
      if (!row)
        return res
          .status(409)
          .json({ error: "This image is unavailable or still processing." });
      res.json({ success: true });
    } catch {
      res
        .status(503)
        .json({ error: "Could not move this image to Trash. Please retry." });
    }
  });
  app.post("/api/staging-jobs/:id/restore", ...auth, async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.id).success)
      return res.status(404).json({ error: "Image not found." });
    try {
      const [row] =
        await client`UPDATE staging_jobs SET deleted_at=NULL WHERE id=${req.params.id}
        AND token_id=${getTokenIdFromRequest(req)!} AND purged_at IS NULL AND purge_started_at IS NULL RETURNING id`;
      if (!row)
        return res
          .status(409)
          .json({
            error:
              "This image is unavailable or permanent deletion has started.",
          });
      res.json({ success: true });
    } catch {
      res
        .status(503)
        .json({ error: "Could not restore this image. Please retry." });
    }
  });

  app.delete("/api/staging-jobs/:id", ...auth, async (req, res) => {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success)
      return res.status(404).json({ error: "Image not found." });
    if (req.body?.confirm !== true)
      return res
        .status(400)
        .json({ error: "Confirm permanent deletion first." });
    try {
      const outcome = await client.begin(async (tx) => {
        const [row] =
          await tx`SELECT * FROM staging_jobs WHERE id=${id} AND token_id=${getTokenIdFromRequest(req)!} FOR UPDATE`;
        if (!row) return { status: 404, error: "Image not found." };
        if (row.purged_at) return { done: true };
        if (!row.deleted_at || row.state === "processing")
          return {
            status: 409,
            error: "Move the finished image to Trash first.",
          };
        // Completed jobs have finished all provider/storage writes. Interrupted jobs
        // can still have an ambiguous external write; leave those for support review.
        if (row.state !== "completed")
          return {
            status: 409,
            error:
              "Contact support to permanently remove files from an incomplete attempt. You can keep it in Trash.",
          };
        const r = row.result || {};
        const paths = [
          r.originalStoragePath,
          r.stagedStoragePath,
          ...(r.thumbnailStoragePath ? [r.thumbnailStoragePath] : []),
        ];
        if (
          r.storageBucket !== jobBucket ||
          paths.some((p) => !ownedResultPath(p, id))
        )
          return {
            status: 409,
            error: "Contact support to remove this older image safely.",
          };
        const [work] =
          await tx`SELECT input_path,phase FROM staging_work WHERE job_id=${id}`;
        if (work) {
          const base = storagePrefix() + `/inputs/${id}/`;
          if (
            work.phase === "running" ||
            !work.input_path.startsWith(base) ||
            !/^[a-f0-9]{64}$/.test(work.input_path.slice(base.length))
          )
            return {
              status: 409,
              error:
                "This image is finishing processing. Please retry shortly.",
            };
          paths.push(work.input_path + "/source", work.input_path + "/mask");
        }
        await tx`UPDATE staging_jobs SET purge_started_at=COALESCE(purge_started_at,now()) WHERE id=${id}`;
        return { paths };
      });
      if (outcome.error)
        return res.status(outcome.status!).json({ error: outcome.error });
      if (!outcome.done) {
        // A failed/partial storage deletion remains in Trash and cannot be restored.
        // Retrying the exact paths is safe; no credits or request identifiers change.
        await files.remove(outcome.paths!);
        await client`UPDATE staging_jobs SET purged_at=now(),result=jsonb_build_object('roomType',result->>'roomType','mode',result->>'mode') WHERE id=${id}`;
        await client`UPDATE staging_work SET input_deleted_at=now() WHERE job_id=${id}`;
      }
      res.json({ success: true });
    } catch {
      res
        .status(503)
        .json({
          error:
            "Deletion is not finished. Keep this item in Trash and retry permanent deletion.",
        });
    }
  });
}
