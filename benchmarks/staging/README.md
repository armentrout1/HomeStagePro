# Full-room staging benchmark

This is engineering evidence, not a production delivery path. The current production adapter remains `complete-layers-v2`, explicitly advertising `completeArrangements: false` internally. No request field or environment variable can select this benchmark candidate in the customer app.

## Coverage

`manifest.json` has seven development sources: four existing app photos and three supplementary CC0 photographic stress cases. One app photo is only 249 × 148 and is blocked from paid rendering. Two public cases exercise furniture removal; the current experimental provider rejects these before submitting any request because removal is not implemented. There are still no held-out or removal results. Studio backplates and perspective projections from photographed panoramas do not substitute for representative customer photos. The target remains 30 development sources, 10 held-out sources and 10 repeated cases. `roomIdentity` groups related views: never count crops/resizes or generated variants as independent rooms.

The three public source images are licensed CC0 by [Poly Haven](https://polyhaven.com/license). Authors, exact download URLs, checksums and transformations are in `sources/provenance.json`. These small prepared files may be committed; private customer photos may not. To reproduce, download the three named files into a local folder, then run `node benchmarks/staging/prepare-sources.mjs <folder>`. It verifies original checksums before deterministic photographic projection/resizing. There is no AI-created source content. The public API used for discovery is [Poly Haven](https://github.com/Poly-Haven/Public-API), with a RoomStagerPro user agent. License permission is distinct from the operator's approval to upload to a new service; `externalProviderConsent` remains false pending that approval.

## Run

From the repository root, inventory is offline and makes no AI requests:

```sh
npm run benchmark:inventory
```

A smoke run requires the existing approved OpenAI credential, explicit case IDs and an explicit request count (maximum four). It never reads production entitlements or uploads benchmark results to customer storage:

```sh
node --env-file=.env --import tsx scripts/benchmark-staging.ts --execute --cases bedroom-panelled-carpet,living-fireplace-wood --max-calls 2
```

`--max-calls` bounds requests, not dollars. Before a larger run, estimate cost and establish a monetary budget. Each invocation creates a unique run directory; a submitted attempt is persisted before the API call. There is no automatic replay or fallback on failure. Inspect a previous unknown outcome before deliberately starting a new invocation. The candidate supports empty bedroom/living-room furnishing only. It does not claim measured placement, source-pixel preservation, or removal.

## Review

Inspect source and candidate at full resolution. Populate each generated case's `review.json`, recording the reviewer identity, actual timestamp, pass/fail/uncertain for all six criteria, and concrete observations. An agent inspection must be labeled as such, not independent human review. Missing or uncertain checks cannot pass. Assess without any API calls:

```sh
npm run benchmark:assess -- temp/staging-benchmarks/<run-directory>
```

Keep raw report.json unchanged; assessment.json records reviewed outcomes and generation cost estimates from usage at the documented price snapshot. Generation success is never automatically visual acceptance. Reports remain releaseReady=false until the broader release procedure is implemented and passed. Store outputs under ignored `temp/` or outside the repo; do not commit user photos or secrets.

### Permanent-feature diagnostics

`npm run benchmark:preservation -- <run-directory> benchmarks/staging/preservation-regions.json` builds a local `preservation.html` with original/candidate crops and amplified differences, plus hashed evidence in `preservation.json`. Regions are manually chosen inspection areas, not edit masks. The command rejects changed aspect ratios instead of silently cropping. Small resolution differences are normalized and explicitly recorded. It never changes candidate pixels, provider reports or acceptance decisions.

Do not turn pixel differences into a pass/fail threshold without calibration. Added furniture can legitimately occlude the room; shadows, reflections, interpolation and compression also change pixels. The tool samples visible fixtures and surfaces, and cannot establish complete architectural preservation. Never paste original rectangular regions over furniture to improve a diagnostic score: that recreates clipping and fading failures.

## Initial smoke result, October 1

Two full-scene OpenAI requests returned complete arrangements in 28.6 and 31.4 seconds. Agent review marked bedroom uncertain and living room rejected (fireplace appearance and visible floor changed). No accepted result. Estimated generation cost: $0.102555 total at standard uncached rates, excluding review/hosting/tax; this is not invoice verification. These findings support testing different preservation strategies, not enabling the candidate in production.

Specialized-provider comparison remains pending. Virtual Staging AI advertises a homepage trial; its documented API requires Enterprise. The inspected pricing page displayed $79/month with annual billing ($948/year), not a confirmed monthly checkout quote. No vendor account was created, key acquired, photo sent or subscription purchased. Check terms/photo handling and benchmark access before integrating it.

## Expanded smoke result, October 1

Two additional calls tested the smaller existing bedroom and the licensed narrow-room photograph. Generation took 30.2 and 28.8 seconds; estimated total generation cost was $0.108442. The bedroom remains uncertain. The narrow-room arrangement was rejected: outlet position changed, and the bed obstructed the balcony-door area. Across four smoke calls there are zero accepted results (two uncertain, two rejected); estimated combined generation cost is $0.210997. This is evidence against promoting the unconstrained full-scene candidate, not a measured success rate for all models or future engines. No production changes or customer-credit deductions were made.
