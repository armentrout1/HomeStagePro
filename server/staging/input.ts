import sharp from "sharp";
import type { StagingRequest } from "../../shared/staging/contracts";
import { generateAutoMaskPng } from "../utils/autoMask";

function decode(value: string) {
  const normalized = value.replace(/\s/g, "");
  if (normalized.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error("INVALID_IMAGE");
  return Buffer.from(normalized, "base64");
}

/** Called before reserving credit, and again when consuming persisted input. */
export async function validateStagingInput(input: Pick<StagingRequest, "image" | "mask">) {
  const original = decode(input.image);
  const meta = await sharp(original, { limitInputPixels: 40_000_000 }).metadata();
  if (!meta.width || !meta.height || meta.width > 2048 || meta.height > 2048 ||
      !["png", "jpeg", "webp"].includes(meta.format || "") || (meta.pages || 1) > 1 ||
      original.length > 10 * 1024 * 1024 || meta.width / meta.height > 3 || meta.width / meta.height < 1 / 3)
    throw new Error("INVALID_IMAGE");
  let mask: Buffer | undefined;
  if (input.mask) {
    mask = decode(input.mask);
    const info = await sharp(mask, { limitInputPixels: 40_000_000 }).metadata();
    if (info.format !== "png" || !info.hasAlpha || info.width !== meta.width || info.height !== meta.height || (info.pages || 1) > 1)
      throw new Error("INVALID_MASK");
    const alpha = await sharp(mask).extractChannel(3).raw().toBuffer();
    if (!alpha.some((value: number) => value < 255)) throw new Error("EMPTY_MASK");
  }
  const extension = meta.format === "jpeg" ? "jpg" : meta.format!;
  return { original, mask, width: meta.width, height: meta.height, extension, mime: `image/${meta.format}` };
}

export async function prepareStagingInput(input: StagingRequest) {
  const decoded = await validateStagingInput(input);
  const room = input.roomType.toLowerCase();
  const options = room.includes("living") ? { topPct: .4, sidePct: .18, bottomPct: 0 }
    : room.includes("bed") ? { topPct: .34, sidePct: .14, bottomPct: 0 }
    : room.includes("kitchen") ? { topPct: .42, sidePct: .2, bottomPct: 0 } : undefined;
  return { ...decoded, mask: decoded.mask ?? await generateAutoMaskPng(decoded.width, decoded.height, options) };
}
