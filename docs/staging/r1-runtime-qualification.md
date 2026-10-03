# R1.4B1 runtime qualification — blocked before real inference

Date: 2026-10-02. Starting commit: `0f776d68c7aff5c18efec3c3a7823120a41f9d24`. Development branch: `refactor/staging-engine-boundary`; draft PR #3. Parent: [candidate qualification](./r1-model-candidates.md).

**Status: `BLOCKED_REAL_INFERENCE_HOST_MEMORY`. R1.4B1 is not complete.** This commit preserves the tested acquisition/runtime infrastructure. No real model has been loaded or executed. Neither R1.4B2 nor R1.5 has begun.

## Admission and scope

Preflight confirmed the expected clean HEAD and draft PR. `server/staging/production.ts` still selects only the legacy provider. No application/server/shared TypeScript, customer route, storage, database, queue, billing or provider configuration was changed.

The machine has 31.16 GiB OS-visible RAM and an RTX 4060 Ti with 16380 MiB VRAM, driver 591.86. Initial available host RAM was 9.48 GiB, already below the mandatory 12 GiB. A later observation recorded 3,997,995,008 available bytes (about 3.72 GiB), with 14220 MiB free GPU memory. Initial disk headroom was 989.52 GiB. Docker Desktop 4.45.0 / Engine 28.3.3 responded. Available memory is a snapshot, not a measured model requirement.

The [admission command](../../scripts/staging_runtime/admission.py) checks the exact 12 GiB host / 10 GiB GPU thresholds. Passing it does not activate a worker. No applications were terminated or memory threshold reduced to obtain a pass.

## Acquired artifacts and cache

Only these registered evaluation records are accepted by the [operator acquisition command](../../scripts/staging_runtime/acquire.py):

- `grounding-dino-tiny-hf-v1`: revision `a2bb814dd30d776dcf7e30523b00659f4f141c71`; `model.safetensors`, `config.json`, `preprocessor_config.json`, `tokenizer.json`, `tokenizer_config.json`, `special_tokens_map.json`, `added_tokens.json`, `vocab.txt`, and model-card `README.md` evidence.
- `sam21-small-hf-v1`: revision `ee5bba1d82bb8749febdf90f45e84b687142ba03`; `model.safetensors`, `config.json`, `preprocessor_config.json`, `processor_config.json`, and model-card `README.md` evidence.

Actual complete-byte verification, including a second offline rehash, matched every recorded pin. Exact per-file byte counts and computed hashes are in [model acquisition evidence](./r1-runtime-evidence/model-acquisition.json).

| Weight | Actual bytes | Actual SHA-256 | Publisher match |
| --- | ---: | --- | --- |
| Grounding DINO `model.safetensors` | 689359096 | `1a2412ef99bd74bcd3c2a246fa1e48581f8889a1300c9051974741314fc042f3` | Yes |
| SAM `model.safetensors` | 184305280 | `0a4067b11ce1e23d5229203f11c718a823060d15a4b23fa2372a7d4b77cbbc60` | Yes |

The cache is the ignored `.model-cache/r14b1` directory, separate from scene artifacts. Its Windows ACL disables inheritance and permits only the current owner and SYSTEM; the command verifies that boundary. On POSIX it requires owner-only mode. Paths are generated from fixed records; symlink/reparse ancestry is rejected. Downloads stream into private temporary files, check size/hash, inspect the safetensors header/ranges without deserialization, fsync, and publish using no-clobber hard links. Existing corrupt files fail rather than being overwritten. Persistent acquisition manifests bind record digest/revision/file receipts; `verify_bundle` rehashes all bytes and compares the manifest without network access. Partial files are never usable.

