/**
 * STAGING RULES SOURCE OF TRUTH:
 * See docs/staging/staging-profiles.md
 * If you change staging behavior, update the MD in the same change.
 */
import { log } from "../vite";
import type { LayoutConstraints } from "./layoutAnalyzer";

export type RoomType = string;

type LivingRoomProfile = "standard" | "large";
type BedroomProfile = "standard" | "large";
type KitchenProfile = "standard" | "large";
type BathroomProfile = "standard" | "large";

type BuildPromptOptions = {
  layoutConstraints?: LayoutConstraints | null;
};

const GLOBAL_GUARDRAILS = [
  "Preserve the exact room layout and camera perspective.",
  "Do not remodel, repaint, change finishes, or alter architecture in any way.",
  "Do not add, remove, or change windows, doors, built-ins, plumbing, or electrical fixtures.",
  "Do not place any furniture in front of doors or within the door swing area—keep every doorway fully clear and usable.",
  "Maintain an unobstructed path from the main entry or camera position through the room; do not place chairs in that path.",
  "Prefer minimal staging with appropriately scaled pieces; do not fill every empty space, and only add accent chairs when ample room remains without impacting circulation or door clearance.",
  "Keep at least 36 inches of clear walking path everywhere people would naturally walk; never block doors, halls, windows, vents, or switches.",
  "HARD RULES (MUST FOLLOW):",
  "NEVER place ANY furniture within 4 feet (1.2m) of ANY door, doorway, or door swing area.",
  "Keep ALL doorways fully clear and visible; if unsure, leave the area empty.",
  "If a placement might obstruct a doorway or circulation, OMIT the furniture (do not try to fill space).",
  "WINDOW RULES (MUST FOLLOW):",
  "NEVER place wall art, mirrors, shelves, or any objects over/inside the window opening (no frames hanging on windows).",
  "Keep windows visible and unobstructed; do not cover the glass with furniture, art, or decor.",
  "Window treatments are allowed (simple neutral curtains or blinds), but they must look realistic and not block the window opening entirely.",
  "COMPOSITION RULES (MUST FOLLOW):",
  "Do NOT try to center furniture for the camera or make the scene symmetrical.",
  "Place furniture where it realistically fits given doors, windows, and circulation—even if it looks off-center in the photo.",
  "Natural asymmetry is acceptable; prioritize function and clear paths over visual centering.",
];

const ROOM_SPECIFIC_GUARDRAILS: Record<string, string[]> = {
  bathroom: [
    "Do not change or add fixtures—keep existing lighting, plumbing, and hardware exactly as-is.",
    "Never place anything inside the tub or shower; leave all wet zones completely empty.",
    "Countertop styling must stay minimal: create only one small clustered vignette and keep the sink/faucet zone mostly clear.",
    "Flooring: at most one small bath mat outside wet zones; never add rugs, runners, or overlapping mats.",
    "Keep every toilet, vanity, tub/shower, door, and window fully clear and unobstructed.",
  ],
  bedroom: [
    "Keep bed placement realistic and do not block closet doors.",
    "Add nightstands or lamps only if space allows, and do not add extra ceiling fixtures.",
    "If the room is small or wall space is limited, use a FULL or TWIN bed (not queen/king).",
    "If a standard bed would block a window, stage as a GUEST ROOM / OFFICE flex room (daybed or twin + small desk) and keep windows fully visible.",
    "Avoid benches at the foot of the bed in small rooms; prioritize circulation.",
    "If adding curtains/blinds, use light neutral tones and keep them outside the glass area (mounted above/around the window), never as a substitute for wall art.",
    "If the bed must be placed on the same wall as a window due to room constraints, center the bed under the window and keep it aligned with the window trim.",
  ],
  "living room": [
    "Follow the STRICT FURNITURE SET block exactly—never exceed the allowed items or counts.",
    "Prefer placing the sofa or sectional against the longest uninterrupted wall that is NOT near doors/entry.",
    "Only add an accent chair when the STRICT block explicitly allows it and the placement leaves generous door and pathway clearance.",
  ],
  kitchen: [
    "Keep countertops mostly visible; only add the minimal optional decor described in the STRICT block.",
    "Never block appliances, cabinet doors, drawers, or their clearances—you must leave room to open everything fully.",
    "Floor coverings: ONLY one small mat directly in front of the sink is allowed; no other rugs or runners.",
    "Open shelving is optional only when a clearly empty wall segment between upper cabinets exists and is not a window; never create shelving on windows.",
  ],
};

