const ROOM_SYNONYM_MAP: Record<string, string> = {
  "living_room": "living room",
  "livingroom": "living room",
  "living room": "living room",
  bedroom: "bedroom",
  "bed room": "bedroom",
  kitchen: "kitchen",
  bathroom: "bathroom",
  "bath room": "bathroom",
  "diningroom": "dining room",
  "dining_room": "dining room",
  "dining room": "dining room",
  office: "office",
  "home office": "office",
  "office space": "office",
  outdoor: "outdoor space",
  "outdoor space": "outdoor space",
  patio: "outdoor space",
  deck: "outdoor space",
  entry: "entry",
  foyer: "entry",
  entryway: "entry",
  "entry way": "entry",
  "entry / foyer": "entry",
  "front entry": "entry",
  "front entryway": "entry",
};

export const normalizeRoomType = (roomType?: string): string => {
  if (!roomType) {
    return "room";
  }

  const normalized = roomType.trim().toLowerCase();
  return ROOM_SYNONYM_MAP[normalized] || normalized;
};
