/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import crypto from "crypto";
import { toFile } from "openai";
import { z } from "zod";
import {
  type Request,
  type Response,
} from "express";

import { log } from "./vite";
import { storage } from "./storage";
import { requireAuthedUserId } from "./tokenManager";
import { buildStagingPrompt } from "./prompting/stagingPrompt";
import { openai } from "./openaiClient";
import { analyzeRoomLayout } from "./prompting/layoutAnalyzer";
import { FREE_QUALITY, ImageQuality } from "./plans";
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

type ImageEditParamsWithFidelity = Parameters<typeof openai.images.edit>[0] & {
  input_fidelity?: "low" | "medium" | "high";
};

const sanitizeOpenAiQuality = (
  quality: ImageQuality | undefined,
  reqId: string,
): "low" | "high" => {
  if (quality === "high" || quality === "low") {
    return quality;
  }

  if (quality !== undefined) {
    log(
      `[${reqId}] Invalid quality "${quality}" requested; defaulting to "low" for OpenAI`,
    );
  }
  return "low";
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
  return `roomstager/${formatYearMonth(date)}/${reqId}/${variant}.${extension}`;
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
  if (sanitized.length % 4 !== 0) {
    throw new Error("Invalid base64 image data");
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const charToIndex = (char: string): number => {
    if (char === "=") return 0;
    const index = chars.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid character in base64 image data");
    }
    return index;
  };

  const padding = sanitized.endsWith("==") ? 2 : sanitized.endsWith("=") ? 1 : 0;
  const outputLength = (sanitized.length * 3) / 4 - padding;
  const bytes = new Uint8Array(outputLength);

  let byteIndex = 0;
  for (let i = 0; i < sanitized.length; i += 4) {
    const chunk =
      (charToIndex(sanitized[i]) << 18) |
      (charToIndex(sanitized[i + 1]) << 12) |
      (charToIndex(sanitized[i + 2]) << 6) |
      charToIndex(sanitized[i + 3]);

    bytes[byteIndex++] = (chunk >> 16) & 0xff;
    if (sanitized[i + 2] !== "=") {
      bytes[byteIndex++] = (chunk >> 8) & 0xff;
    }
    if (sanitized[i + 3] !== "=") {
      bytes[byteIndex++] = chunk & 0xff;
    }
  }

  const { mime, extension } = detectImageType(bytes);

  return { bytes, mime, extension };
};

const detectImageType = (
  bytes: Uint8Array
): { mime: string; extension: string } => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
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
  const reqId = `stage_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

    const requestedQuality: ImageQuality =
      req.stagingEntitlement?.quality ?? FREE_QUALITY;
    const openAiQuality = sanitizeOpenAiQuality(requestedQuality, reqId);
    if (process.env.NODE_ENV !== "production") {
      log(`[${reqId}] quality=${openAiQuality}`);
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
            error: "Mask dimensions must match image dimensions"
          });
        }
        return res.status(400).json({
          success: false,
          error: "Invalid mask provided"
        });
      }
    }

    if (!maskDecoded) {
      const { width, height } = await getImageSize(decodedImage.bytes);
      const rt = String(req.body.roomType || "").toLowerCase();
      const opts: AutoMaskOptions | undefined = (() => {
        if (rt.includes("living")) {
          return { topPct: 0.4, sidePct: 0.18, bottomPct: 0.08 };
        }
        if (rt.includes("bed")) {
          return { topPct: 0.34, sidePct: 0.14, bottomPct: 0.08 };
        }
        if (rt.includes("kitchen")) {
          return { topPct: 0.42, sidePct: 0.2, bottomPct: 0.1 };
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

    await uploadToStorage(
      originalStoragePath,
      decodedImage.bytes,
      decodedImage.mime,
    );
    mark("uploadOriginalDone");

    const { layoutPrompt, layoutConstraints } = await (async () => {
      try {
        const layout = await analyzeRoomLayout({
          roomType: req.body.roomType || "Unknown",
          imageBase64: req.body.image,
          mime: decodedImage.mime,
        });

        if (process.env.NODE_ENV !== "production") {
          log(
            `[${reqId}] layout.noFurnitureZones=${
              layout.noFurnitureZones?.join(" | ") || "None"
            }`
          );
          log(
            `[${reqId}] layout.preferredPlacements=${
              layout.preferredPlacements?.join(" | ") || "None"
            }`
          );
          log(
            `[${reqId}] layout.notes=${layout.notes?.join(" | ") || "None"}`
          );
        }

        const safeJoin = (items: string[]): string =>
          items.length ? items.join("; ") : "None provided";

        return {
          layoutConstraints: layout,
          layoutPrompt: `

Layout constraints (MUST FOLLOW):
- No-furniture zones: ${safeJoin(layout.noFurnitureZones)}
- Preferred placements: ${safeJoin(layout.preferredPlacements)}
- Notes: ${safeJoin(layout.notes)}
`,
        };
      } catch (analysisError) {
        const err = analysisError as Error;
        log(`[${reqId}] layoutAnalyzerFailed: ${err.message}`);
        log(
          `Layout analyzer failed: ${err.message || "Unknown error"}. Proceeding without layout constraints.`
        );
        return {
          layoutConstraints: {
            noFurnitureZones: [],
            preferredPlacements: [],
            notes: [],
          },
          layoutPrompt: `

