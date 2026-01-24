import { useFeedbackContext } from "@/state/feedbackContext";

import { type ExtendedFeedbackPayload, type FormValues } from "./types";

type FeedbackContextValue = ReturnType<typeof useFeedbackContext>;

type BuildFeedbackPayloadArgs = {
  values: FormValues;
  context: FeedbackContextValue;
  showWatermarkText: boolean;
};

const normalize = (value: string) => (value.trim().length ? value.trim() : null);

export function buildFeedbackPayload({
  values,
  context,
  showWatermarkText,
}: BuildFeedbackPayloadArgs): ExtendedFeedbackPayload {
  return {
    rating: values.rating!,
    goal: values.goal,
    issue: normalize(values.issue),
    requestedFeature: normalize(values.requestedFeature),
    freeformFeedback: normalize(values.freeformFeedback),
    persona: normalize(values.persona),
    usageFrequency: normalize(values.usageFrequency),
    pricingPreference: normalize(values.pricingPreference),
    willingnessToPayRange: normalize(values.willingnessToPayRange),
    watermarkPreference: normalize(values.watermarkPreference),
    watermarkTextPreference: showWatermarkText
      ? normalize(values.watermarkTextPreference)
      : null,
    canPublishTestimonial: values.canPublishTestimonial,
    testimonialName: values.canPublishTestimonial
      ? normalize(values.testimonialName)
      : null,
    testimonialCompany: values.canPublishTestimonial
      ? normalize(values.testimonialCompany)
      : null,
    canShareBeforeAfter:
      values.canPublishTestimonial && values.canShareBeforeAfter ? true : false,
    source: context.source ?? "nav_tab",
    jobId: context.jobId,
    planType: context.planType,
    roomType: context.roomType,
    styleSelected: context.styleSelected,
    deviceType: context.deviceType,
    country: context.country,
  };
}
