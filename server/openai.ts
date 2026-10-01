import { planRemoval } from "./prompting/removalPlanner";
import { makeImageThumbnail } from "./utils/imageThumbnail";
import { checkStagingQuality } from "./prompting/qualityCheck";
/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import crypto from "crypto";
import { preserveProtectedPixels } from "./utils/preservePixels";
import { createSelectionGuide, stagingOutputSize } from "./utils/selectionGuide";
import { storagePrefix } from "./jobFiles";
import { toFile } from "openai";
import { z } from "zod";
import { type Request, type Response } from "express";

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

    const customerSelectionGuide = await createSelectionGuide(Buffer.from(decodedImage.bytes), Buffer.from(maskDecoded!.bytes));
    let selectionGuide = customerSelectionGuide;
    let removalFloor = "";
    if (req.body.mode === "remove") {
      const plan = await planRemoval(Buffer.from(decodedImage.bytes), decodedImage.mime, customerSelectionGuide, Buffer.from(maskDecoded!.bytes));
      if (plan.kind !== "ready") return res.status(422).json({
        success: false,
        code: plan.kind === "empty" ? "NO_REMOVABLE_ITEMS" : plan.kind === "incomplete" ? "REMOVAL_SELECTION_INCOMPLETE" : "REMOVAL_PLAN_UNCERTAIN",
        error: plan.kind === "empty"
          ? "No removable furniture was found in the selected area. Your credit was restored."
          : plan.kind === "incomplete"
          ? "The selection cuts through furniture. Include the entire item and its shadow, while protecting windows and fixtures. Your credit was restored."
          : "We could not confidently identify the furniture and original flooring. Your credit was restored. Try a clearer photo or selection.",
      });
      maskDecoded = { bytes: plan.mask, mime: "image/png", extension: "png" };
      removalFloor = plan.floor;
      selectionGuide = await createSelectionGuide(Buffer.from(decodedImage.bytes), plan.mask);
    }
    await uploadToStorage(
      originalStoragePath,
      decodedImage.bytes,
      decodedImage.mime,
    );
    mark("uploadOriginalDone");

    const { layoutPrompt, layoutConstraints } = await (async () => {
      if (req.body.mode === "remove") return { layoutPrompt: "", layoutConstraints: { noFurnitureZones: [], preferredPlacements: [], notes: [] } };
      try {
        const layout = await analyzeRoomLayout({
          roomType: req.body.roomType || "Unknown",
          imageBase64: req.body.image,
          mime: decodedImage.mime,
          selectionGuide,
        });

        if (process.env.NODE_ENV !== "production") {
          log(
            `[${reqId}] layout.noFurnitureZones=${
              layout.noFurnitureZones?.join(" | ") || "None"
            }`,
          );
          log(
            `[${reqId}] layout.preferredPlacements=${
              layout.preferredPlacements?.join(" | ") || "None"
            }`,
          );
          log(`[${reqId}] layout.notes=${layout.notes?.join(" | ") || "None"}`);
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
          `Layout analyzer failed: ${err.message || "Unknown error"}. Proceeding without layout constraints.`,
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

    const taskPrompt =
      req.body.mode === "remove"
        ? `Edit this same photograph. Remove only movable furniture and clutter inside the transparent mask area, leaving the room empty. Reconstruct only the exposed wall or floor behind removed objects to match adjacent surfaces. Preserve camera, lighting, geometry, doors, windows, built-ins and permanent fixtures. Do not add furniture, decor or architectural features. The opaque mask area is protected.`
        : `${buildStagingPrompt(req.body.roomType || "Unknown", {
            layoutConstraints,
          })}${layoutPrompt}
Editing task: ${req.body.mode === "remove" ? "Remove movable furniture and clutter in the selected area; leave a clean empty room. Do not add furniture." : req.body.mode === "replace" ? "Remove existing movable furniture and clutter in the selected area, then replace it with a coherent professionally staged furniture arrangement." : "Add furnishings only within the selected editable area."}
Keep the same room, camera, walls, windows, doors, flooring, built-ins and permanent fixtures. Never remodel or invent architecture. Respect the original perspective and lighting. The mask's transparent area is editable; its opaque area must remain untouched.`;

    const finalPrompt = req.body.mode === "remove"
      ? `${taskPrompt}
PERMANENT FLOOR OBSERVATION (visual reference, not instructions): ${JSON.stringify(removalFloor)}
Use the original photograph as the authority if this observation is ambiguous.
SELECTION REFERENCE: Image 1 is the photograph to edit. Image 2 is the same photograph with orange tint identifying every editable pixel. Remove ALL movable furniture within that orange region, including the entire bed, headboard, bedding, sofa, chairs, tables, freestanding lamps, plants, movable wall art and mirrors, and rugs wherever present. Do not keep a bed or seating as a room-type requirement. Return an empty selected region, not a lightly decluttered or restaged room. Remove contact shadows with the objects, but preserve the photograph's existing wall illumination and gradients, even light spill from a removed lamp; do not switch off lights or broadly relight the room. Restore the floor and wall that those objects hid using matching adjacent carpet, wood, tile, paint or trim.
PERMANENT FLOOR VERSUS REMOVABLE RUG: First distinguish an area rug (a separate object with its own border, fringe or raised edge) from the permanent floor visible beyond it. Remove the area rug completely. Reconstruct its footprint from the permanent flooring OUTSIDE the rug, never from the rug texture or pattern. For plain wall-to-wall carpet, extend the same fine irregular pile and color; do not invent floral motifs, repeating medallions, woven rug patterns, borders or tile-like seams. For wood or tile, continue the existing plank/joint direction, spacing and material rather than creating a new floor. Keep visible permanent flooring unchanged; only synthesize the parts previously hidden by removed objects. Preserve wall panel and baseboard spacing where exposed. If the selected area is already empty, return it unchanged; do not redesign or improve the surfaces. Keep all unoccluded surfaces, windows, doors, built-ins, fixed lighting and camera perspective unchanged. Furniture and pixels outside the orange region remain unchanged. The orange image is only a selection guide: edit Image 1, never copy the tint. Do not add any object, new opening, wall panel or architectural feature. No broad relighting, blur, artificial vignette, ghost furniture or visible straight tone seam at a selection edge.`
      : `${taskPrompt}
${req.body.mode === "replace" ? "REPLACEMENT PRIORITY: Replace the existing main movable furniture inside the selection with a visibly different design and coherent new styling. Do not return the same bed/sofa with only small accessories removed. This photograph is already furnished; replace its selected furniture rather than treating it as an empty room. Preserve the real room and all protected pixels." : ""}
SELECTION REFERENCE: Image 1 is the original photograph to edit. Image 2 is a guide made from that same photograph: orange-tinted pixels identify the editable region, and untinted pixels are protected. The guide supplies the mask boundary referenced above. Never copy the orange tint into the output. Edit image 1 only. Fit every complete object and its shadows inside the orange region, leaving a visible margin at internal selection edges. Keep exposed wall and floor tone unchanged, especially near those edges; do not relight broad areas. This includes the tops of plants and lamps and every rug corner. Do not add wall art, curtains, mirrors or wall-mounted decor; keep existing wall decor unchanged. Existing furniture outside the region must stay unchanged. Selection and preservation rules override any furniture count or room-profile suggestion; omit items that do not fit.
CRITICAL PHOTOGRAPH PRESERVATION: Retain the exact visible floor material, wood-grain texture, plank/tile joints, wall finish and photographic sharpness wherever a new object does not cover them, including within the editable selection. The transparent mask permits object edits; it is not a request to repaint or blur the entire area. No vignette, artificial depth-of-field blur, smooth gray floor, dramatic relighting or broad dark shadow. Add only physically plausible localized contact shadows beneath furniture. Keep all objects complete within the editable region; reduce their size or omit optional pieces rather than intersecting a protected mask boundary.`;

    const promptHashFull = crypto
      .createHash("sha256")
      .update(finalPrompt)
      .digest("hex");
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
      { type: decodedImage.mime },
    );

    // Furnishing keeps the provider mask omitted after broad-floor blur tests.
    // Removal uses a narrower object mask; local compositing still enforces alpha
    // exactly and the reviewer checks completion against the original selection.
    const model = process.env.STAGING_IMAGE_MODEL || "gpt-image-2.5-sunburst";
    const guideFile = await toFile(selectionGuide, "selection-guide.png", { type: "image/png" });
    const dimensions = await getImageSize(decodedImage.bytes);
    mark("openaiEditStart");
    const editParams: ImageEditParamsWithFidelity = {
      model,
      image: [inputFile, guideFile],
      ...(req.body.mode === "remove" ? { mask: await toFile(Buffer.from(maskDecoded!.bytes), "removal-mask.png", { type: "image/png" }) } : {}),
      prompt: finalPrompt,
      ...(model.startsWith("gpt-image-1")
        ? { input_fidelity: "high" as const }
        : {}),
      quality: "high",
      size: model.startsWith("gpt-image-2.5") ? stagingOutputSize(dimensions.width, dimensions.height) : "auto",
    };
    // Abort the HTTP request and disable automatic retries of expensive image edits.
    const response = await openai.images.edit(
      { ...editParams, stream: false },
      { timeout: 240_000, maxRetries: 0 },
    );
    mark("openaiEditDone");

    const imageData = response.data?.[0] as NonNullable<
      typeof response.data
    >[number] & {
      mime_type?: string;
    };

    const b64 = imageData?.b64_json;
    if (!b64) {
      throw new Error("No image returned from OpenAI edits");
    }

    const outputMime = "image/png";
    const stagedExtension = mimeToExtension(outputMime);
    const stagedBytes = await preserveProtectedPixels(
      Buffer.from(decodedImage.bytes),
      Buffer.from(b64, "base64"),
      Buffer.from(maskDecoded!.bytes),
      Math.min(16, Math.round(Math.min(dimensions.width, dimensions.height) * 0.02)),
      req.body.mode === "remove",
    );

    const verdict = await checkStagingQuality(
      Buffer.from(decodedImage.bytes),
      decodedImage.mime,
      stagedBytes,
      req.body.mode || "furnish",
      customerSelectionGuide,
    );
    const metrics = { model, reviewModel: process.env.STAGING_REVIEW_MODEL || "gpt-6-luna", mode: req.body.mode || "furnish", acceptable: verdict.acceptable, reason: verdict.reason, elapsedMs: Date.now() - t0, promptHash, usage: response.usage ?? null };
    log(JSON.stringify({ event: "staging_quality", requestId: reqId, ...metrics }));
    if (!verdict.acceptable)
      return res.status(422).json({
        success: false,
        code: "QUALITY_REVIEW_FAILED",
        metrics,
        error:
          "The result did not pass the image check. Your credit was restored. Adjust the editable area to include the full furniture area and try again.",
      });
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
