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

### Room-Specific Guardrails
- Prefer sofa/sectional placement along the longest uninterrupted wall away from doors.
- Place the primary sofa or loveseat flush against that main wall whenever feasible—avoid floating the seating cluster, and keep all doorways, windows, vents, and circulation paths clear.
- Only add an accent chair when explicitly allowed and when doorway/walkway clearance remains generous.

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
- **Large**: up to **four** optional decor items and one small sink mat. Never add shelving or change permanent fixtures.

### Forbidden Items
- Applies to all kitchen profiles: **no** sofas, beds, dining tables/chairs (unless room type is explicitly dining), desks, bar stools, sectionals, new islands, large rugs, runners, wall remodeling, or any permanent fixture changes. Never block sinks, stoves, refrigerators, dishwashers, or cabinet/ drawer swing.

### Max Counts
- **Standard**: decor ≤2, sink mats ≤1 (sink-only), shelving =0, rugs =0, runners =0.
- **Constrained**: decor ≤1, sink mats ≤1, shelving =0, rugs =0, runners =0.
- **Large**: decor ≤4, sink mats ≤1, shelving =0, rugs =0, runners =0.

### Size Inference Rules
- Aggregate `preferredPlacements + notes`.
- Large profile = (≥2 large keyword hits **OR** any secondary-zone keyword hit) and *not* constrained.
- Constrained override takes precedence: any constrained keyword forces `{ profile: "standard", isConstrained: true }` even if large cues fire.
- If no layout constraints exist, default to Standard, `isConstrained=false`.

### Logging Expectations
- Always log `KitchenProfile=standard|large`.
- When constrained keywords trigger, also log `KitchenConstrained=true`.

### Room-Specific Guardrails
- Reinforce in prompt builder: countertops mostly visible, never block appliances or cabinet doors, only one small sink mat, and never add shelving.

### Quick Test Cases
1. **Kitchen — Standard default**: no constraints provided → expect `KitchenProfile=standard`, no constrained log, optional decor limit = 2.
2. **Kitchen — Large (keyword hits)**: notes include "spacious", "open" and mention an island → expect `KitchenProfile=large`, optional decor limit = 4, shelving forbidden.
3. **Kitchen — Large via secondary zone**: single "breakfast nook" mention → expect Large profile without constrained log.
4. **Kitchen — Constrained**: notes say "galley layout" and "keep path clear" → force Standard, log `KitchenConstrained=true`, optional decor limit = 1.
5. **Kitchen — Mixed cues**: constraints mention "large open kitchen" but also "multiple doors" → constrained override wins; expect Standard with `KitchenConstrained=true`.

## G) Dining Room Profile
### Profiles
- **Standard**: default when layout constraints provide no additional cues; one table plus 2–4 chairs and minimalist styling.
- **Large**: triggered when the analyzer finds either (a) two or more dining large keywords (`large`, `spacious`, `open`, `expansive`, `wide`, `big`) across `preferredPlacements + notes`, OR (b) any secondary-zone keyword (`formal dining`, `dining area`, `separate dining`, `dedicated dining`, `open floor`, `extra space`, `unused space`).
- **Constrained override**: if any constrained keyword appears (`tight`, `narrow`, `small`, `limited space`, `cramped`, `compact`, `multiple doors`, `many doors`, `door swing`, `keep path clear`, `minimal clearance`, `entry path`, `main walkway`, `circulation path`, `limited wall space`, `no open wall`, `little floor space`), force STANDARD and set `isConstrained=true`, regardless of large cues.

### Allowed Items
- **Required (all sizes)**: EXACTLY ONE dining table placed realistically in the current layout.
- **Standard**: 2–4 dining chairs, one simple centerpiece, and optionally either a single runner OR a coordinated set of placemats (never both). No rugs.
- **Constrained**: same as Standard but reduce chairs to ≤2, allow the centerpiece only if it keeps the tabletop usable, and skip runners/placemats entirely when the room feels tight. No rugs.
- **Large**: one table, 6–8 dining chairs, one simple centerpiece plus optional runner/placemats, optionally one rug (only if it fits under the table and fully under pulled-out chairs without pinching circulation), and optionally **one** plant total (either part of the centerpiece or a single floor plant placed away from walk paths).

### Forbidden Items
- Applies to every dining profile: sofas/sectionals/beds/desks/office furniture, kitchen islands or improvised counters, bar stools, multiple tables, full table place settings (plates/cutlery for every seat), and cluttered tabletop arrangements.

