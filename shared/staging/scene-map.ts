import { z } from "zod";
import { stagingRequestSchema } from "./contracts";
// Pure metadata validation only. No filesystem, network, model or production imports.
export const SCENE_LIMITS = Object.freeze({
    elements: 512, vertices: 256, holes: 64, artifacts: 2048, pixels: 16000000
});
const number = z.number().finite();
const nonnegative = number.nonnegative();
const integer = nonnegative.int().max(Number.MAX_SAFE_INTEGER);
const dimension = integer.positive().max(SCENE_LIMITS.pixels);
export const idSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const code = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/);
const text = z.string().min(1).max(256);
const ids = z.array(idSchema).max(2048).refine(a => new Set(a).size === a.length, "Duplicate references");
const codes = z.array(code).max(512);
const stamp = z.string().datetime();
export const xySchema = z.tuple([number, number]);
export const xyzSchema = z.tuple([number, number, number]);
const uv = z.tuple([number.min(0).max(1), number.min(0).max(1)]);
const fail = (ctx: z.RefinementCtx, message: string, path: (string | number)[] = []) => ctx.addIssue({
    code: z.ZodIssueCode.custom, message, path
});
// Scale before inversion to avoid overflow. Infinity-norm condition number <= 1e10.
function conditioned(m: readonly number[]): boolean {
    const scale = Math.max(...m.map(Math.abs));
    if (!scale || !Number.isFinite(scale))
        return false;
    const [a, b, c, d, e, f, g, h, i] = m.map(v => v / scale);
    const adj = [e * i - f * h, c * h - b * i, b * f - c * e, f * g - d * i, a * i - c * g, c * d - a * f, d * h - e * g, b * g - a * h, a * e - b * d];
    const det = a * adj[0] + b * adj[3] + c * adj[6];
    if (!det || !Number.isFinite(det))
        return false;
    const norm = (v: number[]) => Math.max(...[0, 3, 6].map(j => Math.abs(v[j]) + Math.abs(v[j + 1]) + Math.abs(v[j + 2])));
    const condition = norm([a, b, c, d, e, f, g, h, i]) * norm(adj.map(v => v / det));
    return Number.isFinite(condition) && condition <= 1e10;
}
export const mat3Schema = z.tuple([number, number, number, number, number, number, number, number, number]).refine(conditioned, "Singular or ill-conditioned matrix");
export const elementClassSchema = z.enum(["floor", "wall", "ceiling", "window", "door", "opening", "fireplace", "built-in", "fixed-light", "vent", "outlet", "fixed-appliance", "plumbing-fixture", "mirror", "stairs", "furniture", "foreground-object", "unknown"]);
export const ELEMENT_CLASSES = elementClassSchema.options;
export const confidenceSchema = z.object({
    state: z.enum(["estimated", "verified", "unknown"]), rawScore: number.nullable(), scoreType: code.nullable(),
    calibratedProbability: number.min(0).max(1).nullable(), calibrationId: idSchema.nullable(), evidenceIds: ids, reasons: codes,
}).strict().superRefine((v, c) => {
    if ((v.rawScore === null) !== (v.scoreType === null))
        fail(c, "Raw score and native score type must occur together");
    if ((v.calibratedProbability === null) !== (v.calibrationId === null))
        fail(c, "Probability requires calibration evidence, and vice versa");
    if (v.state === "verified" && !v.evidenceIds.length)
        fail(c, "Verified confidence requires trusted adjudication");
});
type Point = readonly [
    number,
    number
];
// Conservative floating-point predicates in normalized coordinates. Near-touching
// edges (1e-10) are rejected; this is not an exact-arithmetic geometry kernel.
const EPS = 1e-10;
const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const near = (a: Point, b: Point) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= EPS;
function on(a: Point, b: Point, p: Point) { return Math.abs(cross(a, b, p)) <= EPS && p[0] >= Math.min(a[0], b[0]) - EPS && p[0] <= Math.max(a[0], b[0]) + EPS && p[1] >= Math.min(a[1], b[1]) - EPS && p[1] <= Math.max(a[1], b[1]) + EPS; }
function intersects(a: Point, b: Point, c: Point, d: Point) {
    const x = cross(a, b, c), y = cross(a, b, d), u = cross(c, d, a), v = cross(c, d, b);
    return on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b) || ((x > EPS && y < -EPS || x < -EPS && y > EPS) && (u > EPS && v < -EPS || u < -EPS && v > EPS));
}
function area(r: Point[]) { return r.reduce((sum, a, i) => { const b = r[(i + 1) % r.length]; return sum + a[0] * b[1] - b[0] * a[1]; }, 0) / 2; }
function inside(p: Point, r: Point[]) {
    let result = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const a = r[i], b = r[j];
        if (on(a, b, p))
            return false;
        if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0])
            result = !result;
    }
    return result;
}
function ringsTouch(a: Point[], b: Point[]) { return a.some((p, i) => b.some((q, j) => intersects(p, a[(i + 1) % a.length], q, b[(j + 1) % b.length]))); }
const ring = z.array(uv).min(3).max(SCENE_LIMITS.vertices);
export const polygonSchema = z.object({
    frameId: idSchema, space: z.literal("normalized-image"), exterior: ring, holes: z.array(ring).max(SCENE_LIMITS.holes)
}).strict().superRefine((p, c) => {
    // Zod refinements may still run after an array-length issue. Do not do quadratic work on oversized input.
    if (p.holes.length > 64 || [p.exterior, ...p.holes].some(r => r.length > 256 || r.length < 3))
        return;
    const rings = [p.exterior, ...p.holes];
    for (let ri = 0; ri < rings.length; ri++) {
        const r = rings[ri];
        if (r.some((a, i) => r.some((b, j) => j > i && near(a, b))))
            fail(c, "Repeated/near-coincident polygon vertex");
        const signed = area(r);
        if (ri === 0 ? signed <= EPS : signed >= -EPS)
            fail(c, "Wrong winding or degenerate polygon area");
        for (let i = 0; i < r.length; i++) {
            const prev = r[(i + r.length - 1) % r.length], a = r[i], b = r[(i + 1) % r.length];
            if (Math.abs(cross(prev, a, b)) <= EPS && ((prev[0] - a[0]) * (b[0] - a[0]) + (prev[1] - a[1]) * (b[1] - a[1])) > EPS)
                fail(c, "Adjacent polygon edges overlap");
            for (let j = i + 1; j < r.length; j++)
                if (j !== i + 1 && !(i === 0 && j === r.length - 1) && intersects(a, b, r[j], r[(j + 1) % r.length]))
                    fail(c, "Self-intersecting polygon");
        }
    }
    for (let i = 0; i < p.holes.length; i++) {
        const h = p.holes[i];
        if (!inside(h[0], p.exterior) || ringsTouch(h, p.exterior))
            fail(c, "Hole must be strictly inside exterior");
        for (let j = 0; j < i; j++)
            if (ringsTouch(h, p.holes[j]) || inside(h[0], p.holes[j]) || inside(p.holes[j][0], h))
                fail(c, "Holes overlap, nest or touch");
    }
});
const artifactFields = {
    id: idSchema, key: z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)?$/), sha256: sha256Schema, bytes: integer.positive(), mediaType: z.string().max(128).regex(/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/)
};
export const artifactRefSchema = z.object(artifactFields).strict();
const rasterFields = {
    ...artifactFields, frameId: idSchema, width: dimension, height: dimension, channels: z.number().int().min(1).max(4), dtype: z.enum(["uint8", "uint16", "float32-le"]), encoding: z.enum(["png", "raw-row-major"])
};
type RasterMetadata = z.infer<z.ZodObject<typeof rasterFields>>;
function rasterRules(r: RasterMetadata, c: z.RefinementCtx) {
    if (r.width * r.height > SCENE_LIMITS.pixels)
        fail(c, "Raster exceeds pixel ceiling");
    if (r.encoding === "png" && (r.dtype === "float32-le" || r.mediaType !== "image/png"))
        fail(c, "PNG requires integer samples and image/png");
    if (r.encoding === "raw-row-major") {
        if (r.mediaType !== "application/octet-stream")
            fail(c, "Raw raster requires application/octet-stream");
        const bytes = r.width * r.height * r.channels * ({
            uint8: 1, uint16: 2, "float32-le": 4
        }[r.dtype]);
        if (r.bytes !== bytes)
            fail(c, "Raw raster byte count does not match packed dimensions");
    }
}
export const rasterRefSchema = z.object(rasterFields).strict().superRefine(rasterRules);
export const maskRefSchema = z.object({
    ...rasterFields, channels: z.literal(1), dtype: z.literal("uint8"), encoding: z.literal("png"), semantics: z.literal("binary-membership")
}).strict().superRefine(rasterRules);
export const shapeSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("polygon"), polygon: polygonSchema }).strict(),
    z.object({
        kind: z.literal("mask"), mask: maskRefSchema, outline: z.array(polygonSchema).max(512).nullable()
    }).strict(),
]).superRefine((s, c) => { if (s.kind === "mask" && s.outline?.some(p => p.frameId !== s.mask.frameId))
    fail(c, "Mask outlines must share mask frame"); });
