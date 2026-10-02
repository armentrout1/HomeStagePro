import test from "node:test";
import assert from "node:assert/strict";
import { ELEMENT_CLASSES, createSceneMapSchema, sceneMapSchema, sceneAnalysisResultSchema, createSceneAnalysisResultSchema, polygonSchema, mat3Schema, frameSchema, rasterRefSchema, maskRefSchema, floorEstimateSchema, confidenceSchema, trustedSceneContextSchema, idSchema, sha256Schema, type SceneMap, type Confidence, type ArtifactRef, type RasterRef, type MaskRef, type Polygon, type ComponentRun, type FloorEstimate, type TrustedSceneContext } from "../shared/staging/scene-map";
// In-memory synthetic metadata only; no image assets, fixture servers or network imports.
const hash = "a".repeat(64), otherHash = "b".repeat(64);
const identity: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const confidence = (): Confidence => ({
    state: "unknown", rawScore: null, scoreType: null, calibratedProbability: null, calibrationId: null, evidenceIds: [], reasons: ["not-estimated"]
});
const artifact = (id: string): ArtifactRef => ({
    id, key: id, sha256: hash, bytes: 64, mediaType: "application/json"
});
const raster = (id: string): RasterRef => ({
    ...artifact(id), frameId: "canonical", width: 8, height: 8, channels: 3, dtype: "uint8", encoding: "png", mediaType: "image/png"
});
const mask = (id: string): MaskRef => ({
    ...raster(id), channels: 1, dtype: "uint8", encoding: "png", semantics: "binary-membership"
});
const raw = (id: string): RasterRef => ({
    ...raster(id), channels: 1, dtype: "float32-le", encoding: "raw-row-major", mediaType: "application/octet-stream", bytes: 256
});
const polygon = (): Polygon => ({
    frameId: "canonical", space: "normalized-image", exterior: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: []
});
const run = (task: ComponentRun["task"]): ComponentRun => ({
    id: task, adapterId: "synthetic", adapterVersion: "1", task, codeRevision: "fixture", weights: [], runtimeManifest: artifact(`${task}-runtime`), configSha256: hash, configManifest: artifact(`${task}-config`), inputSha256: hash, inputFrameId: "canonical", seed: 0, deterministic: true, nondeterminism: [], startedAt: "2026-10-02T00:00:00Z", elapsedMs: 0, peakMemoryBytes: null, status: "completed", failureCode: null
});
function scene(): SceneMap {
    return {
        schemaVersion: "scene-map/1", sceneId: "scene", revision: 1, runId: "run", createdAt: "2026-10-02T00:00:00Z", engineCodeRevision: "fixture",
        source: {
            uploadedSha256: hash, canonical: raster("canonical-image"), selection: null, originalSelectionSha256: null, preprocessingVersion: "1", preprocessingConfigSha256: hash, preprocessingManifest: artifact("preprocess"), sourceRole: "original", architectureSourceSha256: hash, parentSceneId: null, clearingQaRecordId: null, reconstructionMask: null
        }, requestedRoomType: "Bedroom", frames: [{
                id: "canonical", width: 8, height: 8, toCanonical: [...identity], validPixels: [0, 0, 8, 8]
            }], elements: [], coverage: Object.fromEntries(ELEMENT_CLASSES.map(k => [k, {
                inspection: "unsupported", observedCount: 0, absence: "not-established", confidence: confidence()
            }])) as SceneMap["coverage"], depth: null, edges: null, floor: null, candidateRegions: [], componentRuns: [], status: "complete", blockers: [], warnings: [], downstreamAuthorization: "diagnostics-only"
    };
}
function populated(): SceneMap {
    const s = scene();
    s.componentRuns = [run("segmentation")];
    s.elements = [{
            id: "floor", class: "floor", subtype: null, shape: { kind: "polygon", polygon: polygon() }, visibility: "visible", permanence: "fixed", detectionConfidence: confidence(), geometryConfidence: confidence(), permanenceConfidence: confidence(), boundaryUncertaintyPixels: null, componentRunIds: ["segmentation"], relatedElementIds: [], opening: null
        }];
    s.coverage.floor = {
        inspection: "complete-visible-frame", observedCount: 1, absence: "not-established", confidence: confidence()
    };
    s.candidateRegions = [{
            id: "region", purpose: "placement-candidate", shape: { kind: "polygon", polygon: polygon() }, basisElementIds: ["floor"], componentRunIds: ["segmentation"], confidence: confidence(), proposedTreatment: "unresolved", derivationRuleVersion: "1", enforceable: false
        }];
    return s;
}
function relative(): SceneMap {
    const s = populated();
    s.componentRuns.push(run("depth"));
    s.depth = {
        values: raw("depth-values"), valid: mask("valid-depth"), representation: "relative-depth", largerMeans: "farther", unit: "relative", calibrationEvidenceId: null, uncertainty: null, confidence: confidence(), componentRunId: "depth"
    };
    return s;
}
function floor(): FloorEstimate { return {
    supportElementIds: ["floor"], cameraFrameId: "canonical-camera", normal: [0, 0, 1], offset: -1, unit: "relative", floorBasis: {
        originCamera: [0, 0, 1], xAxisCamera: [1, 0, 0], yAxisCamera: [0, 1, 0]
    }, floorToCanonicalPixels: [...identity], cameraIntrinsics: [...identity], calibrationEvidenceId: null, reprojectionErrorPixels: null, scaleRelativeErrorBound: null, confidence: confidence(), alternatives: 0
}; }
function evidence(id: string, target: string, purpose: TrustedSceneContext["evidence"][number]["grants"][number]["purpose"]): TrustedSceneContext["evidence"][number] { return {
    id, sceneId: "scene", revision: 1, canonicalSha256: hash, grants: [{ target, purpose }]
}; }
function metric() {
    const s = relative(), context: TrustedSceneContext = { evidence: [evidence("metric", "/depth", "metric-calibration"), evidence("error", "/depth/uncertainty", "uncertainty")], lineage: [] };
    s.depth = {
        ...s.depth!, representation: "metric-z", unit: "metre", calibrationEvidenceId: "metric", uncertainty: {
            values: raw("depth-error"), meaning: "estimated-absolute-error", unit: "metre", evidenceId: "error"
        }
    };
    return { s, context };
}
function cleared() {
    const s = scene();
    s.source = {
        ...s.source, sourceRole: "qa-cleared", architectureSourceSha256: otherHash, parentSceneId: "parent", clearingQaRecordId: "qa", reconstructionMask: mask("reconstruction")
    };
    const context: TrustedSceneContext = { evidence: [], lineage: [{
                sceneId: "scene", revision: 1, parentSceneId: "parent", clearingQaRecordId: "qa", architectureSourceSha256: otherHash, clearedCanonicalSha256: hash, reconstructionMaskSha256: hash
            }] };
    return { s, context };
}
test("smallest complete diagnostic scene round trips without manufactured certainty", () => {
    const s = scene(), parsed = sceneMapSchema.parse(s);
    assert.deepEqual(parsed, s);
    assert.equal(parsed.floor, null);
    assert.equal(parsed.coverage.door.confidence.calibratedProbability, null);
});
test("partial scene preserves blockers and artifact references", () => {
    const s = populated();
    s.status = "partial";
    s.blockers = [{
            code: "missing-depth", elementIds: ["floor"], artifactIds: ["canonical-image"]
        }];
    assert.deepEqual(sceneMapSchema.parse(s), s);
});
test("relative and inverse depth preserve unknown uncertainty", () => {
    const s = relative();
    assert.equal(sceneMapSchema.parse(s).depth?.uncertainty, null);
    s.depth!.representation = "relative-inverse-depth";
    s.depth!.largerMeans = "nearer";
    assert.equal(sceneMapSchema.safeParse(s).success, true);
});
test("metric depth requires scene-bound calibration and uncertainty evidence", () => { const { s, context } = metric(); assert.equal(createSceneMapSchema(context).safeParse(s).success, true); assert.equal(sceneMapSchema.safeParse(s).success, false); });
test("qa-cleared lineage is independently bound to original architecture and reconstruction", () => { const { s, context } = cleared(); assert.equal(createSceneMapSchema(context).safeParse(s).success, true); assert.equal(sceneMapSchema.safeParse(s).success, false); });
test("relative floor and coherent pinhole homography", () => { const s = relative(); s.floor = floor(); assert.equal(sceneMapSchema.safeParse(s).success, true); });
test("metric floor with scale uncertainty and evidence", () => {
    const { s, context } = metric();
    s.floor = {
        ...floor(), unit: "metre", calibrationEvidenceId: "floor-calibration", scaleRelativeErrorBound: 0.03
    };
    context.evidence.push(evidence("floor-calibration", "/floor", "metric-calibration"));
    assert.equal(createSceneMapSchema(context).safeParse(s).success, true);
});
test("verified confidence and calibrated probability require distinct trusted grants", () => {
    const s = scene(), cf = s.coverage.wall.confidence;
    cf.state = "verified";
    cf.evidenceIds = ["review"];
    cf.calibrationId = "prob";
    cf.calibratedProbability = 0.8;
    const context: TrustedSceneContext = { evidence: [evidence("review", "/coverage/wall/confidence", "adjudication"), evidence("prob", "/coverage/wall/confidence", "probability-calibration")], lineage: [] };
    assert.equal(createSceneMapSchema(context).safeParse(s).success, true);
    assert.equal(sceneMapSchema.safeParse(s).success, false);
});
test("raw scores retain native scale and do not create probabilities", () => { const cf = confidence(); cf.rawScore = 42; cf.scoreType = "native-logit"; assert.equal(confidenceSchema.parse(cf).calibratedProbability, null); });
test("independently reviewed absence needs a specific absence grant", () => {
    const s = scene(), e = s.coverage.door;
    e.inspection = "complete-visible-frame";
    e.absence = "independently-reviewed";
    e.confidence.evidenceIds = ["absence"];
    const grant = evidence("absence", "/coverage/door", "absence-review");
    grant.grants.push({ target: "/coverage/door/confidence", purpose: "observation" });
    assert.equal(createSceneMapSchema({ evidence: [grant], lineage: [] }).safeParse(s).success, true);
    assert.equal(sceneMapSchema.safeParse(s).success, false);
});
test("mask outlines, source restrictions and edge lines resolve frames", () => {
    const s = populated();
    s.source.selection = mask("selection");
    s.source.originalSelectionSha256 = hash;
    s.elements[0].shape = {
        kind: "mask", mask: mask("floor-mask"), outline: [polygon()]
    };
    s.componentRuns.push(run("edges"));
    s.edges = {
        strength: { ...raster("edges"), channels: 1 }, structuralLines: [{
                id: "line", frameId: "canonical", endpoints: [[0, 0], [1, 1]], elementIds: ["floor"], confidence: confidence()
            }], confidence: confidence(), componentRunId: "edges"
    };
    assert.equal(sceneMapSchema.safeParse(s).success, true);
});
test("published/failed/cancelled result envelopes are strict", () => {
    assert.equal(sceneAnalysisResultSchema.safeParse({
        status: "published", scene: scene(), manifest: artifact("manifest")
    }).success, true);
    for (const status of ["failed", "cancelled"])
        assert.equal(sceneAnalysisResultSchema.safeParse({
            status, code: "failure", runId: "run"
        }).success, true);
    assert.equal(sceneAnalysisResultSchema.safeParse({
        status: "failed", code: "failure", runId: "run", scene: scene()
    }).success, false);
    const { s, context } = metric();
    assert.equal(createSceneAnalysisResultSchema(context).safeParse({
        status: "published", scene: s, manifest: artifact("manifest")
    }).success, true);
});
// Invalid data is intentionally untyped at the external boundary.
const invalid: [
    string,
    (s: any) => void
][] = [
    ["uppercase SHA", s => s.source.uploadedSha256 = "A".repeat(64)],
    ["short SHA", s => s.source.uploadedSha256 = "a".repeat(63)],
    ["nonhex SHA", s => s.source.uploadedSha256 = "z".repeat(64)],
    ["duplicate element IDs", s => s.elements.push(structuredClone(s.elements[0]))],
    ["duplicate frame IDs", s => s.frames.push(structuredClone(s.frames[0]))],
    ["duplicate run IDs", s => s.componentRuns.push(structuredClone(s.componentRuns[0]))],
    ["duplicate region IDs", s => s.candidateRegions.push(structuredClone(s.candidateRegions[0]))],
    ["missing element reference", s => s.elements[0].relatedElementIds = ["missing"]],
    ["missing run reference", s => s.elements[0].componentRunIds = ["missing"]],
    ["missing shape frame", s => s.elements[0].shape.polygon.frameId = "missing"],
    ["missing input frame", s => s.componentRuns[0].inputFrameId = "missing"],
    ["missing artifact reference", s => { s.status = "partial"; s.blockers = [{
                code: "blocked", elementIds: [], artifactIds: ["missing"]
            }]; }],
    ["counter-clockwise exterior", s => s.elements[0].shape.polygon.exterior.reverse()],
    ["closing vertex repeated", s => s.elements[0].shape.polygon.exterior.push([0, 0])],
    ["self intersection", s => s.elements[0].shape.polygon.exterior = [[0, 0], [1, 1], [0, 1], [1, 0]]],
    ["normalized coordinate overflow", s => s.elements[0].shape.polygon.exterior[1][0] = 1.01],
    ["negative normalized coordinate", s => s.elements[0].shape.polygon.exterior[0][0] = -0.01],
    ["zero polygon area", s => s.elements[0].shape.polygon.exterior = [[0, 0], [0.5, 0.5], [1, 1]]],
    ["singular matrix", s => s.frames[0].toCanonical = [1, 0, 0, 0, 0, 0, 0, 0, 1]],
    ["ill-conditioned matrix", s => s.frames[0].toCanonical = [1e-12, 0, 0, 0, 1, 0, 0, 0, 1]],
    ["projective image frame", s => s.frames[0].toCanonical = [1, 0, 0, 0, 1, 0, 0.1, 0, 1]],
    ["frame bounds overflow", s => s.frames[0].validPixels = [1, 0, 8, 8]],
    ["zero width", s => s.frames[0].width = 0],
    ["fractional height", s => s.frames[0].height = 8.5],
    ["empty valid pixels", s => s.frames[0].validPixels[2] = 0],
    ["mismatched raster frame size", s => s.source.canonical.width = 7],
    ["depth mask mismatch", s => s.depth.valid.width = 7],
    ["depth mask wrong frame", s => s.depth.valid.frameId = "missing"],
    ["illegal PNG float", s => s.source.canonical.dtype = "float32-le"],
    ["illegal channel count", s => s.source.canonical.channels = 5],
    ["mask wrong channels", s => s.depth.valid.channels = 3],
    ["mask wrong semantics", s => s.depth.valid.semantics = "edit-alpha"],
    ["raw packed size mismatch", s => s.depth.values.bytes = 255],
    ["raw wrong media type", s => s.depth.values.mediaType = "image/png"],
    ["depth wrong channels", s => { s.depth.values.channels = 2; s.depth.values.bytes = 512; }],
    ["inverse depth wrong direction", s => s.depth.representation = "relative-inverse-depth"],
    ["relative depth metric units", s => s.depth.unit = "metre"],
    ["relative depth metric calibration", s => s.depth.calibrationEvidenceId = "fake"],
    ["metric without evidence", s => { s.depth.representation = "metric-z"; s.depth.unit = "metre"; }],
    ["depth wrong task", s => s.depth.componentRunId = "segmentation"],
    ["calibrated probability without evidence", s => s.coverage.floor.confidence.calibratedProbability = 0.9],
    ["self-asserted verified confidence", s => { s.coverage.floor.confidence.state = "verified"; s.coverage.floor.confidence.evidenceIds = ["invented"]; }],
    ["raw score without score type", s => s.coverage.floor.confidence.rawScore = 0.95],
    ["complete with blockers", s => s.blockers = [{
                code: "blocked", elementIds: [], artifactIds: []
            }]],
    ["partial without blockers", s => s.status = "partial"],
    ["enforceable candidate", s => s.candidateRegions[0].enforceable = true],
    ["rejected placement proposal", s => s.status = "rejected"],
    ["missing class coverage", s => delete s.coverage.window],
    ["coverage count mismatch", s => s.coverage.floor.observedCount = 0],
    ["unknown coverage class", s => s.coverage.fake = s.coverage.wall],
    ["unsupported schema version", s => s.schemaVersion = "scene-map/2"],
    ["production authority attempt", s => s.downstreamAuthorization = "render"],
    ["root unknown key", s => s.extra = true],
    ["nested unknown key", s => s.source.canonical.extra = true],
    ["model supplied trust context", s => s.trustedContext = { evidence: [] }],
    ["original has parent", s => s.source.parentSceneId = "parent"],
    ["original has QA record", s => s.source.clearingQaRecordId = "qa"],
    ["original has reconstruction", s => s.source.reconstructionMask = mask("reconstruction")],
    ["architecture hash mismatch", s => s.source.architectureSourceSha256 = otherHash],
    ["malformed cleared source", s => s.source.sourceRole = "qa-cleared"],
    ["selection missing source digest", s => s.source.selection = mask("selection")],
    ["negative boundary uncertainty", s => s.elements[0].boundaryUncertaintyPixels = -1],
    ["NaN uncertainty", s => s.elements[0].boundaryUncertaintyPixels = NaN],
    ["Infinity elapsed time", s => s.componentRuns[0].elapsedMs = Infinity],
    ["negative memory bytes", s => s.componentRuns[0].peakMemoryBytes = -1],
    ["noncanonical room type", s => s.requestedRoomType = "invented room"],
    ["path traversal artifact key", s => s.source.canonical.key = "../secret"],
    ["remote artifact URL", s => s.source.canonical.key = "https://example.org/image"],
    ["conflicting artifact IDs", s => s.componentRuns[0].runtimeManifest.id = "canonical-image"],
    ["different IDs share artifact key", s => s.componentRuns[0].runtimeManifest.key = "canonical-image"],
    ["config hash mismatch", s => s.componentRuns[0].configSha256 = otherHash],
    ["unexplained nondeterminism", s => s.componentRuns[0].deterministic = false],
    ["component failure without code", s => s.componentRuns[0].status = "failed"],
    ["unapproved weight license", s => s.componentRuns[0].weights = [{
                name: "fake", revision: "1", sha256: hash, licenseEvidenceId: "fake-license"
            }]],
];
for (const [name, mutate] of invalid)
    test(`reject ${name}`, () => { const s = relative(); mutate(s); assert.equal(sceneMapSchema.safeParse(s).success, false, name); });