### Max Counts
- **Standard**: tables = 1, chairs ≤ 4, centerpiece ≤ 1, runner/placemats ≤ 1, rugs = 0, plants = 0.
- **Constrained**: tables = 1, chairs ≤ 2, centerpiece ≤ 1 (only if it preserves usable space), runner/placemats = 0, rugs = 0, plants = 0.
- **Large**: tables = 1, chairs ≤ 8, centerpiece ≤ 1, runner/placemats ≤ 1, rugs ≤ 1 (under table + chairs), plants ≤ 1.

### Size Inference Rules
- Aggregate `preferredPlacements + notes`.
- Large profile = (≥2 large keyword hits **OR** any secondary-zone keyword hit) and *not* constrained.
- Constrained override takes precedence: any constrained keyword forces `{ profile: "standard", isConstrained: true }` even if large cues fire.
- If no layout constraints exist, default to Standard, `isConstrained=false`.

### Room-Specific Guardrails
- Stage exactly one dining table.
- Keep chair counts conservative and leave at least one side clear for circulation (≤2 chairs when constrained; 6–8 only when clearly large).
- Maintain minimalist tabletop styling: one simple centerpiece plus at most one runner **or** one coordinated placemat set; never full place settings.
- Never block doors, windows, or walk paths; leave obvious clearance for chair pull-out arcs.
- Only add a rug when the dining room is clearly large and the rug fits fully beneath the table/chairs without cutting off circulation paths.

### Logging Expectations
- Always log `DiningRoomProfile=standard|large`.
- When constrained keywords trigger, also log `DiningRoomConstrained=true`.

### Quick Test Cases
1. **Dining — Standard default**: no constraints → `DiningRoomProfile=standard`, chairs limited to 4, no rugs, no constrained log.
2. **Dining — Large (keyword hits)**: notes include "spacious", "expansive" → `DiningRoomProfile=large`, chairs up to 8, rug allowed only if it fits.
3. **Dining — Large via secondary zone**: notes mention "dedicated dining area" once → large profile without constrained log.
4. **Dining — Constrained override**: notes say "narrow dining area with main walkway" → force Standard, chairs ≤2, no runner/placemats, log `DiningRoomConstrained=true`.
5. **Dining — Mixed cues**: mentions "formal dining" and "multiple doors" → constrained override wins; expect Standard profile with constrained instructions and log.

## H) Bathroom Profile
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

## I) Office Profile
### Profiles
- **Standard**: Default modern home office setup—compact desk plus chair with minimal accessories.
- **Large**: Triggered when layout cues indicate a spacious or dedicated office; allows larger/L-shaped desk and a single bookshelf while staying uncluttered.
- **Constrained override**: Any constrained keyword forces STANDARD with `isConstrained=true`, removing optional accessories but still requiring the desk + chair pairing.

### Allowed Items
- **Standard**:
  - Required: exactly one compact desk + exactly one compact modern office chair (no oversized executive chairs).
  - Optional: choose **at most one** of `rectangular rug`, `small desk lamp`, `small plant`.
  - Desk placement: prefer the longest uninterrupted wall away from doors; angled/corner placement only when it improves flow and keeps windows clear.
- **Constrained override (standard profile + constrained flag)**:
  - Required: desk + compact chair remain.
  - Optional: **none**—omit rugs, lamps, plants entirely.
  - Add reminder to keep the chair tucked and prioritize walk paths; emphasize the constrained size definition (limited floor/wall space, many doors/windows, cropped view).
- **Large**:
  - Required: exactly one desk (allow larger or L-shaped) + exactly one modern chair (scaled appropriately, still minimal).
  - Optional: choose **at most two** total from:
    - One bookshelf or low bookcase (against a blank wall),
    - One rectangular rug,
    - One desk lamp **or** one small plant (still only one of those).
  - Surfaces must remain uncluttered; accessories stay minimal.

### Forbidden Items
- Beds, sofas/sectionals, dining tables/chairs, bar stools, kitchen items, multiple desks, bulky storage (filing cabinets, large hutches), cluttered accessories, entertainment centers.

