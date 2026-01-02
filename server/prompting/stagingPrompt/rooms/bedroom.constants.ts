export const BEDROOM_LARGE_KEYWORDS = [
  "large",
  "spacious",
  "open",
  "expansive",
  "wide",
  "big",
] as const;

export const BEDROOM_SECONDARY_ZONE_KEYWORDS = [
  "sitting area",
  "reading corner",
  "seating corner",
  "extra space",
  "open floor",
  "empty corner",
  "spare corner",
  "unused space",
  "lounge area",
] as const;

export const BEDROOM_CONSTRAINED_KEYWORDS = [
  "tight",
  "narrow",
  "small",
  "limited space",
  "cramped",
  "multiple doors",
  "many doors",
  "closet doors",
  "door swing",
  "keep path clear",
  "minimal clearance",
  "avoid blocking window",
  "window wall",
  "little floor space",
  "limited wall space",
  "no open wall",
  "compact",
] as const;

export const BEDROOM_REQUIRED = ["ONE bed", "ONE rug"] as const;

export const BEDROOM_OPTIONAL_STANDARD = [
  "ONE OR TWO nightstands",
  "ONE OR TWO lamps",
  "ONE plant",
] as const;

export const BEDROOM_OPTIONAL_LARGE = [
  "ONE OR TWO nightstands",
  "ONE OR TWO lamps",
  "ONE plant",
  "ONE bench",
] as const;

export const BEDROOM_FORBIDDEN = [
  "dining tables",
  "office desks",
  "sectionals",
  "large sofas",
  "bar stools",
  "kitchen items",
] as const;
