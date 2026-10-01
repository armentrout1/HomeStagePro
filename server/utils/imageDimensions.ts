import sharp from 'sharp';

export type ImageSize = {
  width: number;
  height: number;
};

export async function getImageSize(bytes: Uint8Array | Buffer): Promise<ImageSize> {
  const metadata = await sharp(bytes).metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions");
  }
  
  return {
    width: metadata.width,
    height: metadata.height,
  };
}

export async function assertSameDimensions(
  original: Uint8Array | Buffer,
  mask: Uint8Array | Buffer
): Promise<void> {
  const [originalSize, maskSize] = await Promise.all([
    getImageSize(original),
    getImageSize(mask),
  ]);
  
  if (originalSize.width !== maskSize.width || originalSize.height !== maskSize.height) {
    throw new Error("MASK_DIMENSION_MISMATCH");
  }
}
