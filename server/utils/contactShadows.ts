import sharp from "sharp";

/** Carry only local darkening from the staged scene, keeping source texture intact.
 * This is a separate shadow layer: it never erases or feathers furniture pixels.
 */
export async function addContactShadows(original: Buffer, scene: Buffer, furniture: Buffer) {
  const { data: source, info } = await sharp(original).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const layer = await sharp(furniture).ensureAlpha().raw().toBuffer();
  const generated = await sharp(scene).resize(width, height).removeAlpha().toColourspace("srgb").raw().toBuffer();
  const count = width * height;
  const radius = Math.max(4, Math.round(Math.min(width, height) * 0.035));
  const distance = new Uint16Array(count).fill(radius + 1);
  // Seed only the lower silhouette; never add a halo around pillows/headboards.
  for (let x = 0; x < width; x++) {
    let top = height, bottom = -1;
    for (let y = 0; y < height; y++) if (layer[(y * width + x) * 4 + 3] >= 250) { top = Math.min(top, y); bottom = y; }
    if (bottom < 0) continue;
    const floorward = top + (bottom - top) * 0.65;
    for (let y = Math.ceil(floorward); y <= bottom; y++) if (layer[(y * width + x) * 4 + 3] >= 250) { distance[y * width + x] = 0; }
  }
  // Manhattan distance has a strict finite support (unlike an unbounded blur).
  for (let p = 0; p < count; p++) distance[p] = Math.min(distance[p], p % width ? distance[p - 1] + 1 : radius + 1, p >= width ? distance[p - width] + 1 : radius + 1);
  for (let p = count - 1; p >= 0; p--) distance[p] = Math.min(distance[p], p % width < width - 1 ? distance[p + 1] + 1 : radius + 1, p < count - width ? distance[p + width] + 1 : radius + 1);
  const dark = Buffer.alloc(count);
  for (let p = 0; p < count; p++) {
    if (layer[p * 4 + 3] > 8 || distance[p] > radius) continue;
    const a = (source[p * 3] + source[p * 3 + 1] + source[p * 3 + 2]) / 3;
    const b = (generated[p * 3] + generated[p * 3 + 1] + generated[p * 3 + 2]) / 3;
    // Ignore small exposure changes and bound strength; only darken, never copy pixels.
    dark[p] = Math.round(Math.min(0.45, Math.max(0, (a - b) / Math.max(24, a) - 0.06)) * 255);
  }
  const smooth = await sharp(dark, { raw: { width, height, channels: 1 } }).blur(2).greyscale().raw().toBuffer();
  let shadowPixels = 0;
  for (let p = 0; p < count; p++) {
    if (distance[p] > radius) continue;
    const a = layer[p * 4 + 3] / 255;
    const shadow = smooth[p] / 255 * Math.max(0, 1 - distance[p] / radius);
    if (shadow < 1 / 255 || a === 1) continue;
    const combined = a + shadow * (1 - a);
    // Composite the complete foreground over black shadow in premultiplied alpha.
    for (let c = 0; c < 3; c++) layer[p * 4 + c] = Math.round(layer[p * 4 + c] * a / combined);
    layer[p * 4 + 3] = Math.round(combined * 255);
    shadowPixels++;
  }
  return { layer: await sharp(layer, { raw: { width, height, channels: 4 } }).png().toBuffer(), shadowPixels };
}