Layout constraints (MUST FOLLOW):
- No-furniture zones: Doors, door swings, entry path, windows, vents/returns must stay fully clear.
- Preferred placements: Place furniture along solid walls; keep walkways open; do not obstruct openings.
- Notes: Keep existing architectural features and circulation unchanged; only add movable decor/furniture.
`,
        };
      }
    })();
    mark("layoutAnalysisDone");

    const finalPrompt = `${buildStagingPrompt(req.body.roomType || "Unknown", {
      layoutConstraints,
    })}${layoutPrompt}`;

    const promptHashFull = crypto.createHash("sha256").update(finalPrompt).digest("hex");
    const promptHash = promptHashFull.slice(0, 16);

    if (process.env.NODE_ENV !== "production") {
      const preview =
        finalPrompt.length > 1200
          ? finalPrompt.slice(0, 1200) + "…(truncated)"
          : finalPrompt;
      log(`[${reqId}] finalPromptPreview=${preview}`);
      log(`[${reqId}] promptHash=${promptHash}`);
    }

    const inputFile = await toFile(
      Buffer.from(decodedImage.bytes),
      `room.${decodedImage.extension}`,
      { type: decodedImage.mime }
    );

    let maskFile: Awaited<ReturnType<typeof toFile>> | undefined;
    if (maskDecoded) {
      maskFile = await toFile(
        Buffer.from(maskDecoded.bytes),
        `mask.${maskDecoded.extension}`,
        { type: maskDecoded.mime }
      );
    }

    const openAiTimeoutMs = 110_000;
    mark("openaiEditStart");
    type ImageEditResponse = Awaited<ReturnType<typeof openai.images.edit>>;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let response: ImageEditResponse;
    try {
      const timeoutPromise = new Promise<ImageEditResponse>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("OPENAI_TIMEOUT")),
          openAiTimeoutMs,
        );
      });

      const editParams: ImageEditParamsWithFidelity = {
        model: "gpt-image-1",
        image: inputFile,
        prompt: finalPrompt,
        input_fidelity: openAiQuality,
      };
      
      if (maskFile) {
        editParams.mask = maskFile;
      }
      
      response = await Promise.race([
        openai.images.edit(editParams),
        timeoutPromise,
      ]);
    } catch (error) {
      if ((error as Error)?.message === "OPENAI_TIMEOUT") {
        log(`[${reqId}] openaiEditTimeout after ${openAiTimeoutMs}ms`);
        return res.status(504).json({
          success: false,
          code: "STAGING_TIMEOUT",
          error: "Staging took longer than expected. Please try again.",
        });
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
    mark("openaiEditDone");

    const imageData = response.data?.[0] as (typeof response.data)[number] & {
      mime_type?: string;
    };

    const b64 = imageData?.b64_json;
    if (!b64) {
      throw new Error("No image returned from OpenAI edits");
    }

    const outputMime = imageData?.mime_type || "image/png";
    const stagedExtension = mimeToExtension(outputMime);
    const stagedBytes = Buffer.from(b64, "base64");

    const stagedStoragePath = buildStoragePath(reqId, "staged", stagedExtension);
    await uploadToStorage(stagedStoragePath, stagedBytes, outputMime);
    mark("uploadStagedDone");

    const originalDataUrl = `data:${decodedImage.mime};base64,${originalBase64}`;
    const stagedDataUrl = `data:${outputMime};base64,${b64}`;

    const [originalSignedUrl, stagedSignedUrl] = await Promise.all([
      tryCreateSignedUrl(
        STORAGE_BUCKET,
        originalStoragePath,
        originalDataUrl,
      ),
      tryCreateSignedUrl(STORAGE_BUCKET, stagedStoragePath, stagedDataUrl),
    ]);
    
    // Handle mask storage in dev mode
    if (process.env.NODE_ENV !== "production" && maskDecoded) {
      maskStoragePath = buildStoragePath(reqId, "mask", maskDecoded.extension);
      await uploadToStorage(maskStoragePath, maskDecoded.bytes, maskDecoded.mime);
      
      const maskDataUrl = `data:${maskDecoded.mime};base64,${Buffer.from(maskDecoded.bytes).toString("base64")}`;
      maskSignedUrl = await tryCreateSignedUrl(STORAGE_BUCKET, maskStoragePath, maskDataUrl);
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
    if (process.env.NODE_ENV !== "production" && maskStoragePath && maskSignedUrl) {
      responseJson.maskStoragePath = maskStoragePath;
      responseJson.maskSignedUrl = maskSignedUrl;
    }
    
    return res.json(responseJson);
  } catch (err) {
    const error = err as Error;
    log(`OpenAI API error: ${error.message || 'Unknown error'}`);
    return res.status(500).json({
      success: false,
      error: `Error generating image: ${error.message || 'Unknown error'}`,
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
      return res.status(400).json({ error: "Invalid payload", details: err.issues });
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
    log(`Database error: ${error.message || 'Unknown error'}`);
    return res.status(500).json({
      success: false,
      error: `Error retrieving staged images: ${error.message || 'Unknown error'}`,
    });
  }
};
