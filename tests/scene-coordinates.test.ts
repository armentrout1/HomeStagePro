import test from "node:test";
import assert from "node:assert/strict";
import { IDENTITY, affine, compose, invert, transformPoint, transformRect, exifTransform, canonicalFrame, modelFrame, normalizedToPixels, pixelsToNormalized } from "../server/staging/scene/coordinates";
import type { Mat3, XY } from "../shared/staging/scene-map";
const close = (a: number[], b: number[]) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-8, `${a} != ${b}`));
test("composition applies right-hand matrix first", () => {
    const a: Mat3 = [2, 0, 3, 0, 4, 5, 0, 0, 1], b: Mat3 = [1, 0, -1, 0, 1, 2, 0, 0, 1];
    close(transformPoint(compose(a, b), [2, 3]), [5, 25]);
    close(transformPoint(invert(a), transformPoint(a, [1.5, 2.5])), [1.5, 2.5]);
});
const mappings: XY[] = [[0.5, 1.5], [4.5, 1.5], [4.5, 1.5], [0.5, 1.5], [1.5, 0.5], [1.5, 0.5], [1.5, 4.5], [1.5, 4.5]];
for (let orientation = 1; orientation <= 8; orientation++)
    test(`EXIF ${orientation} point, region and inverse`, () => {
        const t = exifTransform(5, 3, orientation);
        close(transformPoint(t.toCanonical, [0.5, 1.5]), mappings[orientation - 1]);
        close(transformRect(t.toCanonical, [0, 0, 5, 3]), [0, 0, t.width, t.height]);
        for (const p of [[0, 0], [5, 3], [1.5, 0.5], [3.5, 2.5]] as XY[])
            close(transformPoint(invert(t.toCanonical), transformPoint(t.toCanonical, p)), p);
    });
for (const [width, height] of [[7, 11], [11, 7], [513, 257]])
    for (const upscale of [false, true])
        test(`model contain-fit round trip ${width}x${height} upscale=${upscale}`, () => {
            const c = canonicalFrame(width, height), m = modelFrame(c, {
                id: "model", width: 101, height: 79, padding: {
                    left: 3, right: 7, top: 5, bottom: 11
                }, allowUpscale: upscale
            });
            close(transformRect(m.frame.toCanonical, m.frame.validPixels), [0, 0, width, height]);
            for (const p of [[0, 0], [width, height], [width / 2, height / 2]] as XY[])
                close(transformPoint(m.frame.toCanonical, transformPoint(m.fromCanonical, p)), p);
            assert.ok(m.resize.left >= 3 && m.resize.top >= 5);
            assert.ok(m.resize.width + m.resize.left <= 94);
            assert.ok(m.resize.height + m.resize.top <= 68);
        });
test("normalized edge coordinates preserve half-open rectangle limits without clamping", () => {
    close(normalizedToPixels([1, 1], 5, 7), [5, 7]);
    close(pixelsToNormalized([2.5, 3.5], 5, 7), [0.5, 0.5]);
    for (const p of [[-0.01, 0], [1.01, 0], [NaN, 0]] as XY[])
        assert.throws(() => normalizedToPixels(p, 5, 7), /INVALID_TRANSFORM/);
    assert.throws(() => pixelsToNormalized([6, 0], 5, 7), /INVALID_TRANSFORM/);
});
test("singular, ill-conditioned, perspective and non-finite transforms reject", () => {
    for (const m of [[0, 0, 0, 0, 1, 0, 0, 0, 1], [1e-12, 0, 0, 0, 1, 0, 0, 0, 1], [1, 0, 0, 0, 1, 0, 0.1, 0, 1], [Infinity, 0, 0, 0, 1, 0, 0, 0, 1]])
        assert.throws(() => affine(m), /INVALID_TRANSFORM/);
    assert.throws(() => invert([0, 0, 0, 0, 0, 0, 0, 0, 1]), /INVALID_TRANSFORM/);
    assert.throws(() => transformRect(IDENTITY, [0, 0, 0, 1]), /INVALID_TRANSFORM/);
    assert.throws(() => exifTransform(5, 3, 9), /INVALID_TRANSFORM/);
    assert.throws(() => canonicalFrame(4001, 4000), /IMAGE_TOO_LARGE/);
});
