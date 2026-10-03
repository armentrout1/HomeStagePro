# R1.4B2: local detection and segmentation smoke evaluation

Status: implementation and first seven-source smoke evaluation complete; **quality gates not met or statistically established; evaluation only; not architecture-safe**. No R1.5/R1.6 work, furniture rendering, customer use, merge, or deployment.

## Outcome

The qualified local models execute through the TypeScript component boundary. DINO completed all seven cases. Six SAM components explicitly abstained with `COMPONENT_RESOURCE_LIMIT` because retained hypotheses exceeded the frozen 32-prompt ceiling. One case produced 32 full-size validated binary masks. This is a negative quality/readiness result, not a memory failure and not permission to discard low-score openings or increase limits after seeing results.

Nine annotated door/window/opening instances failed the declared same-class box IoU >= 0.5 match. Minimal agent annotation, pane-versus-assembly grouping, occlusion, and coarse boxes complicate interpretation; these misses remain prominently reported rather than erased. No representative accuracy, independently reviewed absence, safe region, editing permission, or production qualification is claimed.

## Implementation and pins

`components/real.ts` exposes only two host-owned evaluation factories: `grounding-dino-tiny-hf-v1` and `sam21-small-hf-v1`. The registry also retains `synthetic-test-worker`; real factories are bound by object identity and exact frozen registration. There is no request/environment-selected Python command, module, path, or prompt. `production.ts` and `StagingProvider` are unchanged.

The real adapter reads the verified R1.2 canonical PNG through the runner context. R1B1 binary framing carries bounded JSON metadata plus image/mask bytes. Strict native schemas, source/dimension hashes, finite scores, exact key exclusions, mask IDs/offsets/hashes, artifact validation and existing runner trust checks apply before accepting observations. Failed masks stay explicit; no rectangle masquerades as segmentation. Source detection IDs remain related to mask IDs. Permanence, hinge, swing and physical dimensions remain unknown. Model scores are estimated and uncalibrated; neither model can grant trusted context or verified confidence.

`bindings/scene-runtime.json`, hard-pinned by `real-pins.ts`, binds new worker/protocol bytes to R1.4B1 descriptor/evidence/record digests, pinned native sources, requirements/wheel locks, runtime image, model revisions/weights/sidecars and the unchanged vocabulary. The record code revision is the **qualification baseline** `dab2a2d8f3a09088f5cd277aa2632ef118841fda`; the new worker's exact bytes are identified by its source SHA, not asserted to exist in that baseline commit. The host configuration also records the complete descriptor digest. See the companion JSON for exact hashes and per-case evidence.

Runtime image: `sha256:fa3d2775b699b548515cc11efb615102d46d642b463a2d513930b6e84fc99c29`.

Prompt: `roomstager-r1-detection-v1`; SHA-256 `b6d5c6eac170017a9dc88396924d1bee670d99b1bed3541599469d52f525afcc`. The seven frozen R1.4A groups are unchanged. Box/text thresholds are both 0.20; same-class/subtype alias consolidation uses IoU >= 0.80, score then group/coordinate/text ordering. Contributions retain native labels, scores and boxes. Conflicting classes are retained and linked; unrecognized/concatenated labels remain unknown. This conservative v1 mapping does **not** resolve tokenizer-spaced `built - in ...` or multi-phrase output into a confident class. That is a measured follow-up blocker, not an excuse to label uncertain structure as verified.

SAM uses the exact qualified static config and 160 explicit video-only exclusions, safetensors, strict core state dict and the native image processor. One image embedding is reused for sequential box prompts. This version preserves the B1 single-mask path (`multimask_output=false`); no alternative masks are generated and silently discarded. That choice is recorded in the configuration and does not establish optimal boundary selection.

Every prompted class has partial model-only coverage; experimental floor/wall/ceiling remain partial. Mask failures are recorded per class. Zero detections never mean absence. Unsupported or unexecuted future geometry tasks are not manufactured. There are no depth, edge, camera, floor-plane, homography or placement outputs.

## Limits and isolation

- Admission: >=12 GiB host available, >=10 GiB GPU free before each model, sequential model containers; any failed admission stops the harness, including one caught inside a component.
- Container: network none, non-root, read-only root/models/bindings, no Docker socket, dropped capabilities, no-new-privileges, 8 GiB memory/swap ceiling, 2 CPUs, 64 PIDs, 64 MiB tmpfs. Only fixed worker modules are mounted. No provider credentials or production data mounted.
- Native detections <=128/group, <=896 total before consolidation, <=128 retained. SAM <=32 prompts/masks per image, one prompt per call (within frozen batch maximum four). Overflow abstains; no truncation.
- Metadata <=1 MiB, canonical image <=32 MiB and <=2048 per dimension, output masks <=16 MiB, stderr <=64 KiB, model worker <=120 seconds; case signal <=300 seconds.
- Each model exits and its container is removed before the next model. Post-run model/sidecar hashes matched; no remaining evaluation containers. No downloads, model rebuild, paid calls, or customer images.

