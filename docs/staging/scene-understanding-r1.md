# R1 — Scene Understanding: Technical Design

Status: **R1.1 contracts and R1.2 offline preprocessing implemented; R1.3 and later remain proposed**. Updated October 2, 2026. Parent: [canonical staging roadmap](./staging-roadmap.md). Behavior authority: [staging-profiles.md](./staging-profiles.md). Application contract: [engine-boundary.md](./engine-boundary.md).

## 1. Scope and boundary

R1 converts an authorized photograph into inspectable, immutable engine state. It identifies visible structure/objects, estimates relative geometry where supported, and records unknowns. It does not generate furnishings, remove objects, reconstruct hidden surfaces, select a production model, change customer behavior, or certify physical clearance. A schema-valid SceneMap is not a staging approval.

Start offline under an explicit development command. No imports from `server/staging/production.ts`, `openaiClient`, billing, access or production storage clients. Do not modify `StagingRequest`, `StagingService`, `StagingProvider.render` or customer routes to add R1. Eventually a first-party provider can implement the existing provider contract and internally orchestrate scene -> policy -> plan -> style -> render -> QA. Internal CV adapters are separate interfaces; the application boundary remains intact.

The current `LayoutConstraints` string arrays remain legacy hints. They cannot be parsed heuristically into trusted polygons or substituted for missing geometry. Existing matting/removal boxes can be evaluated as components but do not satisfy whole-room understanding.

## 2. State lifecycle and durability

A SceneMap is versioned **engine state**, not log text or prompt context. Initially persist it in an offline directory through an injected `SceneArtifactStore`. Future job-linked persistence must implement the same atomic publication rules behind a reviewed storage adapter/migration; no migration is part of this phase.

Proposed lifecycle: `pending -> preprocessing -> components-running -> assembling -> validated -> published`, or terminal `rejected/cancelled/failed`. Published means a self-consistent diagnostic bundle, not authorization to render. Partial results may be published for investigation with explicit blockers.

Write run-scoped artifacts, verify digests/metadata, then publish the immutable manifest last. A crash cannot expose a complete-looking manifest with missing masks. Reuse only a validated completed manifest matching source, selection, preprocessing, schema, model/runtime and rule versions. Changes create a new scene revision; never overwrite observations. Resume bounded local work only under an explicit budget. Storage failure must not rerun the legacy paid renderer.

```text
<private-run-root>/<run-id>/
  source-canonical.png
  scene-map.json
  components/<component-run-id>/result.json
  artifacts/<content-hash>.<extension>
  diagnostics/index.html
  diagnostics/contact-sheet.png
  diagnostics/{segmentation,depth,edges,protected,placement}.png
  diagnostics/metrics.json
  manifest.json
```

The manifest hashes `scene-map.json` and inventories its artifacts. No signed URLs, credentials or public bucket URLs in durable state. Future customer ownership is enforced by the store and job-to-scene association, not possession of an ID/hash. No cross-tenant deduplication or disclosure of matching uploads.

## 3. Coordinates and deterministic preprocessing

| Frame | Convention |
| --- | --- |
| Upload bytes | Immutable original hash/byte count; record EXIF/ICC parsing. Never overwrite the source. |
| Canonical image | Apply EXIF orientation once, explicit sRGB RGB, lossless PNG, no crop or generation. Integer W/H. Reject unsupported transparency rather than invent a background. |
| Image geometry | Upper-left origin, +x right, +y down. Continuous edge coordinates [0,W] x [0,H]; pixel (i,j) center (i+0.5,j+0.5). Half-open bounding rectangles. |
| Normalized polygons | u=x/W, v=y/H in [0,1]. Clockwise exterior in screen coordinates, counter-clockwise holes; no duplicated closing vertex. Simple nonzero-area rings with >=3 unique vertices. |
| Model input | Explicit invertible 3x3 row-major affine matrix multiplying column [x,y,1], dimensions, scale, padding and valid-image rectangle. No inferred center crop. |
| Raster | Own frame/dimensions/channels/dtype/encoding/semantics; masks sample pixel centers. Record the transform to canonical pixels. |
| Camera | +X right, +Y down, +Z forward; intrinsics in canonical pixels. Unknown focal length/distortion stays unknown. Camera position is not necessarily an entry. |
| Floor | Plane in camera coordinates and floor-to-image homography where supported. Floor X lateral, Y forward on plane; record axis orientation and uncertainty. Relative units unless independently calibrated. |
| Metric calibration | Separate verified measurement evidence and uncertainty. Guessed door widths or model depth do not establish metres or a 36-inch clearance. |

Retain framing/aspect ratio and canonical resolution within existing upload limits. Components resize/letterbox separately with stored transforms. Pin decoder/image library, color conversion, resize filter, rounding, padding color and model preprocessing. Use nearest-neighbor or conservative coverage rules for binary restrictions, never blur a prohibition into editable pixels. Depth interpolation must propagate validity rather than interpolate through missing/occluded samples.

EXIF orientation must also transform customer selections from their declared frame. Unknown selection alignment is rejection, not permission to rotate only the photo. Future adaptation preserves current edit-alpha semantics: alpha 0 editable, 255 protected; partial protection cannot be weakened. R1 membership masks use 255 inside and 0 outside, **not edit alpha**. Test all eight EXIF orientations, odd dimensions, portrait/landscape, padding and transform round trips. Generation-output normalization is not R1 preprocessing.

