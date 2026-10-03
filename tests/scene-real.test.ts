import test from "node:test";
import assert from "node:assert/strict";
import { realComponent, realLicense, convertMasks } from "../server/staging/scene/components/real";
import { ComponentRegistry } from "../server/staging/scene/components/registry";
import { REAL_IDS, realId, decodeResponse, responseSchema, checked } from "../server/staging/scene/components/real-runtime";
import { consolidate, mapLabel, detectionElements, coverage } from "../server/staging/scene/components/real-mapping";
import { sceneElementSchema } from "../shared/staging/scene-map";
const detection = (label: string, score = .8, box = [1, 2, 20, 30]) => ({ group: "openings" as const, label, score, box });

test("reviewed real factories register only exact descriptors and reject production use", async () => {
    for (const id of REAL_IDS) {
        const { registration, component } = await realComponent(id);
        new ComponentRegistry().register(registration, component);
        await assert.rejects(realLicense(component, "production"), /COMPONENT_LICENSE_BLOCKED/);
        assert.throws(() => new ComponentRegistry().register({ ...registration, codeRevision: "a".repeat(40) }, component));
        assert.throws(() => new ComponentRegistry().register({ ...registration, supportedClasses: [] }, component));
        assert.throws(() => new ComponentRegistry().register(registration, { ...component }));
        assert.throws(() => new ComponentRegistry().register({ ...registration, policy: { ...registration.policy, deadlineMs: 60000 } as unknown as typeof registration.policy }, component));
    }
    for (const id of ["florence2-base-ms-v1", "python", "../worker", "synthetic-test-worker"]) assert.throws(() => realId(id));
});
test("canonical aliases preserve opening, subtype and permanence uncertainty", () => {
    assert.deepEqual(mapLabel("open doorway"), ["opening", "doorway"]);
    assert.deepEqual(mapLabel("balcony door"), ["door", "balcony-door"]);
    assert.deepEqual(mapLabel("cabinet"), ["furniture", "cabinet"]);
    assert.deepEqual(mapLabel("built-in cabinet"), ["built-in", "cabinet"]);
    assert.deepEqual(mapLabel("wall window door"), ["unknown", "ambiguous-native-label"]);
    const elements = detectionElements(consolidate([detection("door")], 100, 100), "run", "canonical", 100, 100);
    assert.equal(sceneElementSchema.safeParse(elements[0]).success, true);
    assert.equal(elements[0].permanence, "unknown");
    assert.equal(elements[0].detectionConfidence.state, "estimated");
    assert.equal(elements[0].detectionConfidence.calibratedProbability, null);
    assert.deepEqual(elements[0].opening, { state: "unknown", hingeImageSide: "unknown", swing: "unknown", confidence: elements[0].permanenceConfidence });
    for (const key of ["depth", "floorToCanonicalPixels", "cameraIntrinsics", "enforceable", "editingAuthorization"]) assert.equal(key in elements[0], false);
});
test("deterministic alias consolidation retains conflicting architectural hypotheses", () => {
    const raw = [detection("doorway", .7), detection("open doorway", .9), detection("door", .8), detection("window", .8)];
    const kept = consolidate(raw, 100, 100);
    assert.equal(kept.length, 3);
    assert.equal(kept[0].contributions.length, 2);
    assert.deepEqual(consolidate([...raw].reverse(), 100, 100), kept);
    const elements = detectionElements(kept, "run", "canonical", 100, 100);
    assert.ok(elements.every(e => e.relatedElementIds.length === 2));
});
test("bad boxes, nonfinite scores and overflow cannot silently become observations", () => {
    for (const score of [NaN, Infinity, -Infinity, 1.1, -.1]) assert.throws(() => consolidate([detection("door", score)], 100, 100));
    assert.throws(() => consolidate([detection("door", .8, [0, 0, 101, 1])], 100, 100));
    assert.throws(() => consolidate(Array.from({ length: 129 }, () => detection("door")), 100, 100));
    assert.throws(() => consolidate([detection("door", .8, [20, 2, 1, 30])], 100, 100));
});
test("coverage never claims absence or qualified surfaces and failed masks stay failed", () => {
    const c = coverage([], ["door"]);
    assert.equal(c.door.inspection, "failed");
    for (const value of Object.values(c)) { assert.equal(value.absence, "not-established"); assert.equal(value.confidence.state, "unknown"); }
    for (const cls of ["floor", "wall", "ceiling"] as const) {
        assert.equal(c[cls].inspection, "partial");
        assert.ok(c[cls].confidence.reasons.includes("experimental-surface-not-qualified"));
    }
});
test("binary frame and exact native schema reject malformed data and authority", () => {
    for (const bytes of [Buffer.alloc(0), Buffer.from("R1B1bad"), Buffer.from("NOPE00000000")]) assert.throws(() => decodeResponse(bytes));
    assert.equal(responseSchema.safeParse({ trusted: true, state: "verified", absence: "independently-reviewed" }).success, false);
});

