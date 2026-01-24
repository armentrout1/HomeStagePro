import { useEffect, useState } from "react";

import { onFeedbackDrawerOpen } from "@/state/feedbackDrawerBus";
import { setFeedbackContext } from "@/state/feedbackContext";

export function useFeedbackDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    const unsubscribe = onFeedbackDrawerOpen((payload) => {
      if (payload?.context) {
        setFeedbackContext(payload.context);
      }
      if (payload?.source) {
        setFeedbackContext({ source: payload.source });
      }
      setStep(payload?.initialStep ?? 1);
      setIsOpen(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
  };

  const handleSheetChange = (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  return {
    isOpen,
    step,
    setStep,
    setIsOpen,
    handleClose,
    handleSheetChange,
  } as const;
}