const normalizeRoomType = (roomType?: RoomType): string =>
  roomType?.trim().toLowerCase() || "room";

const LIVING_ROOM_SIZE_KEYWORDS = [
  "large",
  "spacious",
  "open",
  "expansive",
  "wide",
  "big",
] as const;

const LIVING_ROOM_SECONDARY_ZONE_KEYWORDS = [
  "sitting area",
  "reading corner",
  "seating corner",
  "separate seating",
  "extra space",
  "open floor",
  "empty corner",
  "unused space",
  "lounge area",
] as const;

const LIVING_ROOM_CONSTRAINED_KEYWORDS = [
  "tight",
  "narrow",
  "small",
  "limited space",
  "cramped",
  "compact",
  "multiple doors",
  "many doors",
  "door swing",
  "keep path clear",
  "minimal clearance",
  "entry path",
  "main walkway",
  "circulation path",
  "limited wall space",
  "no open wall",
  "couch blocks",
  "avoid blocking window",
  "little floor space",
  "cropped",
  "partial view",
] as const;

const LIVING_ROOM_REQUIRED = [
  "ONE sofa OR loveseat",
  "ONE rug",
  "ONE coffee table",
] as const;

const LIVING_ROOM_OPTIONAL_DECOR = [
  "ONE plant",
  "ONE floor lamp",
  "ONE TV/media console",
] as const;

const LIVING_ROOM_FORBIDDEN = [
  "beds",
  "dining tables",
  "office desks",
  "pianos",
  "dining chairs",
  "bar stools",
] as const;

const BEDROOM_LARGE_KEYWORDS = [
  "large",
  "spacious",
  "open",
  "expansive",
  "wide",
  "big",
] as const;

const BEDROOM_SECONDARY_ZONE_KEYWORDS = [
  "sitting area",
  "reading corner",
  "seating corner",
  "extra space",
  "open floor",
  "empty corner",
  "spare corner",
  "unused space",
  "lounge area",
] as const;

const BEDROOM_CONSTRAINED_KEYWORDS = [
  "tight",
  "narrow",
  "small",
  "limited space",
  "cramped",
  "multiple doors",
  "many doors",
  "closet doors",
  "door swing",
  "keep path clear",
  "minimal clearance",
  "avoid blocking window",
  "window wall",
  "little floor space",
  "limited wall space",
  "no open wall",
  "compact",
] as const;

const BEDROOM_REQUIRED = ["ONE bed", "ONE rug"] as const;

const BEDROOM_OPTIONAL_STANDARD = [
  "ONE OR TWO nightstands",
  "ONE OR TWO lamps",
  "ONE plant",
] as const;

const BEDROOM_OPTIONAL_LARGE = [
  "ONE OR TWO nightstands",
  "ONE OR TWO lamps",
  "ONE plant",
  "ONE bench",
] as const;

const BEDROOM_FORBIDDEN = [
  "dining tables",
  "office desks",
  "sectionals",
  "large sofas",
  "bar stools",
  "kitchen items",
] as const;

const KITCHEN_LARGE_KEYWORDS = [
  "large",
  "spacious",
  "open",
  "expansive",
  "wide",
  "big",
] as const;

const KITCHEN_SECONDARY_ZONE_KEYWORDS = [
  "island",
  "eat-in",
  "breakfast nook",
  "dining area",
  "open floor",
  "extra space",
  "unused space",
] as const;

