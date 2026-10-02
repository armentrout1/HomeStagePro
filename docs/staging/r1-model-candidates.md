# R1.4A — detection and segmentation qualification packet

Research date: **2026-10-02**. Baseline: `f6a1d451217654cece38f684f10b5e4b081238df`, `refactor/staging-engine-boundary`, draft PR #3. Scope: documentation and static metadata/source review only. No model weights, package binaries or container images were downloaded; no model ran; no dependency was installed. Review identity: Codex engineering provenance triage, not independent legal review or legal advice.

## 1. Decision and scope

Evaluate **Grounding DINO Tiny → SAM 2.1 Hiera Small** first, on rights-cleared local fixtures. Keep **Microsoft Florence-2 Base** as a deferred comparator. This is an evaluation selection, not a claim that these models preserve architecture, segment room surfaces adequately, or are production-approved.

| Candidate | Intended role | Qualification decision | Production decision |
| --- | --- | --- | --- |
| IDEA Grounding DINO Tiny, official HF safetensors | Text-conditioned boxes for openings, architecture, fixtures and furniture | `APPROVED_FOR_EVALUATION` at engineering code/weight-license triage; execution still requires R1.4B approval and all gates below | `PRODUCTION_CANDIDATE_PENDING_PROVENANCE`; accuracy, source-data rights chain and operational isolation unresolved |
| Meta SAM 2.1 Hiera Small, official HF safetensors | Box-prompt mask refinement; not an independent semantic detector | `APPROVED_FOR_EVALUATION` at the same limited triage level; verify static-image compatibility of the video-labelled HF package | `PRODUCTION_CANDIDATE_PENDING_PROVENANCE`; no production approval |
| Microsoft Florence-2 Base, original official safetensors | Comparison for open-vocabulary boxes and referring-expression/region segmentation | Code/weight terms are evaluation-compatible; **execution deferred** until a reviewed native-runtime mapping or vendored-code route is qualified | `PRODUCTION_CANDIDATE_PENDING_PROVENANCE`; original remote-code layout and FLD-5B rights chain unresolved |
| NVlabs SegFormer / ADE20K-derived route | Possible dense surfaces, not selected | `NEEDS_COMMERCIAL_LICENSE`; excluded from this commercial-product evaluation plan | Blocked without a separate suitable license and dataset/provenance review |
| Official MaskFormer / Mask2Former model-zoo checkpoints | Possible dense surfaces, not selected | `REJECTED` for this commercial-product plan under current terms | Their official model-zoo documents explicitly specify CC-BY-NC-4.0; permissive code is not weight permission |

These decisions do **not** insert real records into the synthetic R1.3 runtime registry. None is `APPROVED_FOR_PRODUCTION`. A paper or public model-card tag does not establish end-to-end training-data clearance. Conversely, restrictions on access to a training dataset do not by themselves prove that a separately licensed checkpoint is unusable; that relationship remains an explicit review question.

## 2. Code, checkpoint and training-data evidence