## 4. Proposed TypeScript contract

The overview below is supplemented by the authoritative Zod metadata validator and inferred types in [`shared/staging/scene-map.ts`](../../shared/staging/scene-map.ts). TypeScript alone cannot validate geometry, ownership or artifact bytes. R1.1 does not decode or read artifacts, verify their actual hashes, or establish ownership. Those checks remain required before publication in later phases.

### R1.1 contract clarifications

- `sceneMapSchema` and `sceneAnalysisResultSchema` are the complete, fail-closed metadata validators with empty trust context. Individual exported schemas validate local structure; only the aggregate schema resolves references and trusted claims. No customer path imports them.
- The design's evidence IDs previously had no resolution mechanism. `createSceneMapSchema(context)` and `createSceneAnalysisResultSchema(context)` now accept a separately supplied, snapshotted `TrustedSceneContext`. Evidence records bind an ID to a scene ID, revision, canonical digest and explicit purpose/JSON-pointer target grants. Purposes distinguish observation, probability calibration, metric calibration, uncertainty, adjudication, absence review and licensing. Clearing lineage separately binds the parent, QA record, original architecture digest, cleared canonical digest and reconstruction-mask digest. Missing/mismatched evidence is rejection. These are caller trust inputs, not a license registry, adjudication service or proof that evidence is genuine. Never construct context from model output; a future trusted caller must review the exact scene revision/claim and preserve immutable revisions. A model cannot confer trust by placing a record inside SceneMap.
- `verified` confidence needs an adjudication grant at the confidence path; independent absence additionally needs an absence-review grant at the class coverage path. Every confidence evidence ID must resolve and be bound to that confidence path. Probability calibration is distinct from native score provenance; raw scores are not restricted to [0,1] and never become probabilities implicitly.
- IDs are bounded opaque ASCII tokens; artifact keys are opaque tokens with an optional extension, not paths or URLs. A future store resolves these tokens. All artifact occurrences count toward the 2,048-reference ceiling, including repeated declarations. Repeated IDs must declare identical metadata; different IDs cannot alias one key. Blocker artifact IDs resolve to inline declarations. External evidence and parent-scene IDs resolve through the trusted context.
- All declared raster/frame dimensions are positive integers with a conservative 16,000,000-pixel ceiling; this does not expand existing upload admission limits. PNG supports integer samples with 1–4 channels; raw row-major supports the declared sample types with exact packed byte counts. Float depth/error rasters are single-channel raw little-endian float32. Canonical imagery is RGB uint8 PNG. Binary membership masks are one-channel uint8 PNG; actual 0/255 sample checks, raw finite/error/nonnegative sample checks, and byte/hash verification belong to R1.2. Metadata validation alone never certifies them.
- Frames use affine transforms with bottom row `[0,0,1]`; canonical frame transform is identity with a full-image valid rectangle. Raster dimensions match their named frame, and valid frame corners must map inside canonical bounds (1e-5 pixel arithmetic tolerance). Restriction/reconstruction masks and optional outlines must align with their declared source/mask frames.
- Matrix validation uses scaled inversion and an infinity-norm condition limit of 1e10. Polygon checks use deterministic segment intersection, signed area and strict hole containment with a 1e-10 normalized-coordinate tolerance. They reject repeated/near-coincident vertices, overlapping adjacent edges, non-adjacent intersections, touching/crossing/nested holes and near-degenerate area. This is conservative floating-point screening, not an exact computational-geometry proof. It does not repair geometry or validate physical clearance.
- Floor unit-length, tangency and orthogonality tolerances are 1e-5. Plane membership uses relative 1e-5 residual tolerance. Normal sign is not an additional handedness claim. A supplied homography requires pinhole intrinsics and must agree, up to homogeneous scale and 1e-5 normalized coefficient tolerance, with `K * [xAxisCamera yAxisCamera originCamera]`; otherwise retain null instead. This checks internal consistency, not whether the estimated camera/plane is physically correct.
- Metric depth requires trusted metric calibration and an aligned uncertainty raster/evidence. Metric floor requires trusted calibration and a finite nonnegative scale error bound. Relative outputs cannot claim metric calibration/scale, and a scene cannot mix relative depth with a metric plane or vice versa. Null uncertainty remains null, never a default zero.
- Coverage counts must match observed element classes. Complete means no blockers, failed component runs, partial/failed coverage or competing floor alternatives; unsupported classes may remain explicit and unknown. Partial requires at least one blocker. Rejected maps cannot retain placement-candidate proposals. Every region remains `enforceable: false` and authorization remains `diagnostics-only`, including the smallest complete scene with no configured components. Completeness alone certifies no detection capability or layout.
- `requestedRoomType` reuses the existing request schema's UI enum; it does not invent another room normalization mapping. Component seeds are nonnegative safe integers; failed runs require failure codes and nondeterminism must be explicit. Component input digests are format-checked here; actual prepared-input content/ownership binding remains a later artifact/harness check.