const KITCHEN_CONSTRAINED_KEYWORDS = [
  "tight",
  "narrow",
  "small",
  "limited space",
  "cramped",
  "compact",
  "galley",
  "multiple doors",
  "many doors",
  "door swing",
  "keep path clear",
  "minimal clearance",
  "little floor space",
  "limited wall space",
  "no open wall",
  "limited counter",
  "minimal counter",
] as const;

const KITCHEN_OPTIONAL_DECOR = [
  "fruit bowl",
  "cutting board",
  "coffee setup (mug + small tray)",
  "small plant",
  "dish towel",
  "soap dispenser",
] as const;

const KITCHEN_FORBIDDEN = [
  "sofas",
  "beds",
  "dining tables",
  "dining chairs",
  "office desks",
  "bar stools",
  "sectionals",
  "new islands",
  "large rugs",
  "runners",
  "wall remodeling",
  "permanent fixture changes",
] as const;

const BATHROOM_LARGE_KEYWORDS = [
  "large",
  "spacious",
  "open",
  "expansive",
  "wide",
  "big",
] as const;

const BATHROOM_SECONDARY_ZONE_KEYWORDS = [
  "double vanity",
  "dual sinks",
  "his and hers",
  "separate tub and shower",
  "soaking tub",
  "walk-in shower",
  "water closet",
  "private toilet area",
  "spa bath",
  "ensuite",
  "makeup vanity",
  "dressing area",
] as const;

const BATHROOM_CONSTRAINED_KEYWORDS = [
  "tight",
  "narrow",
  "small",
  "limited space",
  "cramped",
  "compact",
  "powder room",
  "half bath",
  "guest bath",
  "multiple doors",
  "many doors",
  "door swing",
  "keep path clear",
  "minimal clearance",
  "little floor space",
  "limited wall space",
  "no open wall",
] as const;

const BATHROOM_OPTIONAL_DECOR = [
  "neatly folded towels (one set)",
  "ONE soap dispenser + small tray (one vignette)",
  "ONE small plant",
  "ONE small bath mat near vanity/tub (outside wet zone)",
] as const;

const BATHROOM_FORBIDDEN = [
  "any furniture (chairs, benches)",
  "new fixtures (lighting or plumbing)",
  "rugs or runners beyond one small mat",
  "any objects inside tub or shower",
  "anything that blocks fixtures, doors, or windows",
] as const;

type LivingRoomProfileResult = {
  profile: LivingRoomProfile;
  isConstrained: boolean;
};

const determineLivingRoomProfile = (
  layoutConstraints?: LayoutConstraints | null
): LivingRoomProfileResult => {
  if (!layoutConstraints) {
    return { profile: "standard", isConstrained: false };
  }

  const phrases = [
    ...(layoutConstraints.preferredPlacements || []),
    ...(layoutConstraints.notes || []),
  ];

  let isConstrained = false;
  let largeKeywordHits = 0;
  let hasSecondaryZone = false;

  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();

    if (
      LIVING_ROOM_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (
      LIVING_ROOM_SIZE_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      largeKeywordHits += 1;
    }

    if (
      LIVING_ROOM_SECONDARY_ZONE_KEYWORDS.some((keyword) =>
        lower.includes(keyword)
      )
    ) {
      hasSecondaryZone = true;
    }
  }

  if (isConstrained) {
    return { profile: "standard", isConstrained: true };
  }

  return {
    profile:
      largeKeywordHits >= 2 || hasSecondaryZone ? "large" : "standard",
    isConstrained: false,
  };
};

type BedroomProfileResult = {
  profile: BedroomProfile;
  isConstrained: boolean;
};

