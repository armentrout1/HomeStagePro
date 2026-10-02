import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { preprocessImage, selectionRestriction } from "../server/staging/scene/preprocess";
import { validateArtifactBytes, sha256, type ArtifactDescription, type SceneArtifact, type SceneArtifactStore } from "../server/staging/scene/artifacts";
import { canonicalFrame, exifTransform, modelFrame } from "../server/staging/scene/coordinates";
import { sourceIdentitySchema, type Frame } from "../shared/staging/scene-map";
function memoryStore(): SceneArtifactStore {
    return {
        runId: "synthetic", async put(bytes: Uint8Array, description: ArtifactDescription) {
            const hash = sha256(bytes);
            return validateArtifactBytes({
                ...description, id: `a-${hash}`, key: `a-${hash}`, sha256: hash, bytes: bytes.length
            }, bytes);
        }, async read() { throw new Error("Unused fixture port"); }, async publishPreprocessing() { throw new Error("Unused fixture port"); }
    };
}
async function image(width = 5, height = 3, orientation = 1) {
    const raw = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
        raw[i * 3] = 20 + i * 3;
        raw[i * 3 + 1] = 80 + i;
        raw[i * 3 + 2] = 140 - i;
    }
    const png = await sharp(raw, { raw: {
            width, height, channels: 3
        } }).withMetadata({ orientation }).png().toBuffer();
    return {
        png, raw, width, height
    };
}
async function alphaImage(width: number, height: number, alpha: number[]) {
    const raw = Buffer.alloc(width * height * 4);
    alpha.forEach((a, i) => { raw[i * 4 + 3] = a; });
    return sharp(raw, { raw: {
            width, height, channels: 4
        } }).png().toBuffer();
}
const rawMask = (bytes: Buffer) => sharp(bytes).toColourspace("b-w").raw().toBuffer();
// Independent encoded-pixel-index mapping; does not use the coordinate utility.
function destination(x: number, y: number, w: number, h: number, o: number): [
    number,
    number
] {
    return ([[x, y], [w - 1 - x, y], [w - 1 - x, h - 1 - y], [x, h - 1 - y], [y, x], [h - 1 - y, x], [h - 1 - y, w - 1 - x], [y, w - 1 - x]] as [
        number,
        number
    ][])[o - 1];
}
for (let orientation = 1; orientation <= 8; orientation++)
    test(`canonical EXIF ${orientation} pixels and selected region`, async () => {
        const f = await image(5, 3, orientation), original = Buffer.from(f.png), a = Array(15).fill(0);
        a[1] = 1;
        a[14] = 254;
        const selection = await alphaImage(5, 3, a), result = await preprocessImage({
            bytes: f.png, mediaType: "image/png", selection: {
                bytes: selection, sourceUploadedSha256: sha256(f.png), alignment: "encoded-pixels"
            }
        }, memoryStore());
        const pixels = await sharp(result.canonicalBytes).raw().toBuffer(), restriction = await rawMask(result.restrictionBytes!);
        const width = orientation >= 5 ? 3 : 5, height = orientation >= 5 ? 5 : 3;
        assert.equal(result.source.canonical.width, width);
        assert.equal(result.source.canonical.height, height);
        for (let y = 0; y < 3; y++)
            for (let x = 0; x < 5; x++) {
                const [dx, dy] = destination(x, y, 5, 3, orientation), from = (y * 5 + x) * 3, to = (dy * width + dx) * 3;
                assert.deepEqual(pixels.subarray(to, to + 3), f.raw.subarray(from, from + 3));
                assert.equal(restriction[dy * width + dx], a[y * 5 + x] ? 255 : 0);
            }
        assert.deepEqual(f.png, original);
        assert.equal(result.source.uploadedSha256, sha256(original));
        assert.equal(sourceIdentitySchema.safeParse(result.source).success, true);
        const metadata = await sharp(result.canonicalBytes).metadata();
        assert.equal(metadata.orientation, undefined);
        assert.equal(metadata.exif, undefined);
        assert.equal(metadata.icc, undefined);
    });
