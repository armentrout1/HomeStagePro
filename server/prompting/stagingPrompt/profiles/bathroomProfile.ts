import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  BATHROOM_CONSTRAINED_KEYWORDS,
  BATHROOM_LARGE_KEYWORDS,
  BATHROOM_SECONDARY_ZONE_KEYWORDS,
} from "../rooms/bathroom.constants";

export type BathroomProfile = "standard" | "large";

export type BathroomProfileResult = {
  profile: BathroomProfile;
  isConstrained: boolean;
};

export const determineBathroomProfile = (
  layoutConstraints?: LayoutConstraints | null
): BathroomProfileResult => {
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
      BATHROOM_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (BATHROOM_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      BATHROOM_SECONDARY_ZONE_KEYWORDS.some((keyword) =>
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
