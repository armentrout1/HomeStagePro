export type RoomType = string;

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
    "Living Room (MINIMAL): add ONLY (a) one sofa OR loveseat, (b) one coffee table, (c) one rug, (d) optionally one TV console, and (e) optionally one plant.",
    "Do NOT add accent chairs unless the room is clearly large and there is a dedicated seating corner that does not intersect any path or doorway.",
    "Prefer placing the sofa against the longest uninterrupted wall that is NOT near doors/entry.",
  ],
};

const normalizeRoomType = (roomType?: RoomType): string => {
  return roomType?.trim().toLowerCase() || "room";
};

export const buildStagingPrompt = (roomType: RoomType): string => {
  const normalizedRoomType = normalizeRoomType(roomType);
  const roomLabel = roomType?.trim() || "room";

  const baseInstructions = `Add realistic, stylish furniture and home décor to this empty ${roomLabel}. Match the existing lighting, shadows, and perspective so the staging looks naturally photographed.`;

  const guardrails = [...GLOBAL_GUARDRAILS];

  if (ROOM_SPECIFIC_GUARDRAILS[normalizedRoomType]) {
    guardrails.push(...ROOM_SPECIFIC_GUARDRAILS[normalizedRoomType]);
  }

  return `${baseInstructions} ${guardrails.join(" ")}`;
};
