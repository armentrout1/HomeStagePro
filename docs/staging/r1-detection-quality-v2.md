# R1.4B3 development detection hardening

## Pre-change failure inventory and declared study

Baseline inspection completed before V2 behavior changes. The original B2 Markdown/JSON and private run remain immutable; hashes and per-prediction triage are recorded in `r1-detection-v2-failure-inventory.json`. Triage tags are hypotheses for review, not automatic false-positive ground truth.

| Failure category | Baseline evidence / distinction |
| --- | --- |
| Native label formatting | `built - in cabinet` / `built - in shelving`; literal hyphen spacing prevented exact lookup. |
| Canonical alias mapping | `electrical outlet wall outlet`, `sofa couch` describe equivalent configured aliases but become unknown. |
| Duplicate hypothesis | Same object receives repeated aliases; existing same-subtype IoU .80 consolidation is incomplete for concatenated labels. |
| Multi-class/conflicting hypothesis | `door window`, `built-in cabinet ... staircase` must not be resolved by maximum score. |
| Low-quality detector box | Balcony door best IoU .172; fireplace firebox versus full surround and whole-image stairs boxes. |
| Detector false positive | Empty-room stairs; studio fireplace and sink; furniture in empty rooms. |
| Detector false negative | Studio cropped window lacks canonical window; extent/class failures remain distinguished from total lack of proposal. |
| Class confusion | Window/door hypotheses on the same region; cabinet versus architectural paneling. |
| Pane vs assembly grouping | Several living-room panes miss strict box matching despite overlapping assembly predictions. |
| Doorway vs door grouping | Passage may receive a door leaf hypothesis; canonical strict class remains authoritative. |
| Surface/stuff noise | Multiple walls/ceilings consume budget without usable architecture certainty. |
| Furniture subtype | Studio sofa matches broad furniture while highest matching prediction says bed; must remain a semantic error. |

Predeclared development study: critical **paired box/text** thresholds {0.10, 0.15, 0.20, 0.25}; other groups fixed at 0.25. Native outputs are computed once per group/image and postprocessed at all four critical threshold pairs (no extra learned model, no grid expansion). Exactly the seven authorized development images, unchanged source annotations. No held-out or customer images.

Threshold selection, declared before results: lexicographically minimize (strict critical misses; regressions of B2 strict matches; critical-overflow cases; unmatched critical proposals as a false-positive-review proxy; total critical proposals), then prefer the higher threshold on exact ties. False-positive proxies are not adjudicated truth; report the complete tradeoff and visually review false architecture. A selected policy may still fail the development targets; do not tune again after the final V2 run.

V2 prompt structure: window alone; each door/opening phrase alone; fireplace, built-ins, stairs in separate architecture groups; separate electrical/plumbing/appliance/seating/table/other furniture groups; floor/wall/ceiling each isolated experimental group. Normalization is vocabulary-bound, never fuzzy. Concatenated phrases map only if a complete known-phrase decomposition yields one identical canonical class/subtype; incompatible or incomplete concepts stay unknown.

Budget policy `architecture-first-v2`: keep the 32-mask ceiling. Priority critical (door/opening/window), other architecture (fireplace/built-in/stairs), fixtures, furniture, foreground/unknown. Experimental surfaces receive no primary SAM prompts. Any unknown originating in a critical prompt group is conservatively priority-critical. If critical proposals alone exceed 32, explicit whole-case critical-overflow abstention. Otherwise select deterministically by tier, descending native score, class order, coordinates, normalized label. Retain ALL other detections with `mask-not-attempted-budget`; surfaces use `mask-not-attempted-experimental`. Actual selected mask failures remain `MASK_REFINEMENT_FAILED`. No box claims segmentation.

Frozen detection limits: native 128/group, 4096 total across V2 groups, retained 256, bounded metadata 1 MiB, masks 32 and 16 MiB; existing container/memory/timeout controls remain. Higher detection-only bounds cover additional fixed prompt groups, not an increase in SAM capacity. Same-class/subtype duplicate IoU .80; incompatible classes/subtypes stay separate. No post-result dedup/threshold adjustment.