The adapter originally omitted Windows `ProgramFiles`; NVIDIA NVML returned an initialization error before inference. Adding that one ordinary OS variable to the host allow-list resolved it. Container environment remains separately restricted. An earlier attempt stopped at 7.7 GiB host available. The completed run began at 16,030,793,728 available host bytes and 14,501 MiB free GPU memory.

## Seven-source results

Sources, room identities, local-evaluation authorization and pre-prediction agent annotations are in `benchmarks/staging/scene-smoke-annotations.json`. App example ownership was not independently audited; local use was explicitly authorized. The three CC0 sources additionally match the existing provenance prepared hashes. These seven rooms are development smoke coverage, with no held-out data or post-result threshold tuning.

| Case | Detections | SAM masks | Annotated object boxes matched | Critical unmatched annotations | DINO / SAM / sequence wall seconds |
| --- | ---: | ---: | --- | --- | --- |
| bedroom-panelled-carpet | 49 | 0: cap abstention | 4/5 | None under this box criterion | 17.73 / 0.22 / 18.07 |
| living-fireplace-wood | 53 | 0: cap abstention | 4/9 | 3 windows; 1 opening (IoU 0.493) | 13.37 / 0.25 / 13.75 |
| bedroom-small-window | 45 | 0: cap abstention | 3/5 | 1 window (IoU 0.317) | 12.81 / 0.19 / 13.11 |
| living-low-resolution | 48 | 0: cap abstention | 2/4 | 1 window; 1 uncertain opening | 13.15 / 0.19 / 13.44 |
| public-small-empty-room | 37 | 0: cap abstention | 0/2 | Balcony door (IoU 0.172) | 12.89 / 0.23 / 13.23 |
| public-blue-furnished | 32 | 32 | 1/4 | Cropped window | 12.97 / 16.59 / 29.67 |
| public-cayley-furnished | 89 | 0: cap abstention | 7/12 | None under this box criterion | 13.72 / 0.23 / 14.06 |

The object-box criterion excludes surfaces and matches canonical class, **not furniture subtype**. A sofa box labeled bed can therefore count as a furniture-class match; it is still a semantic mistake. Unmatched predictions are review candidates, not automatically counted as false positives: annotations are deliberately minimal and grouping can differ. The 249x148 case is a low-resolution/abstention stress case, never fine-boundary evidence. Full per-class counts and matched/unmatched annotation IDs are in the companion JSON.

### Object/architecture review

- Window boxes were useful in some empty-room views, but panes versus whole-window grouping inflated strict box misses. The balcony-door and cropped studio-window failures are especially important blockers for future architecture protection.
- Fireplaces were detected in the two relevant living-room images. Duplicates and other errors remain; a fireplace hypothesis also appears in the studio, where it is a false positive.
- No retained observation mapped to canonical built-in. Visible kitchen cabinetry therefore was not reliably established as built-in; spaced/concatenated native labels frequently became unknown. Ordinary cabinet remains furniture and cannot become fixed merely from a name.
- No confidently visible staircase is annotated in these sources. Stairs predictions in empty rooms are false-positive warnings, not stairs qualification.
- Major furniture boxes occur in the furnished dining/studio views, but empty rooms also receive cabinet/sectional/furniture hypotheses. The studio sofa is described as both bed and sofa; cropped chair and plant annotations are not successfully matched. Kitchen/dining hypotheses are numerous and exceed the prompt budget.
- Many outlet and lighting predictions are concatenated phrases and remain unknown. This is not evidence that the fixture is absent. The studio also has a sink hypothesis despite no visible sink.

### Surfaces and masks

The single completed SAM case shows visually useful visible-floor, wall and sofa boundaries, but also duplicate/conflicting masks. The textured ornate ceiling has holes/noisy boundaries; thin/cropped foreground details need review. Correct-looking outlines do not correct wrong DINO labels. All pixels remain unverified.

Only three simple empty-room floors received adequate coarse source polygons before predictions. All three abstained before SAM. Their mask IoU is **N/A**, not zero or a claimed SAM failure. The completed studio case has reviewed boxes only; no post-hoc polygon was drawn to manufacture an accuracy number. Normalized boundary error is N/A because coarse uncertain annotations are inadequate. **Actual false-safe-region rate is N/A because R2 does not exist.**

