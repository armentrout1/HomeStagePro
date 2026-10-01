import sharp from "sharp";
/** Transparent mask pixels may change. Fully opaque pixels are copied byte-for-byte. */
export async function preserveProtectedPixels(
  original: Buffer,
  generated: Buffer,
  mask: Buffer,
): Promise<Buffer> {
  const { data: source, info } = await sharp(original, {
    limitInputPixels: 40_000_000,
  })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const generatedInfo = await sharp(generated).metadata();
  if (!generatedInfo.width || !generatedInfo.height || Math.abs((generatedInfo.width / generatedInfo.height) / (info.width / info.height) - 1) > 0.02) {
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
  let editable = 0;
  for (let p = 0; p < info.width * info.height; p++) {
    const protectedWeight = alpha[p * 4 + 3];
    if (protectedWeight < 255) editable++;
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