Synthetic coverage lives in [`tests/scene-map-contract.test.ts`](../../tests/scene-map-contract.test.ts). The published-result envelope includes its JSON manifest in the artifact-reference ceiling and rejects manifest aliases of scene artifacts. No images, model dependencies, network execution, persistence or production integration are part of R1.1.

```ts
type Id = string;
type Sha256 = string; // runtime: lowercase 64-hex
type XY = readonly [number, number];
type XYZ = readonly [number, number, number];
type Mat3 = readonly [number, number, number, number, number, number, number, number, number];
type ElementClass =
  | "floor" | "wall" | "ceiling" | "window" | "door" | "opening"
  | "fireplace" | "built-in" | "fixed-light" | "vent" | "outlet"
  | "fixed-appliance" | "plumbing-fixture" | "mirror" | "stairs"
  | "furniture" | "foreground-object" | "unknown";
type Confidence = {
  state: "estimated" | "verified" | "unknown";
  rawScore: number | null; // native scale defined by scoreType
  scoreType: string | null;
  calibratedProbability: number | null; // [0,1], only with calibration evidence
  calibrationId: Id | null;
  evidenceIds: Id[];
  reasons: string[]; // bounded codes, not model-authored instructions
};
type Polygon = {
  frameId: Id;
  space: "normalized-image";
  exterior: XY[];
  holes: XY[][];
};
type ArtifactRef = {
  id: Id;
  key: string; // opaque private key, never arbitrary URL/path
  sha256: Sha256;
  bytes: number;
  mediaType: string;
};
type RasterRef = ArtifactRef & {
  frameId: Id;
  width: number;
  height: number;
  channels: number;
  dtype: "uint8" | "uint16" | "float32-le";
  encoding: "png" | "raw-row-major";
};
type MaskRef = RasterRef & {
  channels: 1;
  dtype: "uint8";
  encoding: "png";
  semantics: "binary-membership";
};
type Shape =
  | { kind: "polygon"; polygon: Polygon }
  | { kind: "mask"; mask: MaskRef; outline: Polygon[] | null };
type Frame = {
  id: Id;
  width: number;
  height: number;
  toCanonical: Mat3;
  validPixels: readonly [number, number, number, number]; // x,y,w,h
};
type SourceIdentity = {
  uploadedSha256: Sha256;
  canonical: RasterRef;
  selection: MaskRef | null; // restriction membership, not raw edit alpha
  originalSelectionSha256: Sha256 | null;
  preprocessingVersion: string;
  preprocessingConfigSha256: Sha256;
  preprocessingManifest: ArtifactRef; // actual settings/EXIF transform, not only a hash
  sourceRole: "original" | "qa-cleared";
  architectureSourceSha256: Sha256; // original canonical authority
  parentSceneId: Id | null;
  clearingQaRecordId: Id | null;
  reconstructionMask: MaskRef | null; // inferred pixels, never observed truth
};
type SceneElement = {
  id: Id;
  class: ElementClass;
  subtype: string | null;
  shape: Shape;
  visibility: "visible" | "partly-occluded" | "uncertain";
  permanence: "fixed" | "movable" | "unknown";
  detectionConfidence: Confidence;
  geometryConfidence: Confidence;
  boundaryUncertaintyPixels: number | null; // canonical pixels; null is unknown, not zero
  permanenceConfidence: Confidence;
  componentRunIds: Id[];
  relatedElementIds: Id[];
  opening: null | {
    state: "open" | "closed" | "unknown";
    hingeImageSide: "left" | "right" | "unknown";
    swing: "inward" | "outward" | "sliding" | "unknown";
    confidence: Confidence;
  };
};
type ClassCoverage = {
  inspection: "complete-visible-frame" | "partial" | "unsupported" | "failed";
  observedCount: number;
  absence: "not-established" | "independently-reviewed";
  confidence: Confidence;
};
type DepthEstimate = {
  values: RasterRef; // one-channel float32-le; finite values
  valid: MaskRef; // same frame/dimensions; invalid numeric cells stored as 0
  representation: "relative-depth" | "relative-inverse-depth" | "metric-z";
  largerMeans: "farther" | "nearer";
  unit: "relative" | "metre";
  calibrationEvidenceId: Id | null;
  uncertainty: null | { values: RasterRef; meaning: "estimated-absolute-error";
    unit: "relative" | "metre"; evidenceId: Id };
  confidence: Confidence;
  componentRunId: Id;
};
type EdgeEstimate = {
  strength: RasterRef; // one-channel uint8 PNG, 0..255 strength
  structuralLines: Array<{ id: Id; frameId: Id; endpoints: readonly [XY, XY];
    elementIds: Id[]; confidence: Confidence }>;
  // Line endpoints use normalized-image coordinates, not floor coordinates.
  confidence: Confidence;
  componentRunId: Id;
};
type FloorEstimate = {
  supportElementIds: Id[];
  cameraFrameId: "canonical-camera"; // 3D convention in section 3, not a 2D raster frame
  normal: XYZ; // unit plane normal
  offset: number; // normal dot cameraPoint + offset = 0
  unit: "relative" | "metre";
  floorBasis: { originCamera: XYZ; xAxisCamera: XYZ; yAxisCamera: XYZ };
  floorToCanonicalPixels: Mat3 | null;
  cameraIntrinsics: Mat3 | null;
  calibrationEvidenceId: Id | null;
  reprojectionErrorPixels: number | null;
  scaleRelativeErrorBound: number | null; // verified calibration evidence required
  confidence: Confidence;
  alternatives: number;
};
type CandidateRegion = {
  id: Id;
  purpose: "protected" | "no-placement" | "placement-candidate" | "unknown";
  shape: Shape;
  basisElementIds: Id[];
  componentRunIds: Id[];
  confidence: Confidence;
  proposedTreatment: "no-edit-no-occlusion" | "original-surface-occludable"
    | "bounded-reconstruction" | "unresolved";
  derivationRuleVersion: string;
  enforceable: false; // R2 creates a separate authoritative policy
};
type ComponentRun = {
  id: Id;
  adapterId: string;
  adapterVersion: string;
  task: "detection" | "segmentation" | "depth" | "edges" | "floor-fit";
  codeRevision: string;
  weights: Array<{ name: string; revision: string; sha256: Sha256;
    licenseEvidenceId: Id }>;
  runtimeManifest: ArtifactRef;
  configSha256: Sha256;
  configManifest: ArtifactRef; // exact bounded configuration needed for replay
  inputSha256: Sha256;
  inputFrameId: Id;
  seed: number | null;
  deterministic: boolean;
  nondeterminism: string[];
  startedAt: string;
  elapsedMs: number;
  peakMemoryBytes: number | null;
  status: "completed" | "failed" | "timed-out" | "cancelled";
  failureCode: string | null;
};
type SceneMap = {
  schemaVersion: "scene-map/1";
  sceneId: Id;
  revision: number;
  runId: Id;
  createdAt: string;
  engineCodeRevision: string;
  source: SourceIdentity;
  requestedRoomType: string; // validate using existing request/normalization mapping
  frames: Frame[];
  elements: SceneElement[];
  coverage: Record<ElementClass, ClassCoverage>;
  depth: DepthEstimate | null;
  edges: EdgeEstimate | null;
  floor: FloorEstimate | null;
  candidateRegions: CandidateRegion[];
  componentRuns: ComponentRun[];
  status: "complete" | "partial" | "rejected";
  blockers: Array<{ code: string; elementIds: Id[]; artifactIds: Id[] }>;
  warnings: string[];
  downstreamAuthorization: "diagnostics-only";
};
type SceneAnalysisResult =
  | { status: "published"; scene: SceneMap; manifest: ArtifactRef }
  | { status: "failed" | "cancelled"; code: string; runId: Id };
```