const determineBedroomProfile = (
  layoutConstraints?: LayoutConstraints | null
): BedroomProfileResult => {
  if (!layoutConstraints) {
    return { profile: "standard", isConstrained: false };
  }

  const phrases = [
    ...(layoutConstraints.preferredPlacements || []),
    ...(layoutConstraints.notes || []),
  ];

  let largeKeywordHits = 0;
  let hasSecondaryZone = false;
  let isConstrained = false;

  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();

    if (
      BEDROOM_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (
      BEDROOM_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      largeKeywordHits += 1;
    }

    if (
      BEDROOM_SECONDARY_ZONE_KEYWORDS.some((keyword) =>
        lower.includes(keyword)
      )
    ) {
      hasSecondaryZone = true;
    }
  }

  if (isConstrained) {
    return { profile: "standard", isConstrained: true };
  }

  if (largeKeywordHits >= 2 || hasSecondaryZone) {
    return { profile: "large", isConstrained: false };
  }

  return { profile: "standard", isConstrained: false };
};

type BathroomProfileResult = {
  profile: BathroomProfile;
  isConstrained: boolean;
};

const determineBathroomProfile = (
  layoutConstraints?: LayoutConstraints | null
): BathroomProfileResult => {
  if (!layoutConstraints) {
    return { profile: "standard", isConstrained: false };
  }

  const phrases = [
    ...(layoutConstraints.preferredPlacements || []),
    ...(layoutConstraints.notes || []),
  ];

  let largeKeywordHits = 0;
  let hasSecondaryZone = false;
  let isConstrained = false;

  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();

    if (
      BATHROOM_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (BATHROOM_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      BATHROOM_SECONDARY_ZONE_KEYWORDS.some((keyword) =>
        lower.includes(keyword)
      )
    ) {
      hasSecondaryZone = true;
    }
  }

  if (isConstrained) {
    return { profile: "standard", isConstrained: true };
  }

  if (largeKeywordHits >= 2 || hasSecondaryZone) {
    return { profile: "large", isConstrained: false };
  }

  return { profile: "standard", isConstrained: false };
};

type KitchenProfileResult = {
  profile: KitchenProfile;
  isConstrained: boolean;
};

const determineKitchenProfile = (
  layoutConstraints?: LayoutConstraints | null
): KitchenProfileResult => {
  if (!layoutConstraints) {
    return { profile: "standard", isConstrained: false };
  }

  const phrases = [
    ...(layoutConstraints.preferredPlacements || []),
    ...(layoutConstraints.notes || []),
  ];

  let largeKeywordHits = 0;
  let hasSecondaryZone = false;
  let isConstrained = false;

  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();

    if (
      KITCHEN_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (KITCHEN_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      KITCHEN_SECONDARY_ZONE_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      hasSecondaryZone = true;
    }
  }

  if (isConstrained) {
    return { profile: "standard", isConstrained: true };
  }

  if (largeKeywordHits >= 2 || hasSecondaryZone) {
    return { profile: "large", isConstrained: false };
  }

  return { profile: "standard", isConstrained: false };
};

