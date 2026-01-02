# Staging Profiles — Canonical Specification

## A) Purpose & Scope
This document is the single source of truth for all AI staging behavior across the HomeStagePro stack. Prompt changes, analyzer tweaks, and UI selections **must match this spec**. If the code and this document disagree, treat this doc as correct and adjust the code immediately.
Future ideas / roadmap: [`docs/staging/staging-roadmap.md`](./staging-roadmap.md)

## B) Global Rules (Apply to Every Room)
- **Preserve architecture**: never remodel, repaint, or change finishes, fixtures, doors, windows, or built-ins.
- **Door/doorway clearance**: keep every doorway completely clear; never place furniture within door swings.
- **Circulation / path rules**: maintain a 36" walking path from camera/entry to other doors or hallways.
- **If uncertain, omit furniture**: when a placement risks blocking circulation or looks doubtful, leave that area empty.
- **Windows & closets**: do not block window glass or closet doors; keep architectural openings visible.
- **Minimalism bias**: prioritize fewer, properly scaled pieces over filling the space.

## C) RoomType Contract
- Canonical normalized room types today: `living room`, `bedroom`, `bathroom`, `kitchen`, `dining room`, `office`, `entry`, `room` (fallback).
- UI selections must match these names (case-insensitive). Server normalization (`normalizeRoomType`) maps user input to the same set.
- Adding a new room type requires coordinated updates in: UI selector list, server normalization, guardrail blocks, prompt builder, and this document.

## D) Living Room Profile
### Profiles
- **Standard**: default size when no large cues exist; one seating piece and minimal decor.
- **Large**: triggered by living-room size keywords (e.g., "large", "spacious") detected in layout constraints.
- **Constrained override**: if any constrained keyword appears (`tight`, `narrow`, `small`, `limited space`, `cramped`, `compact`, `multiple doors`, `many doors`, `door swing`, `keep path clear`, `minimal clearance`, `entry path`, `main walkway`, `circulation path`, `limited wall space`, `no open wall`, `couch blocks`, `avoid blocking window`, `little floor space`, `cropped`, `partial view`), force STANDARD regardless of large hits and set `isConstrained=true`.

### Allowed Items
- **Required**: one sofa or loveseat, one rug, one coffee table.
- **Optional (standard)**: choose **at most one** of plant, floor lamp, or TV/media console. When `isConstrained=true`, remind that only one optional item total may be added.
- **Optional (large)**: plant or floor lamp (still only one of those), plus TV/media console when an uninterrupted wall exists; accent chair allowed only if away from doors.
- **Forbidden**: beds, dining tables/chairs, desks, pianos, bar stools, non-listed items.

### Max Counts
- **Standard**: seating pieces = 1 (sofa/loveseat), accent chairs = 0, tables = 1 coffee table, rugs = 1, optional decor ≤1.
- **Large**: seating pieces ≤2 (sofa/sectional + optional accent chair), accent chairs ≤1, tables = 1 coffee table, rugs =1, decor as listed.

### Size Inference Rules
- Evaluate combined `preferredPlacements + notes` from layout constraints.
- Large profile = (≥2 living-room size keyword hits **OR** any secondary-zone keyword hit such as "sitting area", "reading corner", "seating corner", "separate seating", "extra space", "open floor", "empty corner", "unused space", "lounge area") **and** not being constrained.
- Constrained overrides both standard and large profiles, forcing Standard with `isConstrained=true`.

### Logging Expectations
- Always log `LivingRoomProfile=standard|large`.
- When constrained keywords trigger, also log `LivingRoomConstrained=true`.

## E) Bedroom Profile
### Profiles
- **Standard**: default. Bed + minimal accessories; no seating allowed.
- **Large**: triggered by either:
  - Two or more bedroom large keywords ("large", "spacious", "open", "expansive", "wide", "big"), OR
  - Any secondary-zone keywords ("sitting area", "reading corner", "seating corner", "extra space", "open floor", "empty corner", "spare corner", "unused space", "lounge area").
- **Constrained override**: if constrained keywords are present (`tight`, `narrow`, `small`, `limited space`, `cramped`, `multiple doors`, `many doors`, `closet doors`, `door swing`, `keep path clear`, `minimal clearance`, `avoid blocking window`, `window wall`, `little floor space`, `limited wall space`, `no open wall`, `compact`), force STANDARD and set `isConstrained=true` (even if large keywords hit).

### Allowed Items
- **Required**: one bed, one rug.
- **Optional (standard)**: up to two nightstands, up to two lamps, one plant; when constrained, limit to **one optional item total**.
- **Optional (large)**: standard items plus optional bench and one small chair (only if spacious and away from doors/windows).
- **Forbidden**: dining tables, desks, sectionals, large sofas, bar stools, kitchen items, or any non-listed furniture.

### Max Counts
- **Standard**: beds =1, rugs =1, nightstands ≤2, lamps ≤2, plants ≤1, benches =0, chairs =0.
- **Large**: beds =1, rugs =1, nightstands ≤2, lamps ≤2, plants ≤1, benches ≤1, chairs ≤1.

