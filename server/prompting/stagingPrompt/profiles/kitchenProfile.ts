import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  KITCHEN_CONSTRAINED_KEYWORDS,
  KITCHEN_LARGE_KEYWORDS,
  KITCHEN_SECONDARY_ZONE_KEYWORDS,
} from "../rooms/kitchen.constants";

export type KitchenProfile = "standard" | "large";

export type KitchenProfileResult = {
  profile: KitchenProfile;
  isConstrained: boolean;
};

export const determineKitchenProfile = (
  layoutConstraints?: LayoutConstraints | null
): KitchenProfileResult => {
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
      KITCHEN_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (KITCHEN_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      KITCHEN_SECONDARY_ZONE_KEYWORDS.some((keyword) =>
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