const buildLivingRoomStrictBlocks = (
  profile: LivingRoomProfile,
  options?: { isConstrained?: boolean }
) => {
  const isConstrainedStandard = Boolean(
    options?.isConstrained && profile === "standard"
  );
  const requiredLine = `Required items: ${LIVING_ROOM_REQUIRED.join(", ")}.`;
  const optionalLine =
    profile === "standard"
      ? `Optional (choose AT MOST ONE): ${LIVING_ROOM_OPTIONAL_DECOR.join(" OR ")}.`
      : `Optional decor (still choose only ONE plant OR ONE floor lamp) and add ONE TV/media console ONLY if there is a clear uninterrupted wall section far from doors/windows; otherwise omit it.`;
  const constrainedOptionalNote = isConstrainedStandard
    ? "In constrained rooms, do not add more than ONE optional item total."
    : "";

  const accentLine =
    profile === "large"
      ? "Accent seating: You may add ONE accent chair ONLY if the room is clearly spacious and the chair sits away from every doorway."
      : "Accent seating: DO NOT add any accent chairs in standard living rooms.";

  const maxCountsLine =
    profile === "large"
      ? "Max counts: seating pieces = 2 total (one sofa/sectional + at most one accent chair), accent chairs = 1, tables = 1 coffee table, rugs = 1."
      : "Max counts: seating pieces = 1 (one sofa or loveseat only), accent chairs = 0, tables = 1 coffee table, rugs = 1.";

  const allowedPiecesSummary =
    profile === "large"
      ? "Allowed pieces: sofa/sectional, rug, coffee table, TV/media console, one plant OR floor lamp, and optionally one accent chair if space remains."
      : "Allowed pieces: sofa or loveseat, rug, coffee table, and optionally one of plant / floor lamp / TV-media console.";
  const constrainedSizeDefinitionLine = isConstrainedStandard
    ? "SIZE DEFINITION (CONSTRAINED): Visible photo area has limited floor/wall space or a clear entry/walkway; stage extremely minimally; if uncertain, OMIT optional items."
    : "";

  const prefixLines = [
    `STRICT FURNITURE SET (${profile.toUpperCase()}) — MUST FOLLOW:`,
    requiredLine,
    optionalLine,
    constrainedOptionalNote,
    accentLine,
    maxCountsLine,
    constrainedSizeDefinitionLine,
  ];

  const suffixLines = [
    `STRICT FURNITURE SET (${profile.toUpperCase()}) — FINAL CHECK:`,
    allowedPiecesSummary,
    "If uncertain, omit extra furniture rather than breaking these limits.",
  ];

  const forbiddenBlock = `DO NOT add: ${LIVING_ROOM_FORBIDDEN.join(
    ", "
  )}. If an item is not listed in the STRICT set above, leave it out entirely.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};

const buildKitchenStrictBlocks = (
  profile: KitchenProfile,
  options?: { isConstrained?: boolean }
) => {
  const isConstrained = Boolean(options?.isConstrained);
  const optionalLimit = isConstrained
    ? 1
    : profile === "large"
      ? 4
      : 2;
  const requiredLine =
    "COUNTERTOP VISIBILITY RULE: Keep countertops mostly visible; add only minimal decor and never cover large counter areas.";
  const optionalLine = `Optional decor (choose AT MOST ${optionalLimit} total): ${KITCHEN_OPTIONAL_DECOR.join(
    ", "
  )}.`;
  const constrainedOptionalNote = isConstrained
    ? "Constrained kitchens: limit to ONE optional decor item, and omit it entirely if doing so keeps clearances cleaner."
    : "";
  const floorLine =
    "Floor rule: Allow AT MOST one small sink mat placed directly in front of the sink; no large rugs, runners, or mats across the tile.";
  const shelvingLine =
    profile === "large"
      ? "Open shelving: Allowed ONLY if there is a clear empty wall segment between upper cabinets that is not a window; keep it minimal with 2–3 decorative items."
      : "Open shelving: DO NOT add open shelving in standard kitchens.";
  const clearanceLine =
    "Clearances: Do not block sinks, stoves, refrigerators, dishwashers, or any cabinet doors/drawers. Keep decor away from door swings and appliance handles.";
  const placementLine =
    "Placement: Never add furniture except compact counter decor; do NOT introduce new islands or dining sets.";
  const maxCountsLine =
    profile === "large"
      ? "Max counts: decor ≤ 4, sink mats ≤ 1, shelving ≤ 1 small section, rugs = 0, runners = 0."
      : "Max counts: decor ≤ 2, sink mats ≤ 1, shelving = 0, rugs = 0, runners = 0.";
  const sizeDefinitionLine =
    profile === "large"
      ? "SIZE DEFINITION (LARGE): Kitchen has clear extra zones (e.g., island seating, eat-in/breakfast nook, or multiple open areas). Requires ≥2 large-keyword hits or any secondary-zone keyword. If uncertain, treat as STANDARD."
      : "SIZE DEFINITION (STANDARD): Not an open-plan kitchen with extra staging zones; if uncertain or cues conflict, treat as STANDARD.";
  const constrainedDefinitionLine = isConstrained
    ? "SIZE DEFINITION (CONSTRAINED): Photo shows limited counter/floor/wall space or crowded appliances/doors—stage extremely minimally and keep all clearances obvious."
    : "";
  const constrainedEdgeNote = isConstrained
    ? "Constrained placement: Never place decor near counter edges where it could block cabinet doors or appliance clearance."
    : "";

  const prefixLines = [
    `STRICT KITCHEN BLOCK (${profile.toUpperCase()}) — MUST FOLLOW:`,
    requiredLine,
    optionalLine,
    constrainedOptionalNote,
    "COUNTERTOP DECOR PLACEMENT: Place decor as ONE small clustered vignette along the backsplash, away from the sink basin/faucet area and away from the cooktop/stove area. Do not scatter items across multiple counters.",
    isConstrained ? "If uncertain, omit countertop decor entirely." : "",
    floorLine,
    shelvingLine,
    clearanceLine,
    placementLine,
    maxCountsLine,
    sizeDefinitionLine,
    constrainedDefinitionLine,
    constrainedEdgeNote,
  ].filter(Boolean);

  const suffixLines = [
    `STRICT KITCHEN BLOCK (${profile.toUpperCase()}) — FINAL CHECK:`,
    "Allowed items: only countertop-safe decor from the optional list, plus one small sink mat; no other furniture.",
    "If uncertain, err on the side of fewer items and keep every appliance and surface fully visible.",
  ];

  const forbiddenBlock = `DO NOT add: ${KITCHEN_FORBIDDEN.join(
    ", "
  )}. Never block the sink, stove, refrigerator, dishwasher, or cabinet doors.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};

