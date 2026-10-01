import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createRemovalMask } from "../server/utils/removalMask";
import { preserveProtectedPixels } from "../server/utils/preservePixels";
const rectangle = [{ x: 300, y: 300 }, { x: 700, y: 300 }, { x: 700, y: 700 }, { x: 300, y: 700 }];
test("object removal narrows alpha and preserves both user protection and exposed selected flooring", async () => {
    const width = 100, height = 100;
    const rgba = Buffer.alloc(width * height * 4);
    // A protected vertical strip crosses the object; a translucent strip stays at least as protected.
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
            rgba[(y * width + x) * 4 + 3] = x >= 45 && x < 50 ? 255 : x >= 50 && x < 55 ? 128 : 0;
    const userMask = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const mask = await createRemovalMask(userMask, [rectangle]);
    const alpha = await sharp(mask).extractChannel(3).raw().toBuffer();
    for (let p = 0; p < alpha.length; p++)
        assert.ok(alpha[p] >= rgba[p * 4 + 3], "Planner cannot expand a user's edit permission");
    assert.equal(alpha[10 * width + 10], 255, "Previously selected exposed floor becomes protected");
    assert.equal(alpha[35 * width + 35], 0, "Object interior remains editable");
    assert.equal(alpha[35 * width + 47], 255);
    assert.equal(alpha[35 * width + 52], 128);
    const original = await sharp({ create: { width, height, channels: 3, background: { r: 20, g: 60, b: 90 } } }).png().toBuffer();
    const generated = await sharp({ create: { width, height, channels: 3, background: { r: 220, g: 160, b: 190 } } }).png().toBuffer();
    const result = await sharp(await preserveProtectedPixels(original, generated, mask, 3)).raw().toBuffer();
    assert.deepEqual([...result.subarray((10 * width + 10) * 3, (10 * width + 10) * 3 + 3)], [20, 60, 90]);
    assert.deepEqual([...result.subarray((35 * width + 47) * 3, (35 * width + 47) * 3 + 3)], [20, 60, 90]);
    assert.deepEqual([...result.subarray((35 * width + 35) * 3, (35 * width + 35) * 3 + 3)], [220, 160, 190]);
});
test("object removal rejects unbounded or malformed planner geometry", async () => {
    const mask = await sharp({ create: { width: 20, height: 20, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    for (const polygons of [[], [rectangle.slice(0, 2)], [rectangle.map(p => ({ ...p, x: NaN }))], [rectangle.map(p => ({ ...p, x: 1001 }))], Array(25).fill(rectangle)])
        await assert.rejects(createRemovalMask(mask, polygons), /INVALID_REMOVAL_POLYGONS/);
});
test("fully protected selection cannot become a removal region", async () => {
    const mask = await sharp({ create: { width: 20, height: 20, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }).png().toBuffer();
    await assert.rejects(createRemovalMask(mask, [rectangle]), /NO_REMOVAL_AREA/);
});
