import { renderStaging } from "./stagingPipeline";
import { makeImageThumbnail } from "./utils/imageThumbnail";
/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import crypto from "crypto";
import { storagePrefix } from "./jobFiles";
import { z } from "zod";
import { type Request, type Response } from "express";

import { log } from "./vite";
import { storage } from "./storage";
import { requireAuthedUserId } from "./tokenManager";
import { supabase, getSignedImageUrl } from "./supabase";
import { generateAutoMaskPng, type AutoMaskOptions } from "./utils/autoMask";
import { assertSameDimensions, getImageSize } from "./utils/imageDimensions";

const STORAGE_BUCKET = "roomstager-images";
const SIGNED_URL_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

const stagedImageSchema = z.object({
  originalStoragePath: z.string().min(1),
  stagedStoragePath: z.string().min(1),
  userId: z.number().int().positive().optional().nullable(),
  originalImageUrl: z.string().url().optional().nullable(),
  stagedImageUrl: z.string().url().optional().nullable(),
  storageBucket: z.string().max(100).optional(),
  roomType: z.string().max(50).optional(),
});

type DecodedImage = {
  bytes: Uint8Array;
  mime: string;
  extension: string;
};

const formatYearMonth = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const buildStoragePath = (
  reqId: string,
  variant: "original" | "staged" | "mask",
  extension: string,
  date = new Date(),
): string => {
  return `${storagePrefix()}/results/${formatYearMonth(date)}/${reqId}/${variant}.${extension}`;
};

const mimeToExtension = (mime: string): string => {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
};

