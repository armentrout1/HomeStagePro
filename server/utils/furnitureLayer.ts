import sharp from "sharp";

export class LayerRejected extends Error {}

/** Validate the complete layer. Never crop, erase or feather it to fit a selection. */
export async function compositeFurnitureLayer(original: Buffer, generated: Buffer, mask: Buffer) {
  const source = await sharp(original, { limitInputPixels: 40_000_000 }).toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = source.info;
  const metadata = await sharp(generated, { limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.hasAlpha) throw new LayerRejected("The furniture layer has no transparency.");
  if (!metadata.width || !metadata.height || Math.abs(metadata.width / metadata.height / (width / height) - 1) > 0.02)
    throw new LayerRejected("The furniture layer changed the camera framing.");
  const selection = await sharp(mask).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  if (selection.info.width !== width || selection.info.height !== height) throw new Error("MASK_DIMENSION_MISMATCH");
  const layer = await sharp(generated).resize(width, height, { fit: "fill" }).toColourspace("srgb").ensureAlpha().raw().toBuffer();
  let visible = 0, solid = 0, overlap = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let p = 0; p < width * height; p++) {
    const alpha = layer[p * 4 + 3];
    if (!alpha) continue;
    visible++;
    if (alpha >= 250) solid++;
    // Partial protection is also a boundary: blending it would fade solid furniture.
    if (selection.data[p] > 0) {
      overlap++;
      const x = p % width, y = Math.floor(p / width);
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  if (visible < width * height * 0.005 || solid < visible * 0.5)
    throw new LayerRejected("The furniture is empty or translucent. Furniture interiors must be opaque.");
  if (visible > width * height * 0.85)
    throw new LayerRejected("The overlay includes an opaque room or background instead of isolated furniture.");
  if (overlap) throw new LayerRejected(`The complete furniture or shadow overlaps ${overlap} protected pixels in rectangle (${minX},${minY})-(${maxX},${maxY}) on the ${width}x${height} reference. Replan smaller complete objects inside orange with a larger safety margin. Do not clip, fade, or erase their edges.`);
  // Blend only the actual generated alpha, not the user selection. With alpha=0,
  // copy source bytes exactly, including visible flooring inside the selection.
  const output = Buffer.from(source.data);
  for (let p = 0; p < width * height; p++) {
    const alpha = layer[p * 4 + 3] / 255;
    if (!alpha) continue;
    for (let c = 0; c < 3; c++) output[p * 3 + c] = Math.round(layer[p * 4 + c] * alpha + source.data[p * 3 + c] * (1 - alpha));
  }
  return { image: await sharp(output, { raw: { width, height, channels: 3 } }).png().toBuffer(), metrics: { visiblePixels: visible, solidPixels: solid, protectedOverlap: overlap, untouchedPixels: width * height - visible } };
}