### Runtime schema and consistency rules

Strict objects/versions, no unknown keys, finite values, bounded collections and discriminated artifact encodings. Proposed defensive ceilings: <=512 elements, <=256 vertices/ring, <=64 holes, <=2048 artifact references and <=16 megapixels/intermediate raster. These do not bypass current upload caps. Oversized output fails, never truncates important geometry.

Require unique IDs and resolvable component/element/frame/artifact references. Validate actual payload hashes, byte sizes, channels/dtype and dimensions, not just JSON. Matrices must be invertible and well-conditioned; polygons cannot self-intersect or have invalid holes. Reject NaN/Infinity, invalid topology, arbitrary paths and mismatched frames instead of stretching results into alignment.

Every class appears in coverage, including unsupported classes. No detections does not establish absence. Unknown permanence does not authorize removal. Raw scores are incomparable across components until calibrated on a recorded dataset/version. Only trusted adjudication can set verified confidence/independent absence, never a model's own assertion.

Complete means configured tasks executed and artifacts validate, not that the entire room is known. Missing critical coverage, geometry ambiguity or conflicting detections require partial plus blockers. Complete requires no blockers and still authorizes diagnostics only. Rejected maps contain no usable placement proposals. R2 must explicitly validate eligibility rather than infer permission from status.

Metric depth/plane requires verified calibration evidence and uncertainty. Inverse depth means larger is nearer; relative-depth/metric-z mean farther. Relative plane units cannot mix with metre-valued footprints. Unknown intrinsics or competing floor hypotheses remain explicit; omit unsupported homographies. R1.1 must add schema refinements for these cross-field conditions.

Uncertainty fields are finite/nonnegative when available and carry their measurement/calibration provenance; null never means zero error. Depth uncertainty rasters must match the depth frame/validity and units. Probability is not a geometric distance: R2 must not invent a pixel or clearance margin directly from a raw confidence score. Uncalibrated positional error means conservative exclusion or abstention. Independent annotator uncertainty is retained alongside prediction uncertainty.

The source selection is a binary **restriction** mask: 255 means forbidden. Retain original selection digest; a future adapter conservatively maps any nonzero customer protection alpha to forbidden membership. R1 does not change today's runtime selection code.

For qa-cleared sources require parent scene, original architecture hash, clearing QA record and reconstruction mask. Inferred surfaces stay inferred after QA. Original sources have null clearing fields and the architecture hash identifies the original canonical image. Source substitution invalidates derived artifacts.

## 4a. R1.2 implemented foundation and limits

The offline implementation is `server/staging/scene/{preprocess,coordinates,artifacts,errors}.ts`. It imports the R1.1 schemas and existing Sharp; no R1.1 schema changes, models, customer routes or production wiring are involved. It produces a verified `SourceIdentity` and frames, not an empty or fabricated SceneMap. Full scene assembly/publication remains R1.6.

