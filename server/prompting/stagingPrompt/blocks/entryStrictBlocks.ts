import type { EntryProfile } from "../profiles/entryProfile";
import { ENTRY_FORBIDDEN } from "../rooms/entry.constants";
import type { StrictBlocksResult } from "./types";

export const buildEntryStrictBlocks = (
  profile: EntryProfile,
  options?: { isConstrained?: boolean }
): StrictBlocksResult => {
  const isConstrained = Boolean(options?.isConstrained);

  const walkwayRule =
    "WALKWAY RULE: Keep the main entry door, stair starts, and every visible walkway completely clear—omit furniture if there is any doubt.";
  const egressRule =
    "EGRESS RULE: Never block door swings, stair landings, or circulation paths; preserve egress first, styling second.";

  let prefixLines: string[] = [];
  let suffixLines: string[] = [];

  if (isConstrained) {
    prefixLines = [
      "STRICT ENTRY BLOCK (CONSTRAINED) — MUST FOLLOW:",
      "Default to NO furniture. Only add ONE very small wall-mounted mirror OR ONE very small plant tucked in a corner, and only if it does not reduce clearance.",
      "Do NOT add console tables, benches, trays, or runners in constrained foyers.",
      "SIZE DEFINITION (CONSTRAINED): Narrow/tight/cropped entry view with limited clearance, visible door swings, steps, or multiple doors. Prioritize walkway visibility over decor.",
      "If uncertain whether an item fits, leave the entry completely empty.",
      walkwayRule,
      egressRule,
    ];
    suffixLines = [
      "STRICT ENTRY BLOCK (CONSTRAINED) — FINAL CHECK:",
      "Ensure the door, stairs, and walk path read fully open; remove the mirror/plant if it creates any crowding.",
      "No rugs, runners, benches, or consoles are allowed when constrained.",
    ];
  } else if (profile === "large") {
    prefixLines = [
      "STRICT ENTRY BLOCK (LARGE) — MUST FOLLOW:",
      "Allow EXACTLY ONE console table positioned against a wall (never floating) plus EXACTLY ONE mirror centered above it.",
      "Optional decor: up to TWO total (ONE plant + ONE small tray/bowl) kept minimal on or beside the console.",
      "Runner allowance: at most ONE slim runner, only if it does not narrow the main walkway; default to omitting it when unsure.",
      "Staircase rule: if a staircase is visible, keep the first 3–4 feet of the landing completely empty—no decor near the stair base.",
      "Max counts: consoles ≤1, mirrors ≤1, runner ≤1, decor items ≤2 (plant ≤1, tray/bowl ≤1).",
      walkwayRule,
      egressRule,
    ];
    suffixLines = [
      "STRICT ENTRY BLOCK (LARGE) — FINAL CHECK:",
      "Keep the styling modern and minimal; if any required clearance looks tight, remove decor first, then furniture.",
      "Forbidden items apply even in large entries: never add seating clusters, dining pieces, or anything bulky.",
    ];
  } else {
    prefixLines = [
      "STRICT ENTRY BLOCK (STANDARD) — MUST FOLLOW:",
      "Core furniture: choose AT MOST ONE of (a) narrow console table OR (b) small bench. Never use both.",
      "Only place the console/bench if it clearly fits without blocking doors or walk paths.",
      "Optional decor (choose AT MOST ONE total): mirror above console OR one plant OR one small tray/bowl on the console surface.",
      "Runner allowance: at most ONE slim runner and only when it clearly does not reduce the primary walkway; default to NO rug.",
      "Max counts: console/bench ≤1, mirror ≤1, plant ≤1, tray/bowl ≤1, runners ≤1.",
      walkwayRule,
      egressRule,
    ];
    suffixLines = [
      "STRICT ENTRY BLOCK (STANDARD) — FINAL CHECK:",
      "If any placement could pinch the path, remove the furniture entirely—empty space is preferred to a risky placement.",
      "Keep door thresholds, closets, and stair starts visible with zero obstruction.",
    ];
  }

  const forbiddenBlock = `DO NOT add: ${ENTRY_FORBIDDEN.join(
    ", "
  )}. Never introduce large furniture, clutter, or anything that blocks doors, stairs, or circulation.`;

  return {
    prefix: prefixLines.join(" "),
    suffix: suffixLines.join(" "),
    forbidden: forbiddenBlock,
  };
};
