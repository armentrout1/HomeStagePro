import type { DiningRoomProfile } from "../profiles/diningRoomProfile";
import { DINING_FORBIDDEN } from "../rooms/diningRoom.constants";
import type { StrictBlocksResult } from "./types";

const KITCHEN_MISCLASSIFICATION_GUARD =
  "KITCHEN MISCLASSIFICATION GUARD (MUST FOLLOW): This is a dining area/breakfast nook, NOT a kitchen. Do NOT add or modify cabinets, countertops, sinks, faucets, dishwashers, stoves, refrigerators, or any plumbing/appliances. Do NOT create new built-ins or casework.";

export const buildDiningRoomStrictBlocks = (
  profile: DiningRoomProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
  const isConstrained = Boolean(options?.isConstrained);
  const isLarge = profile === "large";

  const requiredLine =
    "Required: EXACTLY ONE dining table placed realistically within the existing room layout.";

  const chairsLine = isLarge
    ? "Chairs: Arrange 6–8 dining chairs total (never exceed 8) and ensure every chair can slide out without hitting doors, windows, or walls."
    : isConstrained
      ? "Chairs: Use no more than TWO slim dining chairs and leave the busiest circulation sides completely open."
      : "Chairs: Use 2–4 dining chairs total (never exceed 4) and leave at least one side of the table open for easy circulation.";

  const tabletopBase =
    "Tabletop styling: Keep the surface mostly empty; add exactly ONE simple centerpiece plus optionally ONE runner OR ONE coordinated set of placemats. NEVER add full place settings.";
  const tabletopLine = isConstrained
    ? `${tabletopBase} Only use the centerpiece if it will not reduce usable table space, and SKIP runners/placemats when space feels tight.`
    : tabletopBase;

  const rugLine = isLarge
    ? "Rug: OPTIONAL — at most ONE rug that fits completely beneath the table and all chairs (even when pulled out) and does not cover primary walk paths."
    : "Rug: DO NOT add a rug in standard or constrained dining rooms.";

  const plantLine = isLarge
    ? "Plant allowance: You may add ONE plant total — either integrate greenery into the centerpiece OR place ONE floor plant only if it does not block circulation."
    : "";

  const maxCountsLine = isLarge
    ? "Max counts: tables = 1, chairs ≤ 8, centerpiece ≤ 1, runner/placemats ≤ 1, rugs ≤ 1, plants ≤ 1."
    : isConstrained
      ? "Max counts: tables = 1, chairs ≤ 2, centerpiece ≤ 1 (only if it keeps the tabletop usable), runner/placemats = 0, rugs = 0."
      : "Max counts: tables = 1, chairs ≤ 4, centerpiece ≤ 1, runner/placemats ≤ 1, rugs = 0.";

  const sizeDefinitionLine = isLarge
    ? "SIZE DEFINITION (LARGE): Triggered by ≥2 large-keyword hits or any secondary-zone keyword (formal dining, dedicated dining area, etc.) and only when not constrained. Large rooms clearly support expanded seating or extra dining zones."
    : "SIZE DEFINITION (STANDARD): Default dining treatment when no strong large cues exist. If cues conflict or are uncertain, treat as STANDARD.";

  const constrainedDefinitionLine = isConstrained
    ? "SIZE DEFINITION (CONSTRAINED): Layout shows limited clearance, multiple doors, or main walk paths intersecting the dining zone—stage extremely minimally and omit decor rather than risking blocked circulation."
    : "";

  const circulationLine =
    "Clearances: Never block any doorway, window, or walkway; keep chair pull-out arcs obvious. Remove furniture if there is any doubt.";

  const prefixLines = [
    `STRICT DINING BLOCK (${profile.toUpperCase()}) — MUST FOLLOW:`,
    requiredLine,
    KITCHEN_MISCLASSIFICATION_GUARD,
    chairsLine,
    tabletopLine,
    rugLine,
    plantLine,
    maxCountsLine,
    circulationLine,
    sizeDefinitionLine,
    constrainedDefinitionLine,
  ].filter(Boolean);

  const suffixLines = [
    `STRICT DINING BLOCK (${profile.toUpperCase()}) — FINAL CHECK:`,
    "Exactly ONE dining table, conservative chair counts, minimal tabletop styling, and zero items that block doors, windows, or walk paths.",
    isLarge
      ? "If the rug or plant would pinch circulation, omit them entirely."
      : "Skip rugs and extra decor if adding them risks any clearance issues.",
  ];

  const forbiddenBlock = `DO NOT add: ${DINING_FORBIDDEN.join(
    ", "
  )}. If an item is not explicitly allowed above, leave it out.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};