- **Admission/canonicalization:** explicit bytes and MIME are required. JPEG, PNG and WebP signatures/decoded formats must agree. Existing source limits remain 10 MiB, 2048 pixels per edge, aspect ratio <=3 and one frame; the decoder separately has a 16,000,000-pixel limit. Canonicalization preserves resolution/framing, applies EXIF 1–8 once, converts embedded ICC or decoder-default input color to sRGB through Sharp, removes only proven-opaque 8-bit alpha, writes RGB uint8 PNG and strips EXIF/ICC/XMP/IPTC. Nonopaque alpha and alpha at unsupported sample depth reject; no background is invented. Originals are copied for stable processing and never modified. Byte limits are checked before copying/decoding where possible.
- **Coordinates:** small affine helpers implement composition, inverse, points, enclosing rectangles, normalized/pixel conversion, EXIF permutations and model contain-fit/inverse. They reuse R1.1 conditioning/frame limits. Model content sizes use floor rounding, minimum one pixel, explicit padding and optional upscaling; per-axis scales record the integer rounding rather than pretending an exact aspect ratio survives rounding. No model raster or inference is produced. Canonical preprocessing itself never resizes.
- **Selections:** the caller must bind selection bytes to the uploaded source digest and declare encoded-pixel, canonical-pixel or an explicit validated frame alignment. Selection PNGs must have 8-bit alpha, matching dimensions and no nontrivial EXIF transform of their own. Every alpha >0 becomes 255 restriction. Axis-aligned scale/padding and EXIF permutations are supported; unknown alignment, shear, partial-frame/cropped coverage and protected padding reject. Each protected source-pixel footprint marks every intersected canonical pixel, retaining thin/one-pixel restrictions through reduction. Only <=1e-9-pixel arithmetic fringe at known full-frame bounds is admitted and intersected with the canvas; larger errors reject, and public coordinate helpers never clamp invalid points. Original selection digest and the exact selection frame are recorded. This helper does not change production edit-alpha handling.
- **Stable manifest:** `preprocess/1` records uploaded digest, decoded format/dimensions/color/sample/alpha/profile presence, EXIF orientation, canonical digest/dimensions, transforms, selection lineage, full config/config digest, Node/platform/architecture, Sharp/native-library versions and SIMD/concurrency settings. It contains no timestamps, timing metrics, filenames or EXIF location values. Its output declarations omit run-local IDs/keys, so the same bytes/config/runtime produce the same stable manifest across runs. Reproduction requires the original bytes matching the retained digest and matching runtime; cross-runtime byte identity is not promised. PNG compression settings are explicit.
- **Local storage:** the caller provides an already-existing, private, OS-access-controlled local root and opaque run ID. Content-addressed artifact IDs/keys include that run ID; callers cannot choose filesystem keys or read another run's reference. The store verifies persisted sidecar metadata and actual bytes on read, limits each artifact/decoded PNG buffer to 64 MiB, run artifact bytes to 128 MiB and references to 2048. No URL loading, remote storage, telemetry, credentials or cross-run deduplication is added.
- **Actual validation:** byte count and SHA-256, PNG signature/complete decoding, declared dimensions/channels/sample depth, and binary membership samples are verified. A publication's canonical image must be RGB uint8 sRGB without retained orientation/private metadata; restriction dimensions must match it. JSON must be valid UTF-8/JSON. Packed raw-row-major declarations are supported without creating depth estimates: float32-LE samples must be finite, with an explicit optional nonnegative check for a caller's absolute-error/other nonnegative role. Future role orchestration remains responsible for requesting that extra constraint.
- **Publication:** `publishPreprocessing` accepts a preprocessing manifest and its exact declared output artifacts; missing, duplicate, substituted or contradictory outputs reject. It revalidates all bytes, writes/flushes a temporary `preprocessing-bundle/1` envelope, then creates `manifest.json` with a no-replacement hard link. The terminal name becomes visible only with full file contents. Published runs cannot be written again. The returned receipt permits exact publication hash/size verification through `read(receipt)`; `readPublication()` without a receipt discovers and validates the bundle and referenced content. Discovery is not proof against an authorized local owner rewriting a consistent entire bundle.
- **Crash/filesystem scope:** a run-wide exclusive lock serializes writers. Interrupted artifacts, temporary files or a stale lock are not publication; a stale lock fails closed with `ARTIFACT_BUSY` and requires offline operator review/a new run, not automatic deletion or retry. Existing ancestors, run/artifact directories and read files are checked for symlinks/junctions/realpath escape; hard-linked read-file substitutions reject. Windows junction and hard-link cases are executable tests. This is a private single-owner offline store, not a hostile concurrent-filesystem sandbox: Node path checks are not directory-handle-relative race-proof authorization. Callers must prevent external writers. Atomic name visibility is tested; power-loss durability across OS/filesystem caches is not claimed. Temporary-file crash remnants can remain unpublished for later reviewed cleanup.
- **Errors/testing:** `SceneInputError.code` and message are bounded categories; native filesystem/decoder messages, causes, source bytes, filenames and EXIF values are not forwarded. Consumers should expose the code, not diagnostic stacks. Tests generate synthetic fixtures, use task-owned temporary directories and clean them up. The network-blocking test preload rejects fetch/socket/HTTP/TLS/datagram transport. Parent-directory metadata access is required for ancestry checks; a filesystem sandbox denying that access causes a closed failure rather than skipping the check.