const uploadToStorage = async (
  path: string,
  file: Uint8Array | Buffer,
  contentType: string,
) => {
  const payload = file instanceof Buffer ? file : Buffer.from(file);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, payload, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Failed to upload ${path} to bucket ${STORAGE_BUCKET}: ${error.message}`,
    );
  }
};

const tryCreateSignedUrl = async (
  bucket: string,
  path?: string | null,
  fallback?: string | null,
) => {
  if (!path) {
    return fallback ?? null;
  }

  try {
    return await getSignedImageUrl(bucket, path, SIGNED_URL_EXPIRATION_SECONDS);
  } catch (error) {
    const err = error as Error;
    log(
      `Failed to create signed URL for ${bucket}/${path}: ${
        err.message || "Unknown error"
      }`,
    );
    return fallback ?? null;
  }
};

const decodeBase64Image = (base64: string): DecodedImage => {
  const sanitized = base64.replace(/[\r\n\s]/g, "");
  if (sanitized.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(sanitized)) throw new Error("Invalid base64 image data");
  const bytes = Buffer.from(sanitized, "base64");
  const { mime, extension } = detectImageType(bytes);
  return { bytes, mime, extension };
};

const detectImageType = (
  bytes: Uint8Array,
): { mime: string; extension: string } => {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", extension: "webp" };
  }

  return { mime: "image/png", extension: "png" };
};

export const generateStagedRoom = async (req: Request, res: Response) => {
  const reqId = req.body.requestId || crypto.randomUUID();
  const t0 = Date.now();
  const mark = (label: string) => {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    const delta = Date.now() - t0;
    log(`[${reqId}] t+${delta}ms ${label}`);
  };
  try {
    if (!req.body.image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const decodedImage = decodeBase64Image(req.body.image);
    mark("decodeDone");
    const originalBase64 = Buffer.from(decodedImage.bytes).toString("base64");
    const originalStoragePath = buildStoragePath(
      reqId,
      "original",
      decodedImage.extension,
    );

    // Handle optional mask
    let maskDecoded: DecodedImage | null = null;
    let maskStoragePath: string | null = null;
    let maskSignedUrl: string | null = null;

    if (req.body.mask) {
      try {
        maskDecoded = decodeBase64Image(req.body.mask);
        if (maskDecoded.mime !== "image/png") {
          return res.status(400).json({
            success: false,
            error: "Mask must be a PNG image",
          });
        }
        await assertSameDimensions(decodedImage.bytes, maskDecoded.bytes);

        if (process.env.NODE_ENV !== "production") {
          log(`[${reqId}] mask=present mime=${maskDecoded.mime}`);
        }
      } catch (maskError) {
        const error = maskError as Error;
        if (error.message === "MASK_DIMENSION_MISMATCH") {
          return res.status(400).json({
            success: false,
            error: "Mask dimensions must match image dimensions",
          });
        }
        return res.status(400).json({
          success: false,
          error: "Invalid mask provided",
        });
      }
    }

    if (!maskDecoded) {
      const { width, height } = await getImageSize(decodedImage.bytes);
      const rt = String(req.body.roomType || "").toLowerCase();
      const opts: AutoMaskOptions | undefined = (() => {
        if (rt.includes("living")) {
          return { topPct: 0.4, sidePct: 0.18, bottomPct: 0 };
        }
        if (rt.includes("bed")) {
          return { topPct: 0.34, sidePct: 0.14, bottomPct: 0 };
        }
        if (rt.includes("kitchen")) {
          return { topPct: 0.42, sidePct: 0.2, bottomPct: 0 };
        }
        return undefined;
      })();
      const autoMaskBuffer = await generateAutoMaskPng(width, height, opts);
      maskDecoded = {
        bytes: autoMaskBuffer,
        mime: "image/png",
        extension: "png",
      };

      if (process.env.NODE_ENV !== "production") {
        log(
          `[${reqId}] autoMask=generated rt=${rt || "unknown"} opts=${JSON.stringify(
            opts ?? "default",
          )}`,
        );
      }
    }

    const rendered = await renderStaging({ original: Buffer.from(decodedImage.bytes), mime: decodedImage.mime, mask: Buffer.from(maskDecoded!.bytes), roomType: req.body.roomType || "Unknown", mode: req.body.mode || "furnish" });
    const metrics = rendered.metrics;
    log(JSON.stringify({ event: "staging_quality", requestId: reqId, ...metrics }));
    if (!rendered.success) return res.status(422).json({ success: false, code: rendered.code, metrics, error: "We could not produce a complete, well-placed result. Your credit was restored. Try a clearer photo or a larger editable area while protecting permanent fixtures." });
    const stagedBytes = rendered.image;
    const promptHash = metrics.promptHash;
    const outputMime = "image/png";
    const stagedExtension = "png";
    await uploadToStorage(originalStoragePath, decodedImage.bytes, decodedImage.mime);
    const stagedStoragePath = buildStoragePath(
      reqId,
      "staged",
      stagedExtension,
    );
    await uploadToStorage(stagedStoragePath, stagedBytes, outputMime);
    mark("uploadStagedDone");
    let thumbnailStoragePath: string | null = stagedStoragePath.replace(/staged\.png$/, "thumbnail.webp");
    try { await uploadToStorage(thumbnailStoragePath, await makeImageThumbnail(stagedBytes), "image/webp"); }
    catch { thumbnailStoragePath = null; log("History preview unavailable; full result retained"); }

    // The job API signs links only when read; avoid encoding and signing discarded copies.
    if (req.body.resultPathsOnly) return res.json({ success: true, requestId: reqId, promptHash, originalStoragePath, stagedStoragePath, thumbnailStoragePath, storageBucket: STORAGE_BUCKET, metrics });

    const originalDataUrl = `data:${decodedImage.mime};base64,${originalBase64}`;
    const stagedDataUrl = `data:${outputMime};base64,${stagedBytes.toString("base64")}`;

    const [originalSignedUrl, stagedSignedUrl] = await Promise.all([
      tryCreateSignedUrl(STORAGE_BUCKET, originalStoragePath, originalDataUrl),
      tryCreateSignedUrl(STORAGE_BUCKET, stagedStoragePath, stagedDataUrl),
    ]);

    // Handle mask storage in dev mode
    if (process.env.NODE_ENV !== "production" && maskDecoded) {
      maskStoragePath = buildStoragePath(reqId, "mask", maskDecoded.extension);
      await uploadToStorage(
        maskStoragePath,
        maskDecoded.bytes,
        maskDecoded.mime,
      );

      const maskDataUrl = `data:${maskDecoded.mime};base64,${Buffer.from(maskDecoded.bytes).toString("base64")}`;
      maskSignedUrl = await tryCreateSignedUrl(
        STORAGE_BUCKET,
        maskStoragePath,
        maskDataUrl,
      );
    }

    mark("signedUrlsDone");

    if (process.env.NODE_ENV !== "production") {
      log(`[${reqId}] total=${Date.now() - t0}ms`);
    }
    const responseJson: any = {
      success: true,
      requestId: reqId,
      promptHash,
      imageUrl: stagedSignedUrl ?? stagedDataUrl,
      originalSignedUrl,
      stagedSignedUrl: stagedSignedUrl ?? stagedDataUrl,
      originalStoragePath,
      stagedStoragePath,
      storageBucket: STORAGE_BUCKET,
    };

    // Include mask fields in dev mode only
    if (
      process.env.NODE_ENV !== "production" &&
      maskStoragePath &&
      maskSignedUrl
    ) {
      responseJson.maskStoragePath = maskStoragePath;
      responseJson.maskSignedUrl = maskSignedUrl;
    }

    return res.json(responseJson);
  } catch (err) {
    const error = err as Error;
    log(`OpenAI API error: ${error.message || "Unknown error"}`);
    return res.status(500).json({
      success: false,
      error: "We couldn’t finish this image. Please try again.",
    });
  }
};

export const saveStagedImage = async (req: Request, res: Response) => {
  try {
    const parsed = stagedImageSchema.parse(req.body);

    const stagedImage = await storage.createStagedImage({
      userId: parsed.userId ?? null,
      originalImageUrl: parsed.originalImageUrl ?? null,
      stagedImageUrl: parsed.stagedImageUrl ?? null,
      originalStoragePath: parsed.originalStoragePath,
      stagedStoragePath: parsed.stagedStoragePath,
      storageBucket: parsed.storageBucket || STORAGE_BUCKET,
      roomType: parsed.roomType || "Unknown",
    });

    return res.json({
      success: true,
      stagedImage,
    });
  } catch (err) {
    const error = err as Error;
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: err.issues });
    }
    log(`Database error: ${error.message || "Unknown error"}`);
    return res.status(500).json({
      success: false,
      error: `Error saving staged image: ${error.message || "Unknown error"}`,
    });
  }
};

export const getUserStagedImages = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const authedUserId = requireAuthedUserId(req);
    if (authedUserId === null) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (authedUserId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const images = await storage.getStagedImagesByUserId(userId);

    return res.json({
      success: true,
      images,
    });
  } catch (err) {
    const error = err as Error;
    log(`Database error: ${error.message || "Unknown error"}`);
    return res.status(500).json({
      success: false,
      error: `Error retrieving staged images: ${error.message || "Unknown error"}`,
    });
  }
};