### Max Counts
- **Standard**: desks = 1, chairs = 1, rugs ≤ 1, lamps ≤ 1, plants ≤ 1, bookshelves = 0.
- **Constrained**: desks = 1, chairs = 1 (kept tucked), rugs = 0, lamps = 0, plants = 0, bookshelves = 0.
- **Large**: desks = 1, chairs = 1, rugs ≤ 1, lamps ≤ 1, plants ≤ 1, bookshelves ≤ 1.

### Size Inference Rules
- Aggregate `preferredPlacements + notes`.
- Constrained keywords (`tight`, `narrow`, `small`, `limited space`, `cramped`, `compact`, `multiple doors`, `many doors`, `door swing`, `keep path clear`, `minimal clearance`, `little floor space`, `limited wall space`, `no open wall`) override everything: return `{ profile: "standard", isConstrained: true }`.
- Large profile = (≥2 `OFFICE_LARGE_KEYWORDS` hits **OR** any `OFFICE_SECONDARY_ZONE_KEYWORDS` hit) and *not* constrained.
- If no layout constraints exist, default to Standard with `isConstrained=false`.

### Logging Expectations
- Always log `OfficeProfile=standard|large`.
- When constrained keywords trigger, also log `OfficeConstrained=true`.

### Quick Test Cases
1. **Standard default**: no layout constraints → `OfficeProfile=standard`, optional slot available.
2. **Window wall guidance**: notes mention “keep desk off window wall” → Standard with desk placement reminder intact.
3. **Large via keywords**: “spacious dedicated office with built-in shelves” → `OfficeProfile=large`, bookshelf allowed once.
4. **Constrained override**: “compact office with multiple doors, keep path clear” → Standard profile + constrained instructions (no optional accessories), log `OfficeConstrained=true`.
5. **Flex room**: “spare bedroom staged as office, limited wall space” → constrained override to ensure no beds/extra seating appear.

## J) Entry / Foyer Profile
### Profiles
- **Standard**: Default entry treatment when no large cues or constraints exist. Allows a single slim furniture piece and extremely limited decor so the main walkway stays open.
- **Large**: Triggered by at least two entry large keywords (“large”, “spacious”, “open”, “expansive”, “wide”, “big”) or any secondary-zone keyword (“foyer”, “grand entry”, “two-story entry”, “staircase”, “open landing”, “console area”) found in layout constraints.
- **Constrained override**: Any constrained keyword (`tight`, `narrow`, `small`, `limited space`, `cramped`, `compact`, `door swing`, `keep path clear`, `entry path`, `main walkway`, `steps`, `stair`, `landing`, `multiple doors`) forces STANDARD with `isConstrained=true` even if large cues appear.

### Allowed Items
- **Standard**:
  - Core furniture: choose **at most one** of (a) narrow console table **or** (b) small bench. Never stage both simultaneously.
  - Placement: only drop the console/bench when it clearly fits without touching doors, stairs, or walk paths. Empty entries are preferred to risky placements.
  - Optional decor (pick **at most one** total): `mirror above console`, `one plant`, `one small tray/bowl on the console`.
  - Runner: at most **one** slim runner, only when it obviously does not reduce the main walkway. Default to **no rug**.
  - Remind the model to keep door thresholds, stair starts, and walk paths fully visible.
- **Constrained override (standard profile + constrained flag)**:
  - Default to **no furniture** at all.
  - If anything is staged, allow only **one** of: `small wall mirror` **or** `very small plant tucked in a corner`, but only when it does not reduce clearance.
  - No console, no bench, no tray, no runner. Include a “Size Definition (Constrained)” reminder describing narrow/tight/cropped views with visible door swings, steps, or stacked doors—prioritize the walkway above all styling.
- **Large**:
  - Furniture: allow **one** console table (against a wall) plus **one** mirror centered above it.
  - Decor: up to **two** total (one plant + one small tray/bowl)—keep them minimal and never let them protrude into circulation.
  - Runner: optional slim runner (≤1) only if it clearly keeps the main walkway unobstructed; otherwise omit.
  - Stair rule: if a staircase is visible, keep the first 3–4 feet of the landing completely empty (no decor or furniture near the stair base).

### Forbidden Items
- Applies to all entry profiles: `beds`, `sofas/sectionals`, `dining tables/chairs`, `office desks`, `kitchen items`, `large rugs covering walkways`, or any bulky/cluttered furniture.
- Never block doors, stairs, or the main path; if uncertain, leave the space empty.