const badFloors: [
    string,
    (f: FloorEstimate) => void
][] = [
    ["nonunit normal", f => f.normal = [0, 0, 2]], ["nonunit basis", f => f.floorBasis.xAxisCamera = [2, 0, 0]],
    ["nonorthogonal basis", f => f.floorBasis.yAxisCamera = [1, 0, 0]], ["basis out of plane", f => f.floorBasis.yAxisCamera = [0, 0, 1]],
    ["origin off plane", f => f.floorBasis.originCamera = [0, 0, 2]], ["negative alternatives", f => f.alternatives = -1],
    ["fractional alternatives", f => f.alternatives = 0.5], ["metric no calibration", f => f.unit = "metre"],
    ["relative with metric scale", f => f.scaleRelativeErrorBound = 0.1], ["unrelated homography", f => f.floorToCanonicalPixels![0] = 2],
    ["homography without intrinsics", f => f.cameraIntrinsics = null], ["negative focal length", f => f.cameraIntrinsics![0] = -1],
];
for (const [name, mutate] of badFloors)
    test(`reject floor ${name}`, () => { const f = floor(); mutate(f); assert.equal(floorEstimateSchema.safeParse(f).success, false, name); });
test("null floor uncertainty stays unknown and alternatives block complete", () => { const s = relative(); s.floor = floor(); assert.equal(sceneMapSchema.parse(s).floor?.reprojectionErrorPixels, null); s.floor.alternatives = 1; assert.equal(sceneMapSchema.safeParse(s).success, false); s.status = "partial"; s.blockers = [{
        code: "competing-planes", elementIds: [], artifactIds: []
    }]; assert.equal(sceneMapSchema.safeParse(s).success, true); });