const buildBathroomStrictBlocks = (
  profile: BathroomProfile,
  options?: { isConstrained?: boolean }
) => {
  const isConstrained = Boolean(options?.isConstrained);
  const optionalLimitLabel = isConstrained
    ? "ONE"
    : profile === "large"
      ? "THREE"
      : "TWO";
  const fixturesLine =
    "Fixtures: NEVER block the toilet, vanity/sink, mirror, tub/shower, towel bars, or any doors/windows.";
  const countertopLine =
    "Countertop: keep the vanity counter mostly visible; add only minimal decor as ONE small clustered vignette near the backsplash and away from the sink faucet zone.";
  const optionalLine = `Optional decor: choose AT MOST ${optionalLimitLabel} total from: ${BATHROOM_OPTIONAL_DECOR.join(
    ", "
  )}.`;
  const constrainedOptionalNote = isConstrained
    ? "Constrained bathrooms: optional decor AT MOST ONE total; if uncertain, omit decor entirely."
    : "";
  const floorLine = isConstrained
    ? "Floor: allow at most one small bath mat ONLY if it does not reduce circulation; otherwise omit mats entirely. Never place mats or rugs inside the tub/shower."
    : "Floor: allow at most one small bath mat; no large rugs or runners; never place anything inside the tub/shower.";
  const wallsLine =
    profile === "large"
      ? "Walls: you may add at most ONE small framed art piece ONLY if there is a clear blank wall area that does not interfere with mirrors, windows, or doors."
      : "Walls: do not cover mirrors; wall art is NOT allowed in STANDARD bathrooms.";
  const lightingLine = "Lighting: do NOT add or change fixtures.";
  const maxCountsLine =
    profile === "large"
      ? "Max counts: optional decor ≤3, plants ≤1, towels ≤1 set, mats ≤1, art ≤1."
      : `Max counts: optional decor ≤${
          isConstrained ? 1 : 2
        }, plants ≤1, towels ≤1 set, mats ≤1, art = 0.`;
  const constrainedArtLine = isConstrained
    ? "Constrained bathrooms: NO wall art; leave walls bare except existing mirrors/windows."
    : "";
  const constrainedMatLine = isConstrained
    ? "Constrained bathrooms: No mats if they reduce circulation—keep paths fully clear."
    : "";
  const sizeDefinitionLine =
    profile === "large"
      ? "SIZE DEFINITION (LARGE): Triggered by ≥2 bathroom large-keyword hits or any secondary-zone keyword (double vanity, separate tub + shower, soaking tub, dressing area/ensuite). If cues are weak, treat as STANDARD."
      : "SIZE DEFINITION (STANDARD): Default bathroom size; stage minimally unless clear large cues exist.";
  const constrainedDefinitionLine = isConstrained
    ? "SIZE DEFINITION (CONSTRAINED): Limited visible floor/wall space or many doors/fixtures/cropped view—stage extremely minimally and keep circulation obvious."
    : "";

  const prefixLines = [
    `STRICT BATHROOM BLOCK (${profile.toUpperCase()}) — MUST FOLLOW`,
    fixturesLine,
    countertopLine,
    optionalLine,
    constrainedOptionalNote,
    floorLine,
    wallsLine,
    lightingLine,
    maxCountsLine,
    sizeDefinitionLine,
    constrainedDefinitionLine,
    constrainedMatLine,
    constrainedArtLine,
  ].filter(Boolean);

  const suffixLines = [
    `STRICT BATHROOM BLOCK (${profile.toUpperCase()}) — FINAL CHECK`,
    "Allowed items: only a minimal countertop vignette plus the limited optional decor above; never add furniture or new fixtures.",
    "Keep the tub and shower completely empty and leave every fixture, doorway, and window fully visible.",
  ];

  const forbiddenBlock = `DO NOT add: ${BATHROOM_FORBIDDEN.join(
    ", "
  )}. This applies to ALL bathroom sizes.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};

const buildBedroomStrictBlocks = (
  profile: BedroomProfile,
  options?: { isConstrained?: boolean }
) => {
  const isConstrained = Boolean(options?.isConstrained);
  const requiredLine = `Required items: ${BEDROOM_REQUIRED.join(", ")}.`;
  const optionalList =
    profile === "standard" ? BEDROOM_OPTIONAL_STANDARD : BEDROOM_OPTIONAL_LARGE;
  const optionalLimit =
    profile === "standard"
      ? isConstrained
        ? "ONE"
        : "TWO"
      : "THREE";
  const optionalLine = `Optional (choose AT MOST ${optionalLimit} total): ${optionalList.join(
    " OR "
  )}.`;
  const constrainedOptionalNote = isConstrained
    ? "In constrained rooms, do not add more than ONE optional item total."
    : "";

  const bedPlacementLine =
    "Bed placement: Put the headboard against the longest uninterrupted wall away from every door. Never block closet doors, door swings, or windows, and always keep clear circulation.";

  const seatingLine =
    profile === "standard"
      ? "Seating: DO NOT add any chairs, loveseats, or sofas in standard bedrooms."
      : "Seating: You may add ONE small chair ONLY if the room is clearly spacious and the chair sits away from all doors and closets.";

  const maxCountsLine =
    profile === "standard"
      ? "Max counts: beds = 1, rugs = 1, nightstands ≤ 2, lamps ≤ 2, plants ≤ 1, benches = 0, chairs = 0, tables = 0."
      : "Max counts: beds = 1, rugs = 1, nightstands ≤ 2, lamps ≤ 2, plants ≤ 1, benches ≤ 1, chairs ≤ 1, tables = 0.";

  const allowedPiecesSummary =
    profile === "standard"
      ? "Allowed pieces: one bed, one rug, up to two nightstands/lamps, one plant."
      : "Allowed pieces: one bed, one rug, up to two nightstands/lamps, one plant, optional bench, and optionally one small chair if space allows.";

  const sizeDefinitionLine =
    profile === "standard"
      ? "SIZE DEFINITION (STANDARD): Room does NOT have an extra sitting area; stage only the sleeping zone. If uncertain, treat as STANDARD."
      : "SIZE DEFINITION (LARGE): Room has clear unused space beyond the main walking path and bed clearance (e.g., a distinct corner/zone). If uncertain, treat as STANDARD.";
  const constrainedDefinitionLine = isConstrained
    ? "SIZE DEFINITION (CONSTRAINED): The visible photo area has limited floor space or limited uninterrupted wall space (e.g., many doors/windows/crop). Stage extremely minimally; if uncertain, OMIT optional items."
    : "";

  const prefixLines = [
    `STRICT FURNITURE SET (${profile.toUpperCase()} BEDROOM) — MUST FOLLOW:`,
    requiredLine,
    optionalLine,
    constrainedOptionalNote,
    bedPlacementLine,
    seatingLine,
    maxCountsLine,
    sizeDefinitionLine,
    constrainedDefinitionLine,
  ];

  const suffixLines = [
    `STRICT FURNITURE SET (${profile.toUpperCase()} BEDROOM) — FINAL CHECK:`,
    allowedPiecesSummary,
    "If uncertain, omit extra furniture rather than breaking these limits.",
  ];

  const forbiddenBlock = `DO NOT add: ${BEDROOM_FORBIDDEN.join(
    ", "
  )}. If an item is not listed in the STRICT set above, leave it out entirely.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};

