import { useSyncExternalStore } from "react";

export type FeedbackSource =
  | "post_render"
  | "post_download"
  | "post_purchase"
  | "nav_tab";

export type FeedbackContext = {
  jobId: string | null;
  planType: string | null;
  roomType: string | null;
  styleSelected: string | null;
  deviceType: string | null;
  country: string | null;
  source: FeedbackSource;
};

const listeners = new Set<() => void>();

let context: FeedbackContext = {
  jobId: null,
  planType: null,
  roomType: null,
  styleSelected: null,
  deviceType: null,
  country: null,
  source: "nav_tab",
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const getFeedbackContext = () => context;

export const setFeedbackContext = (update: Partial<FeedbackContext>) => {
  context = { ...context, ...update };
  notify();
};

export const resetFeedbackContext = () => {
  context = {
    jobId: null,
    planType: null,
    roomType: null,
    styleSelected: null,
    deviceType: context.deviceType,
    country: context.country,
    source: "nav_tab",
  };
  notify();
};

export const useFeedbackContext = () =>
  useSyncExternalStore(subscribe, () => context);
