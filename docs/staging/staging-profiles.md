# Staging Profiles — Canonical Specification

## A) Purpose & Scope
This document is the single source of truth for all AI staging behavior across the HomeStagePro stack. Prompt changes, analyzer tweaks, and UI selections **must match this spec**. If the code and this document disagree, treat this doc as correct and adjust the code immediately.

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

## F) Layout Analyzer Contract
- Analyzer output structure (`LayoutConstraints`):
  - `noFurnitureZones: string[]`
  - `preferredPlacements: string[]`
  - `notes: string[]`
- Profile inference consumes `preferredPlacements + notes` for keyword detection; `noFurnitureZones` populate user-visible restrictions but do not impact sizing rules directly.
- On analyzer failure, server logs the error, sets `layoutConstraints=null`, and prompts fall back to STANDARD profile with minimal instructions.

## G) Change Management
- Any change to staging prompts, sizing keywords, or analyzer logic must update this Markdown file **in the same PR**.
- Add a checklist item "✅ staging-profiles.md updated" to PR templates / manual review.
- Guidance for AI agents and developers: **never** modify staging behavior without updating this document to match.

## H) Quick Test Plan
1. **Living Room — Standard default**: no layout constraints; expect Standard profile, no constrained log.
2. **Living Room — Large**: constraints mention "spacious" twice; expect Large profile, no constrained override.
3. **Living Room — Constrained**: notes include "keep path clear"; expect Standard profile, `LivingRoomConstrained=true`, optional limit =1.
4. **Bedroom — Standard default**: no constraints; expect Standard, no constrained log.
5. **Bedroom — Large keyword hits**: notes with "open" and "expansive"; expect Large profile.
6. **Bedroom — Secondary zone**: notes include "reading corner"; expect Large profile even if only one size keyword.
7. **Bedroom — Constrained**: notes include "limited wall space" + "closet doors"; expect Standard profile with constrained instructions and log.
