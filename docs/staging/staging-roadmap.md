# Staging Roadmap — First-Party Engine Evolution

## A) Purpose, authority and execution boundary

Updated October 1, 2026. This expands the existing roadmap in place; it is the canonical staging development roadmap, not a second product plan. [staging-profiles.md](./staging-profiles.md) remains the behavioral source of truth. Its October 1 conservative complete-layer override takes precedence over earlier furniture counts and historical release notes. Proposed capabilities below are not current behavior.

**Decision:** build a first-party Room Stager engine from replaceable computer-vision, geometry and rendering components. Do not train a foundation model from scratch. Prefer proven pretrained/open-source components only after verifying the exact code, weights, conversion and asset licenses for intended commercial use. No specialized virtual-staging API is a dependency or milestone. Earlier vendor-comparison suggestions and pending trial work are superseded by this decision.

**This phase is documentation/design only:** no CV implementation, model downloads, paid provider calls, production configuration changes, provider replacement, PR #3 merge or deployment. A later implementation phase must keep experiments unreachable from customer requests until qualification and an explicit promotion decision.

### Reconciled implementation status

Inspected checkout: `refactor/staging-engine-boundary`, tracking the same origin branch, baseline `64d110605244097e600e3b63162ec1f4f2606355`. [Draft PR #3](https://github.com/armentrout1/HomeStagePro/pull/3) is open. R0 service separation was introduced in `d5b86ea`; benchmark diagnostics were extended in `64d1106`. This is a branch/code inspection, not a fresh production deployment audit. The aggregate PR also contains earlier complete-layer, segmentation and packaging changes; do not describe its entire diff as documentation-only or a behavior-neutral release.

| Work | Status | Evidence and remaining gap |
| --- | --- | --- |
| Typed application/provider boundary (R0) | Already implemented on draft branch; not merged/qualified here | `shared/staging/contracts.ts`, `server/staging/{input,service,production}.ts`, `server/staging/providers/{types,legacy}.ts`; job callers use the typed service. |
| Commercial job lifecycle and delivery | Already implemented; preserve | Existing leases, input hashes, reservation/refund/idempotency paths, private source/result/thumbnail paths and access/history contracts. No redesign required for R1. |
| Scene understanding (R1) | Partially implemented as legacy hints; typed SceneMap planned | `LayoutConstraints` is three string arrays. Existing removal bounds and foreground matting are narrow tasks, not a room map, depth estimator or durable scene state. |
| Architecture protection (R2) | Partially implemented | Current customer masks, protected-pixel compositor and overlap rejection remain. Semantic protection policies, scene-derived restrictions and uncertainty handling are planned. |
| Spatial planning (R3) | Planned | Keyword profiles and prompt instructions exist; measured footprints, door envelopes and circulation solver do not. |
| Style system (R4) | Planned | Structured, versioned property-wide style packages and asset metadata are not implemented. |
| Controlled rendering (R5) | Partially implemented baseline; replacement planned | Current legacy provider uses one main furnishing, local extraction and contact shadows. It is not a qualified full-arrangement renderer. |
| Preservation/quality validation (R6) | Partially implemented | Current rejection/review path plus offline crop diagnostics exist. Diagnostics are not automatic proof of preserved architecture. |
| Bounded candidate selection (R7) | Partially implemented | Current completed-rejection retry is bounded; general stage budgets, candidate ranking and durable stage reconciliation are planned. |
| Removal/replacement (R8) | Partially implemented legacy path | Existing removal planner, bounded reconstruction, cleared-room review and replacement sequence remain. SceneMap-based clearing and reconstruction provenance are planned. |
| Production qualification (R9) | Blocked / unknown | Representative coverage, licensed R1 components, calibrated thresholds, compute cost and independent held-out acceptance remain unresolved. |

### Existing benchmark evidence

`benchmarks/staging/manifest.json` contains seven development source files: four app examples and three CC0 photographic stress sources. Two public sources are designated for removal, but the experimental full-scene provider rejects that unsupported mode before an API submission. One app image is too small for paid rendering. There are no held-out or repeated-case results establishing reliability. Related views must remain grouped by `roomIdentity`; file hashes alone do not establish independent rooms. Studio backplates and panorama projections are supplementary, not representative customer-photo coverage.

Four historical OpenAI full-scene smoke outputs received agent review: two uncertain, two rejected, zero accepted. Failures included changed fireplace/floor detail and relocated outlets/blocked door access. Estimated generation cost was $0.210997, excluding review, hosting and tax. These small experiments do not estimate general model performance. No additional calls are authorized for this documentation phase. Keep their evidence and diagnostic tooling as baselines; do not enable the experimental provider.

## B) Vision detection becomes durable engine state

The earlier plan converted structured detections primarily into prompt text and proposed a keyword-profile fallback when vision failed. That plan is superseded: **the Scene Map is immutable, versioned, typed engine state**, persisted with its source hash, coordinate frames, confidence, component provenance and derived artifact hashes. Prompts may summarize it but cannot overwrite it or authorize a conflicting placement.

```text
Original photograph
  -> scene understanding (SceneMap)
  -> architecture/protected-region policy
  -> spatial furniture planner
  -> structured style package
  -> controlled renderer
  -> preservation/quality validator
  -> bounded candidate selection / retry
  -> customer result
```

Furniture clearing remains a distinct path:

```text
Original occupied photograph
  -> object detection -> segmentation -> bounded removal
  -> surface reconstruction -> cleared-room QA
  -> remove: validated cleared result
  -> replace: new SceneMap linked to cleared source + original architecture
              -> normal furnishing pipeline
```

A doorway observation must become a referenced image polygon and, where supportable, a floor-plane exclusion envelope. The planner rejects intersecting footprints; the renderer receives the exclusion; post-render QA checks the opening and circulation. An unknown hinge or uncertain depth cannot become a confidently empty region. Failure to establish required geometry results in abstention, not a permissive prompt-only fallback or automatic switch to the single-item legacy provider.

R1 records candidate policies and placement regions for inspection. R2 owns authoritative policy derivation; R3 owns actual placement. Do not call an R1 visualization a validated layout.

### Invariants

1. Architecture preservation comes before furniture completeness or aesthetics; the source photograph is authoritative.
2. Geometry, masks and structural controls take precedence over prompts. Uncertain preservation fails closed.
3. A single photograph does not establish absolute dimensions or hidden surfaces. The 36-inch profile rule remains a requirement, not a measurement inferred from uncalibrated relative depth.
4. Natural furniture occlusion is distinct from modifying a visible surface. Permanently protected openings cannot be hidden to make a layout fit.
5. Never fade, clip or erase a furniture edge to satisfy a protection mask. Reject/replan the candidate instead.
6. Models and components remain replaceable. No foundation-model training; adoption follows license and benchmark review.
7. Preserve credit/refund, storage, access, history and customer compatibility. Engine stages cannot mint credits or independently refund jobs.
8. No customer photos go to a new service without explicit approval. Derived masks, depth and diagnostics receive the same privacy controls as the source.
9. Marketing examples and small smoke samples never establish release readiness. No existing production safeguard may be weakened to raise a pass rate.

## C) Phased engine roadmap

Dependencies: R0 -> R1 -> R2 -> R3; R4 can be designed alongside R3. R5 consumes their versioned contracts. R6 test design starts with R1 and gates R5/R7. R8 may be developed alongside furnishing after R1/R2, but replacement is not qualified until both clearing and furnishing pass. R9 gates any promotion. R1 alone performs no furnishing generation.

| Phase | Deliverable | Exit evidence / stop condition |
| --- | --- | --- |
| **R0 — Engine/application boundary** | Preserve `StagingService` and `StagingProvider`; retain legacy adapter and compatible result paths. | Implemented on PR #3. Existing service/job tests are the compatibility baseline; branch implementation does not mean merged or released. |
| **R1 — Scene understanding** | Typed SceneMap for surfaces, openings, fireplaces, built-ins, fixed fixtures, existing objects, relative depth, edges, probable floor plane, confidence and provisional zones. Development diagnostic contact sheet. | Offline schema/artifact/transform tests and independently annotated CV evaluation. Required unknowns explicitly abstain. No image generation. See [R1 design](./scene-understanding-r1.md). |
| **R2 — Architecture protection** | Deterministic `ProtectionPolicy` from SceneMap + customer selection; separately represent no-edit, no-occlusion, permitted occlusion, shadows and bounded reconstruction. | Zero forbidden overlap on analytic fixtures; policy cannot widen customer permissions; ambiguous structure blocks the affected region. Rasterization and transforms versioned. |
| **R3 — Spatial furniture planner** | Versioned `LayoutPlan`: item identities, complete footprints, orientation, size evidence, clearance envelopes, attachment/support relationships and projected silhouettes. Translate current profile constraints into solver constraints. | Reject layouts crossing doors, swings, circulation, windows or unsupported floor; validate complete required packages. Unknown metric scale cannot certify inches. Never shrink to toy scale or silently omit required furniture. |
| **R4 — Structured style system** | `StylePackage`: palette/material families, furniture archetypes, asset/license IDs, dimensions, compatibility rules, property-level style ID/version/seed. | Stable package choices across property rooms; scale/structure constraints always override styling. Optional accessories may be omitted; an impossible required package returns unsupported/uncertain. |
| **R5 — Controlled renderer** | First-party provider orchestrating original image, SceneMap, masks, depth/edges, LayoutPlan and StylePackage through replaceable rendering components. Preserve the external provider/service contract. | Compare controlled pretrained generation/inpainting, explicit geometry/asset rendering, or hybrid implementations on the same fixtures. Reject renderers that ignore required controls. No model selected solely by popularity. |
| **R6 — Preservation and quality QA** | Versioned validation result with per-check evidence: architecture, visible surfaces, furniture completeness, clipping, geometry, forbidden overlap, grounding and circulation. | Hard failures/unknowns veto delivery before aesthetics. Exact protected pixels where required; occlusion-aware comparison elsewhere. Independent manual adjudication for disputed evidence. Surface reconstruction assessed separately from observed surfaces. |
| **R7 — Candidate selection / bounded retry** | Persist candidate IDs, budgets, attempt outcomes and deterministic selection of eligible candidates. | Proposed initial cap: <=2 completed furnishing candidates and <=1 clearing call for replacement, no increase over current image-call bounds without review. No retry on unknown paid outcome; reconcile first. Stop if no qualified candidate or budget/time is exhausted. |
| **R8 — Furniture removal / replacement** | Detect -> segment -> bounded edit -> reconstruct -> cleared-room QA; preserve observed source surfaces and tag reconstructed surfaces as inferred. | Original furniture fully removed where selected; invalid/incomplete selections rejected. Clearing must pass before furnishing. Re-analysis cannot launder a changed doorway/window into a new architectural truth. |
| **R9 — Production qualification** | Frozen component/config/license manifest; representative development, untouched held-out and repeated fixtures; operational/privacy/cost tests and rollback plan. | All qualification gates below pass; owner approves promotion separately. No merge/deploy during this phase. Retire old files only after the replacement passes and rollback is demonstrated. |

### R1 implementation sequence (future reviewable commits)

| Commit | Scope | Review/validation boundary |
| --- | --- | --- |
| R1.1 | Schema, coordinate conventions, status/failure taxonomy, synthetic fixtures | Pure contracts and validation. No model imports, networking or production wiring. |
| R1.2 | Deterministic preprocessing, image/mask transforms and local artifact store | EXIF/ICC/alpha/size cases, round trips, hashes and crash-safe manifest publication. |
| R1.3 | Component adapter harness and license/provenance registry | Fake adapters first; timeouts/cancellation/resource limits. Exact artifacts must pass licensing review before download/use. |
| R1.4 | First local segmentation/detection adapters selected by evaluation | Room surfaces/openings/objects and class coverage. Missing critical observations remain unknown. |
| R1.5 | Depth, edges and probable floor-plane adapters; conservative zone proposals | Relative vs metric distinction, alignment, uncertainty, mirrors/occlusion and disagreement fixtures. |
| R1.6 | Immutable SceneMap assembly and offline six-panel diagnostics | Source/artifact linkage, deterministic serialization, partial/rejected outputs and no source alteration. |
| R1.7 | Benchmark annotations, calibration, repeat runs and R1 acceptance report | Freeze splits/thresholds; report per-class misses and abstentions. Decide whether R2 may consume outputs; no production activation. |

Detailed proposed files and acceptance requirements are in the R1 design. Each commit must stay reviewable without R2-R9 runtime code.

### Qualification measurements (proposed gates, not achieved results)

Freeze thresholds, hardware, supported room/mode list and evaluation protocol before held-out runs. Never tune to a held-out failure; move it to development and acquire a fresh held-out replacement while retaining the original failure record.

| Measure | Proposed release gate |
| --- | --- |
| Source coverage | Minimum 30 independently sourced representative development rooms + 10 disjoint held-out rooms; 10 selected rooms repeated at least 3 times. Group by property/room and source lineage across splits. Public synthetic/projected/studio stress cases are separately reported and do not fill the representative quota. |
| Room/mode coverage | Include bright/dim, cluttered/empty, small/open-plan, mirrors, occluded openings, wood/tile/carpet, unusual perspective and mobile uploads. No room or mode is enabled without explicit coverage; expand beyond the minimum when strata are sparse. |
| Usable complete results | Proposed >=90% of all eligible held-out jobs accepted by independent review, with uncertainty/rejection counted as non-success. Report per-stratum rates and counts, not just aggregate. This minimum sample is a release screen, not a statistical guarantee. |
| Critical false acceptance | Zero accepted results with altered architecture/surface, clipped or missing required objects, invalid geometry or blocked circulation in qualification and repeat tests. Any such result blocks release and triggers root-cause work. Report defects among all generated candidates too. |
| Protected source preservation | Zero changed decoded RGB values in strict-protection pixels after canonical alignment/lossless output; no post-hoc warping to conceal drift. For legitimate occlusion/shadows use explicit policy/layer evidence plus independent review. |
| R1 critical-region recall | Provisional target >=95% object-level recall for visible annotated doors/windows/openings on the development qualification set; report small fixtures separately. Any miss yielding an unsafe region marked usable blocks R1 advancement. Confidence/abstention calibration and class denominators are required. |
| Repeatability | Every accepted repeat must satisfy invariants and completeness; variation in decor is not geometry drift. Record seeds, component/runtime hashes and nondeterministic operations. |
| Latency | Proposed end-to-end p95 <=120s for furnish and <=180s for replace on declared deployment hardware, including queueing and QA; zero orphaned jobs. Also report cold/warm R1 latency, timeouts and memory peaks. These are unvalidated targets. |
| Retry rate | Proposed <=20% of eligible jobs require a second completed furnishing candidate; 0 automatic replays of unknown paid outcomes, and 100% adherence to configured caps. |
| Cost | Record total CV compute, rendering, QA, retries, storage and transfer per attempted and accepted job. A numeric per-job budget and p95 cost ceiling must be approved from measured infrastructure costs and actual pack economics before release. **Blocked until those numbers are recorded; unknown cost never equals zero.** |
| Compatibility and operations | Existing reservation/refund/lease races, ownership, history, email access and download tests pass; stage restart never double-generates or double-charges; cancellation, retention/deletion, load, rollback and physical mobile-device checks pass. |

## D) Room selector and style backlog — reconciled

Bathroom, dining, office and entry profiles already exist in `staging-profiles.md` and request/UI contracts; introducing them from scratch is no longer a task. R1 must preserve the existing request-to-normalized-room mapping, including fallback/outdoor handling, and document any current mismatch without silently changing it. All nine current request choices remain unchanged in this phase.

The earlier “Master Bedroom” idea remains deferred; no new selector is required for the engine. Room-size/profile rules remain authoritative until an explicit behavioral revision accompanies a validated planner. Modern/Farmhouse/Luxury labels, if offered later, map to R4 data packages, not unbounded prompt adjectives. Complete arrangements are a future product requirement; the current single-item override must not be presented as successful full-room staging.

## E) Storage roadmap — extend existing private delivery

Private source, result and thumbnail storage already exists. Preserve the current environment-prefixed `results/YYYY-MM/requestId` paths and database ownership references; regenerate signed links on authorized reads rather than persisting expiring URLs. The old proposed `/userId/roomType/timestamp.png` migration is not required and is retired from this plan.

R1 starts with an offline artifact-store interface and immutable local manifests. Future durable engine state uses private artifact IDs and hashes, linked to the existing job owner. Add an explicit scene/stage schema and migration only in a separately reviewed implementation phase. Do not assume existing arbitrary metrics logs constitute durable stage state. Publish a scene manifest only after every referenced artifact is written and validated. Propagate deletion/retention to diagnostics and reconstructed intermediates; do not change current retention policy silently.

## F) Payments roadmap — preserve, do not reopen

Checkout, access grants and durable credit accounting are implemented. Existing plan IDs, one-time pack semantics and access durations remain unchanged. Do not re-enable checkout, introduce subscriptions, add public token-mint endpoints or rebuild billing as part of R1. The job owns credit reservation/refund; an internal CV stage cannot spend customer credits or issue new credits. Development analysis is offline and does not use production entitlements.

Cost controls must include local GPU/CPU time as well as any future renderer request; “first-party” does not mean free compute. Unknown paid execution status must remain unknown until reconciled. Admin overrides and pricing changes, if ever requested, require their own scope and audit trail.

## G) UX roadmap — preserve access; defer engine-dependent work

Existing access/history pages, credit display and downloads remain. R1 diagnostics are developer-only and must not appear in customer history as completed staging. Future customer flow should explain unsupported/uncertain photos and the distinction between furniture removal and furnishing without exposing model jargon. Property-wide style consistency, batch staging and ZIP export remain deferred backlog until individual room quality and costs are qualified.

Do not ask customers to repair masks repeatedly as the definition of product quality. A later assisted correction flow may create a new versioned scene observation, but must not overwrite the original or bypass architectural protections.

## H) User feedback inbox — preserve no-redo semantics

A feedback endpoint, `feedback_submissions` schema, rate limiter and development inbox already exist. The earlier proposed `staging_feedback` schema is an unimplemented design, not a required second table. Reconcile future image-specific issue categories, <=300-character comments, contact opt-in and triage statuses with the existing schema before any migration.

Feedback remains a learning/manual-follow-up channel: submitting feedback does not automatically generate a redo or issue credits. This is separate from existing failed-job refunds and R7's internal bounded attempts. Later linking of feedback to SceneMap/layout/renderer versions must use authorized job ownership and private artifact IDs, not arbitrary URLs. Opt-in contact, testimonial consent, marketing image sharing and benchmark reuse are distinct permissions. Existing original/result storage can support authorized investigation; it does not grant permission to reuse customer photos for evaluation or training.

## I) Measurement, evidence and stop rules

Keep existing benchmark manifests, source provenance, raw outputs and manual review criteria. Extend them with R1 annotations, coverage metrics, abstentions and component-level runtime/cost evidence; do not rewrite historical uncertain/rejected outputs as accepted. Existing `evaluateVisualReview` does not independently authenticate reviewers; R9 needs an explicit independent-review protocol/record, not just a reviewer string.

No specialized provider trial, API account or subscription is needed to start R1. The principal unresolved risks are single-view scale/hidden geometry, opening/fixture misses, unknown door swings, incompatible segmentation/depth outputs, complete-object masks and shadows, renderer compliance, commercial model/asset licensing, hardware cost and representative source coverage. R1 must expose these uncertainties in state and diagnostics; it does not solve them by naming a newer model.

Historical workspace HTML reports are dated snapshots, not an alternative roadmap. This repository document governs future sequencing. The next authorized implementation phase should begin at R1.1 after review of [scene-understanding-r1.md](./scene-understanding-r1.md); this documentation phase stops before implementation, merge or deployment.