export const frameSchema = z.object({
    id: idSchema, width: dimension, height: dimension, toCanonical: mat3Schema, validPixels: z.tuple([nonnegative, nonnegative, number.positive(), number.positive()])
}).strict().superRefine((f, c) => {
    if (f.width * f.height > SCENE_LIMITS.pixels)
        fail(c, "Frame exceeds pixel ceiling");
    const [x, y, w, h] = f.validPixels;
    if (x + w > f.width || y + h > f.height)
        fail(c, "Valid pixel rectangle exceeds frame bounds");
    if (f.toCanonical[6] !== 0 || f.toCanonical[7] !== 0 || f.toCanonical[8] !== 1)
        fail(c, "Image frame transform must be affine");
});
const aligned = (a: RasterMetadata, b: RasterMetadata) => a.frameId === b.frameId && a.width === b.width && a.height === b.height;
export const sourceIdentitySchema = z.object({
    uploadedSha256: sha256Schema, canonical: rasterRefSchema, selection: maskRefSchema.nullable(), originalSelectionSha256: sha256Schema.nullable(), preprocessingVersion: code, preprocessingConfigSha256: sha256Schema, preprocessingManifest: artifactRefSchema, sourceRole: z.enum(["original", "qa-cleared"]), architectureSourceSha256: sha256Schema, parentSceneId: idSchema.nullable(), clearingQaRecordId: idSchema.nullable(), reconstructionMask: maskRefSchema.nullable()
}).strict().superRefine((s, c) => {
    if (s.canonical.encoding !== "png" || s.canonical.dtype !== "uint8" || s.canonical.channels !== 3)
        fail(c, "Canonical image must be RGB uint8 PNG");
    if ((s.selection === null) !== (s.originalSelectionSha256 === null))
        fail(c, "Selection requires original selection digest");
    for (const m of [s.selection, s.reconstructionMask])
        if (m && !aligned(m, s.canonical))
            fail(c, "Source masks must align to canonical frame");
    if (s.sourceRole === "original") {
        if (s.parentSceneId !== null || s.clearingQaRecordId !== null || s.reconstructionMask !== null)
            fail(c, "Original cannot contain clearing lineage");
        if (s.architectureSourceSha256 !== s.canonical.sha256)
            fail(c, "Original architecture hash must match canonical image");
    }
    else if (!s.parentSceneId || !s.clearingQaRecordId || !s.reconstructionMask)
        fail(c, "Cleared source requires complete lineage");
});
export const sceneElementSchema = z.object({
    id: idSchema, class: elementClassSchema, subtype: code.nullable(), shape: shapeSchema, visibility: z.enum(["visible", "partly-occluded", "uncertain"]), permanence: z.enum(["fixed", "movable", "unknown"]), detectionConfidence: confidenceSchema, geometryConfidence: confidenceSchema, boundaryUncertaintyPixels: nonnegative.nullable(), permanenceConfidence: confidenceSchema, componentRunIds: ids, relatedElementIds: ids, opening: z.object({
        state: z.enum(["open", "closed", "unknown"]), hingeImageSide: z.enum(["left", "right", "unknown"]), swing: z.enum(["inward", "outward", "sliding", "unknown"]), confidence: confidenceSchema
    }).strict().nullable()
}).strict();
export const classCoverageSchema = z.object({
    inspection: z.enum(["complete-visible-frame", "partial", "unsupported", "failed"]), observedCount: integer.max(512), absence: z.enum(["not-established", "independently-reviewed"]), confidence: confidenceSchema
}).strict();
const depthRaster = rasterRefSchema.superRefine((r, c) => { if (r.channels !== 1 || r.dtype !== "float32-le" || r.encoding !== "raw-row-major")
    fail(c, "Depth/error raster must be one-channel raw float32-le"); });