### Max Counts
- **Standard**: console/bench ≤1, mirror ≤1, plant ≤1, tray/bowl ≤1, runner ≤1 (default 0).
- **Constrained**: furniture = 0, mirror ≤1 *or* plant ≤1 (never both), runner = 0, decor items = 0 otherwise.
- **Large**: console ≤1, mirror ≤1, runner ≤1, decor items ≤2 total (plant ≤1, tray/bowl ≤1).

### Size Inference Rules
- Aggregate `preferredPlacements + notes`.
- Large profile = (≥2 ENTRY_LARGE_KEYWORDS hits **or** any ENTRY_SECONDARY_ZONE_KEYWORDS hit) and **not** constrained.
- Constrained override wins whenever any ENTRY_CONSTRAINED_KEYWORDS hit; return `{ profile: "standard", isConstrained: true }`.
- If no layout constraints exist, default to Standard, `isConstrained=false`.

### Logging Expectations
- Always log `EntryProfile=standard|large`.
- Whenever constrained keywords fire, also log `EntryConstrained=true`.

### Quick Test Cases
1. **Entry — Standard default**: no constraints → expect Standard, allow console *or* bench (not both), optional decor limit = 1, runner default omitted.
2. **Entry — Large via keywords**: notes include “spacious two-story foyer with console area” → expect Large profile, console + mirror allowed, decor limit = 2, runner optional if clear.
3. **Entry — Stair landing constraint**: notes mention “keep door swing and stair landing clear, narrow foyer” → force Standard with `isConstrained=true`, only allow single small mirror *or* tiny plant, log `EntryConstrained=true`.
4. **Entry — Mixed cues**: “grand entry with staircase” plus “multiple doors and tight walkway” → constrained override wins; log `EntryConstrained=true`, no furniture.

## K) Outdoor Space Profile
### Profiles
- **Standard**: Default minimal outdoor staging for patios, decks, balconies, landings, or cropped backyard views. Add at most one small seating vignette (bistro or compact lounge) plus a single accessory only when clearances remain.
- **Large**: Triggered when the analyzer finds **two or more** outdoor large keywords (`large`, `spacious`, `open`, `expansive`, `wide`, `big`, `backyard`, `deck`, `patio`, `entertaining`) across `preferredPlacements + notes`, **or** any secondary-zone keyword (`dining area`, `lounge area`, `seating area`, `pool area`, `fire pit`, `outdoor kitchen`, `grill area`, `conversation area`). Allows up to two clearly separate seating/dining zones.
- **Constrained override**: If any constrained keyword appears (`narrow`, `tight`, `small`, `limited space`, `compact`, `door swing`, `entry door`, `keep path clear`, `walk path`, `walkway`, `main walkway`, `gate`, `steps`, `stair`, `landing`, `minimal clearance`), force STANDARD with `isConstrained=true`, no rugs, and default to omitting furniture unless a tiny bistro set obviously fits.

### Allowed Items & Behavior
- **Standard**:
  - Seating: exactly one small vignette. Option A: bistro set (2 chairs + small round table). Option B: 2–4 seat outdoor lounge set (one loveseat/sofa + up to two chairs + one coffee table) ONLY when the patio clearly supports it.
  - Optional decor: choose either **one** outdoor planter **or** **one** outdoor rug, and only when it does not reduce walkway, doorway, or step clearance.
  - Safety: never block doors, gates, steps, landings, or walk paths; omit furniture if uncertain.
- **Constrained (standard profile + constrained flag)**:
  - Default to zero furniture whenever the scene reads as a walkway, entry landing, narrow balcony, or cropped view focused on doors/steps.
  - If any furniture is used, it must be a **tiny bistro set only** (2 slim chairs + one small table) with obvious clearance around doors/steps.
  - Accessories: NO rugs. Planters optional only when they do not intrude on circulation—omit if uncertain.
  - Add an explicit “SIZE DEFINITION (CONSTRAINED)” reminder describing narrow/tight/cropped layouts and instructions to omit items when unsure.
- **Large**:
  - Zones: up to **two** zones only when the patio/backyard is clearly spacious. Examples: (a) one dining set zone, (b) one lounge zone. Use both only if the photo shows distinct areas.
  - Dining zone: one outdoor dining table + 4–6 slim outdoor chairs (never exceed 6) plus one table-level vignette if space allows.
  - Lounge zone: one outdoor sofa/loveseat + up to two chairs total, paired with one coffee/side table.
  - Accessories: at most **one** outdoor rug and up to **two** planters (never exceed two) when they do not pinch circulation.
  - Reinforce safety buffer around grills, fire pits, or heaters (“keep a wide safety clearance; do not place furniture near heat sources”).

