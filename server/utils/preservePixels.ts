import sharp from "sharp";
/** Transparent mask pixels may change. Fully opaque pixels are copied byte-for-byte. */
export async function preserveProtectedPixels(
  original: Buffer,
  generated: Buffer,
  mask: Buffer,
  featherPixels = 0,
): Promise<Buffer> {
  const { data: source, info } = await sharp(original, {
    limitInputPixels: 40_000_000,
  })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const generatedInfo = await sharp(generated).metadata();
  if (
    !generatedInfo.width ||
    !generatedInfo.height ||
    Math.abs(
      generatedInfo.width / generatedInfo.height / (info.width / info.height) -
        1,
    ) > 0.02
  ) {
    throw new Error("GENERATED_ASPECT_RATIO_MISMATCH");
  }
  // Only normalize the tiny rounding difference from the provider's size grid.
  const output = await sharp(generated)
    .resize(info.width, info.height, { fit: "fill" })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer();
  const { data: alpha, info: maskInfo } = await sharp(mask)
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (maskInfo.width !== info.width || maskInfo.height !== info.height)
    throw new Error("MASK_DIMENSION_MISMATCH");
  // Feather only inward from fully protected pixels. Never blend at the outer
  // photograph edge, and never write into the protected area. A capped distance
  // transform keeps processing linear in the number of pixels.
  const radius = Math.max(0, Math.min(32, Math.round(featherPixels)));
  let distance: Uint8Array | undefined;
  if (radius) {
    const { width, height } = info;
    distance = new Uint8Array(width * height).fill(radius);
    for (let p = 0; p < distance.length; p++)
      if (alpha[p * 4 + 3] === 255) distance[p] = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        distance[p] = Math.min(
          distance[p],
          x ? distance[p - 1] + 1 : radius,
          y ? distance[p - width] + 1 : radius,
        );
      }
    for (let y = height - 1; y >= 0; y--)
      for (let x = width - 1; x >= 0; x--) {
        const p = y * width + x;
        distance[p] = Math.min(
          distance[p],
          x + 1 < width ? distance[p + 1] + 1 : radius,
          y + 1 < height ? distance[p + width] + 1 : radius,
        );
      }
  }
  let editable = 0;
  for (let p = 0; p < info.width * info.height; p++) {
    const maskWeight = alpha[p * 4 + 3];
    if (maskWeight < 255) editable++;
    const t = distance ? distance[p] / radius : 1;
    const blend = t * t * (3 - 2 * t);
    const protectedWeight = 255 - (255 - maskWeight) * blend;
    for (let c = 0; c < 3; c++) {
      const i = p * 3 + c;
      output[i] = Math.round(
        (source[i] * protectedWeight + output[i] * (255 - protectedWeight)) /
          255,
      );
    }
  }
  if (!editable) throw new Error("Select an area to edit before staging.");
  return sharp(output, {
    raw: { width: info.width, height: info.height, channels: 3 },
  })
    .png()
    .toBuffer();
}