test("relative floor cannot mix with metric depth", () => { const { s, context } = metric(); s.floor = floor(); assert.equal(createSceneMapSchema(context).safeParse(s).success, false); });
test("evidence cannot be reused across scene, source, purpose or claim", () => {
    for (const field of ["scene", "revision", "source", "purpose", "target"]) {
        const { s, context } = metric();
        const e = context.evidence[0];
        if (field === "scene")
            e.sceneId = "other";
        if (field === "revision")
            e.revision = 2;
        if (field === "source")
            e.canonicalSha256 = otherHash;
        if (field === "purpose")
            e.grants[0].purpose = "observation";
        if (field === "target")
            e.grants[0].target = "/floor";
        assert.equal(createSceneMapSchema(context).safeParse(s).success, false, field);
    }
});
test("trusted context is snapshotted, strict and rejects duplicate IDs", () => {
    const { s, context } = metric(), schema = createSceneMapSchema(context);
    context.evidence.length = 0;
    assert.equal(schema.safeParse(s).success, true);
    assert.equal(trustedSceneContextSchema.safeParse({ ...context, extra: true }).success, false);
    const e = evidence("id", "/depth", "metric-calibration");
    assert.equal(trustedSceneContextSchema.safeParse({ evidence: [e, e], lineage: [] }).success, false);
});
test("cleared lineage rejects substituted sources, masks, parents, QA or self-parent", () => {
    for (const field of ["canonicalSha256", "architectureSourceSha256", "reconstructionMask", "parentSceneId", "clearingQaRecordId", "self"]) {
        const { s, context } = cleared();
        if (field === "canonicalSha256")
            s.source.canonical.sha256 = otherHash;
        else if (field === "architectureSourceSha256")
            s.source.architectureSourceSha256 = hash;
        else if (field === "reconstructionMask")
            s.source.reconstructionMask!.sha256 = otherHash;
        else if (field === "self")
            s.source.parentSceneId = s.sceneId;
        else
            s.source[field as "parentSceneId" | "clearingQaRecordId"] = "other";
        assert.equal(createSceneMapSchema(context).safeParse(s).success, false, field);
    }
});
test("metric uncertainty cannot be absent, misaligned or differently unitized", () => {
    for (const change of ["none", "frame", "dimensions", "unit", "evidence"]) {
        const { s, context } = metric(), u = s.depth!.uncertainty!;
        if (change === "none")
            s.depth!.uncertainty = null;
        if (change === "frame")
            u.values.frameId = "missing";
        if (change === "dimensions") {
            u.values.width = 4;
            u.values.bytes = 128;
        }
        if (change === "unit")
            u.unit = "relative";
        if (change === "evidence")
            u.evidenceId = "missing";
        assert.equal(createSceneMapSchema(context).safeParse(s).success, false, change);
    }
});
test("simple exterior with interior counter-clockwise hole", () => { const p = polygon(); p.holes = [[[0.2, 0.2], [0.2, 0.8], [0.8, 0.8], [0.8, 0.2]]]; assert.equal(polygonSchema.safeParse(p).success, true); });
test("invalid hole topology: wrong winding, outside, crossing, touching, nesting", () => {
    const h: Polygon["exterior"] = [[0.2, 0.2], [0.2, 0.8], [0.8, 0.8], [0.8, 0.2]];
    const holes: Polygon["holes"][] = [[[...h].reverse()], [[[0, 0.2], [0, 0.8], [0.8, 0.8], [0.8, 0.2]]], [h, h], [h, [[0.3, 0.3], [0.3, 0.5], [0.5, 0.5], [0.5, 0.3]]]];
    for (const hs of holes)
        assert.equal(polygonSchema.safeParse({ ...polygon(), holes: hs }).success, false);
    const concave: Polygon = {
        ...polygon(), exterior: [[0, 0], [1, 0], [1, 0.3], [0.3, 0.3], [0.3, 1], [0, 1]], holes: [[[0.2, 0.2], [0.2, 0.8], [0.8, 0.8], [0.8, 0.2]]]
    };
    assert.equal(polygonSchema.safeParse(concave).success, false);
});
test("deterministic polygons retain winding under translation/positive scale", () => {
    for (let i = 1; i <= 30; i++) {
        const d = i / 100;
        const p = polygon();
        p.exterior = p.exterior.map(([x, y]) => [d + x * 0.3, d + y * 0.3]);
        assert.equal(polygonSchema.safeParse(p).success, true);
        p.exterior.reverse();
        assert.equal(polygonSchema.safeParse(p).success, false);
    }
});
test("matrix scale invariance, exact tuple size and finite safety", () => {
    for (const scale of [1e-100, 1e-4, 1, 1e4, 1e100])
        assert.equal(mat3Schema.safeParse(identity.map(v => v * scale)).success, true);
    for (const m of [identity.slice(1), [...identity, 0], identity.map(() => 0), [NaN, ...identity.slice(1)], [Infinity, ...identity.slice(1)]])
        assert.equal(mat3Schema.safeParse(m).success, false);
});
test("defensive ceilings reject, never truncate", () => {
    const s = populated();
    s.elements = Array.from({ length: 513 }, (_, i) => ({ ...s.elements[0], id: `e-${i}` }));
    s.coverage.floor.observedCount = 513;
    assert.equal(sceneMapSchema.safeParse(s).success, false);
    const p = polygon();
    p.exterior = Array.from({ length: 257 }, (_, i) => { const t = i * 2 * Math.PI / 257; return [0.5 + 0.4 * Math.cos(t), 0.5 + 0.4 * Math.sin(t)]; });
    assert.equal(polygonSchema.safeParse(p).success, false);
    p.exterior = polygon().exterior;
    p.holes = Array.from({ length: 65 }, () => [[0.2, 0.2], [0.2, 0.3], [0.3, 0.2]]);
    assert.equal(polygonSchema.safeParse(p).success, false);
    assert.equal(rasterRefSchema.safeParse({
        ...raster("large"), width: 4001, height: 4000
    }).success, false);
    assert.equal(frameSchema.safeParse({
        ...scene().frames[0], width: 4001, height: 4000
    }).success, false);
    assert.equal(rasterRefSchema.safeParse({
        ...raster("boundary"), width: 4000, height: 4000
    }).success, true);
    const many = scene();
    many.componentRuns = Array.from({ length: 512 }, (_, i) => ({ ...run("segmentation"), id: `run-${i}` }));
    many.elements = Array.from({ length: 512 }, (_, i) => ({
        ...populated().elements[0], id: `floor-${i}`, componentRunIds: [], shape: {
            kind: "mask", mask: mask(`mask-${i}`), outline: null
        }
    }));
    many.coverage.floor.observedCount = 512;
    many.candidateRegions = Array.from({ length: 512 }, (_, i) => ({
        ...populated().candidateRegions[0], id: `candidate-${i}`, basisElementIds: [], componentRunIds: [], shape: {
            kind: "mask", mask: mask(`candidate-mask-${i}`), outline: null
        }
    }));
    const result = sceneMapSchema.safeParse(many);
    assert.equal(result.success, false);
    if (!result.success)
        assert.ok(result.error.issues.some(i => i.message === "Too many artifact references"));
    many.candidateRegions.splice(-2); // 2 source + 1024 run + 512 element + 510 region refs.
    assert.equal(sceneMapSchema.safeParse(many).success, true, "Exactly 2048 references are permitted");
    assert.equal(sceneAnalysisResultSchema.safeParse({status:"published",scene:many,manifest:artifact("manifest")}).success,false,"Envelope includes its manifest in the ceiling");
    many.candidateRegions.pop();
    assert.equal(sceneAnalysisResultSchema.safeParse({status:"published",scene:many,manifest:artifact("manifest")}).success,true);
});
test("opaque IDs, exact SHA and mask formats reject malformed values", () => {
    for (const id of ["", "../id", "has space", "https://host/id"])
        assert.equal(idSchema.safeParse(id).success, false);
    for (const h of [hash + "\n", hash + "0", "0".repeat(63)])
        assert.equal(sha256Schema.safeParse(h).success, false);
    for (const override of [{ dtype: "uint16" }, { encoding: "raw-row-major" }, { semantics: "alpha" }, { channels: 2 }])
        assert.equal(maskRefSchema.safeParse({ ...mask("mask"), ...override }).success, false);
});

