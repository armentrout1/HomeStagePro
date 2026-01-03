import type { StrictBlocksResult } from "./types";
import type { OfficeProfile } from "../profiles/officeProfile";
import { OFFICE_FORBIDDEN } from "../rooms/office.constants";

export const buildOfficeStrictBlocks = (
  profile: OfficeProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
  const isConstrainedStandard = Boolean(
    options?.isConstrained && profile === "standard"
  );

  const requiredLine =
    profile === "large"
      ? "Required items: EXACTLY ONE desk (allow larger desk or L-shaped configuration) plus EXACTLY ONE modern office chair (scaled to the desk, no oversized executive chairs)."
      : "Required items: EXACTLY ONE compact desk plus EXACTLY ONE compact modern office chair (no oversized executive chairs).";

  const optionalStandardLine =
    "Optional (choose AT MOST ONE total): ONE rectangular rug OR ONE small desk lamp OR ONE small plant.";

  const optionalLargeLine =
    "Optional (choose AT MOST TWO items total): ONE bookshelf (or low bookcase) placed along a blank wall, ONE rectangular rug, and ONE desk lamp OR ONE small plant (still only one of those two). Keep surfaces uncluttered.";

  const constrainedOptionalNote = isConstrainedStandard
    ? "Constrained override: Do NOT add rugs, lamps, plants, or any other accessories."
    : "";

  const deskPlacementLine =
    "Desk placement guidance: Prefer the longest uninterrupted wall away from doors; angled/corner placement is allowed only when it improves flow and keeps every door swing and window fully visible.";

  const chairGuidanceLine = isConstrainedStandard
    ? "Chair handling: keep the chair tucked neatly under the desk when not in use so walk paths stay clear."
    : "Chair handling: keep the chair oriented so walk paths remain clear, never blocking door swings or window access.";

  const maxCountsLine =
    profile === "large"
      ? "Max counts: desks = 1, chairs = 1, rugs ≤ 1, lamps ≤ 1, plants ≤ 1, bookshelves ≤ 1. Surfaces must stay uncluttered."
      : "Max counts: desks = 1, chairs = 1, rugs ≤ 1, lamps ≤ 1, plants ≤ 1, bookshelves = 0.";

  const constrainedDefinitionLine = isConstrainedStandard
    ? "SIZE DEFINITION (CONSTRAINED): Visible area shows limited floor/wall space, many doors/windows, or a cropped layout—stage extremely minimally and prioritize main walk paths."
    : "";

  const prefixLines = [
    `STRICT FURNITURE SET (${profile.toUpperCase()}) — MUST FOLLOW:`,
    requiredLine,
    profile === "large" ? optionalLargeLine : optionalStandardLine,
    constrainedOptionalNote,
    deskPlacementLine,
    chairGuidanceLine,
    maxCountsLine,
    constrainedDefinitionLine,
  ].filter(Boolean);

  const suffixLines = [
    `STRICT FURNITURE SET (${profile.toUpperCase()}) — FINAL CHECK:`,
    "Keep the scene modern, clean, and minimal; if an item is not explicitly listed above, omit it.",
    "Never block doors, windows, vents, or the main circulation path; remove furniture instead of forcing a placement.",
  ];

  const forbiddenBlock = `DO NOT add: ${OFFICE_FORBIDDEN.join(
    ", "
  )}. No filing cabinets unless extremely subtle—prefer omitting them entirely.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};