test("identical source/config/runtime yield identical canonical and stable manifest hashes", async () => {
    const { png } = await image(), a = await preprocessImage({ bytes: png, mediaType: "image/png" }, memoryStore()), b = await preprocessImage({ bytes: png, mediaType: "image/png" }, memoryStore());
    assert.deepEqual(a.canonicalBytes, b.canonicalBytes);
    assert.deepEqual(a.stableManifestBytes, b.stableManifestBytes);
    assert.equal(a.source.preprocessingConfigSha256, b.source.preprocessingConfigSha256);
    const manifest = JSON.parse(a.stableManifestBytes.toString());
    assert.equal("createdAt" in manifest, false);
    assert.equal("elapsedMs" in manifest, false);
    const changed = await preprocessImage({
        bytes: png, mediaType: "image/png", config: { pngCompressionLevel: 0 }
    }, memoryStore());
    assert.notEqual(a.source.preprocessingConfigSha256, changed.source.preprocessingConfigSha256);
});
for (const kind of ["grayscale", "rgb", "opaque-alpha"])
    test(`canonical RGB from ${kind}`, async () => {
        const img = sharp({ create: {
                width: 5, height: 7, channels: kind === "opaque-alpha" ? 4 : 3, background: {
                    r: 30, g: 60, b: 90, alpha: 1
                }
            } });
        const bytes = await (kind === "grayscale" ? img.toColourspace("b-w") : img).png().toBuffer();
        const result = await preprocessImage({ bytes, mediaType: "image/png" }, memoryStore()), meta = await sharp(result.canonicalBytes).metadata();
        assert.equal(meta.channels, 3);
        assert.equal(meta.depth, "uchar");
        assert.equal(meta.width, 5);
        assert.equal(meta.height, 7);
    });
for (const format of ["jpeg", "webp"] as const)
    test(`supported ${format} source`, async () => {
        const { png } = await image(), bytes = await sharp(png)[format]().toBuffer(), r = await preprocessImage({ bytes, mediaType: `image/${format}` }, memoryStore());
        assert.equal(r.source.uploadedSha256, sha256(bytes));
        assert.equal((await sharp(r.canonicalBytes).metadata()).format, "png");
    });
