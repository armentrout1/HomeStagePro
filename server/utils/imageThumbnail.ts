import sharp from "sharp";
/** Bounded, metadata-free preview; never download full room photos for history cards. */
export const makeImageThumbnail = (image: Buffer) =>
  sharp(image, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: 384,
      height: 256,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 72 })
    .toBuffer();
