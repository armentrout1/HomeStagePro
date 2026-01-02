export const GLOBAL_GUARDRAILS = [
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
] as const;

export const ROOM_SPECIFIC_GUARDRAILS: Record<string, readonly string[]> =
  {
    bathroom: [
      "Do not change or add fixtures—keep existing lighting, plumbing, and hardware exactly as-is.",
      "Never place anything inside the tub or shower; leave all wet zones completely empty.",
      "Countertop styling must stay minimal: create only one small clustered vignette and keep the sink/faucet zone mostly clear.",
      "Flooring: at most one small bath mat outside wet zones; never add rugs, runners, or overlapping mats.",
      "Keep every toilet, vanity, tub/shower, door, and window fully clear and unobstructed.",
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
    kitchen: [
      "Keep countertops mostly visible; only add the minimal optional decor described in the STRICT block.",
      "Never block appliances, cabinet doors, drawers, or their clearances—you must leave room to open everything fully.",
      "Floor coverings: ONLY one small mat directly in front of the sink is allowed; no other rugs or runners.",
      "Open shelving is optional only when a clearly empty wall segment between upper cabinets exists and is not a window; never create shelving on windows.",
    ],
  } as const;