Strict existing annotation-order, unused same-class IoU >= .5 matching stays unchanged. Additional independent best-class IoU and overlap diagnostics cannot turn a strict miss into a match. Grouping is a review explanation only. Furniture subtype labels are source-derived diagnostic annotations in a separate file, never changes to baseline boxes.

Status: completed R1.4B3 development evaluation, finalized 2026-10-03. **DETECTOR_ALTERNATIVE_EVALUATION_REQUIRED**. The following sections preserve the predeclared design above and distinguish V1, V2 and V3. No production quality claim; no R1.5/R1.6 or deployment.


## Engineering decision

**DETECTOR_ALTERNATIVE_EVALUATION_REQUIRED.** Do not continue threshold/prompt tuning on these seven rooms as if zero annotated misses established quality. DINO now covers all 15 minimal critical annotations, but it invents substantial architecture; SAM faithfully segments many wrong regions/classes. V3 publication is structurally trustworthy in this evaluation. The detector semantics are not. No alternative detector, R1.5 geometry, R1.6 orchestrator, production wiring or deployment was implemented.

Evidence: [structured V1/V2/V3 comparison](r1-detection-quality-v3.json), [complete threshold tradeoff](r1-detection-v2-threshold-study.json), [baseline failure inventory](r1-detection-v2-failure-inventory.json). Structured evidence links and hashes each private case report containing all raw DINO hypotheses, mapped/normalized hypotheses, originating groups/contributions, selected IDs, dispositions, masks, resources and strict annotation matches. Private images/model data are not committed.

## Frozen versions and shared-mask defect

- **V1:** committed R1.4B2 baseline; original report Markdown/JSON hashes and private run remain unchanged.
- **V2:** quality-hardening behavior before publication correction. It completed the seven development cases, including two failed segmentation publications. The full threshold study and negative results remain intact.
- **V3:** `scene-local-3`, host revision `artifact-publication-v3`; same V2 native worker, detector, prompts, thresholds, normalization, consolidation and selection. Only artifact declaration handling differs.

V2 appended a MaskRef for every returned mask observation. When SAM returned identical PNG bytes for different detector hypotheses, the content-addressed store correctly returned the same exact MaskRef, but the component declared it more than once. The existing runner correctly rejected duplicate artifact declarations with `COMPONENT_ARTIFACT_INVALID`. This was a publication defect, not corrupted hashes, cross-case ownership or a lost source identity. The panelled bedroom and low-resolution living room each had 32 native completed masks, but their entire V2 segmentation publications failed: those 64 masks must **not** count as accepted outputs. Native masks are historical debugging evidence only in these failed cases; DINO, threshold-study, strict detection and other successfully published case evidence remain valid.

V3 `uniqueMaskArtifacts` publishes each identical ref once, preserves every distinct SceneElement and detector relationship, and rejects conflicting metadata for a repeated artifact ID. No hash, ownership, component-run, frame, source mapping, R1.2 byte validation or trust checks were relaxed. Changing publication after observing V2 required a separate version, not replacement of V2 evidence. Artifact validity is not semantic correctness: identical masks may still have conflicting detector labels.

Before resumption all **30** uncommitted files matched `temp/r14b1/v3-resume-freeze-2026-10-02.json`, with HEAD `09fad55ffa4a3ffd76877186be15e72d68eaf3c6`, the expected branch/upstream, no unrelated files and no production diff. They matched again after inference and before authorized report finalization. The focused 16 tests passed before the earlier five-case run and again within the final 279-test suite.

Frozen configuration:

- Prompt `roomstager-r1-detection-v2`, SHA-256 `84bfe361eb9e1f2f1f93a4aec4ef6982bc2ff8a428a12ad252fd94187e4138ac`.
- Mapping/normalizer `roomstager-r1-mapping-v2`: NFKC, lowercase, hyphen/punctuation/whitespace normalization; complete known-phrase decomposition within originating group; incompatible/partial labels remain unknown.
- Critical box/text 0.20/0.20; noncritical 0.25/0.25. Selected by the predeclared four-pair development study, not after V3 results.
- Same-class/subtype consolidation IoU >= 0.80; unknowns additionally share group and normalized label; deterministic ordering. Conflicting hypotheses remain distinct.
- `architecture-first-v2`, **32** SAM prompts. Critical-group unknowns remain critical; critical count >32 abstains the case. Surfaces are experimental and excluded. Other unselected observations remain explicit.
- V3 shared publication rules above. Diagnostic helper hash `fa2f119d32dc7c3c05378f3c238011f6c4bef9082e3e9c9306876177d9b9c9b6`; original annotation-order, unused same-canonical-class box IoU >=0.5 is authoritative. Pane/assembly overlap never converts a strict miss to success.
- Full source/descriptor pins in structured evidence and `scene-runtime-v3.json`. No behavioral edits after the freeze. Raw and normalized DINO hypotheses are exactly equal between V2 and V3 for all seven cases.

## Completed V3 cases and resume lineage

First five finalized reports are retained from `f06ad53c-7e64-4d08-a51d-ee563366beea`; none was rerun. Blue alone was restarted at the beginning of case execution under the frozen body in `4ddd91b1-11ee-491d-9a80-90f76fd99953`. Cayley alone ran in `541b408b-da25-49f0-9111-f45a17022ed0`. An ignored operator wrapper only adjusts import paths and selects either unfinished case; frozen source files were unchanged.

| Case | DINO | Unknown | Critical priority | Selected / published masks | Budget-unattempted | Surface-unattempted | Critical misses | Seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| bedroom-panelled-carpet | 54 | 12 | 28 | 32 / 32 | 17 | 5 | 0 | 30.42 |
| living-fireplace-wood | 70 | 14 | 38 | 0 / 0 | 0 | 0 | 0 | 17.07 |
| bedroom-small-window | 54 | 12 | 29 | 32 / 32 | 17 | 5 | 0 | 29.30 |
| living-low-resolution | 57 | 8 | 28 | 32 / 32 | 17 | 8 | 0 | 28.97 |
| public-small-empty-room | 32 | 7 | 12 | 27 / 27 | 0 | 5 | 0 | 30.82 |
| public-blue-furnished | 33 | 4 | 14 | 28 / 28 | 0 | 5 | 0 | 37.49 |
| public-cayley-furnished | 74 | 9 | 17 | 32 / 32 | 36 | 6 | 0 | 38.72 |

The fireplace living room has 38 priority-critical hypotheses, so all 70 detections remain unsegmented by whole-case abstention; these are separate from the 87 individually budget-unattempted detections. Across V3: 183 native masks completed, 183 published observations, **0 native refinement failures**, 176 distinct mask artifacts. No publication failure. All 374 detections are accounted for: 183 completed + 87 budget-unattempted + 34 experimental-unattempted + 70 whole-case-abstained.

All 15 strict critical detection matches are preserved. The five critical annotations in the abstained living room have no published masks; detection recall must not be mistaken for segmentation coverage. Structured evidence records each strict annotation match, native mask disposition and accepted publication separately. No V3 detector miss, extent-induced strict miss or mapping-induced strict miss occurred against this minimal critical set. This does not establish exhaustive real-scene recall.

## V1 / V2 / V3 comparison

| Measure | V1 | V2 | V3 |
| --- | ---: | ---: | ---: |
| Critical misses / 15 | 9 | 0 | 0 |
| DINO hypotheses | 353 | 374 | 374 |
| Unknown labels | 162 | 66 | 66 |
| Whole-case budget abstentions | 6 | 1 | 1 |
| Publication failures | 0 | 2 | 0 |
| Native completed masks | 32 | 183 | 183 |
| Accepted published mask observations | 32 | 119 | 183 |
| Native refinement failures | 0 | 0 | 0 |
| Individual budget-unattempted | 0 | 87 | 87 |
| Detections in whole-case budget abstention | 321 | 70 | 70 |
| Explicit experimental-unattempted | 0 | 34 | 34 |
| Architecture review flags (not precision ground truth) | 45 | 124 | 124 |
| Subtype mistakes among matched diagnostic boxes | 7 | 3 | 3 |
| Correct subtype diagnostic boxes | 0 | 5 | 5 |
| Unmatched diagnostic subtype boxes | 4 | 3 | 3 |