### Detection & Overrides
- Large = ≥2 large keywords OR any secondary-zone keyword.
- Constrained override takes precedence and reverts to Standard profile with constrained treatment.

### Logging Expectations
- Always log `BedroomProfile=standard|large`.
- When constrained keywords trigger, also log `BedroomConstrained=true`.

## F) Kitchen Profile
### Profiles
- **Standard**: default when no explicit large cues exist. Minimal countertop decor, no shelving, and only one small sink mat.
- **Large**: triggered only when the analyzer finds **two or more** kitchen large keywords (`large`, `spacious`, `open`, `expansive`, `wide`, `big`) across `preferredPlacements + notes` **OR** any secondary-zone keyword (`island`, `eat-in`, `breakfast nook`, `dining area`, `open floor`, `extra space`, `unused space`).
- **Constrained override**: if any constrained keyword appears (`tight`, `narrow`, `small`, `limited space`, `cramped`, `compact`, `galley`, `multiple doors`, `many doors`, `door swing`, `keep path clear`, `minimal clearance`, `little floor space`, `limited wall space`, `no open wall`, `limited counter`, `minimal counter`), force STANDARD with `isConstrained=true` no matter how many large hits fire.

### Allowed Items
- **Optional decor list** (shared across profiles): `fruit bowl`, `cutting board`, `coffee setup (mug + small tray)`, `small plant`, `dish towel`, `soap dispenser`.
- **Countertop decor placement**: Place decor as **one small clustered vignette along the backsplash**, positioned away from the sink basin/faucet zone and away from the cooktop/stove zone. **Do not scatter items across multiple counters.**
- **Standard**: choose **at most two** optional decor items total, keep countertops mostly visible, do not add open shelving, and allow only one small mat directly in front of the sink.
- **Constrained override**: same as Standard but limit to **one** optional item total (omit entirely if it risks blocking doors/appliances), explicitly remind the model to keep decor away from counter edges and appliance clearances, and **if uncertain, omit countertop decor entirely.**
- **Large**: up to **four** optional decor items, still only one small sink mat, and optionally one small open-shelving segment (2–3 decorative items) **only** when an empty wall segment between uppers exists and it is not a window.

### Forbidden Items
- Applies to all kitchen profiles: **no** sofas, beds, dining tables/chairs (unless room type is explicitly dining), desks, bar stools, sectionals, new islands, large rugs, runners, wall remodeling, or any permanent fixture changes. Never block sinks, stoves, refrigerators, dishwashers, or cabinet/ drawer swing.

### Max Counts
- **Standard**: decor ≤2, sink mats ≤1 (sink-only), shelving =0, rugs =0, runners =0.
- **Constrained**: decor ≤1, sink mats ≤1, shelving =0, rugs =0, runners =0.
- **Large**: decor ≤4, sink mats ≤1, shelving ≤1 small section, rugs =0, runners =0.

### Size Inference Rules
- Aggregate `preferredPlacements + notes`.
- Large profile = (≥2 large keyword hits **OR** any secondary-zone keyword hit) and *not* constrained.
- Constrained override takes precedence: any constrained keyword forces `{ profile: "standard", isConstrained: true }` even if large cues fire.
- If no layout constraints exist, default to Standard, `isConstrained=false`.

### Logging Expectations
- Always log `KitchenProfile=standard|large`.
- When constrained keywords trigger, also log `KitchenConstrained=true`.

### Room-Specific Guardrails
- Reinforce in prompt builder: countertops mostly visible, never block appliances or cabinet doors, only one small sink mat, and optional shelving is allowed only on empty wall segments, never windows.

### Quick Test Cases
1. **Kitchen — Standard default**: no constraints provided → expect `KitchenProfile=standard`, no constrained log, optional decor limit = 2.
2. **Kitchen — Large (keyword hits)**: notes include "spacious", "open" and mention an island → expect `KitchenProfile=large`, optional decor limit = 4, shelving allowed if wall segment exists.
3. **Kitchen — Large via secondary zone**: single "breakfast nook" mention → expect Large profile without constrained log.
4. **Kitchen — Constrained**: notes say "galley layout" and "keep path clear" → force Standard, log `KitchenConstrained=true`, optional decor limit = 1.
5. **Kitchen — Mixed cues**: constraints mention "large open kitchen" but also "multiple doors" → constrained override wins; expect Standard with `KitchenConstrained=true`.

## G) Bathroom Profile
### Profiles
- **Standard**: default bathroom treatment when no layout constraints exist.
- **Large**: triggered when the analyzer detects **two or more** bathroom large keywords (`large`, `spacious`, `open`, `expansive`, `wide`, `big`) across `preferredPlacements + notes`, **or** any secondary-zone keyword (`double vanity`, `dual sinks`, `his and hers`, `separate tub and shower`, `soaking tub`, `walk-in shower`, `water closet`, `private toilet area`, `spa bath`, `ensuite`, `makeup vanity`, `dressing area`).
- **Constrained override**: if any constrained keyword hits (`tight`, `narrow`, `small`, `limited space`, `cramped`, `compact`, `powder room`, `half bath`, `guest bath`, `multiple doors`, `many doors`, `door swing`, `keep path clear`, `minimal clearance`, `little floor space`, `limited wall space`, `no open wall`), force STANDARD with `isConstrained=true` regardless of large cues.

