import type { LivingRoomProfile } from "../profiles/livingRoomProfile";
import {
  LIVING_ROOM_FORBIDDEN,
  LIVING_ROOM_OPTIONAL_DECOR,
  LIVING_ROOM_REQUIRED,
} from "../rooms/livingRoom.constants";
import type { StrictBlocksResult } from "./types";

export const buildLivingRoomStrictBlocks = (
  profile: LivingRoomProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
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