test("letterboxed intermediate frame maps valid pixels only, within canonical bounds", () => {
    const s = scene();
    s.frames.push({ id: "letterbox", width: 16, height: 24, toCanonical: [0.5,0,0,0,0.5,-2,0,0,1], validPixels: [0,4,16,16] });
    assert.equal(sceneMapSchema.safeParse(s).success, true);
    s.frames[1].toCanonical[2] = 1;
    assert.equal(sceneMapSchema.safeParse(s).success, false);
});

test("nested strict objects reject extra model-authored claims", () => {
    for (const target of ["confidence", "frame", "polygon", "run", "blocker"]) {
        const s: any = relative();
        s.status = "partial";
        s.blockers = [{code: "test", elementIds: [], artifactIds: []}];
        const object = target === "confidence" ? s.elements[0].geometryConfidence : target === "frame" ? s.frames[0] : target === "polygon" ? s.elements[0].shape.polygon : target === "run" ? s.componentRuns[0] : s.blockers[0];
        object.trusted = true;
        assert.equal(sceneMapSchema.safeParse(s).success, false, target);
    }
});

test("unresolved floor support, failed depth producer and incomplete coverage cannot be complete", () => {
    const s = relative();
    s.floor = floor();s.floor.supportElementIds = ["missing"];
    assert.equal(sceneMapSchema.safeParse(s).success, false);
    s.floor = null;s.componentRuns[1].status = "failed";s.componentRuns[1].failureCode = "fixture-failure";
    assert.equal(sceneMapSchema.safeParse(s).success, false);
    const clean = scene();clean.coverage.window.inspection = "partial";
    assert.equal(sceneMapSchema.safeParse(clean).success, false);
    clean.status = "partial";clean.blockers = [{code: "partial-window", elementIds: [], artifactIds: []}];
    assert.equal(sceneMapSchema.safeParse(clean).success, true);
});

