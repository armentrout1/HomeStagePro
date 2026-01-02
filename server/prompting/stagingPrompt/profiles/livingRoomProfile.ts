import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  LIVING_ROOM_CONSTRAINED_KEYWORDS,
  LIVING_ROOM_SECONDARY_ZONE_KEYWORDS,
  LIVING_ROOM_SIZE_KEYWORDS,
} from "../rooms/livingRoom.constants";

export type LivingRoomProfile = "standard" | "large";

export type LivingRoomProfileResult = {
  profile: LivingRoomProfile;
  isConstrained: boolean;
};

export const determineLivingRoomProfile = (
  layoutConstraints?: LayoutConstraints | null
): LivingRoomProfileResult => {
  if (!layoutConstraints) {
    return { profile: "standard", isConstrained: false };
  }

  const phrases = [
    ...(layoutConstraints.preferredPlacements || []),
    ...(layoutConstraints.notes || []),
  ];

  let isConstrained = false;
  let largeKeywordHits = 0;
  let hasSecondaryZone = false;

  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();

    if (
      LIVING_ROOM_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (
      LIVING_ROOM_SIZE_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      largeKeywordHits += 1;
    }

    if (
      LIVING_ROOM_SECONDARY_ZONE_KEYWORDS.some((keyword) =>
        lower.includes(keyword)
      )
    ) {
      hasSecondaryZone = true;
    }
  }

  if (isConstrained) {
    return { profile: "standard", isConstrained: true };
  }

  return {
    profile:
      largeKeywordHits >= 2 || hasSecondaryZone ? "large" : "standard",
    isConstrained: false,
  };
};
