import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  OUTDOOR_CONSTRAINED_KEYWORDS,
  OUTDOOR_LARGE_KEYWORDS,
  OUTDOOR_SECONDARY_ZONE_KEYWORDS,
} from "../rooms/outdoor.constants";

export type OutdoorProfile = "standard" | "large";

export type OutdoorProfileResult = {
  profile: OutdoorProfile;
  isConstrained: boolean;
};

export const determineOutdoorProfile = (
  layoutConstraints?: LayoutConstraints | null
): OutdoorProfileResult => {
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
      OUTDOOR_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (
      OUTDOOR_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      largeKeywordHits += 1;
    }

    if (
      OUTDOOR_SECONDARY_ZONE_KEYWORDS.some((keyword) => lower.includes(keyword))
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
