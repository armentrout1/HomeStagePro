# R1.3 component provenance boundary

No real model, weight artifact, or third-party license is approved by this directory. The runtime registry starts empty. Tests explicitly construct synthetic records; those decisions are test data, not commercial permissions or legal advice.

`server/staging/scene/licenses.ts` records exact adapter association, artifact name, repository, 40-character revision, source URL (data only), SHA-256, separate code and weight terms, dated and hash-verified license snapshots, conversion/quantization lineage, obligations/restrictions, reviewer/date, and evaluation/production/rejection decisions. Unknown, noncommercial, incompatible, pending and rejected terms fail closed. Commercial evaluation, hosting and redistribution permissions are separate. The current schema deliberately accepts only `synthetic: true`; enabling real artifacts requires a later review.

The synthetic no-weight case explicitly uses `noWeights: true`, a null weights license, and the actual fixed worker file hash for both code and artifact hashes. Tests use an artificial forty-`1` revision as an exact fixture identifier, not as a claim about a Git commit. Synthetic weight cases require separate weight terms, their exact payload hash, and an already-available local artifact. Code hash is checked against the worker bytes before execution; revision is checked against the registered adapter declaration. This relies on a trusted private checkout and operator-authored registry, not a hostile-filesystem attestation system.

`synthetic-test-evidence.txt` is the test-only permission snapshot. It grants no rights to any external artifact. Test fixture terms intentionally include evaluation approval only, prohibit redistribution, and identify the review as synthetic.

## Acquisition is separate from inference

R1.3 has no downloader. `SyntheticArtifactCache.install` accepts already-obtained synthetic JSON bytes, an exact revision, and an approved registry record. It verifies the digest/revision and persists through the private R1.2 store; `verify` re-reads those bytes at use. Missing or substituted artifacts reject. The cache's availability index is process-local; after restart, explicit reviewed installation/verification must be repeated. Inference never installs, resolves `latest`, follows redirects, or searches a hub.

A later reviewed acquisition command must obtain a specifically approved artifact, verify its exact revision/hash, persist it in a controlled cache, and register availability. Actual model formats, remote acquisition, persistent cache indexing, OS sandbox policy, third-party rights review and model selection are deferred. No source URL in this registry is an executable instruction.

## R1.4A research records are not runtime approvals

The [qualification packet](../../docs/staging/r1-model-candidates.md) records dated official metadata, checkpoint pins, actual small-file evidence hashes and proposed evaluation decisions. Publisher-reported weight hashes remain distinct from actual acquired-byte verification. The runtime registry is still synthetic-only; this document does not add an executable real record or a production approval.

The future real-local record must separate adapter code, upstream model code, runtime/package lock, model repository revision, each weight/config/tokenizer file, conversion lineage and code/weight/training-data evidence. Add exact byte size, format, platform/runtime binding, dated snapshot hash, reviewer, evaluation/hosting/redistribution decisions and unresolved issues. Do not reuse one revision for all layers or infer weight rights from code rights. Model files require their own streamed, private cache: the scene artifact store's 64 MiB artifact ceiling must not be raised to hold weights. Generalization must retain explicit implementation allow-lists and fail-closed approvals.
