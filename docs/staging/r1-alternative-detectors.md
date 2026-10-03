# R1.4C1 — Alternative detector qualification

Date: 2026-10-03 (America/Chicago). Scope: research, artifact provenance, static runtime review and future evaluation design only. Starting branch `refactor/staging-engine-boundary`, HEAD `4dbc537c43078a2c2037afb62a48ee3d6be1b947`, draft PR #3; working tree was clean. No runtime code, dependency lock, existing evidence, source image or annotation changed. No model weights downloaded, no models instantiated/executed, no SAM run, no merge or deployment.

## Qualification decision

| Candidate | Evaluation qualification | Production status | Execution readiness |
| --- | --- | --- | --- |
| OmDet-Turbo Swin Tiny, primary research target | **APPROVED_FOR_EVALUATION**, conditional on separately resolving the static runtime blockers below | **PRODUCTION_CANDIDATE_PENDING_PROVENANCE** | **Blocked in unchanged environment:** published config selects missing `timm`; config migration can attempt a Hub backbone lookup. Not approved for execution/acquisition by C1. |
| Google OWLv2 Base Patch16 Ensemble, secondary comparator | **APPROVED_FOR_EVALUATION**, subject to later acquisition and compatibility gates | **PRODUCTION_CANDIDATE_PENDING_PROVENANCE** | Native implementation and required core packages present by static inspection; exact weight loading, offline tokenizer path and resource use remain untested. |
| Microsoft Florence-2 Base | **DEFERRED** | Not qualified | Official usage still requests `trust_remote_code=True`; do not enable it. |

These statuses qualify future evaluation candidates, not production use and not permission to begin the next phase. Neither candidate has measured RoomStager precision. OmDet remains the strongest interface fit to investigate, but OWLv2 has fewer identified dependency obstacles in the unchanged environment. Do not force OmDet execution by silently adding packages or substituting another backbone. No evidence presently establishes a required paid checkpoint license; unresolved data rights require review rather than an invented commercial-license conclusion.

Grounding DINO remains immutable comparison evidence: [B2](r1-detection-segmentation-smoke.md), [B3 report](r1-detection-quality-v2.md), [B3 structured evidence](r1-detection-quality-v3.json). Its B3 decision remains **DETECTOR_ALTERNATIVE_EVALUATION_REQUIRED**. V3 had 0/15 critical misses, 66 unknown labels, 374 hypotheses and 124 development architecture-review flags. Valid SAM masks on wrong boxes do not fix semantics. No further DINO prompt/threshold tuning is planned here.

## Official identity and immutable source references

