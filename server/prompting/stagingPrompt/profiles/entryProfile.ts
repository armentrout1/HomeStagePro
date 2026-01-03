import type { LayoutConstraints } from "../../layoutAnalyzer";
import {
  ENTRY_CONSTRAINED_KEYWORDS,
  ENTRY_LARGE_KEYWORDS,
  ENTRY_SECONDARY_ZONE_KEYWORDS,
} from "../rooms/entry.constants";

export type EntryProfile = "standard" | "large";

export type EntryProfileResult = {
  profile: EntryProfile;
  isConstrained: boolean;
};

export const determineEntryProfile = (
  layoutConstraints?: LayoutConstraints | null
): EntryProfileResult => {
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

    if (ENTRY_CONSTRAINED_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      isConstrained = true;
    }

    if (ENTRY_LARGE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      largeKeywordHits += 1;
    }

    if (
      ENTRY_SECONDARY_ZONE_KEYWORDS.some((keyword) => lower.includes(keyword))
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