R1.2 does not implement model adapters, a CLI analyzer, global scheduling, retention automation, customer artifact ownership or full SceneMap/diagnostic publication. The store API's preprocessing bundle is the only published artifact family here; no R1.3 work is activated.

## 5. Protection, occlusion and placement

Segmentation predicts visible surfaces; it grants no editing permission. R1 proposals have reasons/confidence. R2 derives a separately versioned policy referencing SceneMap and customer restriction hash.

| Future policy | Required semantics |
| --- | --- |
| Strict protected | No change, foreground or shadow alpha. Preserve original decoded pixels; reject overlaps rather than cut furniture. |
| Original surface, occludable | Original surface remains unchanged wherever visible; planned complete furniture may cover permitted areas. Shadows require separate allowance. |
| Shadow-permitted | Bounded support/contact region and photometric operation/magnitude, never permission to redraw texture or broadly relight. |
| Bounded reconstruction | R8 only, within verified removable-object masks; excludes observed protected structure and tags inferred pixels. |
| Unknown/disputed | No placement/reconstruction permission; may require whole-room abstention. |

Overlaps take the most restrictive rule; customer protection only narrows permissions. Door/window regions cannot become occludable because a bed covers them. Natural occlusion is not a defect by itself, and high image similarity is not proof that an outlet stayed put.

No-placement zones constrain floor footprints and clearance volumes, not just RGB silhouettes. Derive conservative opening/swing/access envelopes in a common frame. Unknown hinge/swing requires alternatives, a conservative envelope or abstention; do not invent certainty. Check complete furnishings, rug corners, chair pull-out and access. A 2D non-overlap test cannot certify physical inches.

Example: doorway opening-7 -> polygon + uncertain hinge -> referenced conservative proposal -> R2 exclusion with uncertainty margin -> R3 footprint veto -> R5 control -> R6 opening/clearance check. Prompt text is supplementary to this state, not its substitute.

## 6. Replaceable component interfaces

Proposed internal interfaces, not current application interfaces:

```ts
type AnalysisInput = {
  canonical: RasterRef;
  frame: Frame;
  selectionRestriction: MaskRef | null;
};
type DetectionOutput = {
  task: "detection";
  elements: SceneElement[];
  coverage: Partial<Record<ElementClass, ClassCoverage>>;
};
type SegmentationOutput = {
  task: "segmentation";
  elements: SceneElement[];
  coverage: Partial<Record<ElementClass, ClassCoverage>>;
};
type ComponentOutput = DetectionOutput | SegmentationOutput
  | { task: "depth"; depth: DepthEstimate }
  | { task: "edges"; edges: EdgeEstimate }
  | { task: "floor-fit"; floor: FloorEstimate | null };
type ComponentResult =
  | { status: "completed"; run: ComponentRun; output: ComponentOutput;
      frames: Frame[]; artifacts: ArtifactRef[] }
  | { status: "failed" | "timed-out" | "cancelled";
      run: ComponentRun; code: string };
interface SceneArtifactStore {
  read(ref: ArtifactRef): Promise<Uint8Array>;
  writeRunArtifact(runId: Id, bytes: Uint8Array, mediaType: string): Promise<ArtifactRef>;
  publishManifest(runId: Id, scene: SceneMap, artifacts: ArtifactRef[]): Promise<ArtifactRef>;
}
interface VisionComponent {
  readonly id: string;
  readonly version: string;
  readonly task: ComponentRun["task"];
  readonly supportedClasses: readonly ElementClass[];
  readonly execution: "local";
  analyze(input: AnalysisInput, context: {
    runId: Id;
    artifacts: SceneArtifactStore;
    dependencies: readonly ComponentResult[];
    signal: AbortSignal;
    deadlineMs: number;
    memoryLimitBytes: number;
    seed: number | null;
  }): Promise<ComponentResult>;
}
```

The orchestrator checks task, status, component identity, input hash, frame and approved license/artifact registry. Components cannot approve themselves, invent dependency results or fetch arbitrary URLs. A deterministic floor fitter consumes validated segmentation/depth/edges through explicit dependencies; reject missing/cyclic graph dependencies. Retain conflicting observations instead of letting the last component win.

Returned frames must map to the same canonical image and all returned artifacts must be owned by this run. For floor geometry, verify orthonormal basis axes, plane membership of its origin and consistency between basis, normal and any homography; do not accept a plane equation and unrelated projection. Unresolved alternative hypotheses are retained in component result artifacts and force partial status rather than silently choosing one.

Heavy native/CV runtimes run in isolated subprocesses. Cancellation/deadline terminates work and releases memory, not merely abandons a promise. Enforce compute/memory limits and no network egress during inference. Initial offline harness requires explicit caps; exact values follow measurement. Separate pinned artifact acquisition from execution. No automatic remote or prompt-only fallback.

## 7. Candidate classes and licensing

No new model/weights are selected. These are evaluation classes, not download authorizations or endorsements.