| Candidate | Code license and exact source revision | Weight license evidence | Stated training provenance and unresolved issues |
| --- | --- | --- | --- |
| Grounding DINO Tiny | [IDEA repository](https://github.com/IDEA-Research/GroundingDINO/tree/856dde20aee659246248e20734ef9ba5214f5e44), Apache-2.0 | [Official pinned model card](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/README.md) declares Apache-2.0; HF snapshot has no standalone LICENSE | Official Tiny training table lists **O365, GoldG, Cap4M**. Keep that exact vendor description rather than treating the larger model's dataset list as Tiny's. Exact image-level grants, inherited backbone/text-encoder rights, and the HF conversion's complete lineage are not established by the short card. Review before hosting or redistribution. |
| SAM 2.1 Hiera Small | [Meta source](https://github.com/facebookresearch/sam2/tree/2b90b9f5ceec907a1c18123530e92e794ad901a4), Apache-2.0; optional cc_torch code has a separate BSD license | Meta's pinned README expressly includes SAM 2 checkpoints under Apache-2.0; [official HF card](https://huggingface.co/facebook/sam2.1-hiera-small/blob/ee5bba1d82bb8749febdf90f45e84b687142ba03/README.md) also declares Apache-2.0 | [SAM 2 paper, D.2.2](https://arxiv.org/html/2408.00714v2) distinguishes experiments using DAVIS/MOSE/YouTubeVOS from released-model training on **SA-1B, SA-V manual and Internal**. Internal videos are described as licensed. Do not claim independent verification or that every SAM 2.1 conversion has a complete published sample-level manifest. Verify the 2.1 release lineage and dataset terms separately; importing a model does not authorize acquiring its datasets. |
| Florence-2 Base | Microsoft's source is the [pinned model repository](https://huggingface.co/microsoft/Florence-2-base/tree/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac), including three Python files; MIT. No separate official `microsoft/Florence-2` GitHub repository was verified (that URL returned 404). Native Transformers code is separately Apache-2.0. | [Pinned Microsoft LICENSE](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/LICENSE) and model-card MIT declaration | Vendor describes **FLD-5B: 5.4 billion annotations on 126 million images**. This does not supply per-image licenses, consent/privacy clearance or a distributable training corpus. Pseudo-label provenance and inherited components remain unresolved. Do not infer rights from MIT alone. |

Apache-2.0 code/checkpoint terms permit commercial uses subject to their conditions; retain the license, relevant copyright/attribution, modification notices and any applicable upstream NOTICE when distributing derivatives. MIT requires retaining its copyright and permission notice with copies/substantial portions. No applicable NOTICE was separately verified in the selected model snapshots; this is a check-before-distribution item, not permission to omit one. Evaluation is local only; redistribution of models is **not approved by this packet**, even where the stated license would permit it subject to obligations. Production hosting requires the unresolved provenance/quality/security gates to be signed off.

The [SegFormer source license](https://raw.githubusercontent.com/NVlabs/SegFormer/65fa8cfa9b52b6ee7e8897a98705abf8570f9e32/LICENSE) restricts use to noncommercial research/evaluation. [ADE20K image terms](https://ade20k.csail.mit.edu/terms/) separately restrict the image database to noncommercial research/education and say MIT does not own the image copyrights. Website/annotation licensing is a different layer. [MaskFormer](https://raw.githubusercontent.com/facebookresearch/MaskFormer/da3e60d85fdeedcb31476b5edd7d328826ce56cc/MODEL_ZOO.md) and [Mask2Former](https://raw.githubusercontent.com/facebookresearch/Mask2Former/9b0651c6c1d5b3af2e6da0589b719c514ec0d69a/MODEL_ZOO.md) explicitly mark their downloadable model-zoo weights CC-BY-NC-4.0. Do not transfer an MIT code label to those files or presume a third-party conversion changes their terms.

## 3. Exact weight plan

The following SHA-256/byte counts are **publisher-reported LFS metadata**, read from the official HF API on the research date. They are not locally recomputed weight hashes. A later authorized acquisition must verify actual complete bytes before use. Git blob IDs, HF commit IDs and Xet identifiers are not substituted for SHA-256.

| Record | Official model repository revision | Planned weight file | SHA-256 | Bytes |
| --- | --- | --- | --- | ---: |
| `gd-tiny-hf-v1` | `IDEA-Research/grounding-dino-tiny` @ `a2bb814dd30d776dcf7e30523b00659f4f141c71` | `model.safetensors` | `1a2412ef99bd74bcd3c2a246fa1e48581f8889a1300c9051974741314fc042f3` | 689359096 |
| `sam21-small-hf-v1` | `facebook/sam2.1-hiera-small` @ `ee5bba1d82bb8749febdf90f45e84b687142ba03` | `model.safetensors` | `0a4067b11ce1e23d5229203f11c718a823060d15a4b23fa2372a7d4b77cbbc60` | 184305280 |
| `florence2-base-ms-v1` (deferred) | `microsoft/Florence-2-base` @ `5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac` | `model.safetensors` | `03075d2d2d2bbd3e180b9ba0afae4aa8563226e2d32911656966e05b2f2ee060` | 463221266 |

Evidence: [Grounding DINO metadata](https://huggingface.co/api/models/IDEA-Research/grounding-dino-tiny/revision/a2bb814dd30d776dcf7e30523b00659f4f141c71?blobs=true), [SAM metadata](https://huggingface.co/api/models/facebook/sam2.1-hiera-small/revision/ee5bba1d82bb8749febdf90f45e84b687142ba03?blobs=true), [Florence metadata](https://huggingface.co/api/models/microsoft/Florence-2-base/revision/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac?blobs=true). Exact acquisition URL is `https://huggingface.co/{repository}/resolve/{40-character-revision}/{filename}` using only these literal manifest values. No `main`/`latest` lookup during acquisition or inference.

Primary weights total **873,664,376 bytes** (873.66 MB decimal; about 833.19 MiB). Including the deferred comparator: **1,336,885,642 bytes** (1.337 GB decimal; about 1.245 GiB). Sidecars add a few MB; Python/PyTorch/CUDA environments and extracted caches are separate and can consume many GB. Reserve 20 GB for a later isolated runtime, weights, temporary acquisition and bounded diagnostics; this is a planning allowance, not measured installation size.

Do not acquire `pytorch_model.bin`, native `.pt` alternatives, examples or unrelated files via a whole-repository snapshot. For comparison only, the official SAM native `sam2.1_hiera_small.pt` metadata is 184416285 bytes, SHA-256 `6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38`; it is **not** the selected artifact. Safetensors avoids pickle execution, but still needs size/shape limits and trusted loader code. `torch.load(weights_only=True)` is not equivalent to a complete sandbox, and pickle is not needed for this first path. See [safetensors format](https://huggingface.co/docs/safetensors/index) and [PyTorch serialization guidance](https://docs.pytorch.org/docs/2.14/notes/serialization.html).

### Required metadata/code by candidate

- **Grounding DINO:** `config.json`, `preprocessor_config.json`, `tokenizer.json`, `tokenizer_config.json`, `special_tokens_map.json`, `added_tokens.json`, `vocab.txt`; preserve README/license evidence separately. Use the native Transformers `GroundingDinoForObjectDetection` and `GroundingDinoProcessor`, not the original repository's extension-building installation. No model-repository Python is required. BERT configuration is embedded; reject attempts to fetch an independent BERT/Swin checkpoint.
- **SAM:** `config.json`, `preprocessor_config.json`, `processor_config.json`; keep the original YAML and `video_preprocessor_config.json` as conversion/audit evidence, not permission to run video. No tokenizer. Prefer explicit native `Sam2Model`/`Sam2Processor` classes from the pinned Transformers distribution. The actual package declares `Sam2VideoModel`, `sam2_video`, `Sam2VideoProcessor` and `Sam2ImageProcessorFast`: therefore static-image loading/config normalization and known unused video-weight keys must be tested and recorded in R1.4B. Never globally ignore missing/unexpected keys. A reviewed image-only configuration mapping must have its own derived hash; unexpected core key differences block execution. No silent fallback to `.pt` or automatic upstream installation.
- **Florence:** official `config.json`, `preprocessor_config.json`, `tokenizer.json`, `tokenizer_config.json`, `vocab.json`, LICENSE; original custom files are `configuration_florence2.py`, `modeling_florence2.py`, `processing_florence2.py`. Hashes are recorded below for review, **not approved execution**. The original configs have `auto_map`. Current [native Transformers Florence documentation](https://github.com/huggingface/transformers/blob/a906d3c4b65095f2308b6a6a193e934d03b8eb5d/docs/source/en/model_doc/florence2.md) uses `florence-community/Florence-2-base`. Native support exists, but official Microsoft checkpoint/config compatibility without custom code was not executed or established. Preferred future route: reviewed deterministic config/key mapping to built-in classes, with conversion lineage and parity tests. Otherwise separately review/vendor the exact Microsoft Python files and their additional dependencies; do not enable mutable remote code. Neither route is included in the primary install plan.

Runtime source pin: **Transformers 5.18.0**, Git tag resolved to `a906d3c4b65095f2308b6a6a193e934d03b8eb5d`, Apache-2.0. [SAM static-image documentation](https://github.com/huggingface/transformers/blob/a906d3c4b65095f2308b6a6a193e934d03b8eb5d/docs/source/en/model_doc/sam2.md) demonstrates native image classes for the official 2.1 family; small-checkpoint compatibility remains a measured gate. Original IDEA/Meta code pins above are upstream provenance, not instructions to install those repositories. Runtime wheel hashes must be recorded in the reviewed installation lock.

## 4. Hardware audit and resource expectations

Read-only local inspection on 2026-10-02; available memory is a momentary snapshot.

| Item | Observed |
| --- | --- |
| OS | Windows 11 Home, 64-bit, version `10.0.26200` |
| CPU | AMD Ryzen 7 7700, 8 cores / 16 logical processors |
| RAM | 31.16 GiB OS-visible total; **6.75 GiB available** during audit |
| NVIDIA GPU | GeForce RTX 4060 Ti, **16380 MiB VRAM**, 14154 MiB free at query time |
| Driver/CUDA | Driver `591.86`; `nvidia-smi` advertises CUDA compatibility **13.1**; installed `nvcc` toolkit **12.8.61**. These are different facts. No PyTorch CUDA computation was tested. |
| Python | `C:\Python312\python.exe`, **3.12.6**; no `py` launcher found on PATH |
| Node | `C:\nvm4w\nodejs\node.exe`, **24.11.1** |
| Docker | Client/Engine **28.3.3**, Docker Desktop **4.45.0**, Linux engine on WSL2 kernel `6.6.87.2-microsoft-standard-WSL2`; engine responded. No container was launched; GPU passthrough was not tested. |

Engineering estimates below are allocation budgets, not official measured minima, observed peaks or latency claims. Weight bytes alone exclude activations, attention buffers, decoded images, imports, allocators and CUDA context. Batch size one, fixed prompts, sequential components and no training are assumed.

| Candidate | CPU-only feasibility | Current GPU / planning envelope | Future production target |
| --- | --- | --- | --- |
| Grounding DINO Tiny | Native path supports CPU; slower diagnostic fallback, throughput unknown | Likely suitable on 16 GB; budget 2–6 GiB VRAM and 4–8 GiB host RSS initially | One isolated job on at least 16 GB VRAM; benchmark before concurrency/SLA |
| SAM 2.1 Small | CPU image inference is a candidate, not validated here | Likely suitable; budget 1–4 GiB VRAM and 3–6 GiB RSS, one image embedding, prompts in small fixed batches | Same sequential worker class; avoid video state and unbounded automatic mask generation |
| Florence Base | Possible native FP32 comparator after conversion review | Budget 2–6 GiB VRAM / 4–8 GiB RSS; generation token cap required | Deferred until functional/provenance qualification |

A GPU is not mathematically required for these operations, but the existing GPU is the recommended evaluation path. **No hardware purchase is justified yet.** Require at least 12 GiB available host RAM and 10 GiB available GPU memory before the proposed run; current free host RAM is below that admission threshold. Do not start parallel models to work around this. Close other work or reschedule when R1.4B is authorized. CPU and GPU results get separate timing/numerical records.

Use prebuilt PyTorch CUDA **13.0** wheels with this driver; do not infer that the installed 12.8 compiler selects the wheel runtime. No native custom extension or compiler upgrade is planned. Verify actual GPU use, driver/wheel compatibility and container access before admitting a real task. Installation and base-image security review remain necessary; the audited Python/OS versions are observations, not security certification.

## 5. R1.4B architecture and exact R1.3 changes

Proposed flow: Node/TypeScript runner → reviewed isolated Python worker → pinned local native Transformers code and safetensors → bounded observations/binary masks → existing host validator/store. Do not embed PyTorch into Node.

Prefer a **Linux worker container on the already available Docker/WSL engine**, with no network, a private read-only model cache, bounded input mounts/pipes, read-only root, non-root identity, dropped capabilities, no Docker socket in the worker, a bounded temporary directory and explicit cgroup memory/CPU limits. Pin the built image by digest, not a mutable tag. A container/GPU qualification probe is an R1.4B prerequisite; it is not performed here. A native Windows Python backend is a fallback only after reviewed Job Object process-tree/resource control and OS outbound-deny rules are demonstrated. Python monkeypatching or offline environment flags alone are insufficient.

For container execution the host must manage a generated container ID through stop/kill/wait and verify it is stopped; killing only the Docker CLI is not termination. No model-provided name, volume path, flag, command or executable is accepted. Every command is an argument vector with `shell=false`. Neither backend can be enabled solely by an environment variable or customer request.

| Existing R1.3 file / restriction | Minimal reviewed generalization in R1.4B | Preserve / test |
| --- | --- | --- |
| `components/types.ts`: literal synthetic backend, ≤1 GiB advisory memory, ≤60s deadline; observations reuse R1.1 | Add a discriminated real-local backend policy with fixed implementation ID and measured resource fields. Keep current synthetic policy intact. Real GPU budget: 8 GiB host hard limit; 120s per component including load; CPU comparison 300s; enclosing host deadline 300s GPU / 720s CPU. These are provisional cutoffs, not latency promises. | No new trust fields; no path/command fields; policy min/max tests; timeout records distinct from success. Do not globally loosen every synthetic limit. |
| `components/registry.ts`: implementation WeakSet comes only from `fake.ts` | Move identity issuance behind a reviewed factory allow-list: `synthetic-test-worker`, `grounding-dino-tiny-hf-v1`, `sam21-small-hf-v1`; reserve but do not enable Florence. Bind each to exact worker-code digest, runtime lock, artifact bundle and dependency roles. | Unknown IDs, spoofed instances, duplicate identities, cycles and role mismatches still reject. No generic plugin/module-path loader. |
| `components/runner.ts`: hardcoded synthetic worker hash/config, one license/revision, deterministic=true | Resolve the fixed descriptor; verify independent adapter/runtime/weight/config/tokenizer/license pins and current approval. Record device/dtype/seed/deterministic settings and real nondeterminism. Persist dependency receipt digests, prompt/config hashes and runtime lock. Add a whole-job supervisor before input verification; cancellation must cover startup and worker exit. | Frozen same-run/source receipts, raw estimated scores, exact host-owned metadata and existing artifact validation remain. No automatic retry/provider fallback. No deterministic=true merely because a seed exists. |
| `components/backend.ts`: fixed Node `.mjs`, JSON input only, stdout JSON + fd3 binary | Add fixed Python/container entrypoints selected only by the host descriptor. Supply verified canonical bytes/selection through bounded binary input or fixed host-generated read-only paths; the current metadata-only input is insufficient for real inference. Use a versioned length-delimited protocol over container stdin/stdout, separating JSON and binary frames, with stderr bounded independently. Hash/size-check bytes at both ends. | No path from a model/request; no shell; bounded serialization; timeout/cancel kill-and-wait for the whole worker/container; no orphan tests. Never parse mixed log text as result JSON. |
| `licenses.ts`: `synthetic:true`, one shared revision/code+weight association | Keep synthetic branch; add strict `real-local` bundle records with separate source/adapter/runtime/model revisions, file roles/formats/sizes/hashes, conversion lineage, code/weight/data evidence and explicit execution context. Evaluation approval cannot satisfy production. Dated snapshots and operator approval remain required. | No replacement with a permissive boolean. Missing/unclear/noncommercial/incompatible rights fail closed; source URLs remain acquisition-only data. |
| `SyntheticArtifactCache`: synthetic JSON stored in R1.2 scene store, process-local index | Add a **separate private pinned-model cache**, with streamed hash/size verification and atomic manifest publication. Largest selected weight is ~689 MB; it cannot go into the 64 MiB-per-artifact / 128 MiB-per-run scene store. Stream bytes rather than buffering whole weights in Node. Persist availability manifest and verify it on every open. | Do not increase image-store limits to fit models. No fetch from inference, symlink/path substitution, partial publication or version substitution; readonly mounts during inference. |
| `components/fake.ts`: synthetic transport + reference replacement intertwined | Leave fakes for regression tests; extract only the reviewed bounded transport/artifact-ingestion helper used by both fixed implementations. Real workers cannot create arbitrary host keys or publish manifests. | Synthetic tests continue unchanged where possible; binary length/hash/quota checks apply to real output. |
| `runner.ts` observation lineage check currently requires exactly `[currentRunId]` | Detection emits new IDs; segmentation emits distinct IDs and links to the validated detection via `relatedElementIds`. If both run IDs are needed, allow only current plus runner-validated direct dependency IDs in a narrow tested rule. Start with current run in `componentRunIds` and dependency link, avoiding schema changes. | Do not permit arbitrary component-run references, duplicate element IDs across results, or a mask to redefine the detector's semantic evidence. |

Python loaders receive a verified local directory, `local_files_only=True`, `trust_remote_code=False`, explicit built-in model/processor classes and `use_safetensors=True`. Set offline/telemetry-disabled environment flags, prohibit dynamic kernels/downloads and keep networking denied at the OS/container layer. Do not use `device_map='auto'` or accelerate; select CPU or one GPU explicitly. Package the full locked dependencies before inference. No pip, hub client, remote repository, auto-conversion service or asset fetch may run inside a task. Dependencies may contain network-capable libraries transitively; their presence does not grant egress.

## 6. Detection → segmentation behavior

1. Verify R1.2 canonical artifact and source/selection binding. Preserve canonical pixels; model resizing/normalization is internal with recorded transforms. Return boxes/masks mapped to the canonical frame. Reject unexplained crop/scale changes.
2. Run the fixed vocabulary groups below independently, lowercased and period-delimited. Tokenizer/processor bytes are pinned. Verify token count against model limits before inference; no silent truncation or user prompt interpolation. Fixed group order and sorting make label meaning reproducible.
3. Proposed initial raw-score operating point: box threshold **0.20**, token/text threshold **0.20**, chosen before evaluation to favor recall. These are not calibrated probabilities. Emit all retained candidates with native score type and prompt-group provenance. Sweep a predeclared development-only grid `{0.15,0.20,0.25,0.30}`; freeze the selected values before held-out access.
4. Deterministic deduplication: same canonical class/subtype aliases only, descending native score, then prompt-group order and coordinates as tie-breakers; greedy IoU ≥0.80. Keep a bounded provenance list for suppressed aliases. Never merge door leaf with doorway/opening, cabinet with built-in, mirror with window, or two plausible adjacent instances. Retain conflicting hypotheses with unknown permanence. More than 128 retained boxes or 32 segmentation prompts triggers explicit resource/coverage abstention, not silent dropping of low-score critical openings.
5. Send validated boxes to SAM, fixed maximum prompt batch four, one image embedding, no video memory. Keep native predicted-IoU/mask score as `estimated`; it is not empirical calibration. Record all bounded alternative masks; choose the highest native score with deterministic tie-breakers only for the diagnostic primary mask. Record ambiguity rather than implying independent model agreement establishes truth.
6. Map box/mask to R1.1 `SceneElement`; binary membership PNG mask in the R1.2 store. Preserve original box observation separately. Related IDs link semantic detector and mask observation. Permanence starts `unknown` where installation cannot be established from the image; a refrigerator/cabinet label alone does not make an object fixed. No verified confidence, independent absence, safe region or edit permission is issued.
7. Missing detections do not establish absence. Coverage stays partial until independent evidence supports broader inspection. Unknown/unsupported surfaces and tiny fixtures remain explicit; downstream policy must abstain or request review. This phase does not add R2 placement policy or customer staging.

### Versioned vocabulary: `roomstager-r1-detection-v1`

Canonical mapping is a design decision using the existing R1.1 classes, not new schema classes:

| Group / terms | R1.1 class / subtype rule |
| --- | --- |
| door; sliding door; balcony door; closet door | `door`; subtype retains `sliding-door`, `balcony-door`, `closet-door` where supported. Generic door remains generic. |
| doorway; open doorway | `opening` / `doorway`; do not collapse into a visible door leaf |
| window | `window` |
| fireplace | `fireplace` |
| built-in cabinet; built-in shelving | `built-in` / cabinet or shelving; ordinary cabinet is a competing movable hypothesis |
| staircase; stairs | `stairs` aliases |
| electrical outlet; wall outlet | `outlet` aliases |
| vent; air vent | `vent` aliases |
| light fixture; ceiling light; ceiling fan | `fixed-light` proposal, subtype retained; floor/table lamps are not silently treated as fixed |
| sink; toilet; bathtub; shower | `plumbing-fixture` with separate subtype |
| stove; oven; refrigerator; dishwasher | `fixed-appliance` candidate subtype with permanence unknown until attachment is supported |
| mirror | `mirror`, permanence unknown |
| sofa; couch; loveseat; sectional | `furniture` / sofa-family; retain loveseat/sectional subtype rather than erase meaningful shape differences |
| chair; armchair | `furniture` / chair-family |
| coffee table; dining table; table | `furniture` / corresponding table subtype |
| desk; bed; nightstand; dresser; cabinet; rug | `furniture` with each subtype; dresser and cabinet are not automatically built-ins |
| furniture; foreground object | `furniture` / unknown-furniture, or `foreground-object`; unresolved semantic predictions remain `unknown` |
| floor; wall; ceiling | Corresponding surface class; exploratory support only, not assumed reliable from object detection |

The exact prompt groups, serialized byte rule and SHA-256 appear in Appendix C. Any synonym, ordering, threshold, grouping or canonical mapping change requires a new version/config digest. Prompt hashes alone do not cover model/processor/mapping changes; the configuration manifest binds all of them. Free-form customer text is not allowed to redefine this vocabulary.

## 7. Surface-segmentation experiment and alternatives

Grounding DINO detects objects; SAM segments prompted regions, not room semantics. Floor/wall/ceiling are extended, occluded, reflective and sometimes disconnected regions. A box enclosing the room can produce furniture or multiple surfaces instead of the intended surface. **Surface support is unproven.**

Compare three separately labelled diagnostic arms on the same annotations: (A) detector-produced surface boxes → SAM; (B) SAM with an independently annotated oracle box/points to measure refinement potential separately from automatic detection; (C) fixed image-grid seeded SAM proposals without semantic certification. Oracle/manual prompts must never be reported as automated end-to-end results. Use visible-only surface masks, holes for occluding furniture/openings, per-surface connected components, IoU, boundary metrics and protected-opening leakage. The wall class cannot absorb windows/doors. Test carpet/rug confusion, ceiling fans, mirrors, dark floors, strong perspective and partial views explicitly.

If arm A fails thresholds, do not mark surface coverage complete or substitute ADE20K weights. Next options, in order: maintain unsupported/unknown and use reviewed annotation in development; evaluate deterministic seeded SAM only as proposals with separate semantic validation; design geometry/depth-assisted estimates in **R1.5** under separate authorization; later train/fine-tune a surface component on documented rights-cleared/in-house data. No additional commercially clear automatic surface checkpoint has been qualified by this packet. All new pretrained alternatives require the same code/weight/data evidence, not a benchmark-only selection.

## 8. Benchmark and annotation plan

Use the existing [benchmark inventory](../../benchmarks/staging/README.md) and manifest identities. It contains **seven development sources**, including four existing app photographs and three documented CC0 stress cases; one app source is only 249×148. Verify each source's existing rights record before reuse; repository presence is not new permission. Do not download more imagery or use customer photos in this phase. Seven images are smoke coverage, not representative evidence, and no held-out results currently exist.

Expand under separate source authorization to the existing target of **30 development rooms, 10 held-out rooms and 10 repeat cases**, grouping all views/crops by `roomIdentity`. Require sufficient class instances: aim for at least 100 independently annotated critical door/window/opening instances overall, at least 20 per critical class and varied room/property types; expand beyond 40 rooms if needed. Those counts are still a development qualification sample, not a production rare-failure bound. Obtain two independent annotations plus adjudication for critical architecture. No model labels its own ground truth.

Per instance: canonical source SHA, visible polygon/mask, class/subtype, truncation/occlusion, uncertain boundary band, fixed/movable/unknown, tiny-object tag, annotator/date, disagreement and source-rights ID. For floor/wall/ceiling label **visible** surfaces with holes; do not hallucinate occluded extents. Include fireplace, built-ins, stairs, doors/openings/windows, all important fixed classes and furniture. Include negative images and confusing pairs (mirror/window, cabinet/built-in, rug/floor, open door/opening). Block the 249×148 photo from accuracy claims requiring fine boundaries; retain it as an explicit low-resolution abstention test.

Measure per class and per challenge slice: matched object recall/precision, raw false-negative counts (including missed/abstained instances), mask IoU, boundary F1 within a normalized tolerance, symmetric boundary-distance percentiles divided by image diagonal, raw-score distributions, support/abstention rates, cold and warm latency, host peak RSS and GPU peak allocated/reserved memory when measurable. Match predictions one-to-one to annotations; report box IoU≥0.5 detection recall separately from mask quality. Report confidence intervals and denominators; related views are not independent observations.

**Unsafe miss:** a visible annotated door/window/opening missed or materially under-covered **and then treated as safe by downstream policy**. Count this separately, never inside mAP. R1.4 has no safe-region output, so actual downstream unsafe-miss and false-safe-region rates are **not measurable yet**, not automatically zero. Test the contract that no R1 result grants safety and use a diagnostic proxy: critical annotation pixels omitted by all retained critical hypotheses, with unknown areas remaining unknown. Later R2 must measure actual false-safe outcomes. Separate raw detection misses, mask undercoverage, abstentions and downstream unsafe misses.

## 9. Predeclared development acceptance criteria

These are proposed qualification gates frozen before the first real evaluation, not achieved results. Freeze dataset/split/annotation/prompt/model hashes; tune only on development, then one held-out assessment. A threshold change after held-out inspection requires a new held-out set or explicit exploratory status.

| Gate | Proposed requirement |
| --- | --- |
| Critical opening detection | Overall door/window/opening recall ≥0.98 at box IoU≥0.5; each class ≥0.95; report raw counts and confidence intervals. Any miss triggers case review; small sample cannot certify production reliability. Abstained images still contribute misses to raw recall. |
| False safety | Zero authority/safe-region fields in R1 output. Zero actual unsafe misses when a later R2 policy is evaluated; rate and denominator separate. Until then label actual false-safe rate N/A, and publish the diagnostic critical-undercoverage rate. |
| Critical masks | Median per-instance IoU ≥0.85; 10th percentile ≥0.70; boundary F1 ≥0.90 at tolerance 0.003×image diagonal; 95th-percentile normalized symmetric boundary distance ≤0.005. Review every opening mask that spills into/omits an adjacent opening or room boundary. Tiny fixtures get separate pixel-scale reporting, not exemption from being unknown. |
| Other architecture | Fireplace/built-in/stairs recall ≥0.95 where sample minimum is met; no class claim based on absent examples. |
| Fixed fixtures | Per-class recall ≥0.90 and median mask IoU ≥0.70 where measurable; otherwise mark unsupported/partial and require review. Outlet/vent misses cannot silently imply editable wall. |
| Surfaces | Each of floor/wall/ceiling mean IoU ≥0.85, 10th percentile ≥0.70, boundary F1 ≥0.90, and explicit opening holes; failure disables automatic support rather than averaging with furniture scores. |
| Precision / abstention | Critical-class precision ≥0.80; report false positives and empty-room over-detection. ≥80% development images should complete diagnostic processing within limits, but abstention on every ambiguous case is allowed for safety. High abstention fails usefulness qualification; it never justifies weakening safety. |
| Output/resource caps | Metadata input ≤1 MiB; new canonical binary input ≤32 MiB; result JSON ≤1 MiB; stderr ≤64 KiB; total output artifact bytes ≤16 MiB per component; ≤32 mask artifacts; scene-store 64 MiB/artifact and 128 MiB/run unchanged. Count/decode/byte overflow rejects explicitly. |
| Execution | Sequential batch-one evaluation; 8 GiB host memory hard cap in qualified container, admission free-RAM threshold 12 GiB; GPU peak target ≤8 GiB, advisory unless enforced by a suitable GPU isolation mechanism. 120s GPU / 300s CPU per component, 300s/720s job watchdog; report timeout frequency rather than call these latency estimates. |
| Lifecycle/security | No network egress including DNS/HTTP/native library probes; no credential inheritance; absent/hash-mismatched cache blocks before loading; cancel/timeout removes entire worker/container; no orphan GPU work; byte/frame/trust/dependency tests pass. No automatic retry or cloud fallback. |

Do not describe cgroup host-memory enforcement as a GPU VRAM cap. Measure GPU allocator peaks per worker and distinguish those from total device usage/driver allocations. Whole-job measured peaks and hardware/runtime identifiers belong in the result manifest. If reliable measurement is unavailable, record null and a limitation; never fabricate a peak.

## 10. Exact dependency plan

No dependency changes are made now. Proposed primary environment uses **CPython 3.12.6** (matching the observed interpreter; PSF license), native **Transformers 5.18.0**, **torch 2.14.1+cu130**, **torchvision 0.29.1+cu130**, **safetensors 0.8.0**, **Pillow 12.3.0**, **NumPy 2.5.3**, **tokenizers 0.23.2** and **huggingface-hub 1.31.0**. The hub pin is deliberate: Transformers requires ≥1.31 while tokenizers requires <2. The current hub 2.x is incompatible with that constraint. Package metadata constraints were checked without installing/importing models. The full selected transitive metadata plan is in Appendix D; wheel hashes and OS/image security review remain an installation gate, not a claim of tested runtime compatibility.

PyTorch's [official CUDA 13.0 wheel index](https://download.pytorch.org/whl/cu130/torch/) and [torchvision index](https://download.pytorch.org/whl/cu130/torchvision/) list CPython 3.12 Windows amd64 and Linux x86_64 wheels. Do not mix CPU torchvision with CUDA torch or choose wheels by a floating version. Linux wheels require glibc-compatible manylinux 2.28 userspace; pin the container base digest before building. A CPU comparison must use a separately locked official CPU wheel pair and runtime manifest, not silently switch devices. No CPU environment is approved by this GPU lock.

No `accelerate`, `timm`, `flash-attn`, `bitsandbytes`, model-hub extras, notebook packages, GroundingDINO source extension, Meta CUDA extension, Hydra or training stack is necessary for the selected native image path. Florence's original custom route would need separate dependency qualification; it is not allowed to expand this plan automatically. Python packages with HTTP capabilities are unavoidable transitive dependencies here; offline flags plus OS no-network restrictions remain mandatory.

CUDA runtime packages carry NVIDIA terms separately from PyTorch's open-source code. Review the applicable [CUDA EULA](https://docs.nvidia.com/cuda/eula/index.html), [cuDNN terms](https://docs.nvidia.com/deeplearning/cudnn/backend/latest/reference/eula.html), package notices and redistributable list before packaging/shipping an image. PyPI metadata is not complete legal evidence for every bundled binary. Blank/incomplete fields below remain blocking evidence items, not implicit approval. CPython patch/runtime security review and a fully hashed platform wheel lock are required before installation; do not treat this planning packet as production dependency approval.

## 11. Later acquisition and execution gates

1. Create operator-reviewed real-local records from this packet. Bind separate code/weights/data decisions, exact model revision, every required file role/name/size/hash, license snapshots and derived mappings. Keep production blocked. This phase does not mutate R1.3 approvals.
2. A separately authorized acquisition command accepts only a registered record ID, never an arbitrary URL/path. Resolve the exact literal URL from the manifest, with HTTPS, fixed host/path policy, bounded time/bytes, no `main`, no latest resolution and no model-hub search. HF LFS may redirect to signed storage/CDN URLs: validate each redirect against a separately reviewed allow-list, reject HTTPS downgrade/private addresses/unexpected hosts, and never log signed URLs. The default downloader must reject an unapproved redirect rather than silently broaden the policy.
3. Stream into a private temporary cache file, enforce exact byte count, compute SHA-256, fsync, then atomically publish the generated-key cache entry and acquisition manifest. Verify revision via the pinned manifest; record original source, approved redirect-host policy, received hash/size, acquisition time, reviewer and snapshot digest. Do not run repository Python, unpickle files, invoke installers or instantiate models during acquisition.
4. Keep model cache separate from scene artifacts, read-only to workers. The manifest is persistent; acquisition is the only writer. Reject symlinks/reparse points, traversal, malformed safetensors structure, unbounded tensor shapes and partial files. Concurrent/restart/tamper tests must pass. Missing exact bytes means failure, never download. Derived config/checkpoint transformations are separately versioned records with parent hashes, not silent overwrites.
5. Build the reviewed runtime outside inference from exact wheels with `--require-hashes` and a platform lock. Record license notices/SBOM and container image digest. Verify OS no-network/memory/process-tree behavior with synthetic hostile probes **before** loading real weights. Do not use mutable tags or let a task invoke pip.
6. First authorized model run: synthetic/generated local image for API/shape/key compatibility, then the seven existing authorized smoke fixtures. Verify no missing core keys, no downloads/custom-code loading, correct input transforms, masks at original dimensions, bounded artifacts and estimated-only metadata. Compare SAM static-image mapping against documented behavior; no unreviewed `.pt` fallback.
7. Only after these checks, annotate/expand the development benchmark and apply the frozen metrics. Log diagnostics privately under task-owned local storage, not production storage. Human/adjudicator evidence remains separate from model output. R1.4B completion does not permit customer delivery, R1.5, merging or deployment without their own scope.

## 12. Unresolved risks and handoff

The primary pair is a **credible evaluation candidate**, not a proven room-understanding system. Important risks: tiny outlets/vents and thin openings; mirror/window and cabinet/built-in confusion; ambiguous attachment/permanence; incomplete room-surface masks; SAM video-labelled package normalization; precise HF conversion lineage; training-data rights not proven by code licenses; native/Python supply-chain behavior; CUDA binary obligations; untested Docker GPU access; host RAM pressure; artifact volume; sampled rather than hard-limited VRAM; low sample size and no existing held-out annotations.

R1.4B must close the execution, package-license and static-image compatibility gates before running a real adapter. Production provenance/accuracy/operational review remains later. The canonical roadmap is unchanged; no R1.5 depth/floor implementation or new production wiring is authorized here.

## Appendix A. Pinned sidecar/source-text digests

Hashes below were computed from the **actual small text/JSON files**, unlike the publisher-reported weight hashes. URLs use the exact model revisions in section 3. `README.md`/LICENSE are evidence, and the SAM YAML/video config plus Florence Python files are audit-only unless a later explicit route approves them. They are not executable runtime authorization.

| Model | File (pinned source) | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `IDEA-Research/grounding-dino-tiny` | [README.md](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/README.md) | 2580 | `cf46f74c7b6850f1d5cbe406028324d8798148726016d46a69a365b4a2d3e89f` |
| `IDEA-Research/grounding-dino-tiny` | [added_tokens.json](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/added_tokens.json) | 82 | `909e96cb32d92ce728a01bc99850cbba26196d74115c17ebeb019275412588f2` |
| `IDEA-Research/grounding-dino-tiny` | [config.json](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/config.json) | 1644 | `eec82c5ab66e16df12a9a212e68ac011779927c2536cf9078658e35d85f0c67a` |
| `IDEA-Research/grounding-dino-tiny` | [preprocessor_config.json](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/preprocessor_config.json) | 457 | `8454179ba95e2ad22947835aad7b45862a601fc0055ab88bf1ee70892d3aea60` |
| `IDEA-Research/grounding-dino-tiny` | [special_tokens_map.json](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/special_tokens_map.json) | 125 | `b6d346be366a7d1d48332dbc9fdf3bf8960b5d879522b7799ddba59e76237ee3` |
| `IDEA-Research/grounding-dino-tiny` | [tokenizer.json](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/tokenizer.json) | 711396 | `d241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66` |
| `IDEA-Research/grounding-dino-tiny` | [tokenizer_config.json](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/tokenizer_config.json) | 1237 | `d40ab645b68211910b9170d22433d43186a6ec8ee6fd10ba170524b25bf4fb56` |
| `IDEA-Research/grounding-dino-tiny` | [vocab.txt](https://huggingface.co/IDEA-Research/grounding-dino-tiny/blob/a2bb814dd30d776dcf7e30523b00659f4f141c71/vocab.txt) | 231508 | `07eced375cec144d27c900241f3e339478dec958f92fddbc551f295c992038a3` |
| `facebook/sam2.1-hiera-small` | [README.md](https://huggingface.co/facebook/sam2.1-hiera-small/blob/ee5bba1d82bb8749febdf90f45e84b687142ba03/README.md) | 19974 | `6ec2d54879e41ad876d8cded0d641e8bc6ab74d5e095a73afc3f8406372ee6e9` |
| `facebook/sam2.1-hiera-small` | [config.json](https://huggingface.co/facebook/sam2.1-hiera-small/blob/ee5bba1d82bb8749febdf90f45e84b687142ba03/config.json) | 5698 | `97ff9f65b76d107acda4247885f0a5555d0048850ae3c5f97183df289aaecde9` |
| `facebook/sam2.1-hiera-small` | [preprocessor_config.json](https://huggingface.co/facebook/sam2.1-hiera-small/blob/ee5bba1d82bb8749febdf90f45e84b687142ba03/preprocessor_config.json) | 683 | `6ebf229ee259368ce4a8d4f2fe893a72b053023710853e257253939e601f583d` |
| `facebook/sam2.1-hiera-small` | [processor_config.json](https://huggingface.co/facebook/sam2.1-hiera-small/blob/ee5bba1d82bb8749febdf90f45e84b687142ba03/processor_config.json) | 95 | `f8a68e865cfad115c1c2763f3d93eca7b1c622da06da2a9273eb437fb2389b6d` |
| `facebook/sam2.1-hiera-small` | [sam2.1_hiera_s.yaml](https://huggingface.co/facebook/sam2.1-hiera-small/blob/ee5bba1d82bb8749febdf90f45e84b687142ba03/sam2.1_hiera_s.yaml) | 3761 | `632e5cd0104f5ab6cd4f9d2dfd80a8e7240e481ad7960a13cad2ae3504b88dbd` |
| `facebook/sam2.1-hiera-small` | [video_preprocessor_config.json](https://huggingface.co/facebook/sam2.1-hiera-small/blob/ee5bba1d82bb8749febdf90f45e84b687142ba03/video_preprocessor_config.json) | 705 | `9fccfe5f464ec38c2f236d0e6a68e95511c80c22132fc2fa4b9f7b65f24fad95` |
| `microsoft/Florence-2-base` | [LICENSE](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/LICENSE) | 1141 | `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` |
| `microsoft/Florence-2-base` | [README.md](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/README.md) | 14805 | `e49de5527bd39688745ce20388bf3f31fdb891abc0e6950a3f64630114769d17` |
| `microsoft/Florence-2-base` | [config.json](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/config.json) | 2430 | `c666d0fe0172d46e115e8fba6cd93cd83714575b33a73005cab8d24ce2a3aa8f` |
| `microsoft/Florence-2-base` | [configuration_florence2.py](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/configuration_florence2.py) | 15119 | `de2e45a975b3582de05d2f4d963a3e9f9a3d20dccf78d28e0052932a0be93bdf` |
| `microsoft/Florence-2-base` | [modeling_florence2.py](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/modeling_florence2.py) | 127455 | `5162bf465e61b6e29cc113a467630ec3cb56ed8e4d46eb6207157f10fb9b8a24` |
| `microsoft/Florence-2-base` | [preprocessor_config.json](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/preprocessor_config.json) | 806 | `2f5921bbc53c7cc04251e1027b45b1cec726276be6db23d1bb40641bfbe2cf29` |
| `microsoft/Florence-2-base` | [processing_florence2.py](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/processing_florence2.py) | 48676 | `f146023a507c009f425a49ee39aa037f4f25c64e14336e3e4f3f1d7377a68e98` |
| `microsoft/Florence-2-base` | [tokenizer.json](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/tokenizer.json) | 1355863 | `847bbeab6174d66a88898f729d52fa8d355fafe1bea101cf960dd404581df70e` |
| `microsoft/Florence-2-base` | [tokenizer_config.json](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/tokenizer_config.json) | 34 | `79ffcf43af8ebda99d165f61d243180da2e2639952e41e71e11611c18770489c` |
| `microsoft/Florence-2-base` | [vocab.json](https://huggingface.co/microsoft/Florence-2-base/blob/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac/vocab.json) | 1099884 | `394fdc63c71aabe0a9b97117f5d62fb5fcc4d59b2b3ea929a3929e6a53217b3c` |

## Appendix B. Dated license evidence

Read and SHA-256 hashed on 2026-10-02. Future approval records must persist the matching bytes and reviewer decision, not just trust this table. Model-card evidence hashes are also in Appendix A.

| Evidence | Bytes | SHA-256 |
| --- | ---: | --- |
| [GroundingDINO code license](https://raw.githubusercontent.com/IDEA-Research/GroundingDINO/856dde20aee659246248e20734ef9ba5214f5e44/LICENSE) | 11355 | `b403c98ec1ffaccb0124632592a3d99642cddc3031ca412b402568e6c06c202a` |
| [GroundingDINO training table](https://raw.githubusercontent.com/IDEA-Research/GroundingDINO/856dde20aee659246248e20734ef9ba5214f5e44/README.md) | 19492 | `d69cf3fd022661e6be19c56a421020f3ee9e027375020ef6a3def0149ddf9595` |
| [SAM2 code/checkpoint license](https://raw.githubusercontent.com/facebookresearch/sam2/2b90b9f5ceec907a1c18123530e92e794ad901a4/LICENSE) | 11357 | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |
| [SAM2 checkpoint scope](https://raw.githubusercontent.com/facebookresearch/sam2/2b90b9f5ceec907a1c18123530e92e794ad901a4/README.md) | 16249 | `eea69ee1042fb30933c5ca5019fbf0f6f9366cec5e792109281b5023a4f1589c` |
| [Transformers code license](https://raw.githubusercontent.com/huggingface/transformers/a906d3c4b65095f2308b6a6a193e934d03b8eb5d/LICENSE) | 11418 | `77fd4710def9ec3c0f6225800e0235f15a425abd4a8b03559127fcd782612049` |
| [SegFormer restrictive license](https://raw.githubusercontent.com/NVlabs/SegFormer/65fa8cfa9b52b6ee7e8897a98705abf8570f9e32/LICENSE) | 4065 | `f549820c06519e3105e5174a2fd7285224ffd2268a7f879a843b1a255fd04a61` |
| [MaskFormer weights terms](https://raw.githubusercontent.com/facebookresearch/MaskFormer/da3e60d85fdeedcb31476b5edd7d328826ce56cc/MODEL_ZOO.md) | 25517 | `cf1e7c386dd94b6645347321f2513a481e6b350d4817c91fb183ff1ce5ebd5bb` |
| [Mask2Former weights terms](https://raw.githubusercontent.com/facebookresearch/Mask2Former/9b0651c6c1d5b3af2e6da0589b719c514ec0d69a/MODEL_ZOO.md) | 37622 | `6af2cff5f006cdb9bf2949146fd76336feca252f9c39ac0065ba974cca3723f8` |

## Appendix C. Exact prompt payload

Hash rule: UTF-8 JSON, object keys sorted lexicographically, no indentation/spaces, arrays retain order, followed by one LF. Hash covers this payload only; canonical mapping and thresholds above must also be included in the versioned configuration. No text from an image or user request is appended.

SHA-256: `b6d5c6eac170017a9dc88396924d1bee670d99b1bed3541599469d52f525afcc`.

```json
{
  "version": "roomstager-r1-detection-v1",
  "groups": [
    {
      "id": "openings",
      "text": "door. doorway. open doorway. sliding door. balcony door. closet door. window."
    },
    {
      "id": "architecture",
      "text": "fireplace. built-in cabinet. built-in shelving. staircase. stairs."
    },
    {
      "id": "fixtures-electrical",
      "text": "electrical outlet. wall outlet. vent. air vent. light fixture. ceiling light. ceiling fan."
    },
    {
      "id": "fixtures-plumbing-appliances",
      "text": "sink. toilet. bathtub. shower. stove. oven. refrigerator. dishwasher. mirror."
    },
    {
      "id": "furniture-seating-tables",
      "text": "sofa. couch. loveseat. sectional. chair. armchair. coffee table. dining table. table."
    },
    {
      "id": "furniture-other",
      "text": "desk. bed. nightstand. dresser. cabinet. rug. furniture. foreground object."
    },
    {
      "id": "surfaces",
      "text": "floor. wall. ceiling."
    }
  ]
}
```

## Appendix D. Package pins and platform scope

Metadata-only dependency graph checked for CPython 3.12.6; no installation/resolution by executing setup code. Each version link is its exact PyPI metadata record. Windows/Linux means that package is required by that platform's declared dependency graph, not that a model run was measured there. Core torch/torchvision use the explicit official `+cu130` wheels; other pins below are fixed. The CUDA vendor package graph must be cross-checked against those exact wheel METADATA files when creating the final hash lock; PyPI metadata matching alone is not binary compatibility proof.

| Package | Exact version / metadata | Platform graph | License evidence / qualification |
| --- | --- | --- | --- |
| `annotated-doc` | [0.0.5](https://pypi.org/pypi/annotated-doc/0.0.5/json) | Windows + Linux | MIT |
| `anyio` | [4.15.1](https://pypi.org/pypi/anyio/4.15.1/json) | Windows + Linux | MIT |
| `certifi` | [2026.7.22](https://pypi.org/pypi/certifi/2026.7.22/json) | Windows + Linux | MPL-2.0 |
| `click` | [8.5.0](https://pypi.org/pypi/click/8.5.0/json) | Windows + Linux | BSD-3-Clause |
| `colorama` | [0.4.6](https://pypi.org/pypi/colorama/0.4.6/json) | Windows | BSD family; exact notices required |
| `cuda-bindings` | [13.0.3](https://pypi.org/pypi/cuda-bindings/13.0.3/json) | Linux | LicenseRef-NVIDIA-SOFTWARE-LICENSE |
| `cuda-pathfinder` | [1.8.3](https://pypi.org/pypi/cuda-pathfinder/1.8.3/json) | Linux | Apache-2.0 |
| `cuda-toolkit` | [13.0.3](https://pypi.org/pypi/cuda-toolkit/13.0.3/json) | Linux | NVIDIA CUDA EULA / component-specific notices; evidence gate |
| `filelock` | [4.0.9](https://pypi.org/pypi/filelock/4.0.9/json) | Windows + Linux | MIT |
| `fsspec` | [2026.9.0](https://pypi.org/pypi/fsspec/2026.9.0/json) | Windows + Linux | BSD-3-Clause |
| `h11` | [0.16.0](https://pypi.org/pypi/h11/0.16.0/json) | Windows + Linux | MIT |
| `hf-xet` | [1.6.0](https://pypi.org/pypi/hf-xet/1.6.0/json) | Windows + Linux | Apache-2.0 |
| `httpcore` | [1.0.9](https://pypi.org/pypi/httpcore/1.0.9/json) | Windows + Linux | BSD-3-Clause |
| `httpx` | [0.28.1](https://pypi.org/pypi/httpx/0.28.1/json) | Windows + Linux | BSD-3-Clause |
| `huggingface-hub` | [1.31.0](https://pypi.org/pypi/huggingface-hub/1.31.0/json) | Windows + Linux | Apache-2.0 |
| `idna` | [3.20](https://pypi.org/pypi/idna/3.20/json) | Windows + Linux | BSD-3-Clause |
| `jinja2` | [3.1.6](https://pypi.org/pypi/jinja2/3.1.6/json) | Windows + Linux | BSD family; exact notices required |
| `markdown-it-py` | [4.2.0](https://pypi.org/pypi/markdown-it-py/4.2.0/json) | Windows + Linux | MIT |
| `markupsafe` | [3.0.4](https://pypi.org/pypi/markupsafe/3.0.4/json) | Windows + Linux | BSD-3-Clause |
| `mdurl` | [0.1.2](https://pypi.org/pypi/mdurl/0.1.2/json) | Windows + Linux | MIT |
| `mpmath` | [1.3.0](https://pypi.org/pypi/mpmath/1.3.0/json) | Windows + Linux | BSD |
| `networkx` | [3.7](https://pypi.org/pypi/networkx/3.7/json) | Windows + Linux | BSD-3-Clause |
| `numpy` | [2.5.3](https://pypi.org/pypi/numpy/2.5.3/json) | Windows + Linux | BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 |
| `nvidia-cublas` | [13.1.1.3](https://pypi.org/pypi/nvidia-cublas/13.1.1.3/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-cuda-cupti` | [13.0.85](https://pypi.org/pypi/nvidia-cuda-cupti/13.0.85/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-cuda-nvrtc` | [13.0.88](https://pypi.org/pypi/nvidia-cuda-nvrtc/13.0.88/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-cuda-runtime` | [13.0.96](https://pypi.org/pypi/nvidia-cuda-runtime/13.0.96/json) | Linux | NVIDIA CUDA EULA; binary notice verification pending |
| `nvidia-cudnn-cu13` | [9.24.0.43](https://pypi.org/pypi/nvidia-cudnn-cu13/9.24.0.43/json) | Linux | NVIDIA cuDNN license; binary notice verification pending |
| `nvidia-cufft` | [12.0.0.61](https://pypi.org/pypi/nvidia-cufft/12.0.0.61/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-cufile` | [1.15.1.6](https://pypi.org/pypi/nvidia-cufile/1.15.1.6/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-curand` | [10.4.0.35](https://pypi.org/pypi/nvidia-curand/10.4.0.35/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-cusolver` | [12.0.4.66](https://pypi.org/pypi/nvidia-cusolver/12.0.4.66/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-cusparse` | [12.6.3.3](https://pypi.org/pypi/nvidia-cusparse/12.6.3.3/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-cusparselt-cu13` | [0.8.1](https://pypi.org/pypi/nvidia-cusparselt-cu13/0.8.1/json) | Linux | NVIDIA Proprietary Software |
| `nvidia-nccl-cu13` | [2.30.7](https://pypi.org/pypi/nvidia-nccl-cu13/2.30.7/json) | Linux | Upstream BSD-3-Clause; bundled binary notices pending |
| `nvidia-nvjitlink` | [13.0.88](https://pypi.org/pypi/nvidia-nvjitlink/13.0.88/json) | Linux | LicenseRef-NVIDIA-Proprietary |
| `nvidia-nvshmem-cu13` | [3.4.5](https://pypi.org/pypi/nvidia-nvshmem-cu13/3.4.5/json) | Linux | Vendor license evidence incomplete; installation blocked pending review |
| `nvidia-nvtx` | [13.0.85](https://pypi.org/pypi/nvidia-nvtx/13.0.85/json) | Linux | Apache 2.0 |
| `packaging` | [26.3](https://pypi.org/pypi/packaging/26.3/json) | Windows + Linux | Apache-2.0 OR BSD-2-Clause |
| `pillow` | [12.3.0](https://pypi.org/pypi/pillow/12.3.0/json) | Windows + Linux | MIT-CMU |
| `pygments` | [2.21.0](https://pypi.org/pypi/pygments/2.21.0/json) | Windows + Linux | BSD-2-Clause |
| `pyyaml` | [6.0.3](https://pypi.org/pypi/pyyaml/6.0.3/json) | Windows + Linux | MIT |
| `regex` | [2026.9.29](https://pypi.org/pypi/regex/2026.9.29/json) | Windows + Linux | Apache-2.0 AND CNRI-Python |
| `rich` | [15.0.0](https://pypi.org/pypi/rich/15.0.0/json) | Windows + Linux | MIT |
| `safetensors` | [0.8.0](https://pypi.org/pypi/safetensors/0.8.0/json) | Windows + Linux | Apache-2.0 |
| `setuptools` | [84.0.0](https://pypi.org/pypi/setuptools/84.0.0/json) | Windows + Linux | MIT |
| `shellingham` | [1.5.4](https://pypi.org/pypi/shellingham/1.5.4/json) | Windows + Linux | ISC License |
| `sympy` | [1.14.0](https://pypi.org/pypi/sympy/1.14.0/json) | Windows + Linux | BSD |
| `tokenizers` | [0.23.2](https://pypi.org/pypi/tokenizers/0.23.2/json) | Windows + Linux | Apache-2.0 |
| `torch` | [2.14.1+cu130](https://pypi.org/pypi/torch/2.14.1/json) | Windows + Linux | Apache-2.0, Apache-2.0 WITH LLVM-exception, BSD-2/3-Clause, BSL-1.0, MIT (metadata); CUDA binaries separate |
| `torchvision` | [0.29.1+cu130](https://pypi.org/pypi/torchvision/0.29.1/json) | Windows + Linux | BSD |
| `tqdm` | [4.70.1](https://pypi.org/pypi/tqdm/4.70.1/json) | Windows + Linux | MPL-2.0 AND MIT |
| `transformers` | [5.18.0](https://pypi.org/pypi/transformers/5.18.0/json) | Windows + Linux | Apache 2.0 License |
| `triton` | [3.8.0](https://pypi.org/pypi/triton/3.8.0/json) | Linux | MIT |
| `typer` | [0.27.2](https://pypi.org/pypi/typer/0.27.2/json) | Windows + Linux | MIT |
| `typing-extensions` | [4.16.0](https://pypi.org/pypi/typing-extensions/4.16.0/json) | Windows + Linux | PSF-2.0 |

Published official CUDA wheel hashes (metadata only; wheels not downloaded):

| Wheel | SHA-256 |
| --- | --- |
| `torch-2.14.1+cu130-cp312-cp312-win_amd64.whl` | `0a09031e93632d14ef49553acd6211ece3ae9cdc0969a369b8c24e3cc4d15be9` |
| `torchvision-0.29.1+cu130-cp312-cp312-win_amd64.whl` | `14d3195e5e657fef46d08de0d3470da03a983fa383d8aa279e36e47e95d991c6` |
| `torch-2.14.1+cu130-cp312-cp312-manylinux_2_28_x86_64.whl` | `5359b255ac68c0cabb8293952b38e00f0d1a570815cd87f19b61af702c071410` |
| `torchvision-0.29.1+cu130-cp312-cp312-manylinux_2_28_x86_64.whl` | `ce6b51d5ffad41eb1d22ff61cb304415a95c1bfa431dc00a80c8ece06822c3b7` |