The HTTPS downloader pins a validated public DNS address while retaining certificate/SNI verification, rejects private/local addresses, forbids authentication/HTTP downgrade and limits redirects/time/bytes. Only `huggingface.co` and the observed `us.aws.cdn.hf.co` are allowed for models. The latter was independently checked against [official HF download documentation](https://huggingface.co/docs/hub/models-downloading); no wildcard/dynamic host discovery is used. Signed redirect URLs are not logged. No whole-repository snapshot, `.pt`, `.pth`, pickle checkpoint, Florence file or model-repository Python was acquired.

## Dependency and local container evidence

[Wheel lock](../../scripts/staging_runtime/wheels.lock.json): 55 exact Linux CPython 3.12-compatible wheels, 3,070,772,893 downloaded bytes. Every wheel's complete bytes matched its SHA-256. [Acquisition evidence](./r1-runtime-evidence/wheel-acquisition.json) includes actual filenames, sizes, hashes and bundled license/NOTICE member digests. No package versions were substituted. `cuda-toolkit` reports `13.0.3.0`, the packaging-equivalent spelling of the planned `13.0.3`; this is not a changed dependency selection.

The official index's `download-r2.pytorch.org` returned HTTP 403. The same exact torch/torchvision filenames on `download.pytorch.org` supplied matching publisher hashes and wheel METADATA. The exact wheel dependency graph was checked before installation; offline pip resolution and `pip check` then passed. No fallback index or unpinned version was used.

The actual NVSHMEM wheel contains an NVIDIA SDK EULA rather than a standalone Apache license. Its install/use grant was reviewed for this local evaluation; no redistribution or production approval is made. CUDA/cuDNN binary notices remain separate from PyTorch code licensing. Two wheels omit bundled notice files (`tokenizers`, `cuda-toolkit`); their metadata/source license evidence remains in the R1.4A packet, and complete distribution packaging review is still pending. Both model training-provenance blockers remain unresolved.

The [Dockerfile](../../scripts/staging_runtime/Dockerfile) uses a pinned Python 3.12.6 Linux image, a narrowly allow-listed build context, and offline `pip install --require-hashes --only-binary=:all:`. Wheels are a read-only build mount. Main Node dependencies were not changed. No repository secrets, model files, production storage or database were in the build context.

| Binding | Digest |
| --- | --- |
| Base image, Linux amd64 | `sha256:c0d63ec61d3a1321f8dc2d46ab6bd38465e005237c0a463712020e5d338eae25` |
| Requirements lock | `fc2ddd17269a6e050b76aba2fe0a1d4a70ea99bf55db1433d6a2329f18ab5fb9` |
| Wheel manifest | `4a09d44bc1db86528aa7f7318cc91bb43effcdcbd772bb215e74b11afd324356` |
| Local runtime image index | `sha256:fa3d2775b699b548515cc11efb615102d46d642b463a2d513930b6e84fc99c29` |
| Runtime image manifest | `sha256:e2d00eb6f1d7aef2a371fb2ca4fd5991f180a2b49e841e922782ead82575457d` |
| Runtime image config | `sha256:55238c5e39fe77ea42469151df8f5afa4c3e0be93034a603eda2998fac017ee8` |

This is a local development image, not a deployment or a production security certification. Python 3.12.6 and its old base OS require security/patch review before any production selection. The image's default entrypoint deliberately exits `REAL_MODEL_ENTRYPOINT_NOT_QUALIFIED`. No real worker entrypoint/digest exists yet; those fields are null rather than fabricated.

## Isolation and compatibility results

[Synthetic isolation evidence](./r1-runtime-evidence/isolation.json) records non-root execution, read-only root/cache writes denied, no Docker socket, DNS and public-IP HTTP connection failures, no inherited credential/proxy variables, all capabilities dropped, a 64 MiB noexec/nosuid temporary mount, an 8 GiB **host** memory cgroup limit, and two CPU cores. Timeout/cancellation kill and remove the container, not just the CLI. Output overflow is rejected. No compute processes appeared before or remained after the synthetic sequence.

GPU visibility passed with explicit `--gpus all`. The built Python runtime also executed a one-element CUDA tensor: torch `2.14.1+cu130`, CUDA `13.0`, device `cuda:0`, expected value `1.0`; allocator peaks were 512 allocated bytes and 2,097,152 reserved bytes. This proves a small CUDA operation, **not model compatibility or throughput**. No GPU VRAM hard cap is claimed.

The [binary protocol foundation](../../scripts/staging_runtime/protocol.py) has version magic, bounded length fields, strict JSON/duplicate/nonfinite rejection and exact result-key validation. Masks must have exact dimensions and binary values; boxes/scores must be finite and bounded; authority/path/log fields reject. It is not yet connected to a real worker or the R1 SceneMap orchestrator.

| Model measurement | Grounding DINO | SAM 2.1 |
| --- | --- | --- |
| Compatibility execution | Not run: host-memory gate | Not run: host-memory gate |
| Cold load / inference seconds | null | null |
| Host RSS / GPU allocated/reserved peaks | null | null |
| Critical key compatibility | Unverified | Unverified |
| Static-image config mapping | Not applicable | Unresolved; no suppressed key errors or derived config |

Whole-model-sequence peak memory is also null: no such sequence occurred. [Qualification evidence](./r1-runtime-evidence/qualification.json) contains these explicit nulls and implementation file hashes.

## Validation and remaining work

- 253 relevant R1.1–R1.3/staging regression tests passed with the repository's network-denial preload.
- 17 new Python tests cover license/record gates, unknown IDs, redirects/public-address policy, cache corruption/missing files, no-clobber publication, wrong manifest revision, safetensors structure, symlink/reparse rejection, hash lock, framing/output/trust bounds and admission thresholds. Linux execution includes actual symlink creation; Windows sandbox could not create a test symlink, so that case was rerun in Linux rather than counted as a Windows pass.
- Application, benchmark and focused scene/staging test typechecks passed.
- Broader test run encountered three existing isolated-database prerequisites (`access-staging`, `image-history`, `queue-integration`); no production DB was used. The all-tests typecheck reports the unchanged implicit-any at `tests/image-fidelity.test.ts:151`. These are not represented as passing.
- No production build: no shared application imports were touched. No customer browser or room-image tests were run.

**Remaining within R1.4B1:** re-establish at least 12 GiB available host RAM immediately before real inference; implement/bind the fixed real compatibility workers and their descriptors to the actual runtime/lock/code digests; finalize the request protocol and generalized registry boundary; execute native Grounding DINO and SAM static-image compatibility probes on synthetic imagery; document exact SAM config/key mapping and any derived hash; capture real model timing/memory/key reports; rerun the relevant tests. The existing R1.3 component and synthetic license registries remain unchanged and synthetic-only until these gates are demonstrably satisfied. Real evaluation records added here authorize acquisition, not customer execution.

Do not mark R1.4B1 complete, enable a real SceneElement adapter, run the seven-room benchmark, begin R1.4B2/R1.5, merge or deploy from this checkpoint.

## Operator commands

From the canonical repository, use the explicit existing Python interpreter. On Windows first create the fixed cache root and restrict its ACL to the current user and SYSTEM (as done in this qualification); acquisition fails if that protection is absent. No command accepts a caller-supplied model URL/revision/filename/path.

```powershell
& C:/Python312/python.exe scripts/staging_runtime/acquire.py grounding-dino-tiny-hf-v1
& C:/Python312/python.exe scripts/staging_runtime/acquire.py sam21-small-hf-v1
& C:/Python312/python.exe scripts/staging_runtime/wheels.py
& C:/Python312/python.exe scripts/staging_runtime/admission.py
& C:/Python312/python.exe scripts/staging_runtime/isolation.py
& C:/Python312/python.exe -B scripts/staging_runtime/test_runtime.py -v
```

These commands cannot activate real inference. Private cache contents and wheels are ignored by Git; only their verified receipts and license evidence are published.

## Exact checkpoint files

```text
docs/staging/r1-model-candidates.md
docs/staging/r1-runtime-evidence/.gitattributes
docs/staging/r1-runtime-evidence/isolation.json
docs/staging/r1-runtime-evidence/model-acquisition.json
docs/staging/r1-runtime-evidence/qualification.json
docs/staging/r1-runtime-evidence/wheel-acquisition.json
docs/staging/r1-runtime-qualification.md
docs/staging/scene-understanding-r1.md
licenses/staging-components/README.md
licenses/staging-components/real-local/.gitattributes
licenses/staging-components/real-local/grounding-dino-tiny-hf-v1-code.txt
licenses/staging-components/real-local/grounding-dino-tiny-hf-v1-weights.txt
licenses/staging-components/real-local/records.json
licenses/staging-components/real-local/sam21-small-hf-v1-code.txt
licenses/staging-components/real-local/sam21-small-hf-v1-weights.txt
scripts/staging_runtime/.dockerignore
scripts/staging_runtime/.gitattributes
scripts/staging_runtime/.gitignore
scripts/staging_runtime/Dockerfile
scripts/staging_runtime/acquire.py
scripts/staging_runtime/admission.py
scripts/staging_runtime/isolation.py
scripts/staging_runtime/protocol.py
scripts/staging_runtime/requirements.lock
scripts/staging_runtime/test_runtime.py
scripts/staging_runtime/wheels.lock.json
scripts/staging_runtime/wheels.py
```

`git diff --check` passed. Scoped attributes preserve hashed line endings; original upstream license/model-card whitespace is retained as immutable evidence. Staged Git bytes were rehashed against runtime/lock and license evidence records.
