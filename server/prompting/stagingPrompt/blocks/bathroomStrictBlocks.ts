import type { BathroomProfile } from "../profiles/bathroomProfile";
import {
  BATHROOM_FORBIDDEN,
  BATHROOM_OPTIONAL_DECOR,
} from "../rooms/bathroom.constants";
import type { StrictBlocksResult } from "./types";

export const buildBathroomStrictBlocks = (
  profile: BathroomProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
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