- Om AI Lab: [official OmDet repository](https://github.com/om-ai-lab/OmDet/tree/956e2f36a13c32bd1e30b14a790233268c2305fb), code revision `956e2f36a13c32bd1e30b14a790233268c2305fb`. Its pinned README explicitly links the HF Transformers checkpoint and lists Tiny/Swin-T pretraining as O365/GoldG. [Paper, v2](https://arxiv.org/html/2403.06892v2) describes the decoupled label/task design. Do not use the separate original `.pth`/CLIP `.pt` release.
- Google / Google DeepMind: [official Scenic OWL-ViT project](https://github.com/google-research/scenic/blob/8c113c501c9f700b69899c55a69e65bb46727da6/scenic/projects/owl_vit/README.md), code revision `8c113c501c9f700b69899c55a69e65bb46727da6`; [OWLv2 paper, v3](https://arxiv.org/html/2306.09683v3). The official project describes code and checkpoints as Apache-2.0. Our planned inference uses the native Transformers port, not JAX/Flax/Scenic execution.
- Hugging Face native implementation: **already-cached** `transformers-5.18.0-py3-none-any.whl`, SHA-256 `d79e5a515a572ee3deb33eb0d578be47d91e70c75d54cf21bf6eede6edef14a9`, verified against [the existing wheel lock](../../scripts/staging_runtime/wheels.lock.json). ZIP source inspection only: no model imports or model execution. This exact local wheel is authoritative over current online examples.

## Exact artifact plan — inactive until later authorization

The model API was used to discover a revision, then metadata was re-requested by that exact 40-character revision. No inference/acquisition record may reference a moving branch. Weight SHA-256/bytes below are publisher LFS metadata, **not a local weight verification**. Weight URLs were never requested. Only bounded textual model cards/config/tokenizer sidecars were read into ignored `temp/r14c1`; SHA-256 was computed for these and their publisher Git blob SHA-1 independently checked. A Git blob ID is not a file SHA-256.

### omlab/omdet-turbo-swin-tiny-hf

Revision: `7fe93cecfb770c4d76cf71163956221249cab566`. [Pinned model card](https://huggingface.co/omlab/omdet-turbo-swin-tiny-hf/blob/7fe93cecfb770c4d76cf71163956221249cab566/README.md). [Pinned metadata](https://huggingface.co/api/models/omlab/omdet-turbo-swin-tiny-hf/revision/7fe93cecfb770c4d76cf71163956221249cab566?blobs=true).

| Exact file | Bytes | SHA-256 | Evidence / role |
| --- | ---: | --- | --- |
| `README.md` | 5141 | `81b5b3ad13360e919cffbd80c24421c038e97c334d67636e7cb148d586591c90` | Text sidecar verified; license evidence |
| `config.json` | 1959 | `c0d6546428c6dd7e72d9c8e2123cdd7ff24925dfbff9b535b66cd2f19ca65c46` | Text sidecar verified; runtime asset |
| `merges.txt` | 524619 | `9fd691f7c8039210e0fced15865466c65820d09b63988b0174bfe25de299051a` | Text sidecar verified; runtime asset |
| `model.safetensors` | 461822656 | `439d1575d7e237ad565ed6969ea2a2dfcedf2086155e9ca3ac96cd6180a48cfd` | Publisher LFS; **not downloaded** |
| `preprocessor_config.json` | 492 | `cc6c8ac92ba1a8a62065f3439ebb58f01e4895fa038901e1df14c3427a617e23` | Text sidecar verified; runtime asset |
| `special_tokens_map.json` | 588 | `2cdb3b8331a60c92fc1e55a13e9fd61fd2293c5a51275fdcccd62b780052530e` | Text sidecar verified; runtime asset |
| `tokenizer_config.json` | 749 | `e27c4dfb5e3f95e39968080f024ad7fd8f11709acfd0b9ae669285bbedc5fad3` | Text sidecar verified; runtime asset |
| `vocab.json` | 1059962 | `e089ad92ba36837a0d31433e555c8f45fe601ab5c221d4f607ded32d9f7a4349` | Text sidecar verified; runtime asset |

All files resolve under the pinned model revision above. The runtime allowlist is the listed files except README, which is retained as provenance evidence. There is no standalone `processor_config.json` or `tokenizer.json` in this snapshot; processor identity is recorded in preprocessor/tokenizer configs. Do not discover missing files dynamically.

### google/owlv2-base-patch16-ensemble

Revision: `cfd3195ba4ea9592eec887ded089f4c08eff231d`. [Pinned model card](https://huggingface.co/google/owlv2-base-patch16-ensemble/blob/cfd3195ba4ea9592eec887ded089f4c08eff231d/README.md). [Pinned metadata](https://huggingface.co/api/models/google/owlv2-base-patch16-ensemble/revision/cfd3195ba4ea9592eec887ded089f4c08eff231d?blobs=true).

| Exact file | Bytes | SHA-256 | Evidence / role |
| --- | ---: | --- | --- |
| `README.md` | 4838 | `7c7426bc5ec939a42d1f96fb093031b6263400cceac4129ebb941a0c8c11b9b9` | Text sidecar verified; license evidence |
| `added_tokens.json` | 67 | `e5dc0da35d20111e8ff3fdfc03682beca23d5f94ed74331bce81786b2636a24f` | Text sidecar verified; runtime asset |
| `config.json` | 414 | `ba9df8c25a4b8461887dd0a93d9252c9cd84697fe8d49a9d8794ce409af9acb2` | Text sidecar verified; runtime asset |
| `merges.txt` | 524619 | `9fd691f7c8039210e0fced15865466c65820d09b63988b0174bfe25de299051a` | Text sidecar verified; runtime asset |
| `model.safetensors` | 619918824 | `e1e130b9e404cf91a75ad45644c1da9d7fa5284085eecc864266a6923efb99e7` | Publisher LFS; **not downloaded** |
| `preprocessor_config.json` | 425 | `cf3e396635b797ee1a464e1b2836e98748f8edac19e89aaa2c93b55ac15b0064` | Text sidecar verified; runtime asset |
| `special_tokens_map.json` | 121 | `d6e2b9cf664efbad2d22998b8d3da986abcbeed3e0825ad33605c9401f9cf73e` | Text sidecar verified; runtime asset |
| `tokenizer_config.json` | 1100 | `b55cda6198e152ded427c8a9b3faf1cccf27a7fa080697a62f6ff143f511f44f` | Text sidecar verified; runtime asset |
| `vocab.json` | 1059962 | `e089ad92ba36837a0d31433e555c8f45fe601ab5c221d4f607ded32d9f7a4349` | Text sidecar verified; runtime asset |

All files resolve under the pinned model revision above. The runtime allowlist is the listed files except README, which is retained as provenance evidence. There is no standalone `processor_config.json` or `tokenizer.json` in this snapshot; processor identity is recorded in preprocessor/tokenizer configs. Do not discover missing files dynamically.

OWLv2 also publishes `pytorch_model.bin`; it is explicitly **excluded**. Use only `model.safetensors`, with `use_safetensors=True`, `trust_remote_code=False`, and `local_files_only=True`. Neither planned HF snapshot contains required repository Python. No pickle, `.bin`, original `.pth`/`.pt`, training data or auxiliary pretrained backbone downloads are authorized.

## Rights and production provenance

This is an engineering provenance review, not a legal clearance opinion. Treat source code, checkpoint declarations, training data, redistribution and hosting as separate questions.

| Layer | OmDet | OWLv2 |
| --- | --- | --- |
| Source-code license | [Pinned upstream LICENSE](https://github.com/om-ai-lab/OmDet/blob/956e2f36a13c32bd1e30b14a790233268c2305fb/LICENSE): Apache-2.0. Native Transformers files also carry Apache-2.0 notices. | [Pinned Scenic LICENSE](https://github.com/google-research/scenic/blob/8c113c501c9f700b69899c55a69e65bb46727da6/LICENSE): Apache-2.0; native Transformers files Apache-2.0. |
| Checkpoint license | Pinned HF model card declares Apache-2.0. No separate LICENSE file in this HF snapshot. Preserve the exact model card and upstream license evidence. | Pinned HF card declares Apache-2.0; official Scenic project separately states code and checkpoints are Apache-2.0. |
| Training provenance | Release table lists Objects365 and GoldG; pretrained vision/language initialization and full data-rights lineage are not exhaustively cleared by the HF card. GoldG is a dataset mixture, not itself a blanket commercial license. | Card describes public image-caption datasets plus internet crawling, YFCC100M, COCO/OpenImages, but labels its data account as needing a v2 update. The v2 paper describes WebLI self-training. Exact per-checkpoint data lineage and rights are unresolved. |
| Production hosting | Blocked pending data-rights/lineage review, runtime compatibility and measured quality. Apache declaration alone does not clear source-image rights. | Same blocker, with particularly incomplete checkpoint-specific web-data provenance. Research-intended model-card wording is not automatically a new noncommercial license, but also is not production clearance. |

[Objects365's own terms](https://www.objects365.org/download.html) restrict dataset availability to academic purposes, separately license annotations under CC BY 4.0 and disclaim ownership of source images. This is a concrete provenance concern, not proof that every downstream checkpoint is legally forbidden for commercial hosting. Obtain documented checkpoint/data-use rights or appropriate review before production. [Microsoft GLIP data instructions](https://github.com/microsoft/GLIP/blob/9dda9558c1ef59bb6cdc8e896e2bcab775a68ff0/DATA.md), reviewed as a provenance pointer, describe Flickr30K/MixedGrounding constituents; they do not grant blanket image rights or prove this precise OmDet checkpoint's complete lineage. Do not acquire training datasets in this phase.

[Apache-2.0 terms](https://www.apache.org/licenses/LICENSE-2.0) require preserving applicable notices and the license on redistribution, marking modifications, and handling NOTICE content if present; patent/ trademark provisions and warranty exclusions also matter. No standalone NOTICE was listed in either pinned HF snapshot. A later redistributed bundle/container must inventory dependency and checkpoint notices. Hosting inference is distinct from distributing weight copies, but does not remove provenance, privacy, contractual or output obligations. No rights to third-party training images are inferred from code licenses.

## Native interfaces and DINO failure modes

### OmDet: direct class identities, with important runtime caveats

Static inspection of `processing_omdet_turbo.py` in the pinned wheel confirms:

- `OmDetTurboProcessor.__call__` accepts `text=list[str]` / nested lists. Class texts are encoded separately from `task`; `classes_structure` preserves per-image class counts. Use a list, never its optional comma-splitting string convenience.
- A missing task creates a sentence from the class list. C1 instead freezes the separate short task **`Detect the listed objects.`** so the full 38-class sentence cannot be silently truncated by the 77-token task limit. Classes remain separate, complete inputs. Preflight token lengths later without altering the vocabulary.
- Postprocessing produces integer `labels`, looks up `text_labels[idx]` directly, and returns pixel `xyxy` boxes at explicit `(height,width)` target sizes. There is no native free-form token-span reconstruction. Host mapping must validate index range and map the frozen list itself, rather than trusting returned display text.
- Sigmoid class scores are raw and uncalibrated; multiple conflicting class hypotheses can still describe the same region. Stable class identity eliminates malformed/concatenated label reconstruction, **not** visual class confusion, false structure, localization error or calibrated uncertainty.
- The pinned API uses `text_labels=`, `threshold=`, `nms_threshold=` and returns `labels`/`text_labels`. Old model-card examples using `classes=`, `score_threshold=` or output `classes` must not be copied unchanged.
- Native postprocessing applies top-k over proposal/class pairs (bounded by proposal count), threshold, class-aware NMS and clipping. Preserve native pre/postprocessing counts; do not confuse native top-k with host truncation. Published config has 900 queries.

This directly targets B3's ambiguous/concatenated-label and normalization failure class. The zero-unknown benefit would be partly structural and must not be marketed as zero semantic errors. No measured false-positive improvement is claimed.

### OWLv2: direct query indices

`Owlv2Processor` accepts one or multiple text queries, preserving list order. Pinned `Owlv2ImageProcessor.post_process_object_detection` takes maximum class logits per spatial query, applies sigmoid and threshold, and returns integer query-list indices. `Owlv2Processor.post_process_grounded_object_detection(..., text_labels=[classes])` adds labels by indexing that same list; no token-span reconstruction is needed. The chosen class can still be wrong; the top-class rule can suppress alternatives. Scores are not calibrated probabilities. Text-conditioned processing is the comparison path; image-guided detection with label `None` is not used.

OWLv2's 960-square preprocessing pads to a square. Its pinned `_scale_boxes` uses **max(original height, original width)** for both coordinates, accounting for padding. Do not naively multiply x/y by separate dimensions as for a stretched image. Later adapter checks must retain the transform, reject nonfinite/degenerate boxes, clip padding-only boxes to the canonical frame, and verify landscape/portrait/low-resolution geometry with synthetic examples before real evaluation.

## Static runtime compatibility and blockers

The current locks remain **torch 2.14.1+cu130**, **Transformers 5.18.0**, torchvision 0.29.1+cu130. No packages were added. Native classes present: `OmDetTurboConfig`, `OmDetTurboForObjectDetection`, `OmDetTurboProcessor`; `Owlv2Config`, `Owlv2ForObjectDetection`, `Owlv2Processor`, `Owlv2ImageProcessor`. OmDet uses the native `DetrImageProcessor` plus CLIP tokenizer; OWLv2 uses its own image processor plus CLIP tokenizer.

**OmDet is not currently executable as-is:** its exact config sets `use_timm_backbone=true`, `backbone_config=null`, backbone `swin_tiny_patch4_window7_224`, and nonempty `backbone_kwargs`. The pinned `consolidate_backbone_kwargs_to_config` branch can call `hf_api().repo_exists(backbone)` before constructing a timm config. `TimmBackbone.__init__` explicitly requires `timm`; the existing wheel/requirements locks do not include it. `local_files_only=True` alone must not be assumed to suppress that separate config-time lookup.

Two possible future resolutions require separate review: (1) hash/license/dependency qualify a necessary timm package and construct an explicit equivalent local TimmBackboneConfig without the lookup, or (2) prove a native Swin mapping and exact checkpoint tensor/key equivalence. Neither is implemented or assumed correct. Do not set `use_timm_backbone=False` and silently accept missing keys. Missing/unexpected/mismatched tensors must fail. Both could retain the pinned torch/Transformers versions, but unchanged-environment OmDet compatibility is **not established**.

OmDet also decorates deformable attention with `use_kernel_forward_from_hub`. Static inspection shows a local PyTorch `grid_sample` implementation and a no-op decorator when `kernels` is absent; the current lock has no `kernels`. Future worker must set `USE_HUB_KERNELS=NO`, forbid kernel installation/downloads and retain the local path. The old `disable_custom_kernels` config field alone is insufficient evidence of isolation.

**OWLv2 appears compatible without additional packages by static inspection**, but no import, checkpoint load or CUDA execution was attempted. Its tokenizer config contains a stale publisher-local absolute `tokenizer_file` path, while no tokenizer.json is in the snapshot. A later fixed host loader must explicitly use the pinned vocab/merges and ignore that stale path (`tokenizer_file=None` or equivalent reviewed explicit local constructor); no arbitrary path reads or fallback downloads. This is a loader contract to verify, not a change made to the publisher file. Use the pinned processor's actual postprocessor API rather than outdated card examples.

Safety gate before either future run: strict safetensors loading; no remote code; no repository Python; read-only cache; fixed worker allowlist; controlled config; no ambient secrets; network none; no kernel/backbone/inference downloads. Any path requiring a different package or runtime image gets a new reviewed manifest rather than changing B1/B3 pins. Existing registration/license guards remain evaluation-only.

### Exact local source evidence

These SHA-256 values are computed from the verified wheel member bytes, not a mutable online source checkout:

| Wheel member | SHA-256 |
| --- | --- |
| `transformers/models/omdet_turbo/configuration_omdet_turbo.py` | `3834b77cda1f88309965bdda303aacd6ff5a6d7888113b61956f4d4e551c77e0` |
| `transformers/models/omdet_turbo/modeling_omdet_turbo.py` | `a8ba81a2f54aab23db0564b91802dfe85d14a11972161fa3e022a396c9781b5f` |
| `transformers/models/omdet_turbo/processing_omdet_turbo.py` | `fe77e6306ac08bb566d4ef9fce9ac8e15a4ea0f05b063419c6093cc1e9402154` |
| `transformers/models/owlv2/configuration_owlv2.py` | `48e3c999da5a66591fbf3ba902a8b5a969d62ad9a263b5de7bb1e03475809e70` |
| `transformers/models/owlv2/modeling_owlv2.py` | `eb1eb2b9eb6ab8ca47cd607014f22e6b4065051aa42a569a8372f10ea8b1adcd` |
| `transformers/models/owlv2/processing_owlv2.py` | `f65c8ba95217ec1b95ab8411b61021d28ed8cece632bdac512000a290dbb449c` |
| `transformers/models/owlv2/image_processing_owlv2.py` | `caf25d061e4373dbf36712f283084f1d17067d9355d22c94e425e8759003ec7f` |
| `transformers/backbone_utils.py` | `30c5bab3388cdc82f6dcc9e49e027d95f209ddb6a40b461584e09a8646252a30` |
| `transformers/models/timm_backbone/modeling_timm_backbone.py` | `89c176f4fd819816b4de69a061a0620c1f32723bec58862c9cfe8bb504d7d17f` |
| `transformers/integrations/hub_kernels.py` | `a58d58697a463494e66f0384efee75bf1095a17fceda3d0374f8f6039befdb85` |

## Frozen comparison vocabulary and mapping

Version **`roomstager-alternative-taxonomy-c1-v1`**. Ordered 0-based list; same bare semantic targets for both alternatives. No model-generated rewriting, prompt expansion, per-room vocabulary changes or ground-truth hints. OmDet receives `text=[classes]` and the fixed task above; OWLv2 receives `text=[classes]`. No photo-of templates or query ensembles are added. Model name “ensemble” denotes the checkpoint variant, not permission to run extra prompt ensembles.

```json
["window","door","doorway","opening","sliding door","balcony door","closet door","fireplace","built-in cabinet","built-in shelving","stairs","staircase","electrical outlet","vent","light fixture","sink","toilet","bathtub","shower","stove","oven","refrigerator","dishwasher","mirror","sofa","chair","table","dining table","coffee table","bed","nightstand","dresser","cabinet","rug","desk","floor","wall","ceiling"]
```

Canonical compact UTF-8 JSON plus one LF SHA-256: `9c88c274957db5f11731121b3d83e3d17fa3ad6bab82d48c10df7acadf646dee`.

| Indices / input phrases | Canonical class / subtype |
| --- | --- |
| 0 window | window / window |
| 1 door | door / door |
| 2 doorway; 3 opening | opening / doorway; opening / opening |
| 4 sliding door; 5 balcony door; 6 closet door | door / sliding-door; balcony-door; closet-door |
| 7 fireplace | fireplace / fireplace |
| 8 built-in cabinet; 9 built-in shelving | built-in / cabinet; shelving |
| 10 stairs; 11 staircase | stairs / stairs (equivalent alias) |
| 12 electrical outlet; 13 vent; 14 light fixture | outlet / outlet; vent / vent; fixed-light / light-fixture |
| 15 sink; 16 toilet; 17 bathtub; 18 shower | plumbing-fixture / corresponding input noun |
| 19 stove; 20 oven; 21 refrigerator; 22 dishwasher | fixed-appliance / corresponding input noun |
| 23 mirror | mirror / mirror |
| 24 sofa; 25 chair; 26 table; 27 dining table; 28 coffee table; 29 bed; 30 nightstand; 31 dresser; 32 cabinet; 33 rug; 34 desk | furniture / sofa, chair, table, dining-table, coffee-table, bed, nightstand, dresser, cabinet, rug, desk respectively |
| 35 floor; 36 wall; 37 ceiling | corresponding surface class / same noun; experimental only |

Keep queried alias index in provenance even when canonical aliases agree. Reject out-of-range/noninteger indices; do not convert them to a confident class. Invalid mapping is a protocol failure; valid index with wrong visual meaning is a semantic error. Unknown/ambiguous counts must separately report protocol invalidity, within-box conflicting canonical hypotheses and unresolved visual ambiguity. Do not claim semantic certainty merely because every valid index has a known name. Geometry/permanence/door state stay unknown.

## Predeclared detector-only comparison

Use exactly the seven existing development sources, identities and annotations in [the fixed annotations](../../benchmarks/staging/scene-smoke-annotations.json), with their current SHA-256 values. No customer or new web images. No annotation changes or extra precision masks. DINO B3 V3 remains the fixed historical baseline; do not rerun/tune it. Both alternatives consume the identical C1 target list. B3 used its earlier vocabulary/grouped prompts, so this is an operational comparison, not a controlled claim that architecture alone caused any difference. The C1 furniture diagnostic list omits plant; report that B3 plant miss as **out-of-vocabulary** for C1 rather than a misleading newly improved diagnostic score.

1. After separately authorized compatibility/acquisition, execute detector-only, batch one, sequentially. Preserve source/canonical hashes, full query order, task, raw logits/boxes or bounded lossless evidence, native query counts, class IDs, pre/post-NMS counts and all decisions. No SAM compute yet.
2. Freeze four score operating points **0.10, 0.20, 0.30, 0.40**, applied to the same raw output where possible, no per-class/per-room tuning. Scores are not calibrated across models. Report the complete curve, not just the winning point. OmDet native class-aware NMS uses **0.50**; OWLv2 text detection has no native NMS. Record this native difference explicitly. No objectness multiplication/filter tuning for OWLv2.
3. Common host consolidation only for same canonical class **and subtype** at IoU >=0.80, retaining contributing query IDs. Stable order: descending raw score, class/subtype, coordinates, query index. Never merge incompatible classes or silently pick a confident winner. Report before and after consolidation. Do not delete false structure because another label overlaps it.
4. Retain up to 256 mapped hypotheses per case, with a fail-closed overflow marker; preserve bounded raw evidence. Do not silently truncate and score the survivors. Native bounded top-k must also be disclosed (OmDet 900 proposals; OWLv2 60x60 spatial grid at 960/16, with max-class text postprocessing). No global top-k chosen after results.
5. Strict matching remains original annotation order, highest-IoU unused **same canonical class, IoU >=0.5**. Door, opening and window matches/misses are separate. Pane/assembly/doorway grouping diagnostics cannot convert strict misses to matches. Record best same/alternative-class extent, mapping failure, absent proposal and future SAM-budget eligibility separately.
6. Report critical recall (overall and by class/case), strict matches/IoUs, eight-class architecture review burden (door/opening/window/fireplace/built-in/stairs/plumbing-fixture/fixed-appliance), total retained proposals, unknown/ambiguity, furniture subtype mistakes/misses, detection load/inference/wall latency, worker RSS, CUDA allocated/reserved peaks and admission measurements. No measured performance exists in C1.
7. Reuse the B3 architecture-review rules with the same limitations: flag counts are development agent review, not exhaustive precision ground truth. Review every retained architecture proposal against the source. Distinguish true structure, class confusion, extent/grouping duplication, visible false structure and unresolved visibility. Unmatched annotation alone does not establish falsehood. Preserve per-proposal reason and avoid erasing the historical 124 flags through taxonomy changes. Report the unchanged proxy and separately adjudicated visual findings side by side.
8. Reuse [source-derived subtype diagnostics](../../benchmarks/staging/scene-subtypes-v2.json). Report best matching subtype errors separately from unmatched boxes, ambiguous alternatives and the excluded plant diagnostic. Surfaces remain experimental detector proposals with no mask/plane/placement authority; mask IoU and R2 false-safe rate remain N/A.

### Frozen development acceptance gate

This gate determines whether a candidate earns a later SAM evaluation, not production qualification:

- At least **14/15** original critical annotations strictly match; **all original door/opening annotations** must match. Any allowed single window miss must be confined to the existing low-resolution stress case; all other critical matches must be retained. Report any loss relative to DINO's 15/15 explicitly.
- Architecture-review flags **<=62** (at least 50% below B3's 124), with no hidden rise in unresolved architecture substituted for false positives. Require visual corroboration of the decrease. Absent-scene stairs <=3 and fireplaces <=1, the corresponding V1 levels. No class gets silently dropped to meet the total.
- No new severe false-structure class, no regression in the common in-vocabulary subtype error count, no unreported overflow; <=256 retained hypotheses in every case, **<=32 priority-critical hypotheses per case** under the existing selector. Unknown critical-origin ambiguity stays priority-critical where applicable. Do not raise SAM's cap.
- Deterministic query-index/canonical identity, exact source/box transforms, finite in-bounds nondegenerate boxes, valid provenance; no trust/isolation failures. Numeric CUDA bitwise reproducibility remains unqualified unless separately proven.
- Pass unchanged >=12 GiB host / >=10 GiB GPU admission and existing 8 GiB worker/timeout envelope. Out-of-memory/resource failure is a failure, not permission to lower a gate.

Choose among passing operating points lexicographically: fewest critical misses, then lowest architecture flags, then lowest unresolved architecture, then fewest subtype errors, then lowest retained count; prefer higher threshold on ties. Among passing candidates use the same quality ordering; speed is only a final tie-breaker. If neither passes, stop and report **no candidate qualified**. No additional prompts, threshold grid, model choice or endless tuning in the evaluation phase without a new predeclared design. Seven development images cannot establish generalization; independent precision/recall data and provenance clearance remain necessary before production.

## Hardware and SAM plan

Machine basis: RTX 4060 Ti 16 GiB VRAM, approximately 32 GiB system RAM. OmDet checkpoint is 461,822,656 bytes (~0.430 GiB); OWLv2 is 619,918,824 (~0.577 GiB). These are disk artifacts, not peak RAM/VRAM. Both are plausible batch-one GPU evaluation candidates on this machine, **an estimate only**. OmDet uses 640x640 input/900 proposals; OWLv2 960x960, patch16, approximately 3,600 spatial tokens, so attention/activation memory can be appreciably larger than weight size. No measured memory ceiling, FPS or speedup is claimed; upstream A100/TensorRT numbers are not this machine's results.

Host feasibility remains conditional on admission and Docker/model-loading overhead. Previous V3 RAM stops prove that 32 GiB installed is not sufficient evidence of available capacity. Evaluate one detector and one image at a time, with all other model workers stopped. Do not load both alternatives or SAM concurrently. Preserve current limits, record peaks, stop rather than retry into memory pressure. No hardware purchase recommendation.

SAM 2.1 remains unchanged. Only after the detector-only gate is passed and execution is separately authorized: alternative detector -> validated canonical class/box -> existing architecture-first selection -> SAM box prompts -> V3 validated mask publication. Keep exact shared references once, source observations separate, 32-mask cap, uncertainty and evaluation-only restrictions. No furniture placement, image rendering, R1.5 or R1.6 work.

## Future acquisition and qualification gates

This document is an **inactive acquisition plan**, not a new allowlisted runtime record. Suggested future cache identities `omdet-turbo-swin-tiny-hf-c1` and `owlv2-base-patch16-ensemble-c1`; use `.model-cache/r14b1/models/<id>/<exact-revision>/` only after reviewed records are authorized. Extend acquisition records separately; do not modify existing B1/B3 records or descriptors.

For each approved future candidate: exact revision + exact allowlisted files/table hashes; verify byte count and SHA-256 before private publication; owner-controlled ACL; no symlink/reparse escapes; safetensors only; read-only mount; fixed host worker; no secrets; offline flags and network none. Download into private staging and atomically publish only a complete verified bundle. Reject unlisted files, unexpected redirects/hosts, hash mismatches, missing configs or fallback fetches. Preserve license/model-card records. No `main`/`latest` in acquisition or execution records. Validate tensor keys/shapes and tokenizer/config invariants after acquisition in a separately authorized phase; no pickle fallback or permissive partial state loading.

Outstanding blockers: OmDet timm/dependency and config-time lookup; model-key/config compatibility unmeasured; OWLv2 stale tokenizer path/local loading; actual GPU/RSS/latency and accuracy; checkpoint-specific training-rights clearance for both; independent quality data beyond the seven development rooms. Florence remains deferred under the current [official Microsoft instructions](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/README.md), which explicitly request remote code. Do not weaken the boundary; a future native/vendored path needs its own review.

## C1 validation and stop boundary

Verified model revisions (40 lowercase hex), publisher artifact filenames/sizes/LFS SHA-256 (64 lowercase hex), all listed text sidecar byte counts/SHA-256 and Git blob identities; inspected native architecture/config/processor source from the hash-verified existing wheel. Source-code and model-license declarations checked separately. Text sources only were fetched; no weight GET/HEAD/range request was made. No new real weights, no model execution, no package install, no Docker worker, no production access.

Only this qualification document and the current-status paragraph in `scene-understanding-r1.md` are intended changes. Existing DINO evidence is immutable. Local document links and `git diff --check` passed. Original B2 raw-file SHA-256 values and Git-normalized B2/B3 evidence and annotation identities were verified unchanged; Windows checkout line endings were accounted for without rewriting evidence. No code/type tests are needed because no runtime code changed. Commit only C1 qualification; normal push to the existing draft PR; stop before acquisition, runtime implementation, SAM or detector evaluation.

Additional provenance pins: GLIP DATA.md revision `9dda9558c1ef59bb6cdc8e896e2bcab775a68ff0`; deferred Florence model-card revision `5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac`, SHA-256 `e49de5527bd39688745ce20388bf3f31fdb891abc0e6950a3f64630114769d17`. Florence metadata/card inspection does not qualify its weights.

Objects365 terms: reviewed 2026-10-03; no Git revision published for this web page; response SHA-256 `ddbf6281f219417dcddb2ff5f7cccd1a44fbbd5cccd453e283d1e5ebc68ccbce` (HTML/text snapshot, not a model artifact).

Apache-2.0 text: reviewed 2026-10-03; no Git revision published for this web page; response SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` (HTML/text snapshot, not a model artifact).