### Forbidden Items (all outdoor profiles)
- Indoor furniture (beds, indoor sofas, indoor dining sets, office desks, indoor lamps), curtains, wall art, pergolas or new built structures, moved/altered railings, and any remodeling.
- Never block or alter doors, gates, steps, railings, pools, or architectural elements.

### Max Counts
- **Standard**: seating vignettes ≤ 1, tables ≤ 1, chairs ≤ 4, rugs ≤ 1, planters ≤ 1.
- **Constrained**: seating vignettes ≤ 1 (bistro only, omit if unsure), tables ≤ 1 (small round bistro), chairs ≤ 2, rugs = 0, planters ≤ 1 only when it does not impact circulation.
- **Large**: zones ≤ 2, tables ≤ 1 dining OR 1 coffee table, chairs ≤ 6, rugs ≤ 1, planters ≤ 2.

### Size Inference Rules
- Aggregate `preferredPlacements + notes`.
- Large profile = (≥2 large keyword hits **OR** any secondary-zone keyword hit) AND *not* constrained.
- Constrained override takes precedence: any constrained keyword forces `{ profile: "standard", isConstrained: true }`, removes rug allowance, and adds the constrained size-definition reminder.
- If no layout constraints exist, default to Standard, `isConstrained=false`.

### Logging Expectations
- Always log `OutdoorProfile=standard|large`.
- When constrained keywords hit, also log `OutdoorConstrained=true`.

### Quick Test Cases
1. **Outdoor — Standard default**: no layout constraints → expect Standard, single seating vignette option, optional planter OR rug, no constrained log.
2. **Outdoor — Constrained door/steps**: notes say “keep entry door and steps clear, narrow landing” → force Standard profile + constrained instructions, log `OutdoorConstrained=true`, default to omitting furniture (allow tiny bistro set only if obvious).
3. **Outdoor — Large via secondary zone**: notes mention “pool area with lounge area + dining area” → `OutdoorProfile=large`, up to two zones, rug + two planters allowed if circulation stays open.
4. **Outdoor — Grill safety**: notes reference “built-in grill, keep clearance” → regardless of size, enforce safety buffer reminder; omit seating near grill.
5. **Outdoor — Pool deck walkway**: notes mention “main walkway to pool gate” → treat as constrained if keywords hit; otherwise Standard with explicit instruction to keep path clear and limit to one small vignette.

## L) Layout Analyzer Contract
### Layout Analyzer Contract
- Analyzer output structure (`LayoutConstraints`):
  - `noFurnitureZones: string[]`
  - `preferredPlacements: string[]`
  - `notes: string[]`
- Profile inference consumes `preferredPlacements + notes` for keyword detection; `noFurnitureZones` populate user-visible restrictions but do not impact sizing rules directly.

## M) Change Management
- Any change to staging prompts, sizing keywords, or analyzer logic must update this Markdown file **in the same PR**.
- Add a checklist item "✅ staging-profiles.md updated" to PR templates / manual review.
- Guidance for AI agents and developers: **never** modify staging behavior without updating this document to match.

## N) Quick Test Plan
1. **Living Room — Standard default**: no layout constraints; expect Standard profile, no constrained log.
2. **Living Room — Large**: constraints mention "spacious" twice; expect Large profile, no constrained override.
3. **Living Room — Constrained**: notes include "keep path clear"; expect Standard profile, `LivingRoomConstrained=true`, optional limit =1.
4. **Bedroom — Standard default**: no constraints; expect Standard, no constrained log.
5. **Bedroom — Large keyword hits**: notes with "open" and "expansive"; expect Large profile.
6. **Bedroom — Secondary zone**: notes include "reading corner"; expect Large profile even if only one size keyword.
7. **Bedroom — Constrained**: notes include "limited wall space" + "closet doors"; expect Standard profile with constrained instructions and log.


