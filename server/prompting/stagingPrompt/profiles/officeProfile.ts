import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  OFFICE_CONSTRAINED_KEYWORDS,
  OFFICE_LARGE_KEYWORDS,
  OFFICE_SECONDARY_ZONE_KEYWORDS,
} from "../rooms/office.constants";

export type OfficeProfile = "standard" | "large";

export type OfficeProfileResult = {
  profile: OfficeProfile;
  isConstrained: boolean;
};

export const determineOfficeProfile = (
  layoutConstraints?: LayoutConstraints | null
): OfficeProfileResult => {
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
      OFFICE_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))
    ) {
      isConstrained = true;
    }

    if (OFFICE_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      OFFICE_SECONDARY_ZONE_KEYWORDS.some((keyword) => lower.includes(keyword))
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