test("adjacent backtracking and nonzero-area crossing polygons are rejected", () => {
    for(const exterior of [ [[0,0],[0.8,0],[0.4,0],[1,1],[0,1]], [[0,0],[1,0.8],[0,1],[0.8,0]] ]) {
        assert.equal(polygonSchema.safeParse({...polygon(),exterior}).success, false);
    }
});

test("valid bounded hole grid and ring at the vertex limit", () => {
    const p = polygon();
    for(let y=0;y<8;y++) for(let x=0;x<8;x++) {
        const u=0.02+x*0.12,v=0.02+y*0.12;
        p.holes.push([[u,v],[u,v+0.04],[u+0.04,v+0.04],[u+0.04,v]]);
    }
    assert.equal(polygonSchema.safeParse(p).success, true);
    p.holes=[];p.exterior=Array.from({length:256},(_,i)=>{const t=i*2*Math.PI/256;return [0.5+0.4*Math.cos(t),0.5+0.4*Math.sin(t)];});
    assert.equal(polygonSchema.safeParse(p).success, true);
});

test("trusted weight evidence validates metadata without loading any model", () => {
    const s=populated();s.componentRuns[0].weights=[{name:"synthetic",revision:"fixture",sha256:hash,licenseEvidenceId:"license"}];
    const context:TrustedSceneContext={evidence:[evidence("license","/componentRuns/0/weights/0","license")],lineage:[]};
    assert.equal(createSceneMapSchema(context).safeParse(s).success, true);
});

test("publication manifest cannot alias source artifacts or masquerade as an image", () => {
    const s=scene();
    assert.equal(sceneAnalysisResultSchema.safeParse({status:"published",scene:s,manifest:s.source.preprocessingManifest}).success,false);
    assert.equal(sceneAnalysisResultSchema.safeParse({status:"published",scene:s,manifest:{...artifact("manifest"),mediaType:"image/png"}}).success,false);
});
