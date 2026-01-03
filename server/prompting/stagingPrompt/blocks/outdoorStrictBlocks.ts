import type { StrictBlocksResult } from "./types";
import type { OutdoorProfile } from "../profiles/outdoorProfile";
import { OUTDOOR_FORBIDDEN } from "../rooms/outdoor.constants";

export const buildOutdoorStrictBlocks = (
  profile: OutdoorProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
  const isLarge = profile === "large";
  const isConstrainedStandard = Boolean(
    options?.isConstrained && profile === "standard"
  );

  const goalLine =
    "Goal: Create modern, realistic outdoor staging that feels minimally styled and true to the photographed patio/backyard.";

  const standardSeatingLine =
    "Seating vignette: Add AT MOST ONE small outdoor seating vignette. Option A: bistro set (2 chairs + small table). Option B: 2–4 seat outdoor set (one loveseat/sofa + 1–2 chairs + coffee table) ONLY if ample space clearly remains.";

  const walkwayLine =
    "Walkway / entry handling: Do NOT force furniture if the image appears to be a walkway, entry landing, or tight patio. When uncertain, omit furniture entirely.";

  const optionalStandardLine =
    "Optional decor (standard): Choose either ONE outdoor planter OR ONE outdoor rug, only when it will not reduce walkway or door clearance.";

  const maxCountsStandardLine =
    "Max counts (standard): seating vignettes ≤ 1, tables ≤ 1, chairs ≤ 4, rugs ≤ 1, planters ≤ 1.";

  const constrainedOverrideLine = isConstrainedStandard
    ? "Constrained override: Default to omitting furniture if any placement might block entry doors, steps, gates, or main walk paths. If you add furniture, it must be a tiny bistro set (2 chairs + one small table) with obvious clearance."
    : "";

  const constrainedRugLine = isConstrainedStandard
    ? "Constrained rugs: NOT ALLOWED. Keep flooring fully visible."
    : "";

  const largeZoneLine = isLarge
    ? "Zones: Allow up to TWO clearly separate outdoor zones only when the scene is obviously spacious. Otherwise, stick to a single zone."
    : "";

  const largeDiningLine = isLarge
    ? "Dining zone option: ONE outdoor dining table with 4–6 slim outdoor chairs (never exceed 6) and leave chair pull-out clearance obvious."
    : "";

  const largeLoungeLine = isLarge
    ? "Lounge zone option: ONE outdoor sofa or loveseat plus up to two chairs total, paired with ONE coffee/side table. Only include both lounge and dining zones if the patio/backyard clearly supports two distinct areas."
    : "";

  const largeDecorLine = isLarge
    ? "Optional decor (large): ONE outdoor rug plus up to TWO planters (never exceed 2) and only when they do not pinch circulation."
    : "";

  const largeMaxCountsLine = isLarge
    ? "Max counts (large): zones ≤ 2, tables ≤ 1 dining OR 1 coffee table, chairs ≤ 6, rugs ≤ 1, planters ≤ 2."
    : "";

  const sizeDefinitionLine = isLarge
    ? "SIZE DEFINITION (LARGE): Triggered by ≥2 outdoor large-keyword hits or any secondary-zone keyword (dining area, lounge area, pool area, fire pit, outdoor kitchen, etc.) when NOT constrained; indicates a truly spacious patio/backyard with multiple usable zones."
    : "SIZE DEFINITION (STANDARD): Default outdoor treatment when large cues are absent or uncertain; furniture stays extremely minimal.";

  const constrainedSizeDefinitionLine = isConstrainedStandard
    ? "SIZE DEFINITION (CONSTRAINED): Narrow/tight/cropped patio, door swing or steps dominating the scene, or explicit 'keep path clear' instructions—stage extremely minimally and omit items if uncertain."
    : "";

  const safetyDoorsLine =
    "Safety: Never block doors, gates, steps, landings, or walkways; keep every path and egress fully clear.";

  const safetyHeatLine =
    "Heat sources: Keep a wide safety buffer around grills, fire pits, or outdoor heaters; do not place furniture near heat sources.";

  const outdoorOnlyLine =
    "Furniture type: Outdoor-rated furniture only; if a piece might read as indoor furniture, omit it.";

  const suffixLines = [
    `STRICT OUTDOOR BLOCK (${profile.toUpperCase()}) — FINAL CHECK:`,
    "If any placement could pinch circulation or door clearance, omit the item entirely.",
    isConstrainedStandard
      ? "Constrained reminder: default to no furniture unless a tiny bistro vignette clearly fits."
      : "",
    "Keep staging minimal, preserve all doors/steps/walkways, and leave heat sources unobstructed.",
  ].filter(Boolean);

  const prefixLines = [
    `STRICT OUTDOOR BLOCK (${profile.toUpperCase()}) — MUST FOLLOW:`,
    goalLine,
    profile === "standard" ? standardSeatingLine : "",
    profile === "standard" ? optionalStandardLine : "",
    profile === "standard" ? maxCountsStandardLine : "",
    constrainedOverrideLine,
    constrainedRugLine,
    largeZoneLine,
    largeDiningLine,
    largeLoungeLine,
    largeDecorLine,
    largeMaxCountsLine,
    walkwayLine,
    safetyDoorsLine,
    safetyHeatLine,
    outdoorOnlyLine,
    sizeDefinitionLine,
    constrainedSizeDefinitionLine,
  ].filter(Boolean);

  const forbiddenBlock = `DO NOT add: ${OUTDOOR_FORBIDDEN.join(
    ", "
  )}. No remodeling or new built structures, and never move railings or other architecture.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};
