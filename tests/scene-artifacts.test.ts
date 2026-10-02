import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { LocalSceneArtifactStore, validateArtifactBytes, sha256, stableJson, type SceneArtifact, type ArtifactDescription } from "../server/staging/scene/artifacts";
import { preprocessImage } from "../server/staging/scene/preprocess";
async function fixture(t: TestContext) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "roomstager-r12-"));
    t.after(async () => {
        const resolved = path.resolve(root), base = path.resolve(os.tmpdir());
        assert.equal(path.dirname(resolved), base);
        assert.ok(path.basename(resolved).startsWith("roomstager-r12-"));
        await fs.rm(resolved, { recursive: true, force: true });
    });
    const store = await LocalSceneArtifactStore.open(root, "run");
    const image = await sharp({ create: {
            width: 5, height: 3, channels: 3, background: {
                r: 21, g: 37, b: 99
            }
        } }).png().toBuffer();
    const spec: ArtifactDescription = {
        mediaType: "image/png", frameId: "canonical", width: 5, height: 3, channels: 3, dtype: "uint8", encoding: "png"
    };
    return {
        root, store, image, spec, file: (ref: SceneArtifact) => path.join(root, "run", "artifacts", ref.key)
    };
}
const reference = (bytes: Buffer, extra: Record<string, unknown> = {}) => ({
    id: "fixture", key: "fixture", sha256: sha256(bytes), bytes: bytes.length, mediaType: "image/png", ...extra
});
test("run-scoped write/read/reopen verifies actual bytes and metadata", async (t) => {
    const f = await fixture(t), ref = await f.store.put(f.image, f.spec);
    assert.deepEqual(await f.store.read(ref), f.image);
    assert.deepEqual(await (await LocalSceneArtifactStore.open(f.root, "run")).read(ref), f.image);
    assert.deepEqual(await f.store.put(f.image, f.spec), ref);
    assert.equal((await fs.readdir(path.join(f.root, "run", "artifacts"))).some(n => n.startsWith("tmp-")), false);
});
test("same bytes cannot acquire conflicting raster metadata", async (t) => {
    const f = await fixture(t), ref = await f.store.put(f.image, f.spec);
    await assert.rejects(f.store.put(f.image, { ...f.spec, frameId: "other" }), /ARTIFACT_CONFLICT/);
    await assert.rejects(f.store.read({ ...ref, frameId: "other" } as SceneArtifact), /ARTIFACT_CONFLICT/);
});
test("size/hash mismatch and corrupt PNG are verified from bytes", async (t) => {
    const f = await fixture(t);
    await assert.rejects(validateArtifactBytes({ ...reference(f.image), bytes: f.image.length + 1 }, f.image), /ARTIFACT_SIZE_MISMATCH/);
    await assert.rejects(validateArtifactBytes({ ...reference(f.image), sha256: "0".repeat(64) }, f.image), /ARTIFACT_HASH_MISMATCH/);
    const invalid = Buffer.from("not png");
    await assert.rejects(validateArtifactBytes(reference(invalid), invalid), /ARTIFACT_INVALID/);
    const truncated = f.image.subarray(0, 30);
    await assert.rejects(validateArtifactBytes(reference(truncated), truncated), /ARTIFACT_INVALID/);
    const ref = await f.store.put(f.image, f.spec), corrupt = Buffer.from(f.image);
    corrupt[corrupt.length - 1] ^= 1;
    await fs.writeFile(f.file(ref), corrupt);
    await assert.rejects(f.store.read(ref), /ARTIFACT_HASH_MISMATCH/);
});
test("PNG dimensions, sample type, channels and binary membership are checked", async (t) => {
    const f = await fixture(t);
    for (const extra of [{ width: 4 }, { channels: 1 }, { dtype: "uint16" }])
        await assert.rejects(validateArtifactBytes(reference(f.image, { ...f.spec, ...extra }), f.image), /ARTIFACT_INVALID/);
    const gray = await sharp(Buffer.from([0, 1, 255]), { raw: {
            width: 3, height: 1, channels: 1
        } }).toColourspace("b-w").png().toBuffer();
    await assert.rejects(validateArtifactBytes(reference(gray, {
        ...f.spec, width: 3, height: 1, channels: 1, semantics: "binary-membership"
    }), gray), /ARTIFACT_INVALID/);
    const binary = await sharp(Buffer.from([0, 255, 255]), { raw: {
            width: 3, height: 1, channels: 1
        } }).toColourspace("b-w").png().toBuffer();
    await validateArtifactBytes(reference(binary, {
        ...f.spec, width: 3, height: 1, channels: 1, semantics: "binary-membership"
    }), binary);
});
test("raw float32 validates little-endian finite values and optional nonnegative role", async () => {
    const samples = Buffer.alloc(8);
    samples.writeFloatLE(1.5, 0);
    samples.writeFloatLE(-2.5, 4);
    const ref = () => reference(samples, {
        mediaType: "application/octet-stream", frameId: "raw", width: 2, height: 1, channels: 1, dtype: "float32-le", encoding: "raw-row-major"
    });
    await validateArtifactBytes(ref(), samples);
    await assert.rejects(validateArtifactBytes(ref(), samples, { nonnegativeFloat: true }), /ARTIFACT_INVALID/);
    for (const bad of [NaN, Infinity, -Infinity]) {
        samples.writeFloatLE(bad, 4);
        await assert.rejects(validateArtifactBytes(ref(), samples), /ARTIFACT_INVALID/);
    }
});
test("path traversal, URLs, reserved names and cross-run reads fail closed", async (t) => {
    const f = await fixture(t), ref = await f.store.put(f.image, f.spec);
    for (const id of ["../outside", "a/b", "https://host", "CON"])
        await assert.rejects(LocalSceneArtifactStore.open(f.root, id), /ARTIFACT_PATH_VIOLATION/);
    for (const key of ["../outside", "https://host/image", "C:\\outside.png"])
        await assert.rejects(f.store.read({ ...ref, key }), /ARTIFACT_INVALID|ARTIFACT_PATH_VIOLATION/);
    const other = await LocalSceneArtifactStore.open(f.root, "other");
    await assert.rejects(other.read(ref), /ARTIFACT_PATH_VIOLATION/);
    await assert.rejects(f.store.put(f.image, { ...f.spec, key: "arbitrary" } as any), /ARTIFACT_INVALID/);
});
test("incomplete artifacts do not appear published and errors omit filesystem paths", async (t) => {
    const f = await fixture(t);
    await f.store.put(f.image, f.spec);
    await assert.rejects(f.store.readPublication(), (error: unknown) => error instanceof Error && error.message === "ARTIFACT_MISSING" && !error.message.includes(f.root));
    assert.equal((await fs.readdir(path.join(f.root, "run"))).includes("manifest.json"), false);
});
test("preprocessing manifests are stable across run IDs and publish only verified outputs", async (t) => {
    const f = await fixture(t), a = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store);
    const other = await LocalSceneArtifactStore.open(f.root, "other"), b = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, other);
    assert.notEqual(a.source.canonical.id, b.source.canonical.id);
    assert.deepEqual(a.stableManifestBytes, b.stableManifestBytes);
    const ref = await f.store.publishPreprocessing(a.source.preprocessingManifest, a.artifacts), bytes = await f.store.readPublication();
    assert.deepEqual(await f.store.read(ref), bytes);
    assert.equal(sha256(bytes), ref.sha256);
    assert.equal(bytes.length, ref.bytes);
    const published = JSON.parse(bytes.toString());
    assert.equal(published.schemaVersion, "preprocessing-bundle/1");
    assert.equal(published.artifacts.length, 2);
    const before = Buffer.from(bytes);
    await assert.rejects(f.store.publishPreprocessing(a.source.preprocessingManifest, a.artifacts), /ARTIFACT_ALREADY_PUBLISHED/);
    await assert.rejects(f.store.put(f.image, f.spec), /ARTIFACT_ALREADY_PUBLISHED/);
    assert.deepEqual(await f.store.readPublication(), before);
});
test("missing artifact prevents manifest publication", async (t) => {
    const f = await fixture(t), p = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store);
    await fs.unlink(f.file(p.source.canonical));
    await assert.rejects(f.store.publishPreprocessing(p.source.preprocessingManifest, p.artifacts), /ARTIFACT_MISSING/);
    await assert.rejects(f.store.readPublication(), /ARTIFACT_MISSING/);
});
test("manifest cannot omit, duplicate or substitute its declared output", async (t) => {
    const f = await fixture(t), p = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store);
    await assert.rejects(f.store.publishPreprocessing(p.source.preprocessingManifest, []), /ARTIFACT_INVALID/);
    await assert.rejects(f.store.publishPreprocessing(p.source.preprocessingManifest, [...p.artifacts, ...p.artifacts]), /ARTIFACT_CONFLICT/);
    const altered = await sharp(f.image).negate().png().toBuffer(), other = await f.store.put(altered, f.spec);
    await assert.rejects(f.store.publishPreprocessing(p.source.preprocessingManifest, [other]), /ARTIFACT_INVALID/);
    assert.equal((await fs.readdir(path.join(f.root, "run"))).includes("manifest.json"), false);
});
test("publication reader observes absent or a full verified manifest, never a partial file", async (t) => {
    const f = await fixture(t), p = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store);
    let running = true, observed = 0;
    const publish = f.store.publishPreprocessing(p.source.preprocessingManifest, p.artifacts).finally(() => { running = false; });
    while (running) {
        try {
            const raw = await fs.readFile(path.join(f.root, "run", "manifest.json"));
            assert.equal(JSON.parse(raw.toString()).schemaVersion, "preprocessing-bundle/1");
            observed++;
        }
        catch (e) {
            if (!(e && typeof e === "object" && "code" in e && e.code === "ENOENT"))
                throw e;
        }
        await new Promise(resolve => setImmediate(resolve));
    }
    await publish;
    assert.ok((await f.store.readPublication()).length > 0);
    assert.ok(observed >= 0);
});
test("interrupted writer lock blocks reuse without claiming publication", async (t) => {
    const f = await fixture(t), p = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store);
    await fs.writeFile(path.join(f.root, "run", "mutation.lock"), "", { flag: "wx" });
    await fs.writeFile(path.join(f.root, "run", "tmp-interrupted"), "partial");
    await assert.rejects(f.store.publishPreprocessing(p.source.preprocessingManifest, p.artifacts), /ARTIFACT_BUSY/);
    await assert.rejects(f.store.readPublication(), /ARTIFACT_MISSING/);
});
test("junction/symlink directory escapes are rejected before writes", async (t) => {
    const f = await fixture(t), outside = path.join(f.root, "outside");
    await fs.mkdir(outside);
    const link = path.join(f.root, "redirect");
    await fs.symlink(outside, link, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(LocalSceneArtifactStore.open(link, "run"), /ARTIFACT_PATH_VIOLATION/);
    const artifacts = path.join(f.root, "run", "artifacts");
    await fs.rename(artifacts, path.join(f.root, "run", "old-artifacts"));
    await fs.symlink(outside, artifacts, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(f.store.put(f.image, f.spec), /ARTIFACT_PATH_VIOLATION/);
    assert.deepEqual(await fs.readdir(outside), []);
});
test("hard-linked artifact substitution is rejected", async (t) => {
    const f = await fixture(t), ref = await f.store.put(f.image, f.spec);
    await fs.link(f.file(ref), path.join(f.root, "alias.png"));
    await assert.rejects(f.store.read(ref), /ARTIFACT_PATH_VIOLATION/);
});
test("modified published artifacts invalidate publication reads", async (t) => {
    const f = await fixture(t), p = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store);
    await f.store.publishPreprocessing(p.source.preprocessingManifest, p.artifacts);
    await fs.writeFile(f.file(p.source.canonical), Buffer.from("corrupt"));
    await assert.rejects(f.store.readPublication(), /ARTIFACT_SIZE_MISMATCH/);
});
test("JSON validation rejects invalid UTF-8, malformed data and unsupported media types", async (t) => {
    const f = await fixture(t);
    for (const data of [Buffer.from([255]), Buffer.from("{broken")])
        await assert.rejects(f.store.put(data, { mediaType: "application/json" }), /ARTIFACT_INVALID/);
    await assert.rejects(f.store.put(Buffer.from("opaque"), { mediaType: "text/plain" }), /ARTIFACT_INVALID/);
    assert.deepEqual(stableJson({ b: 2, a: 1 }), stableJson({ a: 1, b: 2 }));
    assert.throws(() => stableJson({ bad: Infinity }), /ARTIFACT_INVALID/);
});
test("publication receipt verifies exact envelope bytes", async (t) => {
    const f = await fixture(t), p = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store), receipt = await f.store.publishPreprocessing(p.source.preprocessingManifest, p.artifacts);
    const file = path.join(f.root, "run", "manifest.json");
    await fs.appendFile(file, " ");
    await assert.rejects(f.store.read(receipt), /ARTIFACT_SIZE_MISMATCH/);
});
test("publication rejects contradictory preprocessing metadata", async (t) => {
    const f = await fixture(t), p = await preprocessImage({ bytes: f.image, mediaType: "image/png" }, f.store), manifest = JSON.parse(p.stableManifestBytes.toString());
    manifest.canonical.sha256 = "0".repeat(64);
    const ref = await f.store.put(stableJson(manifest), { mediaType: "application/json" });
    await assert.rejects(f.store.publishPreprocessing(ref, p.artifacts), /ARTIFACT_INVALID/);
});
