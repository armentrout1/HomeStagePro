# Staging engine boundary — October 1, 2026

The roadmap's application boundary is implemented locally. This does not complete the engine rebuild or establish full-room image quality.

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

- Expand the rights-cleared benchmark and obtain a specialized-provider comparison if selected.
- Choose an engine that meets complete-arrangement and preservation requirements.
- Add per-stage persistence/provider reconciliation only once actual provider capabilities are known. Whole-job durability exists; resumable removal/planning/rendering stages are not yet implemented.
- Implement furnished-room removal, room packages, measured geometry/assets/rendering if selected, and the revised customer flow.
- Run independent visual/held-out acceptance, physical-device tests, operating-cost analysis and rollback rehearsal before production promotion.

Do not retire the legacy image pipeline/model assets yet. Do not describe this refactor or the full-scene benchmark as a finished complete-room staging product.