### Performance

DINO native load was about 4.49–5.19 s and seven-group inference about 2.61–3.40 s per image. Its measured worker RSS and GPU peaks are recorded per case; whole-component wall time (12.81–17.73 s) additionally includes cache verification/container startup/artifact work. SAM native load 2.396 s; image embedding plus 32 sequential prompts 1.094 s; whole SAM component 16.587 s. SAM worker peak RSS 1,630,797,824 bytes, GPU allocated 479,818,752 bytes, reserved 715,128,832 bytes. These are process/allocator observations, not total Windows/WSL peaks. Abstention times are not SAM inference timings. No claim of byte-reproducible CUDA inference.

## Private diagnostics and reproducibility

Local directory: `.model-cache/r14b1/scene-smoke/155e1378-f1f2-44dc-b73c-709dd807864f/`. Each case has an original, labeled boxes, SAM overlay, canonical-class display, uncovered/unverified display, HTML metrics/blockers and complete JSON. Full-resolution PNGs and HTML use no external scripts/assets. The directory inherits the private cache ACL and is ignored; no generated photographs or masks are committed.

The unknown panel means uncovered pixels, not proof that covered pixels are known/safe. Display overlap order is explicit. Review found a grayscale-to-RGB expansion bug in the diagnostic only; one-channel decoding and a pixel-position regression fixed it. Panels were regenerated from unchanged saved masks, not rerun models. Config-digest recording, sticky admission failure and extraction of the same mask converter for tests were host-only follow-ups; inference evidence identifies the run as captured rather than claiming a second run on final host bytes.

Run command: `node --import tsx scripts/scene-understanding-smoke.ts --execute-seven-authorized-sources`. It deliberately requires explicit operator intent, verifies all seven sources, checks memory between models, and writes a new private run. Do not rerun by weakening memory/quality thresholds or silently increasing prompts.

## Validation and decision

Focused boundary tests cover real registration, unknown identities, descriptor digest mismatch, mapping/deduplication, nonfinite values, caps, validated binary masks, source relationships, explicit failed masks, no authority/absence/geometry claims and diagnostic pixel alignment. Existing R1.1–R1.3 and staging regressions run without a production DB. The pinned offline runtime passed all 36 Python tests, including R1.4B1 regressions; the Windows-only run skipped three tensor tests, so that run is not the full-runtime claim. Application, benchmark and focused-test typechecks passed. Final TypeScript regression count is recorded with the publication verification below.

The pair is worth **limited further detection/mapping evaluation**: execution is practical and SAM boundaries can be useful. It is not worth promoting as the current architecture-understanding solution. Immediate blockers are phrase/alias mapping, false architectural hypotheses, six-of-seven cap abstentions and critical opening misses. Any revised mapping/prompt/selection policy must be versioned and evaluated as a new development run, preserving this negative baseline. Do not begin R1.5 or R1.6 as part of this change. Larger independent R1.7 annotations and frozen qualification gates are still required before any claim of readiness.

## Publication validation and exact change list

263 TypeScript tests passed (0 failed/skipped); 36 pinned-runtime Python tests passed (0 failed/skipped). All three typechecks and `git diff --check` passed. No production database used. This R1.4B2 commit adds an evaluation path and records negative smoke results; it does not assert quality qualification.

- `docs/staging/scene-understanding-r1.md`
- `server/staging/scene/components/registry.ts`
- `server/staging/scene/components/runner.ts`
- `server/staging/scene/components/types.ts`
- `tests/scene-component-fixtures.ts`
- `tsconfig.benchmark.json`
- `benchmarks/staging/scene-smoke-annotations.json`
- `benchmarks/staging/scene-smoke.ts`
- `docs/staging/r1-detection-segmentation-smoke.json`
- `docs/staging/r1-detection-segmentation-smoke.md`
- `scripts/scene-understanding-smoke.ts`
- `scripts/staging_runtime/bindings/scene-runtime.json`
- `scripts/staging_runtime/bindings/scene-vocabulary.json`
- `scripts/staging_runtime/scene_protocol.py`
- `scripts/staging_runtime/scene_worker.py`
- `scripts/staging_runtime/test_scene_protocol.py`
- `server/staging/scene/components/real-mapping.ts`
- `server/staging/scene/components/real-pins.ts`
- `server/staging/scene/components/real-runtime.ts`
- `server/staging/scene/components/real.ts`
- `tests/scene-real.test.ts`
- `tests/scene-smoke.test.ts`