export const depthEstimateSchema = z.object({
    values: depthRaster, valid: maskRefSchema, representation: z.enum(["relative-depth", "relative-inverse-depth", "metric-z"]), largerMeans: z.enum(["farther", "nearer"]), unit: z.enum(["relative", "metre"]), calibrationEvidenceId: idSchema.nullable(), uncertainty: z.object({
        values: depthRaster, meaning: z.literal("estimated-absolute-error"), unit: z.enum(["relative", "metre"]), evidenceId: idSchema
    }).strict().nullable(), confidence: confidenceSchema, componentRunId: idSchema
}).strict().superRefine((d, c) => {
    if (!aligned(d.values, d.valid))
        fail(c, "Depth validity mask must align");
    if (d.largerMeans !== (d.representation === "relative-inverse-depth" ? "nearer" : "farther"))
        fail(c, "Depth ordering conflicts with representation");
    if (d.representation === "metric-z") {
        if (d.unit !== "metre" || !d.calibrationEvidenceId || !d.uncertainty)
            fail(c, "Metric depth requires metre calibration and uncertainty");
    }
    else if (d.unit !== "relative" || d.calibrationEvidenceId !== null)
        fail(c, "Relative depth cannot carry metric units/calibration");
    if (d.uncertainty && (!aligned(d.values, d.uncertainty.values) || d.unit !== d.uncertainty.unit))
        fail(c, "Depth uncertainty must align and share units");
});
export const edgeEstimateSchema = z.object({
    strength: rasterRefSchema, structuralLines: z.array(z.object({
        id: idSchema, frameId: idSchema, endpoints: z.tuple([uv, uv]).refine(([a, b]) => !near(a, b), "Degenerate line"), elementIds: ids, confidence: confidenceSchema
    }).strict()).max(2048), confidence: confidenceSchema, componentRunId: idSchema
}).strict().superRefine((e, c) => { if (e.strength.channels !== 1 || e.strength.dtype !== "uint8" || e.strength.encoding !== "png")
    fail(c, "Edge strength must be one-channel uint8 PNG"); });
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const unit = (a: readonly number[]) => Math.abs(Math.hypot(...a) - 1) <= 1e-5;
export const floorEstimateSchema = z.object({
    supportElementIds: ids, cameraFrameId: z.literal("canonical-camera"), normal: xyzSchema, offset: number, unit: z.enum(["relative", "metre"]), floorBasis: z.object({
        originCamera: xyzSchema, xAxisCamera: xyzSchema, yAxisCamera: xyzSchema
    }).strict(), floorToCanonicalPixels: mat3Schema.nullable(), cameraIntrinsics: mat3Schema.nullable(), calibrationEvidenceId: idSchema.nullable(), reprojectionErrorPixels: nonnegative.nullable(), scaleRelativeErrorBound: nonnegative.nullable(), confidence: confidenceSchema, alternatives: integer
}).strict().superRefine((f, c) => {
    const { originCamera: o, xAxisCamera: x, yAxisCamera: y } = f.floorBasis, n = f.normal;
    if (!unit(n) || !unit(x) || !unit(y))
        fail(c, "Normal and basis axes must be unit length within 1e-5");
    if (Math.abs(dot(x, y)) > 1e-5 || Math.abs(dot(x, n)) > 1e-5 || Math.abs(dot(y, n)) > 1e-5)
        fail(c, "Floor basis must be orthogonal and tangent to plane");
    const residual = dot(n, o) + f.offset;
    if (!Number.isFinite(residual) || Math.abs(residual) > 1e-5 * Math.max(1, Math.abs(f.offset), Math.hypot(...o)))
        fail(c, "Floor origin is not on plane");
    if (f.unit === "metre" && (!f.calibrationEvidenceId || f.scaleRelativeErrorBound === null))
        fail(c, "Metric plane requires calibration and scale uncertainty");
    if (f.unit === "relative" && (f.calibrationEvidenceId !== null || f.scaleRelativeErrorBound !== null))
        fail(c, "Relative plane cannot claim calibrated metric scale");
    const k = f.cameraIntrinsics, h = f.floorToCanonicalPixels;
    if (k && (k[0] <= 0 || k[4] <= 0 || k[3] !== 0 || k[6] !== 0 || k[7] !== 0 || k[8] !== 1))
        fail(c, "Invalid pinhole intrinsics");
    if (h) {
        if (!k) {
            fail(c, "Homography requires intrinsics to validate plane projection");
            return;
        }
        const expected = [0, 1, 2].flatMap(row => [x, y, o].map(v => dot(k.slice(row * 3, row * 3 + 3), v)));
        const s = Math.max(...expected.map(Math.abs)), t = Math.max(...h.map(Math.abs));
        const idx = expected.findIndex(v => Math.abs(v) === s), sign = Math.sign(expected[idx] * h[idx]);
        if (!s || !Number.isFinite(s) || !sign || expected.some((v, i) => Math.abs(v / s - sign * h[i] / t) > 1e-5))
            fail(c, "Homography conflicts with floor basis and intrinsics");
    }
});
export const candidateRegionSchema = z.object({
    id: idSchema, purpose: z.enum(["protected", "no-placement", "placement-candidate", "unknown"]), shape: shapeSchema, basisElementIds: ids, componentRunIds: ids, confidence: confidenceSchema, proposedTreatment: z.enum(["no-edit-no-occlusion", "original-surface-occludable", "bounded-reconstruction", "unresolved"]), derivationRuleVersion: code, enforceable: z.literal(false)
}).strict();
export const componentRunSchema = z.object({
    id: idSchema, adapterId: code, adapterVersion: code, task: z.enum(["detection", "segmentation", "depth", "edges", "floor-fit"]), codeRevision: text, weights: z.array(z.object({
        name: code, revision: text, sha256: sha256Schema, licenseEvidenceId: idSchema
    }).strict()).max(64), runtimeManifest: artifactRefSchema, configSha256: sha256Schema, configManifest: artifactRefSchema, inputSha256: sha256Schema, inputFrameId: idSchema, seed: integer.nullable(), deterministic: z.boolean(), nondeterminism: codes, startedAt: stamp, elapsedMs: nonnegative, peakMemoryBytes: integer.nullable(), status: z.enum(["completed", "failed", "timed-out", "cancelled"]), failureCode: code.nullable()
}).strict().superRefine((r, c) => {
    if ((r.status === "completed") !== (r.failureCode === null))
        fail(c, "Component status/failure code mismatch");
    if (r.deterministic ? r.nondeterminism.length !== 0 : r.nondeterminism.length === 0)
        fail(c, "Nondeterminism must be explicit");
    if (r.configSha256 !== r.configManifest.sha256)
        fail(c, "Config manifest digest mismatch");
});
// Context is supplied by a trusted caller, NEVER taken from a model/SceneMap.
// Grants bind evidence to this scene/source and exact JSON-pointer claim paths.
const purpose = z.enum(["observation", "probability-calibration", "metric-calibration", "uncertainty", "adjudication", "absence-review", "license"]);
export const trustedSceneContextSchema = z.object({
    evidence: z.array(z.object({
        id: idSchema, sceneId: idSchema, revision: integer.positive(), canonicalSha256: sha256Schema, grants: z.array(z.object({ purpose, target: z.string().min(1).max(512).regex(/^\//) }).strict()).min(1).max(2048)
    }).strict()).max(2048),
    lineage: z.array(z.object({
        sceneId: idSchema, revision: integer.positive(), parentSceneId: idSchema, clearingQaRecordId: idSchema, architectureSourceSha256: sha256Schema, clearedCanonicalSha256: sha256Schema, reconstructionMaskSha256: sha256Schema
    }).strict()).max(512),
}).strict().superRefine((t, c) => {
    if (new Set(t.evidence.map(e => e.id)).size !== t.evidence.length)
        fail(c, "Duplicate trusted evidence IDs");
    if (new Set(t.lineage.map(e => e.sceneId)).size !== t.lineage.length)
        fail(c, "Duplicate lineage grants");
});
export type TrustedSceneContext = z.infer<typeof trustedSceneContextSchema>;
const sceneObject = z.object({
    schemaVersion: z.literal("scene-map/1"), sceneId: idSchema, revision: integer.positive(), runId: idSchema, createdAt: stamp, engineCodeRevision: text, source: sourceIdentitySchema, requestedRoomType: stagingRequestSchema.shape.roomType, frames: z.array(frameSchema).min(1).max(2048), elements: z.array(sceneElementSchema).max(512), coverage: z.object(Object.fromEntries(ELEMENT_CLASSES.map(k => [k, classCoverageSchema])) as Record<z.infer<typeof elementClassSchema>, typeof classCoverageSchema>).strict(), depth: depthEstimateSchema.nullable(), edges: edgeEstimateSchema.nullable(), floor: floorEstimateSchema.nullable(), candidateRegions: z.array(candidateRegionSchema).max(512), componentRuns: z.array(componentRunSchema).max(512), status: z.enum(["complete", "partial", "rejected"]), blockers: z.array(z.object({
        code, elementIds: ids, artifactIds: ids
    }).strict()).max(512), warnings: codes, downstreamAuthorization: z.literal("diagnostics-only")
}).strict();
export type SceneMap = z.infer<typeof sceneObject>;
/** Authoritative metadata validator: empty context fails closed on trusted claims. */
export function createSceneMapSchema(context: TrustedSceneContext = { evidence: [], lineage: [] }) {
    const trusted = trustedSceneContextSchema.parse(context); // snapshot, not mutable caller-owned grants
    return sceneObject.superRefine((s, c) => {
        const unique = (items: {
            id: string;
        }[], name: string) => { if (new Set(items.map(v => v.id)).size !== items.length)
            fail(c, `Duplicate ${name} IDs`); };
        unique(s.elements, "element");
        unique(s.frames, "frame");
        unique(s.componentRuns, "component run");
        unique(s.candidateRegions, "region");
        unique(s.edges?.structuralLines ?? [], "line");
        const frames = new Map(s.frames.map(f => [f.id, f])), elements = new Map(s.elements.map(e => [e.id, e])), runs = new Map(s.componentRuns.map(r => [r.id, r]));
        const evidence = new Map(trusted.evidence.map(e => [e.id, e]));
        const grant = (id: string | null, p: z.infer<typeof purpose>, target: string) => {
            const e = id ? evidence.get(id) : undefined;
            return !!e && e.sceneId === s.sceneId && e.revision === s.revision && e.canonicalSha256 === s.source.canonical.sha256 && e.grants.some(g => g.purpose === p && g.target === target);
        };
        const need = (id: string | null, p: z.infer<typeof purpose>, path: string) => { if (!grant(id, p, path))
            fail(c, `Missing trusted ${p} evidence at ${path}`); };
        const artifactIds = new Map<string, string>(), keys = new Map<string, string>();
        let artifactCount = 0;
        function visit(value: unknown, path: string) {
            if (!value || typeof value !== "object")
                return;
            if (Array.isArray(value)) {
                value.forEach((v, i) => visit(v, `${path}/${i}`));
                return;
            }
            const v = value as Record<string, unknown>;
            if ("key" in v && "sha256" in v) {
                artifactCount++;
                const serialized = JSON.stringify(v), id = v.id as string, key = v.key as string;
                if (artifactIds.has(id) && artifactIds.get(id) !== serialized)
                    fail(c, "Conflicting declarations for artifact ID");
                if (keys.has(key) && keys.get(key) !== id)
                    fail(c, "Artifact key aliases different IDs");
                artifactIds.set(id, serialized);
                keys.set(key, id);
            }
            if (typeof v.frameId === "string") {
                const f = frames.get(v.frameId);
                if (!f)
                    fail(c, `Unresolved frame at ${path}`);
                else if ("width" in v && (v.width !== f.width || v.height !== f.height))
                    fail(c, `Raster/frame dimensions mismatch at ${path}`);
            }
            if ("calibratedProbability" in v) {
                const cf = value as z.infer<typeof confidenceSchema>;
                for (const id of cf.evidenceIds) {
                    const e = evidence.get(id);
                    if (!e || e.sceneId !== s.sceneId || e.revision !== s.revision || e.canonicalSha256 !== s.source.canonical.sha256 || !e.grants.some(g => g.target === path))
                        fail(c, `Unresolved or unbound confidence evidence at ${path}`);
                }
                if (cf.calibratedProbability !== null)
                    need(cf.calibrationId, "probability-calibration", path);
                if (cf.state === "verified" && !cf.evidenceIds.some(id => grant(id, "adjudication", path)))
                    fail(c, `Verified confidence lacks trusted adjudication at ${path}`);
            }
            Object.entries(v).forEach(([k, child]) => visit(child, `${path}/${k}`));
        }
        visit(s, "");
        if (artifactCount > SCENE_LIMITS.artifacts)
            fail(c, "Too many artifact references");
        const refs = (values: string[], set: Map<string, unknown>, kind: string) => { for (const id of values)
            if (!set.has(id))
                fail(c, `Unresolved ${kind}: ${id}`); };
        s.elements.forEach(e => { refs(e.componentRunIds, runs, "component run"); refs(e.relatedElementIds, elements, "element"); });
        s.candidateRegions.forEach(r => { refs(r.basisElementIds, elements, "element"); refs(r.componentRunIds, runs, "component run"); });
        s.blockers.forEach(b => { refs(b.elementIds, elements, "element"); refs(b.artifactIds, artifactIds, "artifact"); });
        for (const cls of ELEMENT_CLASSES) {
            const entry = s.coverage[cls];
            if (entry.observedCount !== s.elements.filter(e => e.class === cls).length)
                fail(c, `Coverage count mismatch: ${cls}`);
            if (entry.absence === "independently-reviewed") {
                if (entry.observedCount !== 0 || entry.inspection !== "complete-visible-frame")
                    fail(c, "Absence requires complete inspection and zero observations");
                if (!entry.confidence.evidenceIds.some(id => grant(id, "absence-review", `/coverage/${cls}`)))
                    fail(c, "Absence requires trusted review");
            }
        }
        const canonical = frames.get(s.source.canonical.frameId);
        if (canonical && (canonical.toCanonical.some((v, i) => v !== [1, 0, 0, 0, 1, 0, 0, 0, 1][i]) || canonical.validPixels.some((v, i) => v !== [0, 0, canonical.width, canonical.height][i])))
            fail(c, "Canonical frame must be identity and full image");
        if (canonical)
            for (const f of s.frames) {
                const [x, y, w, h] = f.validPixels, m = f.toCanonical;
                for (const [u, v] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
                    const a = m[0] * u + m[1] * v + m[2], b = m[3] * u + m[4] * v + m[5];
                    if (!Number.isFinite(a) || !Number.isFinite(b) || a < -1e-5 || b < -1e-5 || a > canonical.width + 1e-5 || b > canonical.height + 1e-5)
                        fail(c, "Valid frame pixels map outside canonical image");
                }
            }
        s.componentRuns.forEach((r, i) => {
            if (!frames.has(r.inputFrameId))
                fail(c, "Unresolved component input frame");
            r.weights.forEach((w, j) => need(w.licenseEvidenceId, "license", `/componentRuns/${i}/weights/${j}`));
        });
        const component = (id: string, task: string) => { const r = runs.get(id); if (!r || r.task !== task || r.status !== "completed")
            fail(c, `Estimate requires completed ${task} component`); };
        if (s.depth) {
            component(s.depth.componentRunId, "depth");
            if (s.depth.unit === "metre")
                need(s.depth.calibrationEvidenceId, "metric-calibration", "/depth");
            if (s.depth.uncertainty)
                need(s.depth.uncertainty.evidenceId, "uncertainty", "/depth/uncertainty");
        }
        if (s.edges) {
            component(s.edges.componentRunId, "edges");
            s.edges.structuralLines.forEach(l => refs(l.elementIds, elements, "element"));
        }
        if (s.floor) {
            refs(s.floor.supportElementIds, elements, "floor support");
            if (s.floor.supportElementIds.some(id => elements.get(id)?.class !== "floor"))
                fail(c, "Floor supports must reference floor elements");
            if (s.floor.unit === "metre")
                need(s.floor.calibrationEvidenceId, "metric-calibration", "/floor");
            if (s.depth && s.depth.unit !== s.floor.unit)
                fail(c, "Depth and floor units cannot mix");
        }
        if (s.status === "complete" && (s.blockers.length || s.floor?.alternatives || s.componentRuns.some(r => r.status !== "completed") || Object.values(s.coverage).some(v => v.inspection === "partial" || v.inspection === "failed")))
            fail(c, "Complete scene contains blockers or unresolved work");
        if (s.status === "partial" && !s.blockers.length)
            fail(c, "Partial scene requires explicit blockers");
        if (s.status === "rejected" && s.candidateRegions.some(r => r.purpose === "placement-candidate"))
            fail(c, "Rejected scene cannot contain placement proposals");
        if (s.source.sourceRole === "qa-cleared") {
            const v = s.source, l = trusted.lineage.find(l => l.sceneId === s.sceneId);
            if (v.parentSceneId === s.sceneId || !l || l.revision !== s.revision || l.parentSceneId !== v.parentSceneId || l.clearingQaRecordId !== v.clearingQaRecordId || l.architectureSourceSha256 !== v.architectureSourceSha256 || l.clearedCanonicalSha256 !== v.canonical.sha256 || l.reconstructionMaskSha256 !== v.reconstructionMask?.sha256)
                fail(c, "Cleared lineage is not independently established");
        }
    });
}
export const sceneMapSchema = createSceneMapSchema();
export function createSceneAnalysisResultSchema(context: TrustedSceneContext = { evidence: [], lineage: [] }) {
    return z.union([
        z.object({
            status: z.literal("published"), scene: createSceneMapSchema(context), manifest: artifactRefSchema
        }).strict().superRefine((result, ctx) => {
            let count = 1; // Include the publication manifest in the envelope ceiling.
            function inspect(value: unknown) {
                if (!value || typeof value !== "object") return;
                if (Array.isArray(value)) { value.forEach(inspect); return; }
                const record = value as Record<string, unknown>;
                if ("key" in record && "sha256" in record) {
                    count++;
                    if (record.id === result.manifest.id || record.key === result.manifest.key)
                        fail(ctx, "Publication manifest cannot alias a scene artifact");
                }
                Object.values(record).forEach(inspect);
            }
            inspect(result.scene);
            if (count > SCENE_LIMITS.artifacts) fail(ctx, "Too many artifact references including publication manifest");
            if (result.manifest.mediaType !== "application/json") fail(ctx, "Publication manifest must be JSON");
        }),
        z.object({
            status: z.enum(["failed", "cancelled"]), code, runId: idSchema
        }).strict(),
    ]);
}
export const sceneAnalysisResultSchema = createSceneAnalysisResultSchema();
export type SceneAnalysisResult = z.infer<typeof sceneAnalysisResultSchema>;
export type Id = z.infer<typeof idSchema>;
export type Sha256 = z.infer<typeof sha256Schema>;
export type XY = z.infer<typeof xySchema>;
export type XYZ = z.infer<typeof xyzSchema>;
export type Mat3 = z.infer<typeof mat3Schema>;
export type ElementClass = z.infer<typeof elementClassSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type Polygon = z.infer<typeof polygonSchema>;
export type ArtifactRef = z.infer<typeof artifactRefSchema>;
export type RasterRef = z.infer<typeof rasterRefSchema>;
export type MaskRef = z.infer<typeof maskRefSchema>;
export type Shape = z.infer<typeof shapeSchema>;
export type Frame = z.infer<typeof frameSchema>;
export type SourceIdentity = z.infer<typeof sourceIdentitySchema>;
export type SceneElement = z.infer<typeof sceneElementSchema>;
export type ClassCoverage = z.infer<typeof classCoverageSchema>;
export type DepthEstimate = z.infer<typeof depthEstimateSchema>;
export type EdgeEstimate = z.infer<typeof edgeEstimateSchema>;
export type FloorEstimate = z.infer<typeof floorEstimateSchema>;
export type CandidateRegion = z.infer<typeof candidateRegionSchema>;
export type ComponentRun = z.infer<typeof componentRunSchema>;
