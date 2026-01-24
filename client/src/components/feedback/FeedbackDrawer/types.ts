import type { FeedbackPayload } from "@/api/feedback";

export const RATING_VALUES = [1, 2, 3, 4, 5] as const;
export const UNSET_OPTION = "unset";

export type FormValues = {
  rating: number | null;
  goal: string;
  issue: string;
  freeformFeedback: string;
  requestedFeature: string;
  persona: string;
  usageFrequency: string;
  pricingPreference: string;
  willingnessToPayRange: string;
  watermarkPreference: string;
  watermarkTextPreference: string;
  canPublishTestimonial: boolean;
  testimonialName: string;
  testimonialCompany: string;
  canShareBeforeAfter: boolean;
};

export const defaultValues: FormValues = {
  rating: null,
  goal: "",
  issue: "",
  freeformFeedback: "",
  requestedFeature: "",
  persona: "",
  usageFrequency: "",
  pricingPreference: "",
  willingnessToPayRange: "",
  watermarkPreference: "",
  watermarkTextPreference: "",
  canPublishTestimonial: false,
  testimonialName: "",
  testimonialCompany: "",
  canShareBeforeAfter: false,
};

export type ExtendedFeedbackPayload = FeedbackPayload & {
  testimonialName?: string | null;
  testimonialCompany?: string | null;
};
