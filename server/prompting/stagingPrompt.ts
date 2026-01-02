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
    "Do not add new lighting fixtures—no pendants or chandeliers; keep existing lighting unchanged.",
    "Do not add lights inside the shower.",
    "Do not place any objects inside the shower or tub.",
    "Only add a small bath mat or runner outside wet zones; do not place rugs inside the shower or overlapping drains.",
    "Allowed decor: neatly arranged towels, a small plant, minimal countertop accessories, and tasteful wall art that does not cover mirrors.",
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

  return [prefixBlock, baseInstructions, guardrails.join(" "), suffixBlock, forbiddenBlock]
    .filter(Boolean)
    .join(" ");
};
