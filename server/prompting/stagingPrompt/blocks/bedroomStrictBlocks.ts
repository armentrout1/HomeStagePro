import type { BedroomProfile } from "../profiles/bedroomProfile";
import {
  BEDROOM_FORBIDDEN,
  BEDROOM_OPTIONAL_LARGE,
  BEDROOM_OPTIONAL_STANDARD,
  BEDROOM_REQUIRED,
} from "../rooms/bedroom.constants";
import type { StrictBlocksResult } from "./types";

export const buildBedroomStrictBlocks = (
  profile: BedroomProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
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