| Task | Candidate classes | Required evaluation |
| --- | --- | --- |
| Surfaces/objects | Indoor semantic/panoptic segmentation; class-conditioned/open-vocabulary detection with mask refinement | Floor/wall/ceiling IoU, opening recall, small fixture misses, cropped/occluded objects, permanence confusion and unsupported classes. |
| Shape refinement | Promptable instance segmentation and foreground matting | Boundary error, complete-object topology, rug/leg/transparent-object failures, architecture leakage and resolution sensitivity. Matting is not scene semantics. |
| Depth | Relative monocular depth; calibrated depth only with verified scale evidence | Ordering/discontinuities, mirrors/windows, reflective/dark surfaces, uncertainty and repeatability. Relative depth is not a measured floor plan. |
| Edges/perspective | Deterministic edges/lines; optionally learned edge prediction | Structural vs texture edges, roll/convergence, multiple planes, wallpaper/wood grain false edges and weak-support failures. |
| Floor | Robust plane fitting; vanishing-point/homography hypotheses from validated observations | Visible-floor consistency, reprojection error, uncertainty, non-flat floors and calibration assumptions. |
| Later R5 renderer | Controlled pretrained generation/inpainting, explicit licensed furniture assets/geometry rendering, or hybrid composition | Mask/depth/layout compliance, completeness, preservation, shadows, latency, cost, license and deployability. No rendering in R1. |

Compare components using identical fixed inputs/annotations and deterministic/no-model baselines where applicable. Report per-task errors, disagreements, abstentions and resources, not attractive overlays or only average scores. High aggregate accuracy cannot excuse a missed door marked safe.

Before new weights are downloaded/used, create a reviewed registry entry for the **exact artifact**: upstream repository/revision, code license, weight/model-card license, conversion/quantization lineage, SHA-256, source URL, dated license snapshot, commercial hosting/distribution permissions, obligations/restrictions, reviewer/date and decision (pending / approved-for-evaluation / approved-for-production / rejected). Record dependency and future furniture/texture licenses separately. Permissive code licensing does not prove permissive weights or training-data rights; evaluation permission does not imply commercial deployment permission.

Unclear, noncommercial or incompatible terms block adoption. Existing `licenses/BiRefNet-MIT.txt` and the pinned revision in `scripts/furniture-model.mjs` are baseline evidence, not blanket approval for other weights/tasks. This design does not re-verify or alter that production dependency. Record unresolved training-data/provenance concerns and review them before production. Do not assume permission because a model is popular or described as open source.

## 8. Failures and fallback behavior

| Condition | R1 outcome | Downstream implication |
| --- | --- | --- |
| Invalid input/selection or resource limit | Reject before CV with reason | Offline command cannot reserve credits or generate images. |
| EXIF/frame mismatch, malformed geometry or bad hash | Rejected/failed | Never guess alignment. |
| Missing critical class, uncertain floor/scale | Partial with blockers | Diagnostic evidence only, no furnishing permission. |
| Component disagreement | Preserve alternatives and disputed regions | Conservative exclusion/abstention; do not average away a doorway. |
| Timeout/OOM/cancellation | Recorded terminal component result | No silent fallback to legacy, cloud, prompts or another paid attempt. |
| Missing optional task | Explicit partial/warning under required-task policy | R2 must decide whether planning is possible; R1 grants no delivery. |
| Occupied room | Record fixed/movable/unknown objects | Route to R8 only in later integration; R1 removes nothing. |
| Artifact-store failure | Unpublished failed run | Bounded local persistence retry only, never paid regeneration. |
| No safe layout / unknown clearance | No placement certification | Later planner rejects or requests additional evidence; no invented dimensions. |

User corrections create new revisions with manual evidence and revalidation; they cannot silently erase hard restrictions. Image text/OCR, filenames, EXIF and model outputs are untrusted data, never orchestrator instructions.

## 9. Diagnostics and benchmark integration

Required primary view: **Original | segmentation | depth | edges | protected regions | candidate placement regions**. Same canonical frame in every panel, legends/frame labels, confidence/coverage, source hash, component versions, blockers and “diagnostics only; not a validated layout.” Original panel stays unaltered. Missing components get explicit missing panels, never blank panels implying absence.

Use a recorded depth display range/convention; keep raw numeric depth and validity separate from its colored preview. Show unknowns distinctly, structural lines separately from raw gradients, and provisional/disputed regions with hatching. Do not rely on color alone. Provide full-resolution images and machine-readable JSON. Escape labels; no external scripts, tracking, fonts or image URLs in private HTML reports.

Extend the existing benchmark:

- Reuse case IDs, `roomIdentity`, source hashes/provenance and split definitions. Add versioned task annotations, coverage, preprocessing hash and SceneMap references through a reviewed manifest revision.
- Annotate visible surface masks; openings/fireplaces/built-ins/fixtures; furniture; uncertain/occluded boundaries; observable thresholds/access regions. Hidden geometry is unknown unless measured, not model-generated ground truth.
- Evaluate per-class recall/precision, mask IoU, boundary error normalized by image diagonal, depth ordering, floor reprojection error, unsafe region overlap, calibration/abstention, latency and peak memory.
- Independent annotation/adjudication supplies truth; the prediction model cannot label its own success. Preserve annotator disagreement. Panorama projection metadata does not establish room dimensions.
- Group all same-property/room views across calibration/development/held-out splits. Report studio/panorama stress cases separately from representative listing photos. No foundation-model training dataset is proposed.
- Start with synthetic geometry and fake adapters, then approved local models on rights-cleared photos. No paid call or customer-image transfer is authorized by this design.
- Existing six visual checks remain R6/R9 image-result criteria, not acceptance tests for an R1 contact sheet. Crop differences aid inspection only. Add R1 task metrics as a separate versioned result section under the same cases.
- Freeze thresholds on development evidence before held-out evaluation. Record hardware, hashes, seeds and nondeterminism; claim byte reproducibility only where demonstrated and specify tolerances otherwise.

R1 exit: schema/artifact/coordinate/crash-publication tests pass; required tasks cannot silently disappear; independently annotated evaluation meets frozen critical-region thresholds from the roadmap; no unsafe unknown region is marked usable; license entries are complete; diagnostics expose uncertainty; resource limits are measured/enforced. Passing permits R2 development, not customer image delivery.

## 10. Privacy and reproducibility

All derivatives are private property imagery: masks/depth reveal layouts and possessions. Default to approved public fixtures. Customer benchmark reuse needs explicit purpose/permission. No source photos, derivatives, EXIF location, tokens or signed links to a new service without explicit approval. Local adapters disable remote model discovery, downloads and telemetry; verify egress, not only SDK settings.

Enforce job ownership on every future scene/artifact read; environment prefixes/opaque IDs alone are not authorization. Keep service credentials out of clients. Logs contain IDs, hashes, versions, timings, bounded failure codes and aggregates, never image bytes/base64, OCR, sensitive filenames or signed URLs. Canonical derivatives strip unnecessary metadata. Original uploads retain their existing protected lifecycle until a separately approved retention change.

Deletion/cancellation covers temporary files, manifests, diagnostics, caches and later stage outputs. Development artifacts need a stated test purpose; production TTL, quotas and cleanup are unresolved implementation decisions that must be fixed before integration. Public-source attribution remains attached to approved benchmark records. Never commit customer imagery, secrets or unreviewed weights.

Reproduction manifest includes source/selection hashes, canonicalizer/config, transforms, component code/weights/license evidence, locked dependencies/runtime, device/precision, seeds, deterministic flags, schema/rule versions and outputs. Hash stable computational content separately from timestamps/performance metrics. A seed alone does not establish determinism.

## 11. Reviewable implementation sequence

R1.1 and the R1.2 foundation paths are now implemented as described above. R1.3 and later paths remain **proposed**.

| Commit | Proposed files | Local checks |
| --- | --- | --- |
| R1.1 | `shared/staging/scene-map.ts`; `tests/scene-map-contract.test.ts`; `benchmarks/staging/annotations/` synthetic fixtures | Strict schema, references, unknowns, topology, finite values and invalid metric claims. No models/network. |
| R1.2 | `server/staging/scene/preprocess.ts`, `coordinates.ts`, `artifacts.ts`; focused tests | EXIF/selection alignment, polarity, odd dimensions, transforms, hashes, quotas and incomplete publication. |
| R1.3 | `server/staging/scene/components/{types,registry,runner}.ts`; `licenses/staging-components/` evidence | Fake adapters first; cancellation/OOM/timeout, task mismatch, blocked unapproved weights and disabled egress. |
| R1.4 | Selected local detection/segmentation adapters | Annotated surfaces/openings/objects, small fixture misses, permanence uncertainty and class coverage. |
| R1.5 | Selected depth/edge adapters; deterministic `floor-estimator.ts` and `region-proposals.ts` | Depth validity, mixed frames, hypotheses, mirrors, unknown scale/swing, no unsafe permissions. |
| R1.6 | `server/staging/scene/analyze.ts`; `scripts/benchmark-scene.ts`; `benchmarks/staging/scene-diagnostics.ts` | Immutable publication, scene lineage, six aligned panels, missing-task panels, escaped/private diagnostics. |
| R1.7 | Annotation/manifest extension; `docs/staging/r1-evaluation.md` | Split audit, calibration freeze, repeatability/resources, license evidence and explicit R2 advancement decision. |

Do not wire these commits into `production.ts`, remove legacy pipeline/model assets or add public SceneMap endpoints. Future integration review must cover stage persistence/migrations, retention, scheduling/budgets, customer compatibility and rollback.

## 12. Open decisions and handoff

Unresolved: exact artifacts/licenses; deployment hardware/memory; per-class annotation coverage; confidence thresholds; geometry uncertainty margins; scale-evidence UX; door-swing inference; renderer control fidelity; shadow allowances; derivative retention; numeric cost ceilings; independent review procedure. The design exposes these questions rather than assuming newer models solve them.

R1.1 and R1.2 now provide contracts and the offline preprocessing/artifact foundation. The next separate implementation slice would be R1.3 fake adapters and the component harness, subject to its own authorization. Adoption of local models follows evaluation/license review. No staging-provider subscription, API key or production change is needed for the initial contracts/harness. This implementation stops after R1.2 validation and publication to the existing draft branch; it does not merge, deploy or start R1.3.
