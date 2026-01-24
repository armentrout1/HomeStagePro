import type { FeedbackContext, FeedbackSource } from "./feedbackContext";

export type FeedbackOpenPayload = {
  source?: FeedbackSource;
  context?: Partial<FeedbackContext>;
  initialStep?: 1 | 2;
};

export type FeedbackDrawerListener = (payload?: FeedbackOpenPayload) => void;

const listeners = new Set<FeedbackDrawerListener>();

export const onFeedbackDrawerOpen = (listener: FeedbackDrawerListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const openFeedbackDrawer = (payload?: FeedbackOpenPayload) => {
  listeners.forEach((listener) => listener(payload));
};