## Historical September 2026 editing and access changes
These entries record prior releases. The October 1 complete-layer delivery specification below supersedes their compositor, model-review and timeout behavior.
- September 30, approved: compositing rejects generated aspect-ratio changes over 2% instead of stretching the room. Exact protected-pixel restoration remains in place. The editor and reviewer receive an additional orange-highlighted copy identifying the editable region. The editor must keep every added object and shadow inside that region; selection constraints override room furniture counts. GPT Image 2.5 output dimensions follow the source aspect ratio on a 16-pixel grid. Removal skips furniture-layout analysis. Rejected results restore the reserved credit.
- Live fixture verification: living-room furnishing and removal passed with zero changed protected pixels. Two bedroom furnishing selections failed the cut-off-furniture check; bedroom placement remains an open quality limitation. These small samples do not establish a general success rate.
- Default image model: gpt-image-2.5-sunburst; override with STAGING_IMAGE_MODEL after testing.
- Transparent mask pixels are editable. Opaque pixels are restored from the original after inference and saved as lossless PNG.
- Customers can paint/protect regions and choose furnish, replace, or remove. The default center selection is only a starting point; protect windows, doors and fixtures.
- The selected area still requires visual review. Do not claim structural perfection, MLS compliance, human review, or guaranteed sales results.
- A database job reserves one credit before generation, persists the result, refunds failure once, and supports reload/recovery from My access.
- Image requests have a 240-second timeout with no automatic API retries. Layout analysis has a separate 30-second limit.
- Existing plan IDs, prices and durations remain compatible; Pro Pack is one payment for 50 credits valid 30 days, not a recurring subscription.

- Post-edit review uses GPT-6 Luna with low reasoning effort to check obvious architecture changes and cut-off furniture. Review failures restore the reserved credit. Automated review is imperfect; customers must review the final image.
- Live tests: GPT-4o-mini accepted an intentionally clipped result; GPT-6 Luna rejected it. A subsequent complete pipeline test (edit, composite, review, private storage, signed download) succeeded with a larger, fixture-aware selection.

- Preserve exposed flooring grain, joints, wall finishes and sharpness inside the edit selection. The secondary review rejects obvious surface changes, broad blur patches and artificial vignettes as well as geometry changes and clipped objects.

- For furnishing and replacement the provider mask is intentionally omitted: controlled edits with it repeatedly blurred exposed flooring. Removal now uses the narrower object mask described below. The alpha selection remains authoritative in local pixel restoration, followed by the image-quality gate. Region-boundary clipping is rejected rather than delivered.

- Full-resolution staging review found a false acceptance: the top of added wall art was clipped at the internal selection boundary. The reviewer now explicitly checks all object outlines, including art frames, plants, lamps and rug corners. New wall art, curtains and wall-mounted decor are omitted. The layout analyzer receives the same orange selection guide and must fit complete objects within it; selection rules override placement suggestions. This is a risk reduction, not a guarantee.

### September 30 bedroom selection follow-up
A follow-up public bedroom fixture protected the actual window outline instead of a large rectangle crossing the proposed bed. The current pipeline accepted it in 35.7 seconds with zero changed protected pixels and no clipped bed. This is one sample, not an acceptance-rate estimate. A visible wall-tone seam at the selection boundary remains a quality limitation; broader bedroom/replace/removal coverage is still required before release. No model or compositor change was made for this diagnostic.

Editor guidance: include the complete furniture item, bedding and shadow in the editable region. Trace windows and trim with Protect rather than cutting a large protected rectangle through the furniture area. Customers must still review changes inside the selection.

### Release boundary verification
The compositor blends only inward from fully protected pixels over at most 16 pixels (2% of the shorter image dimension for small photos). Fully protected pixels remain exact; the natural photograph edge and the edit interior are not faded. The image reviewer also checks tone seams and ghosted furniture. A fresh bedroom fixture passed with zero changed protected pixels; this narrow sample is not a general acceptance-rate guarantee. Keep a margin around complete objects in the selection.

### Mode-specific release checks
Removal uses a separate selection prompt with no furniture-placement instructions; it explicitly removes the main bed/sofa and reconstructs the newly exposed surfaces. Replacement explicitly requires visibly different main-furniture design or styling, and the reviewer rejects unchanged furniture with only accessories removed. In a public bedroom diagnostic, furnishing and revised replacement passed with zero changed protected pixels. Revised removal emptied the room but was rejected for a surface change. Keep this rejection and credit-restoration behavior; do not weaken the quality gate or infer a general acceptance rate from these samples.

