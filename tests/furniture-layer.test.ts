import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { compositeFurnitureLayer, LayerRejected } from "../server/utils/furnitureLayer";
import { normalizeQualityVerdict } from "../server/prompting/qualityVerdict";
async function fixture(alpha = 255, protectedAlpha = 0) {
  const width = 64, height = 48;
  const source = Buffer.alloc(width * height * 3);
  const layer = Buffer.alloc(width * height * 4);
  const mask = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    source[p * 3] = p % 251; source[p * 3 + 1] = 140; source[p * 3 + 2] = 90;
    const x = p % width, y = Math.floor(p / width);
    if (x >= 20 && x < 40 && y >= 20 && y < 40) {
      layer[p * 4] = 230; layer[p * 4 + 3] = alpha;
    }
    mask[p * 4 + 3] = x < 20 ? 255 : protectedAlpha;
  }
  const png = (data: Buffer, channels: 3 | 4) => sharp(data, { raw: { width, height, channels } }).png().toBuffer();
  return { original: await png(source, 3), generated: await png(layer, 4), mask: await png(mask, 4), source, layer, png };
}
test("complete layer preserves all visible source pixels, including flooring inside selection", async () => {
  const f = await fixture();
  const result = await compositeFurnitureLayer(f.original, f.generated, f.mask);
  const output = await sharp(result.image).raw().toBuffer();
  for (let p = 0; p < 64 * 48; p++) {
    if (!f.layer[p * 4 + 3]) assert.deepEqual(output.subarray(p * 3, p * 3 + 3), f.source.subarray(p * 3, p * 3 + 3));
    else assert.deepEqual([...output.subarray(p * 3, p * 3 + 3)], [230, 0, 0], "Solid furniture is never feathered");
  }
  assert.equal(result.metrics.protectedOverlap, 0);
});
test("even one faint pixel crossing protection rejects the whole layer instead of clipping", async () => {
  const f = await fixture(); f.layer[(25 * 64 + 19) * 4 + 3] = 1;
  await assert.rejects(compositeFurnitureLayer(f.original, await f.png(f.layer, 4), f.mask), /overlaps 1 protected pixels/);
});
test("partial protection cannot airbrush solid furniture", async () => {
  const f = await fixture(255, 128);
  await assert.rejects(compositeFurnitureLayer(f.original, f.generated, f.mask), LayerRejected);
});
test("opaque room, empty overlay, transparent solids and reframing are rejected", async () => {
  const f = await fixture();
  const empty = await fixture(0), faded = await fixture(100);
  for (const layer of [f.original, await sharp(f.original).ensureAlpha().png().toBuffer(), empty.generated, faded.generated, await sharp(f.generated).resize(64, 64).png().toBuffer()])
    await assert.rejects(compositeFurnitureLayer(f.original, layer, f.mask), LayerRejected);
});
test("contradictory reviewer approval cannot override a defect or uncertainty", () => {
  const base = { acceptable: true, uncertain: false, observations: [{ region: "rug", evidence: "Missing corner", defect: true }] };
  assert.equal(normalizeQualityVerdict(base).acceptable, false);
  assert.equal(normalizeQualityVerdict({ ...base, uncertain: true, observations: [{ ...base.observations[0], defect: false }] }).acceptable, false);
  assert.equal(normalizeQualityVerdict({ ...base, observations: [{ region: "bed", evidence: "Complete and grounded", defect: false }] }).acceptable, true);
  assert.throws(() => normalizeQualityVerdict({ acceptable: true, observations: [] }));
});