import sharp from "sharp";
import { fixture } from "./scene-component-fixtures";
import { sha256, validateArtifactBytes } from "../server/staging/scene/artifacts";
import { PROMPT_HASH, type NativeResult } from "../server/staging/scene/components/real-runtime";
function native(masks: NativeResult["masks"]): NativeResult {
    return responseSchema.parse({ version: "scene-local/1", implementationId: REAL_IDS[1], task: "segmentation", sourceSha256: "a".repeat(64), width: 5, height: 3, promptHash: PROMPT_HASH, status: "completed", failure: null, detections: [], masks, networkAttempts: 0, keys: { missing: [], unexpected: [], excludedVideo: [] }, resources: { loadSeconds: 1, inferenceSeconds: 1, hostRssBytes: 1, gpuPeakAllocatedBytes: 1, gpuPeakReservedBytes: 1, gpuFreeBytes: 1, gpuTotalBytes: 1 } });
}
test("SAM binary masks retain detector relationships and explicit failure without rectangle fallback", async t => {
    const f = await fixture(t), receipt = await f.runner.run(await f.add());
    const source = detectionElements(consolidate([detection("window", .8, [0, 0, 4, 2]), detection("door", .7, [1, 1, 5, 3])], 5, 3), "detector", "canonical", 5, 3);
    const bytes = await sharp(Buffer.alloc(15, 255), { raw: { width: 5, height: 3, channels: 1 } }).toColourspace("b-w").png().toBuffer();
    const completed = { id: source[0].id, status: "completed" as const, score: .7, offset: 0, bytes: bytes.length, sha256: sha256(bytes), failure: null };
    const failed = { id: source[1].id, status: "failed" as const, score: null, offset: bytes.length, bytes: 0, sha256: null, failure: "MASK_REFINEMENT_FAILED" as const };
    const context = { run: receipt.run, putArtifact: async (...args: Parameters<typeof f.store.put>) => { const ref = await f.store.put(...args); await validateArtifactBytes(ref, await f.store.read(ref)); return ref; } };
    const converted = await convertMasks(native([completed, failed]), bytes, source, f.input, context);
    assert.equal(converted.elements.length, 1);
    assert.equal(converted.artifacts.length, 1);
    assert.deepEqual(converted.failed, ["door"]);
    const e = converted.elements[0];
    assert.equal(e.shape.kind, "mask");
    assert.deepEqual(e.relatedElementIds, [source[0].id]);
    assert.deepEqual(e.componentRunIds, [receipt.run.id]);
    assert.equal(e.geometryConfidence.state, "estimated");
    assert.equal(e.geometryConfidence.calibratedProbability, null);
    assert.equal(e.permanence, "unknown");
    for (const bad of [
        native([{ ...completed, id: "wrong" }, failed]),
        native([completed, { ...failed, offset: 0 }]),
        native([{ ...completed, sha256: "0".repeat(64) }, failed]),
        native([completed, { ...failed, bytes: 1 }])
    ]) await assert.rejects(convertMasks(bad, bytes, source, f.input, context));
    await assert.rejects(convertMasks(native([completed, failed]), Buffer.concat([bytes, Buffer.from([0])]), source, f.input, context));
    const wrongPixels = await sharp(Buffer.alloc(15, 128), { raw: { width: 5, height: 3, channels: 1 } }).toColourspace("b-w").png().toBuffer();
    await assert.rejects(convertMasks(native([{ ...completed, bytes: wrongPixels.length, sha256: sha256(wrongPixels) }, { ...failed, offset: wrongPixels.length }]), wrongPixels, source, f.input, context));
});
test("native schema rejects over-cap masks, claims of authority, invalid scores and network attempts", () => {
    const valid = native([]);
    for (const change of [{ state: "verified" }, { networkAttempts: 1 }, { enforceable: true }, { depth: 2 }, { absence: "independently-reviewed" }]) assert.equal(responseSchema.safeParse({ ...valid, ...change }).success, false);
    const m = { id: "box", status: "completed", score: .8, offset: 0, bytes: 1, sha256: "a".repeat(64), failure: null };
    assert.equal(responseSchema.safeParse({ ...valid, masks: Array.from({ length: 33 }, () => m) }).success, false);
    for (const score of [NaN, Infinity, -Infinity]) assert.equal(responseSchema.safeParse({ ...valid, masks: [{ ...m, score }] }).success, false);
});

test("qualified descriptor file bytes cannot bypass a mismatching content pin", async () => {
    const file = new URL("../scripts/staging_runtime/bindings/scene-runtime.json", import.meta.url);
    await assert.rejects(checked((await import("node:url")).fileURLToPath(file), "0".repeat(64)), /COMPONENT_LICENSE_BLOCKED/);
});
