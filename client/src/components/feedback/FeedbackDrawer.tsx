import { useMemo, useState } from "react";
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
import { REVIEW_URL } from "@/components/feedback/FeedbackCtas";
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
  const { isOpen, step, setStep, handleClose, handleSheetChange } = useFeedbackDrawer();
  const [basicsSaved, setBasicsSaved] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    register,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues });

  const rating = watch("rating");
  const goal = watch("goal");
  const watermarkPreference = watch("watermarkPreference");
  const canPublishTestimonial = watch("canPublishTestimonial");

  const showWatermarkText = useMemo(
    () => Boolean(watermarkPreference && watermarkPreference !== "never"),
    [watermarkPreference],
  );
  const showTestimonialConsent = useMemo(
    () => (rating ?? 0) >= 4,
    [rating],
  );
  const isBasicsSubmitDisabled = !rating || !goal || isSubmitting;
  const isDetailsSubmitDisabled = isSubmitting;

  const closeAndReset = () => {
    handleClose();
    reset(defaultValues);
    setBasicsSaved(false);
    setDetailsSaved(false);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      closeAndReset();
    } else {
      handleSheetChange(true);
    }
  };

  const handleReviewClick = () => {
    window.open(REVIEW_URL, "_blank", "noopener,noreferrer");
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

  const buildBasePayload = (
    values: FormValues,
    overrides: Partial<ExtendedFeedbackPayload> = {},
  ): ExtendedFeedbackPayload => {
    const contextFields = getContextFields();

    return {
      rating: values.rating!,
      goal: values.goal,
      issue: null,
      freeformFeedback: null,
      requestedFeature: null,
      persona: null,
      usageFrequency: null,
      pricingPreference: null,
      willingnessToPayRange: null,
      watermarkPreference: null,
      watermarkTextPreference: null,
      canPublishTestimonial: false,
      testimonialName: null,
      testimonialCompany: null,
      canShareBeforeAfter: false,
      email: null,
      ...contextFields,
      ...overrides,
    };
  };

  const onSubmitBasics = async (values: FormValues) => {
    if (!values.rating || !values.goal) {
      return;
    }

    const payload = buildBasePayload(values, {
      issue: normalize(values.issue),
      freeformFeedback: normalize(values.freeformFeedback),
    });

    await submitFeedbackWithToast({
      payload,
      toast,
      onSuccess: () => {
        setBasicsSaved(true);
      },
    });
  };

  const onSubmitDetails = async (values: FormValues) => {
    if (!basicsSaved) {
      toast({
        title: "Submit basics first",
        description: "Send rating & goal before optional details.",
        variant: "destructive",
      });
      return;
    }

    if (!values.rating || !values.goal) {
      return;
    }

    const payload = buildBasePayload(values, {
      requestedFeature: normalize(values.requestedFeature),
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
    });

    await submitFeedbackWithToast({
      payload,
      toast,
      onSuccess: () => {
        setDetailsSaved(true);
      },
    });
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

        <form onSubmit={(event) => event.preventDefault()} className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-8 pb-6">
              <StepOneBasic
                control={control}
                register={register}
                rating={rating}
                goal={goal}
                isSubmitting={isSubmitting}
                isBasicsSubmitDisabled={isBasicsSubmitDisabled}
                onSetRating={(value) => setValue("rating", value, { shouldValidate: true })}
                onTellUsMore={() => setStep(2)}
                onBackToBasics={() => setStep(1)}
                onSubmitBasics={() => handleSubmit(onSubmitBasics)()}
                basicsSaved={basicsSaved}
                isShowingMore={step === 2}
              />

              {step === 2 && (
                <StepTwoDetails
                  control={control}
                  register={register}
                  showWatermarkText={showWatermarkText}
                  showTestimonialConsent={showTestimonialConsent}
                  canPublishTestimonial={canPublishTestimonial}
                  isSubmitting={isSubmitting}
                  isDetailsSubmitDisabled={isDetailsSubmitDisabled}
                  onSubmitDetails={() => handleSubmit(onSubmitDetails)()}
                  detailsSaved={detailsSaved}
                  basicsSaved={basicsSaved}
                />
              )}
            </div>
          </div>

          <DrawerFooter
            rating={rating}
            step={step}
            onLeaveReview={handleReviewClick}
            onClose={closeAndReset}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}
