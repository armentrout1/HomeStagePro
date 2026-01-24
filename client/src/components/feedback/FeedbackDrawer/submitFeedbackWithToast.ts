import { submitFeedback } from "@/api/feedback";
import { useToast } from "@/hooks/use-toast";

import type { ExtendedFeedbackPayload } from "./types";

type SubmitFeedbackWithToastArgs = {
  payload: ExtendedFeedbackPayload;
  toast: ReturnType<typeof useToast>["toast"];
  onSuccess: () => void;
};

export async function submitFeedbackWithToast({
  payload,
  toast,
  onSuccess,
}: SubmitFeedbackWithToastArgs): Promise<void> {
  try {
    await submitFeedback(payload);
    toast({ title: "Thanks!", description: "Your feedback was submitted." });
    onSuccess();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    toast({
      title: "Submission failed",
      description: message,
      variant: "destructive",
    });
  }
}