V1's zero individual-budget/experimental dispositions means those states did not exist in that policy: its six over-cap cases abstained entirely, including surfaces. It does not imply those objects were segmented. V2 native 183 versus published 119 explicitly preserves the publication loss. No negative V1/V2 evidence is erased by V3.

## False architecture: primary quality result

The frozen six-class diagnostic flagged 43 V1 versus 121 V2/V3 hypotheses. Extending the **report only** to the requested fixed-appliance and window-on-glazed-door reviews yields **45 versus 124 versus 124** flags. These are source-reviewed development hypotheses, not exhaustive independent human false-positive counts or precision percentages. The unchanged minimal annotations do not certify absence. In particular, door/opening grouping and window-pane/assembly duplicates require care; an unmatched box alone is not false. The flag table records the consistent review rule, while the concrete visual examples establish the quality blocker independently.

| Class | V1 flags | V2 flags | V3 flags |
| --- | ---: | ---: | ---: |
| door | 28 | 73 | 73 |
| opening | 10 | 21 | 21 |
| window | 2 | 1 | 1 |
| fireplace | 1 | 11 | 11 |
| built-in | 0 | 2 | 2 |
| stairs | 3 | 13 | 13 |
| plumbing-fixture | 1 | 1 | 1 |
| fixed-appliance | 0 | 2 | 2 |

Concrete repeated errors: panelled bedroom walls called doors/fireplaces; flat floors called stairs; the small-bedroom fan called doorway/fireplace; studio sofa called balcony door/sink/oven; low-resolution fireplace called door/opening; Cayley kitchen cabinetry called doors and exterior roof called sink. V3 contains 13 stairs proposals despite no visible stairs in the reviewed sources and 11 fireplace proposals in scenes without a fireplace. The two fixed-appliance flags are in the low-resolution living room and Blue studio. The glazed balcony door has a window-class hypothesis: class confusion, separately identified rather than silently changing its annotation.

Cayley plumbing/appliance hypotheses remain uncertain or visibly misplaced; absence is not asserted for the whole kitchen. Extra window hypotheses on real windows are retained as extent/grouping review, not all counted false. Cayley window masks include exterior fragments/curtain-edge regions. A complete, independently labeled precision benchmark is still missing; **precision did not materially improve from V2 to V3**, because all raw/mapped detector hypotheses are identical. The publication fix cannot repair them.

Furniture diagnostic errors decreased from seven to three but remain material: Blue sofa -> bed; Cayley dining table -> desk; one Cayley chair -> unknown-furniture. Five matched diagnostic boxes now have correct subtypes; three remain unmatched (Blue plant, one Cayley chair, background sofa). This retrospective same-rule V1 comparison uses the unchanged source-derived diagnostic labels; it does not alter the original V1 score. Many usable furniture masks are excluded by false architecture consuming priority slots.

## Mask integrity and visual quality

All **183** completed V3 mask overlays were inspected across six mask-producing cases. Every completed case passed content/byte hashes, owned-store reads, canonical frame/dimensions, unique artifact declarations, exact shared refs, distinct element IDs, same source class/subtype, single source relationship, host-issued component run and one output representation per detector observation. No new publication defect was discovered.

Panelled bedroom: 32 observations, 30 unique masks; two shared pairs. Low-resolution room: 32 observations, 27 unique masks; six source hypotheses share one exact firebox mask. Other completed cases have no exact shared mask refs. Cross-class shared masks are unresolved semantic conflicts, not conflicting artifact metadata. All source relationships remain separate. Frozen validators and trust boundaries are unchanged.

Visual inspection found gross wrong-region coverage, fragmented masks, partial assemblies and missing portions, despite valid storage. Windows sometimes produce useful panes, while different prompts isolate only the lower pane, extend into curtain/exterior regions or segment unrelated walls. False structure masks can cover whole floor/ceiling/wall regions. The low-resolution fireplace mask omits its surround. Cayley table/chair masks can be coherent but have wrong labels or insufficient selected-chair coverage. Per-case notes and mask ordinals are in structured evidence; private `mask-review-contact.png` sheets accompany the reports. No UI or image rendering behavior was changed by creating these review sheets.

