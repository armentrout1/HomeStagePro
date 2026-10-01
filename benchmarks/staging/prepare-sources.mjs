// Offline, deterministic conversion of licensed photographic sources; no AI.
// Usage: node benchmarks/staging/prepare-sources.mjs <download-directory>
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const input = resolve(process.argv[2] || 'temp/public-sources');
const output = resolve('benchmarks/staging/sources');
await mkdir(output, { recursive: true });
const sources = [
  { id: 'small-empty-room', asset: 'small_empty_room_1', file: 'small_empty_room_1.jpg', author: 'Sergej Majboroda', md5: '3eaac5783a6006d90e3e721c636647f5', projection: { yaw: 90, pitch: -15, horizontalFov: 100 } },
  { id: 'cayley-furnished', asset: 'cayley_interior', file: 'cayley_interior.jpg', author: 'Greg Zaal', md5: 'b56ae551991b3cd259cd11f23e4129b5', projection: { yaw: -110, pitch: -12, horizontalFov: 85 } },
  { id: 'blue-furnished', asset: 'blue_photo_studio', file: 'blue_photo_studio-DSC_0614.jpg', author: 'Sergej Majboroda', md5: '3f3f28d7f330cba4e03247542d5a8c50', backplate: 'DSC_0614' },
];

async function perspective(bytes, { yaw, pitch, horizontalFov }) {
  const { data, info } = await sharp(bytes).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const width = 1536, height = 1024, rgb = Buffer.alloc(width * height * 3);
  const rad = Math.PI / 180, f = Math.tan(horizontalFov * rad / 2);
  const cy = Math.cos(yaw * rad), sy = Math.sin(yaw * rad), cp = Math.cos(pitch * rad), sp = Math.sin(pitch * rad);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = (2 * (x + .5) / width - 1) * f, dy = (1 - 2 * (y + .5) / height) * f * height / width;
    const py = dy * cp + sp, pz = cp - dy * sp, px = dx * cy + pz * sy, pzz = pz * cy - dx * sy;
    const u = ((Math.atan2(px, pzz) / (2 * Math.PI) + .5) * info.width - .5 + info.width) % info.width;
    const v = Math.max(0, Math.min(info.height - 1, (.5 - Math.atan2(py, Math.hypot(px, pzz)) / Math.PI) * info.height - .5));
    const x0 = Math.floor(u), y0 = Math.floor(v), tx = u - x0, ty = v - y0;
    for (let c = 0; c < 3; c++) {
      const at = (xx, yy) => data[(yy * info.width + xx % info.width) * info.channels + c];
      const y1 = Math.min(info.height - 1, y0 + 1);
      rgb[(y * width + x) * 3 + c] = Math.round((at(x0,y0)*(1-tx)+at(x0+1,y0)*tx)*(1-ty)+(at(x0,y1)*(1-tx)+at(x0+1,y1)*tx)*ty);
    }
  }
  return sharp(rgb, { raw: { width, height, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
}

const provenance = [];
for (const source of sources) {
  const bytes = await readFile(join(input, source.file));
  if (createHash('md5').update(bytes).digest('hex') !== source.md5) throw new Error(`Source checksum mismatch: ${source.id}`);
  const image = source.projection ? await perspective(bytes, source.projection) : await sharp(bytes).rotate().resize({ width:1536, height:1536, fit:'inside', withoutEnlargement:true }).jpeg({ quality:95 }).toBuffer();
  await writeFile(join(output, `${source.id}.jpg`), image);
  provenance.push({ ...source, page: `https://polyhaven.com/a/${source.asset}`, license:'CC0-1.0', licenseSource:'https://polyhaven.com/license',
    sourceUrl:source.backplate ? `https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Backplates/${source.asset}/jpg_pretty/${source.backplate}.jpg` : `https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/${source.asset}.jpg`,
    sourceSha256:createHash('sha256').update(bytes).digest('hex'), preparedSha256:createHash('sha256').update(image).digest('hex'),
    preparation:source.projection?'Rectilinear perspective from photographic panorama; bilinear sampling; no generative content.':'EXIF rotation and bounded resize; no generative content.',
    dimensions:await sharp(image).metadata().then(m=>({width:m.width,height:m.height})),
    scope:'Supplementary studio/panorama stress case, not representative customer-photo evidence.' });
}
await writeFile(join(output,'provenance.json'), JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify({ prepared:sources.length, output }));

