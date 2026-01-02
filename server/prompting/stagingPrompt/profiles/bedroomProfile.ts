import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  BEDROOM_CONSTRAINED_KEYWORDS,
  BEDROOM_LARGE_KEYWORDS,
  BEDROOM_SECONDARY_ZONE_KEYWORDS,
} from "../rooms/bedroom.constants";

export type BedroomProfile = "standard" | "large";

export type BedroomProfileResult = {
  profile: BedroomProfile;
  isConstrained: boolean;
};

export const determineBedroomProfile = (
  layoutConstraints?: LayoutConstraints | null
): BedroomProfileResult => {
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
      BEDROOM_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (BEDROOM_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      BEDROOM_SECONDARY_ZONE_KEYWORDS.some((keyword) =>
        lower.includes(keyword)
      )
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