test("malformed, unsupported, transparency, dimensions and byte ceiling reject", async () => {
    await assert.rejects(preprocessImage({ bytes: Buffer.from("not image"), mediaType: "image/png" }, memoryStore()), /UNSUPPORTED_IMAGE/);
    await assert.rejects(preprocessImage({ bytes: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), mediaType: "image/png" }, memoryStore()), /INVALID_IMAGE/);
    const transparent = await alphaImage(3, 3, [255, 255, 255, 255, 254, 255, 255, 255, 255]);
    await assert.rejects(preprocessImage({ bytes: transparent, mediaType: "image/png" }, memoryStore()), /UNSUPPORTED_TRANSPARENCY/);
    const giant = await sharp({ create: {
            width: 2049, height: 800, channels: 3, background: "white"
        } }).png().toBuffer();
    await assert.rejects(preprocessImage({ bytes: giant, mediaType: "image/png" }, memoryStore()), /IMAGE_TOO_LARGE/);
    await assert.rejects(preprocessImage({ bytes: Buffer.alloc(10 * 1024 * 1024 + 1), mediaType: "image/png" }, memoryStore()), /IMAGE_TOO_LARGE/);
    const { png } = await image();
    await assert.rejects(preprocessImage({ bytes: png, mediaType: "image/jpeg" }, memoryStore()), /UNSUPPORTED_IMAGE/);
});
test("alpha 0/1/127/254/255 never weakens protected membership", async () => {
    const bytes = await alphaImage(5, 1, [0, 1, 127, 254, 255]), frame = canonicalFrame(5, 1);
    assert.deepEqual(await rawMask(await selectionRestriction(bytes, frame, frame)), Buffer.from([0, 255, 255, 255, 255]));
});
test("odd-size downsampling conservatively retains one-pixel lines and points", async () => {
    const a = Array(7 * 5).fill(0);
    for (let y = 0; y < 5; y++)
        a[y * 7 + 3] = 1;
    a[0] = 127;
    const source: Frame = {
        id: "selection", width: 7, height: 5, toCanonical: [3 / 7, 0, 0, 0, 3 / 5, 0, 0, 0, 1], validPixels: [0, 0, 7, 5]
    };
    const result = await rawMask(await selectionRestriction(await alphaImage(7, 5, a), source, canonicalFrame(3, 3)));
    assert.equal(result[0], 255);
    for (let y = 0; y < 3; y++)
        assert.equal(result[y * 3 + 1], 255);
});
test("upscale one protected pixel covers its entire footprint", async () => {
    const source: Frame = {
        id: "selection", width: 3, height: 3, toCanonical: [3, 0, 0, 0, 3, 0, 0, 0, 1], validPixels: [0, 0, 3, 3]
    }, a = Array(9).fill(0);
    a[4] = 1;
    const result = await rawMask(await selectionRestriction(await alphaImage(3, 3, a), source, canonicalFrame(9, 9)));
    assert.equal(result.filter((v: number) => v === 255).length, 9);
});
test("letterbox selection maps content and rejects protection in padding", async () => {
    const canonical = canonicalFrame(7, 5), { frame } = modelFrame(canonical, {
        id: "model", width: 14, height: 14, padding: {
            left: 1, right: 2, top: 2, bottom: 3
        }, allowUpscale: true
    });
    const [left, top, width, height] = frame.validPixels, a = Array(196).fill(0);
    a[top * 14 + left] = 1;
    a[(top + height - 1) * 14 + left + width - 1] = 255;
    const result = await rawMask(await selectionRestriction(await alphaImage(14, 14, a), frame, canonical));
    assert.equal(result[0], 255);
    assert.equal(result[34], 255);
    a[0] = 1;
    await assert.rejects(selectionRestriction(await alphaImage(14, 14, a), frame, canonical), /INVALID_SELECTION/);
});
test("selection source binding and unknown/dimension alignment reject before writes", async () => {
    const { png } = await image(), selection = await alphaImage(5, 3, Array(15).fill(0));
    let writes = 0;
    const store = { ...memoryStore(), async put() { writes++; throw new Error("must not write"); } };
    await assert.rejects(preprocessImage({
        bytes: png, mediaType: "image/png", selection: {
            bytes: selection, sourceUploadedSha256: "a".repeat(64), alignment: "encoded-pixels"
        }
    }, store), /SELECTION_ALIGNMENT_UNKNOWN/);
    await assert.rejects(preprocessImage({
        bytes: png, mediaType: "image/png", selection: {
            bytes: selection, sourceUploadedSha256: sha256(png), alignment: "unknown" as any
        }
    }, store), /SELECTION_ALIGNMENT_UNKNOWN/);
    assert.equal(writes, 0);
    await assert.rejects(selectionRestriction(selection, canonicalFrame(3, 5), canonicalFrame(3, 5)), /INVALID_SELECTION/);
});
test("selection cannot silently cover only a crop or apply its own EXIF twice", async () => {
    const bytes = await alphaImage(3, 3, Array(9).fill(1));
    await assert.rejects(selectionRestriction(bytes, { ...canonicalFrame(3, 3), id: "crop" }, canonicalFrame(5, 5)), /SELECTION_ALIGNMENT_UNKNOWN/);
    const oriented = await sharp(bytes).withMetadata({ orientation: 6 }).png().toBuffer();
    await assert.rejects(selectionRestriction(oriented, canonicalFrame(3, 3), canonicalFrame(3, 3)), /INVALID_SELECTION/);
});
test("already oriented canonical-frame selection is not rotated a second time", async () => {
    const f = await image(5, 3, 6), a = Array(15).fill(0);
    a[2] = 255;
    const mask = await alphaImage(3, 5, a), r = await preprocessImage({
        bytes: f.png, mediaType: "image/png", selection: {
            bytes: mask, sourceUploadedSha256: sha256(f.png), alignment: "canonical-pixels"
        }
    }, memoryStore());
    assert.deepEqual(await rawMask(r.restrictionBytes!), Buffer.from(a));
});
test("fractional letterbox scales keep the protected far corner across odd dimensions", async () => {
    for (const [w, h] of [[7, 11], [11, 7], [13, 9], [9, 13]]) {
        const canonical = canonicalFrame(w, h), { frame } = modelFrame(canonical, {
            id: "model", width: 25, height: 31, padding: {
                left: 7, top: 3, right: 4, bottom: 1
            }, allowUpscale: true
        });
        const [x, y, width, height] = frame.validPixels, a = Array(25 * 31).fill(0);
        a[(y + height - 1) * 25 + x + width - 1] = 1;
        const output = await rawMask(await selectionRestriction(await alphaImage(25, 31, a), frame, canonical));
        assert.equal(output[w * h - 1], 255);
    }
});

test("oversized PNG header rejects before decompression allocation", async () => {
    const {png}=await image(),declared=Buffer.from(png);
    declared.writeUInt32BE(5000,16);declared.writeUInt32BE(5000,20);
    let crc=0xffffffff;
    for(const byte of declared.subarray(12,29)) {
        crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
    }
    declared.writeUInt32BE((crc^0xffffffff)>>>0,29);
    await assert.rejects(preprocessImage({bytes:declared,mediaType:"image/png"},memoryStore()),/IMAGE_TOO_LARGE/);
});
