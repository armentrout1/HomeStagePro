import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useFeedbackContext } from "@/state/feedbackContext";
import {
  defaultValues,
  type FormValues,
  type ExtendedFeedbackPayload,
} from "@/components/feedback/FeedbackDrawer/types";
import { useFeedbackDrawer } from "@/components/feedback/FeedbackDrawer/useFeedbackDrawer";
import { submitFeedbackWithToast } from "@/components/feedback/FeedbackDrawer/submitFeedbackWithToast";
import { DrawerFooter } from "@/components/feedback/FeedbackDrawer/components/DrawerFooter";
import { StepOneBasic } from "@/components/feedback/FeedbackDrawer/components/StepOneBasic";
import { StepTwoDetails } from "@/components/feedback/FeedbackDrawer/components/StepTwoDetails";

export function FeedbackDrawer() {
  const { toast } = useToast();
  const context = useFeedbackContext();
  const { isOpen, handleClose, handleSheetChange } = useFeedbackDrawer();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSubmissionId, setClientSubmissionId] = useState<string | null>(null);

  const CLIENT_SUBMISSION_STORAGE_KEY = "feedback.clientSubmissionId";

  const { control, handleSubmit, reset, register, setValue, watch } = useForm<FormValues>({ defaultValues });

  const rating = watch("rating");
  const goal = watch("goal");
  const watermarkPreference = watch("watermarkPreference");
  const canPublishTestimonial = watch("canPublishTestimonial");

  const showWatermarkText = useMemo(
    () => Boolean(watermarkPreference && watermarkPreference !== "never"),
    [watermarkPreference],
  );
  const showTestimonialConsent = useMemo(() => (rating ?? 0) >= 4, [rating]);
  const canSubmit = Boolean(rating && goal);
  const isSubmitDisabled = !canSubmit || isSubmitting || hasSubmitted;

  const ensureClientSubmissionId = () => {
    if (typeof window === "undefined") {
      return null;
    }
    if (clientSubmissionId) {
      return clientSubmissionId;
    }
    const stored = window.localStorage.getItem(CLIENT_SUBMISSION_STORAGE_KEY);
    if (stored) {
      setClientSubmissionId(stored);
      return stored;
    }
    const generated = crypto.randomUUID();
    setClientSubmissionId(generated);
    window.localStorage.setItem(CLIENT_SUBMISSION_STORAGE_KEY, generated);
    return generated;
  };

  const handleFooterSubmit = () => {
    handleSubmit(onSubmit)();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CLIENT_SUBMISSION_STORAGE_KEY);
    if (stored) {
      setClientSubmissionId(stored);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      ensureClientSubmissionId();
    }
  }, [isOpen]);

  const closeAndReset = () => {
    handleClose();
    reset(defaultValues);
    setHasSubmitted(false);
    setIsSubmitting(false);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      closeAndReset();
    } else {
      handleSheetChange(true);
    }
  };

  const normalize = (value?: string) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const getContextFields = () => ({
    source: context.source ?? "nav_tab",
    jobId: context.jobId,
    planType: context.planType,
    roomType: context.roomType,
    styleSelected: context.styleSelected,
    deviceType: context.deviceType,
    country: context.country,
  });

  const buildFeedbackPayload = (values: FormValues): ExtendedFeedbackPayload => {
    const contextFields = getContextFields();
    const submissionId = ensureClientSubmissionId();
    const wantsWatermarkText = Boolean(
      values.watermarkPreference && values.watermarkPreference !== "never",
    );

    return {
      rating: values.rating!,
      goal: values.goal,
      issue: normalize(values.issue),
      freeformFeedback: normalize(values.freeformFeedback),
      requestedFeature: normalize(values.requestedFeature),
      persona: normalize(values.persona),
      usageFrequency: normalize(values.usageFrequency),
      pricingPreference: normalize(values.pricingPreference),
      willingnessToPayRange: normalize(values.willingnessToPayRange),
      watermarkPreference: normalize(values.watermarkPreference),
      watermarkTextPreference: wantsWatermarkText
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
      email: normalize(values.email),
      clientSubmissionId: submissionId,
      ...contextFields,
    };
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.rating || !values.goal) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildFeedbackPayload(values);
      await submitFeedbackWithToast({
        payload,
        toast,
        onSuccess: () => {
          setHasSubmitted(true);
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleDrawerOpenChange}>
      <SheetContent
        side="right"
        className="flex h-dvh max-h-screen w-full flex-col space-y-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <div className="border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle>Share feedback</SheetTitle>
            <SheetDescription>
              Let us know what you need so we can keep improving RoomStager.
            </SheetDescription>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-8 pb-6">
              <StepOneBasic
                control={control}
                register={register}
                rating={rating}
                goal={goal}
                onSetRating={(value) => setValue("rating", value, { shouldValidate: true })}
              />

              <StepTwoDetails
                control={control}
                register={register}
                showWatermarkText={showWatermarkText}
                showTestimonialConsent={showTestimonialConsent}
                canPublishTestimonial={canPublishTestimonial}
              />
            </div>
          </div>

          <DrawerFooter
            rating={rating}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            hasSubmitted={hasSubmitted}
            onSubmit={handleFooterSubmit}
            onClose={closeAndReset}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}
