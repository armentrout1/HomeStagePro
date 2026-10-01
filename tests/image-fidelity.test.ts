import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  createSelectionGuide,
  stagingOutputSize,
} from "../server/utils/selectionGuide";
import { preserveProtectedPixels } from "../server/utils/preservePixels";

test("guide marks editable pixels without changing protected reference pixels", async () => {
  const original = await sharp({
    create: {
      width: 2,
      height: 1,
      channels: 3,
      background: { r: 40, g: 60, b: 80 },
    },
  })
    .png()
    .toBuffer();
  const mask = await sharp(Buffer.from([0, 0, 0, 255, 0, 0, 0, 0]), {
    raw: { width: 2, height: 1, channels: 4 },
  })
    .png()
    .toBuffer();
  const pixels = await sharp(await createSelectionGuide(original, mask))
    .raw()
    .toBuffer();
  assert.deepEqual([...pixels.subarray(0, 3)], [40, 60, 80]);
  assert.ok(pixels[3] > 40 && pixels[4] > 60 && pixels[5] < 80);
});

test("supported sizes preserve wide, tall and square composition", () => {
  for (const [w, h] of [
    [1536, 1024],
    [1024, 1536],
    [800, 800],
    [1800, 600],
    [600, 1800],
    [1200, 801],
  ]) {
    const [ow, oh] = stagingOutputSize(w, h).split("x").map(Number);
    assert.equal(ow % 16, 0);
    assert.equal(oh % 16, 0);
    assert.ok(ow * oh >= 655360 && ow * oh <= 8294400);
    assert.ok(Math.abs(ow / oh / (w / h) - 1) < 0.02);
    assert.ok(ow / oh <= 3 && ow / oh >= 1 / 3);
  }
  assert.throws(() => stagingOutputSize(4000, 500));
});

test("compositor rejects a changed aspect ratio instead of stretching the room", async () => {
  const original = await sharp({
    create: { width: 60, height: 40, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  const generated = await sharp({
    create: { width: 40, height: 60, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  const mask = await sharp({
    create: {
      width: 60,
      height: 40,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
  await assert.rejects(
    preserveProtectedPixels(original, generated, mask),
    /ASPECT_RATIO_MISMATCH/,
  );
});

test("inward blending preserves protected pixels, edit center and natural photo edges", async () => {
  const width = 64,
    height = 32;
  const original = await sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 40, b: 60 } },
  })
    .png()
    .toBuffer();
  const generated = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 220, g: 200, b: 180 },
    },
  })
    .png()
    .toBuffer();
  const raw = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      raw[(y * width + x) * 4 + 3] = x < 16 ? 255 : 0;
  const mask = await sharp(raw, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
  const out = await sharp(
    await preserveProtectedPixels(original, generated, mask, 8),
  )
    .raw()
    .toBuffer();
  for (let y = 0; y < height; y++)
    for (let x = 0; x < 16; x++)
      assert.deepEqual(
        [...out.subarray((y * width + x) * 3, (y * width + x) * 3 + 3)],
        [20, 40, 60],
      );
  // The discontinuity becomes a gradual transition within the edit area only.
  assert.ok(out[16 * 3] > 20 && out[16 * 3] < 35);
  for (let x = 16; x < 23; x++) assert.ok(out[(x + 1) * 3] > out[x * 3]);
  assert.deepEqual([...out.subarray(24 * 3, 24 * 3 + 3)], [220, 200, 180]);
  assert.deepEqual(
    [...out.subarray((width - 1) * 3, (width - 1) * 3 + 3)],
    [220, 200, 180],
  );
});

test("fully editable photos are not faded at their outer edges", async () => {
  const original = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "black" },
  })
    .png()
    .toBuffer();
  const generated = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  const mask = await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
  const out = await sharp(
    await preserveProtectedPixels(original, generated, mask, 16),
  )
    .raw()
    .toBuffer();
  assert.ok(out.every((v) => v === 255));
});
