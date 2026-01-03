import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  DINING_CONSTRAINED_KEYWORDS,
  DINING_LARGE_KEYWORDS,
  DINING_SECONDARY_ZONE_KEYWORDS,
} from "../rooms/diningRoom.constants";

export type DiningRoomProfile = "standard" | "large";

export type DiningRoomProfileResult = {
  profile: DiningRoomProfile;
  isConstrained: boolean;
};

export const determineDiningRoomProfile = (
  layoutConstraints?: LayoutConstraints | null
): DiningRoomProfileResult => {
  if (!layoutConstraints) {
    return { profile: "standard", isConstrained: false };
  }

  const phrases = [
    ...(layoutConstraints.preferredPlacements || []),
    ...(layoutConstraints.notes || []),
  ];

  let largeKeywordHits = 0;
  let hasSecondaryZone = false;
  let isConstrained = false;

  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();

    if (
      DINING_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (DINING_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      DINING_SECONDARY_ZONE_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      hasSecondaryZone = true;
    }
  }

  if (isConstrained) {
    return { profile: "standard", isConstrained: true };
  }

  if (largeKeywordHits >= 2 || hasSecondaryZone) {
    return { profile: "large", isConstrained: false };
  }

  return { profile: "standard", isConstrained: false };
};
