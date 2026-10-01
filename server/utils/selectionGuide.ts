import sharp from "sharp";

/** A separate annotated reference, never the source pixels used for the final image. */
export async function createSelectionGuide(original: Buffer, mask: Buffer) {
  const { data, info } = await sharp(original).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const selection = await sharp(mask).ensureAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  if (selection.info.width !== info.width || selection.info.height !== info.height) throw new Error("MASK_DIMENSION_MISMATCH");
  for (let p = 0; p < info.width * info.height; p++) {
    const tint = (1 - selection.data[p * 4 + 3] / 255) * 0.45;
    for (let c = 0; c < 3; c++) data[p * 3 + c] = Math.round(data[p * 3 + c] * (1 - tint) + [255, 180, 0][c] * tint);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toBuffer();
}

/** 2.5 image models support 16-pixel increments; keep the source composition. */
export function stagingOutputSize(width: number, height: number): `${number}x${number}` {
  const ratio = width / height;
  if (!Number.isFinite(ratio) || width <= 0 || height <= 0 || ratio < 1 / 3 || ratio > 3) throw new Error("Use a room photo with an aspect ratio between 1:3 and 3:1.");
  const scale = Math.sqrt(1_572_864 / (width * height));
  let w = Math.round(width * scale / 16) * 16;
  let h = Math.round(height * scale / 16) * 16;
  if (w > h * 3) h = Math.ceil(w / 3 / 16) * 16;
  if (h > w * 3) w = Math.ceil(h / 3 / 16) * 16;
  return `${w}x${h}`;
}