No post-hoc segmentation annotations were manufactured. Applicable floor mask IoU, object-boundary accuracy and R2 false-safe-region rate remain **N/A**. V3 surfaces are detector-only: 42 mapped floor/wall/ceiling hypotheses overall, with 34 explicit experimental exclusions in non-abstained cases and eight in the whole-case-abstained room. There is no floor geometry, depth or placement-safety authority. V1's studio surface masks remain qualitative evidence only because that case lacks an adequate floor polygon.

## Resource evidence and historical RAM stops

Resume admission: **15,190,487,040 bytes host available (14.15 GiB), 14,473 MiB GPU free**. Blue run admission: 15,148,740,608 bytes / 14,506 MiB; before SAM: 13,242,429,440 bytes / 14,507 MiB. After Blue verification, admission before proceeding to Cayley passed at 15,776,313,344 bytes / 14,501 MiB. Thresholds remain host >=12 GiB and GPU >=10 GiB.

The earlier V3 run `8e438915-255d-489b-8092-b7f7087f7489` stopped after one finalized case. Run `f06ad53c-7e64-4d08-a51d-ee563366beea` stopped after five, before Blue SAM, with `BLOCKED_REAL_INFERENCE_HOST_MEMORY`. Both remain preserved. Exact failing bytes were not recorded by the existing exception; later recovered measurements are not substitutes. This is a known instrumentation limitation for a later change, not silently repaired in V3.

| Resource | V1 | V2 | V3 |
| --- | ---: | ---: | ---: |
| Total case-sequence seconds | 115.337 | 204.103 | 212.793 |
| Mean case-sequence seconds | 16.477 | 29.158 | 30.399 |
| Peak observed worker RSS bytes | 1887768576 | 1899180032 | 1892941824 |
| Peak CUDA allocated bytes | 2194543616 | 2193216512 | 2193216512 |
| Peak CUDA reserved bytes | 2608857088 | 2608857088 | 2608857088 |

Times are recorded case sequences, excluding offline review, hashing/qualification setup outside the timed region, interrupted attempts and operator idle time. V3 is assembled across authorized resumes, not one uninterrupted throughput measurement. More prompt groups and more SAM-executed cases make V2/V3 more expensive than V1; timing variation between V2 and V3 is not an isolated benchmark of deduplication. Worker RSS is not total host/Docker usage, and CUDA counters are not whole-machine peak VRAM. Host-level memory headroom remained operationally fragile despite smaller worker counters.

## Validation and isolation

- **279/279 TypeScript tests**, zero failures/skips, including the 16 focused V3 tests, R1 contracts/preprocessing/artifacts/components/real runtime and staging benchmark/pipeline/service regressions. Network-denial preload enabled.
- **38/38 Python tests** in the exact pinned runtime image, network none, read-only/nonroot/restricted container. No skipped tensor tests.
- Application, benchmark and focused-test TypeScript typechecks pass.
- Both cached model bundles/sidecars/descriptors and **55 wheel hashes** verified; original B2 report and source/annotation hashes unchanged. No inference downloads or new models.
- Inference containers use `--pull=never --network none --read-only`, fixed mounts and offline flags. All recorded worker network attempts are zero. Provider credentials are excluded by the host environment allowlist and are not mounted; no application credential files were read or printed.
- No running Docker containers remain. No identifiable model worker remains in observable GPU processes. One Windows process name was inaccessible and per-process GPU memory is unavailable under WDDM; absolute absence of hidden GPU processes is not claimed.
- No production database used; no unrelated DB-dependent checks claimed. `production.ts` unchanged. Models remain evaluation-only; no provider/billing/configuration changes, merge or deployment.

The exact intentional change list is in structured evidence. This report finalizes the preserved design without replacing it; `scene-understanding-r1.md` receives only a current-status update. Final working-tree whitespace checks passed. Plain staged `git diff --check` flags deliberately frozen CRLF carriage returns in the three V3 host files. The CRLF-aware staged check (`core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol`) passes, as does an independent scan for actual trailing spaces/tabs in every staged file. Exact staged host/native hashes match the freeze; bytes were not normalized. Publication is restricted to the existing draft development PR; it does not authorize a merge or deployment.
