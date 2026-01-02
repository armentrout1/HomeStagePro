# Staging Roadmap — Vision & Future Enhancements

## A) Purpose
- Capture upcoming staging improvements; this roadmap is **non-binding** and exploratory.
- It is **not** the enforcement spec. Current source of truth remains [`docs/staging/staging-profiles.md`](./staging-profiles.md).

## B) Vision Detection Step (Structured Scene Map)
- **Goal**: infer a structured layout/object map from the input image to prevent misplacements (blocked doors/windows, appliance conflicts, circulation violations).
- **Proposed JSON schema draft**:
  ```json
  {
    "roomType": "kitchen",
    "elements": {
      "doors": [{ "bbox": [x, y, w, h], "swingDirection": "unknown|left|right" }],
      "windows": [{ "bbox": [x, y, w, h] }],
      "counters": [{ "polygon": [[x, y], ...] }],
      "sink": [{ "bbox": [x, y, w, h] }],
      "stove": [{ "bbox": [x, y, w, h] }],
      "walkPaths": [{ "polygon": [[x, y], ...] }],
      "noPlaceZones": [{ "polygon": [[x, y], ...], "reason": "doorway|walkway|appliance|window" }]
    },
    "confidence": {
      "doors": 0.92,
      "windows": 0.88,
      "counters": 0.81,
      "sink": 0.74,
      "stove": 0.77,
      "walkPaths": 0.65,
      "noPlaceZones": 0.7
    }
  }
  ```
- **Prompt consumption plan**:
  1. Convert elements into strict guardrail instructions ("never place any geometry intersecting noPlaceZones", "leave swingDirection arcs clear").
  2. Inject structured facts into analyzer-to-prompt pipeline (door/window coordinates, walk-path polygons) before free-form guidance.
  3. If high-confidence conflicts are detected, automatically down-rank risky item lists.
- **Failure fallback**: when the vision step fails or has sub-threshold confidence, revert to current keyword-based profiles and log `VisionSceneMap=false` for telemetry.

## C) Deterministic Safety Rules (Future)
- Doorway + swing masks enforced as binary occupancy grids during placement.
- Countertop visibility masks for kitchens to keep primary work surfaces 80% unobstructed.
- Window visibility constraints: zero opacity overlap across detected window panes.
- Circulation path heuristic: use walkPath polygons to ensure ≥36" effective width.
- Placement risk score derived from overlap percentages + confidence → auto-retry with new seed if risk > threshold.

## D) Room Selector Roadmap
1. Add **Master Bedroom** profile with elevated elegance rules (tufted headboard, layered textiles, metallic accents) while obeying base constraints.
2. Introduce **Bathroom, Dining Room, Office, Entry** canonical profiles aligned with `RoomType Contract` updates.
3. Optional future: **Style presets** (Modern, Farmhouse, Luxury) layered atop base profile spec for user-facing variety.

## E) Storage Roadmap
- Evaluate centralized bucket storage (Supabase/S3/R2) for generated renders; DB stores metadata + signed URLs.
- Define stable folder taxonomy: `/userId/roomType/timestamp.png` with lifecycle policies.
- Private buckets default; on-demand signed URLs for downloads/ZIP exports.

## F) Payments Roadmap (Stripe)
- Re-enable checkout with updated pricing tiers.
- Decide between subscription (monthly) vs 30-day staging pass; map to Stripe products.
- Provide dev-only token mint endpoint to simulate credits without billing.
- Admin/support overrides: manual credit grants, refund toggles, and usage resets.

## G) UX Roadmap
- Display remaining credits prominently (e.g., `0/5`, `0/20`, `0/50`).
- Staging history gallery with before/after cards and quick re-download.
- Batch staging queue plus ZIP export for multi-room projects.

## H) Measurement & Validation
- Metrics: doorway violations, window obstruction rate, clutter density, room-appropriate item checks.
- Logging/telemetry: persist vision-scene-map confidences, placement risk scores, retry counts.
- A/B testing: compare prompt variants (with/without structured map enforcement) using opt-in cohorts and success metrics above.
