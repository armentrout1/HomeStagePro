import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { preserveProtectedPixels } from '../server/utils/preservePixels';
test('removal tone correction matches lighting without copying old furniture or losing new texture', async () => {
    const w = 96, h = 64, source = Buffer.alloc(w * h * 3, 40), generated = Buffer.alloc(w * h * 3, 100), mask = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const p = y * w + x;
            mask[p * 4 + 3] = x >= 24 && x < 72 && y >= 16 && y < 48 ? 0 : 255;
            if (x >= 40 && x < 56 && y >= 24 && y < 40)
                for (let c = 0; c < 3; c++)
                    source[p * 3 + c] = 180; // Old furniture: never sample it.
            if (x === 48 && y === 32)
                for (let c = 0; c < 3; c++)
                    generated[p * 3 + c] = 120; // New floor detail.
        }
    const png = async (data: Buffer, channels: 3 | 4) => sharp(data, { raw: { width: w, height: h, channels } }).png().toBuffer();
    const out = await sharp(await preserveProtectedPixels(await png(source, 3), await png(generated, 3), await png(mask, 4), 3, true)).raw().toBuffer();
    for (let p = 0; p < w * h; p++)
        if (mask[p * 4 + 3] === 255)
            assert.deepEqual(out.subarray(p * 3, p * 3 + 3), source.subarray(p * 3, p * 3 + 3));
    assert.ok(Math.abs(out[(32 * w + 47) * 3] - 40) <= 2, 'Uniform lighting corrected inside old furniture footprint');
    assert.ok(Math.abs(out[(32 * w + 48) * 3] - 60) <= 2, 'New texture contrast survives');
});
test('tone correction leaves a fully editable photo unchanged without a protected reference', async () => {
    const w = 20, h = 20;
    const source = await sharp({ create: { width: w, height: h, channels: 3, background: '#222222' } }).png().toBuffer();
    const generated = await sharp({ create: { width: w, height: h, channels: 3, background: '#999999' } }).png().toBuffer();
    const mask = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    const out = await preserveProtectedPixels(source, generated, mask, 16, true);
    assert.deepEqual(await sharp(out).raw().toBuffer(), await sharp(generated).raw().toBuffer());
});
