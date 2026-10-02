# Staging engine boundary — October 1, 2026

The application boundary is implemented on `refactor/staging-engine-boundary` in open draft [PR #3](https://github.com/armentrout1/HomeStagePro/pull/3), introduced in `d5b86ea` and inspected through `64d1106`. It is not merged or production-qualified by this documentation review. The PR's aggregate diff includes earlier layer/segmentation work as well as this boundary; the compatibility claims below concern the boundary refactor. This does not complete the engine rebuild or establish full-room quality.

The canonical plan is [staging-roadmap.md](./staging-roadmap.md); [scene-understanding-r1.md](./scene-understanding-r1.md) defines the next proposed phase. The first-party decision supersedes earlier specialized-staging-provider comparison work. Preserve this boundary while replacing internal components in future reviewed phases.

## Current call path

`stagingJobs` / `jobQueue` → typed `StagingService` → `createStagingService` → `StagingProvider.render` → private result storage.

- `shared/staging/contracts.ts` defines one request schema and typed success/failure results.
- `server/staging/input.ts` validates bytes and selections before credit reservation and again when consuming persisted input. Legacy default masks retain their prior room-specific bounds.
- `server/staging/service.ts` takes injected provider, artifact store, thumbnailer and clock dependencies. It imports no Express, database or production credential modules. It does not debit/refund credits or sign URLs.
- `server/staging/production.ts` is the composition root using the existing private storage and legacy provider. No experimental provider is wired here.
- `server/staging/providers/legacy.ts` explicitly declares its one-furnishing limitation. It preserves the current image algorithm for baseline comparisons.
- `server/openai.ts` retains unrelated legacy saved-image routes; the HTTP generation handler and simulated response objects were removed after caller migration. The job API response/history contract remains compatible.

Existing queue leases, paid-call boundary, input hash verification, idempotency, failure refunds and old-history access remain. Source/result/thumbnail paths retain the existing environment prefix, year-month and UUID layout. No schema migration, production setting, dependency upgrade or image algorithm change is included in this phase.

## Verification

Type checking covers both application and benchmark sources. Service tests verify validation before provider/storage access, rejected-image withholding, no retry on provider/storage errors, thumbnail fallback and compatible result paths. Existing database-backed tests cover credit/refund races, durable recovery and private image ownership. The existing browser suite covers seven customer flows against local fixture endpoints; it is not a live payment or real-device test.

## Still required

- Expand the rights-cleared benchmark and independently annotated scene-understanding evidence. No third-party staging API is a dependency.
- Implement R1 offline: typed, immutable SceneMap state, replaceable local CV adapters and inspectable diagnostics. No furnishing generation or production wiring in R1.
- Implement deterministic protection/planning, structured styles and a controlled first-party renderer behind the existing `StagingProvider`; prompts cannot override geometry or policy.
- Add reviewed per-stage persistence/reconciliation and budget handling. Whole-job durability exists; durable SceneMap and resumable analysis/removal/planning/rendering stages are not yet implemented.
- Evolve the existing legacy removal/replacement path into the separate R8 clearing pipeline, preserving cleared-room QA; implement complete room packages and any later customer-flow changes only after validation.
- Run independent visual/held-out acceptance, physical-device tests, operating-cost analysis and rollback rehearsal before production promotion.

Do not retire the legacy image pipeline/model assets yet. Do not describe this refactor or the full-scene benchmark as a finished complete-room staging product.
