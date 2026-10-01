# Full-room staging benchmark

This is engineering evidence, not a production delivery path. The current production adapter remains `complete-layers-v2`, explicitly advertising `completeArrangements: false` internally. No request field or environment variable can select this benchmark candidate in the customer app.

## Coverage

`manifest.json` currently has four distinct existing app sources (two bedrooms, two living rooms), all development cases. One is only 249 × 148 and is blocked from paid rendering pending input-resolution review. These are not a representative 40-photo benchmark. No held-out or furnished-room removal results exist yet. The target remains 30 development sources, 10 held-out sources and 10 repeated cases. Do not count crops/resizes or generated variants of the same room as independent rooms. Record provenance and permission before adding photos or transferring existing photos to a new vendor.

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

## Initial smoke result, October 1

Two full-scene OpenAI requests returned complete arrangements in 28.6 and 31.4 seconds. Agent review marked bedroom uncertain and living room rejected (fireplace appearance and visible floor changed). No accepted result. Estimated generation cost: $0.102555 total at standard uncached rates, excluding review/hosting/tax; this is not invoice verification. These findings support testing different preservation strategies, not enabling the candidate in production.

Specialized-provider comparison remains pending. Virtual Staging AI advertises a homepage trial; its documented API requires Enterprise. The inspected pricing page displayed $79/month with annual billing ($948/year), not a confirmed monthly checkout quote. No vendor account was created, key acquired, photo sent or subscription purchased. Check terms/photo handling and benchmark access before integrating it.
