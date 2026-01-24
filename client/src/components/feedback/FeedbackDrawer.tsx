import { useMemo } from "react";
import { useForm } from "react-hook-form";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitFeedback, type FeedbackPayload } from "@/api/feedback";
import { useToast } from "@/hooks/use-toast";
import { useFeedbackContext } from "@/state/feedbackContext";
import { FEATURE_OPTIONS } from "./feedbackOptions";
import { REVIEW_URL } from "@/components/feedback/FeedbackCtas";
import {
  UNSET_OPTION,
  defaultValues,
  type FormValues,
  type ExtendedFeedbackPayload,
} from "@/components/feedback/FeedbackDrawer/types";
import { useFeedbackDrawer } from "@/components/feedback/FeedbackDrawer/useFeedbackDrawer";
import { buildFeedbackPayload } from "@/components/feedback/FeedbackDrawer/buildFeedbackPayload";
import { submitFeedbackWithToast } from "@/components/feedback/FeedbackDrawer/submitFeedbackWithToast";
import { DrawerFooter } from "@/components/feedback/FeedbackDrawer/components/DrawerFooter";
import { StepOneBasic } from "@/components/feedback/FeedbackDrawer/components/StepOneBasic";
import { StepTwoDetails } from "@/components/feedback/FeedbackDrawer/components/StepTwoDetails";

export function FeedbackDrawer() {
  const { toast } = useToast();
  const context = useFeedbackContext();
  const { isOpen, step, setStep, handleClose, handleSheetChange } = useFeedbackDrawer();

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

  const onSubmit = async (values: FormValues, { shouldClose = true } = {}) => {
    if (!values.rating || !values.goal) {
      return;
    }

    const payload: ExtendedFeedbackPayload = buildFeedbackPayload({
      values,
      context,
      showWatermarkText,
    });

    await submitFeedbackWithToast({
      payload,
      toast,
      onSuccess: () => {
        if (shouldClose) {
          closeAndReset();
        }
      },
    });
  };

  const handleBasicsSubmit = handleSubmit((values) => onSubmit(values, { shouldClose: false }));
  const handleDetailsSubmit = handleSubmit((values) => onSubmit(values, { shouldClose: false }));

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
                onSubmitBasics={handleBasicsSubmit}
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
                  onSubmitDetails={handleDetailsSubmit}
                />
              )}
            </div>
          </div>

          <DrawerFooter
            rating={rating}
            step={step}
            onLeaveReview={handleReviewClick}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}