### Allowed Items
- **Countertop styling**: keep the vanity counter mostly visible. Create **one** clustered vignette tucked near the backsplash and away from the sink faucet zone.
- **Optional decor list** (shared across sizes): `neatly folded towels (one set)`, `ONE soap dispenser + small tray (one vignette)`, `ONE small plant`, `ONE small bath mat near vanity/tub (outside wet zone)`.
- **Standard**: choose **at most two** optional decor items total, stay minimal, no wall art. Remind the model that all fixtures/doors/windows must remain clear. No mats inside wet zones; one small mat max.
- **Constrained override**: limit to **one** optional decor item total and omit entirely if it risks blocking circulation. Explicitly forbid wall art and emphasize that mats are only allowed when they do not reduce circulation—otherwise omit.
- **Large**: may use up to **three** optional decor items and add **one** small framed art piece **only** if a blank wall segment exists away from mirrors, windows, and doors. All other fixture rules still apply.

### Forbidden Items
- Applies to all bathroom sizes: **no** furniture (chairs, benches), **no** new fixtures (lighting or plumbing), **no** rugs/runners beyond one small mat, **no** objects inside the tub/shower, and **never** block toilets, vanities, mirrors, tubs/showers, towel bars, doors, or windows.

### Max Counts
- **Standard**: optional decor ≤2, plants ≤1, towel sets ≤1, mats ≤1, art =0.
- **Constrained**: optional decor ≤1, plants ≤1, towel sets ≤1, mats ≤1 only when circulation remains clear (otherwise 0), art =0.
- **Large**: optional decor ≤3, plants ≤1, towel sets ≤1, mats ≤1, art ≤1.

### Size Inference Rules
- Aggregate `preferredPlacements + notes`.
- Large profile = (≥2 large keyword hits **OR** any secondary-zone keyword hit) and *not* constrained.
- Constrained override takes precedence and forces `{ profile: "standard", isConstrained: true }` even if large cues fire.
- If no layout constraints exist, default to Standard with `isConstrained=false`.

### Room-Specific Guardrails
- Reinforce in prompt builder: no fixture changes, nothing inside tub/shower, keep countertop vignette minimal, allow one small mat at most, and keep every fixture/door/window fully clear.

### Logging Expectations
- Always log `BathroomProfile=standard|large`.
- When constrained keywords trigger, also log `BathroomConstrained=true`.

### Quick Test Cases
1. **Bathroom — Standard default**: no constraints → expect `BathroomProfile=standard`, no constrained log, optional decor limit = 2.
2. **Bathroom — Large (keyword hits)**: notes include "spacious", "large", mention "double vanity" → expect Large profile, optional decor limit = 3, art allowed only if blank wall exists.
3. **Bathroom — Constrained override**: notes mention "powder room" and "keep path clear" → force Standard, log `BathroomConstrained=true`, optional decor limit = 1, no art/mats if tight.
4. **Bathroom — Mixed cues**: constraints mention "ensuite with soaking tub" but also "multiple doors" → constrained override wins; Standard profile with `BathroomConstrained=true`.

## H) Layout Analyzer Contract
- Analyzer output structure (`LayoutConstraints`):
  - `noFurnitureZones: string[]`
  - `preferredPlacements: string[]`
  - `notes: string[]`
- Profile inference consumes `preferredPlacements + notes` for keyword detection; `noFurnitureZones` populate user-visible restrictions but do not impact sizing rules directly.
- On analyzer failure, server logs the error, sets `layoutConstraints=null`, and prompts fall back to STANDARD profile with minimal instructions.

## I) Change Management
- Any change to staging prompts, sizing keywords, or analyzer logic must update this Markdown file **in the same PR**.
- Add a checklist item "✅ staging-profiles.md updated" to PR templates / manual review.
- Guidance for AI agents and developers: **never** modify staging behavior without updating this document to match.

## J) Quick Test Plan
1. **Living Room — Standard default**: no layout constraints; expect Standard profile, no constrained log.
2. **Living Room — Large**: constraints mention "spacious" twice; expect Large profile, no constrained override.
3. **Living Room — Constrained**: notes include "keep path clear"; expect Standard profile, `LivingRoomConstrained=true`, optional limit =1.
4. **Bedroom — Standard default**: no constraints; expect Standard, no constrained log.
5. **Bedroom — Large keyword hits**: notes with "open" and "expansive"; expect Large profile.
6. **Bedroom — Secondary zone**: notes include "reading corner"; expect Large profile even if only one size keyword.
7. **Bedroom — Constrained**: notes include "limited wall space" + "closet doors"; expect Standard profile with constrained instructions and log.