### Removal surface reconstruction
Removal distinguishes movable area rugs from permanent flooring. The editor must reconstruct hidden flooring from the permanent surface visible outside the rug, never extend the removed rug pattern. Plain wall-to-wall carpet keeps its fine irregular pile; wood/tile keeps existing joint direction and spacing. Already-empty selected areas remain unchanged. The surface-quality review and exact protected-pixel compositor stay enabled. This instruction is subject to live fixture validation, not a guarantee of unseen surface accuracy.

Removal now runs a bounded visual object planner before image generation. Its conservative object bounds are expanded by at most 32 pixels (3.5% of the shorter photo dimension) and intersected with customer alpha; they can only narrow the selection. Exposed surfaces outside those bounds are copied exactly from the original. Fine silhouette tracing was rejected because it missed furniture fragments. Removal uses this mask in the provider edit request and feathers inward by up to 16 pixels. The final reviewer still sees the customer's original selection so an omitted furniture item cannot pass simply because the planner missed it. Empty, uncertain, or visibly incomplete selections return a clear failure and restore the credit without an image-generation request or result-file upload. The planner is fallible; image review remains mandatory.

### Removal validation and boundary lighting
A bounded, coarse-grid harmonic RGB correction fits generated lighting to protected pixels before compositing. Only protected pixels supply the correction; it never copies original furniture from editable pixels. Generated texture is retained, RGB offsets are capped at 64, and protected pixels are still restored exactly. The final image review remains enabled.

The corrected living-room and carpet-bedroom selections remove complete furniture and rugs; both final tone-corrected outputs passed automated and visual review with zero changed protected pixels. The old furnishing selections protected fragments of the furniture and are invalid removal fixtures. A live preflight detects the incomplete living-room selection; an already-empty bedroom avoids an image call. A GPT Image 1.5 comparison failed the surface check, so the default model remains unchanged. These are two room fixtures, not a general success-rate estimate or proof of hidden-room details.

## Complete-layer delivery (2026-10-01)
Furnishing generates a staged candidate, locates every newly added object, then segments its actual pixels locally using pinned BiRefNet 512 weights. The generator never redraws a transparent cutout. The resulting full-canvas furniture layer retains each object at its generated coordinates. Visible source surfaces stay byte-identical wherever the layer is transparent. Reject any nonzero layer alpha on even partially protected pixels; never clip, feather or erase furniture to enforce a mask. Complete placement and realistic floor contact take priority over all profile counts above; rugs and accessories may be omitted.
Replacement first removes selected furniture with the removal planner, reviews that cleared room, then adds a complete layer. Removal retains restricted background reconstruction and inward seam blending, never used for added furnishings.
Each final image receives an evidence-first full-image and four-detail review. Any defect, uncertainty or invalid response fails closed. One corrective layer generation is allowed after a completed rejection (two layer calls maximum, plus one removal for replacement). Provider timeout/errors never trigger paid automatic retries. Failed jobs restore the reserved credit through the existing idempotent job path. No schema changes or new retained source/layer files. Logs record pipeline version, model, image-call usage, geometry and disposition, without photo payloads. These checks reduce known errors; human evaluation is still required and perfection is not guaranteed.

The current conservative delivery profile uses one main furnishing with its bedding/cushions; separate accessories are excluded; tables, rugs, lamps, plants, curtains and wall art are omitted until independently validated. This overrides profile counts above. Segmentation weights are cached at build time, pinned to a repository revision, and used offline in production. Customer images are never uploaded to Hugging Face or Meta.

Foreground matting runs in a separate process with a 90-second deadline and returns its memory to the OS on exit. Object crops include context; a detected silhouette reaching an internal crop boundary is rejected. Uploaded API images are capped at 2048 pixels per side before credit reservation; the upload UI already resizes to 1536.

The complete-layer compositor includes a separate contact-shadow layer derived from local scene darkening within 3.5% of the shorter photo dimension of the lower furniture silhouette. It only attenuates original RGB, never copies generated background textures, never brightens surfaces, and never fades solid furniture. Any shadow overlap with protected pixels rejects the whole result. Final visual review still checks grounding and artifacts. Replacement supplies the original furnished photo as a third style-avoidance reference while keeping the cleared first photo authoritative for geometry.

Current time bounds: image edit 240 seconds, object detection and visual review 60 seconds each, layout analysis 30 seconds, local extraction 90 seconds. Durable jobs heartbeat while processing. Small real-image checks are not an acceptance-rate guarantee.
