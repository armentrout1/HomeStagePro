import type { KitchenProfile } from "../profiles/kitchenProfile";
import { KITCHEN_FORBIDDEN, KITCHEN_OPTIONAL_DECOR } from "../rooms/kitchen.constants";
import type { StrictBlocksResult } from "./types";

export const buildKitchenStrictBlocks = (
  profile: KitchenProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
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