export const buildStagingPrompt = (
  roomType: RoomType,
  options: BuildPromptOptions = {}
): string => {
  const normalizedRoomType = normalizeRoomType(roomType);
  const roomLabel = roomType?.trim() || "room";

  const baseInstructions = `Add realistic, stylish furniture and home décor to this empty ${roomLabel}. Match the existing lighting, shadows, and perspective so the staging looks naturally photographed.`;

  const guardrails = [...GLOBAL_GUARDRAILS];

  if (ROOM_SPECIFIC_GUARDRAILS[normalizedRoomType]) {
    guardrails.push(...ROOM_SPECIFIC_GUARDRAILS[normalizedRoomType]);
  }

  let prefixBlock = "";
  let suffixBlock = "";
  let forbiddenBlock = "";

  if (normalizedRoomType === "living room") {
    const livingRoomProfile = determineLivingRoomProfile(
      options.layoutConstraints
    );
    log(`LivingRoomProfile=${livingRoomProfile.profile}`);
    if (livingRoomProfile.isConstrained) {
      log("LivingRoomConstrained=true");
    }
    const blocks = buildLivingRoomStrictBlocks(livingRoomProfile.profile, {
      isConstrained: livingRoomProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  if (normalizedRoomType === "bedroom") {
    const bedroomProfile = determineBedroomProfile(options.layoutConstraints);
    log(`BedroomProfile=${bedroomProfile.profile}`);
    if (bedroomProfile.isConstrained) {
      log("BedroomConstrained=true");
    }
    const blocks = buildBedroomStrictBlocks(bedroomProfile.profile, {
      isConstrained: bedroomProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  if (normalizedRoomType === "kitchen") {
    const kitchenProfile = determineKitchenProfile(options.layoutConstraints);
    log(`KitchenProfile=${kitchenProfile.profile}`);
    if (kitchenProfile.isConstrained) {
      log("KitchenConstrained=true");
    }
    const blocks = buildKitchenStrictBlocks(kitchenProfile.profile, {
      isConstrained: kitchenProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  if (normalizedRoomType === "bathroom") {
    const bathroomProfile = determineBathroomProfile(options.layoutConstraints);
    log(`BathroomProfile=${bathroomProfile.profile}`);
    if (bathroomProfile.isConstrained) {
      log("BathroomConstrained=true");
    }
    const blocks = buildBathroomStrictBlocks(bathroomProfile.profile, {
      isConstrained: bathroomProfile.isConstrained,
    });
    prefixBlock = blocks.prefix;
    suffixBlock = blocks.suffix;
    forbiddenBlock = blocks.forbidden;
  }

  return [prefixBlock, baseInstructions, guardrails.join(" "), suffixBlock, forbiddenBlock]
    .filter(Boolean)
    .join(" ");
};
