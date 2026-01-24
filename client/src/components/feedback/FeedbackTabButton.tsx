import { openFeedbackDrawer } from "@/state/feedbackDrawerBus";
import { useCallback } from "react";

export function FeedbackTabButton() {
  const handleOpen = useCallback(() => {
    openFeedbackDrawer();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="hidden md:flex fixed right-4 top-1/2 z-50 -translate-y-1/2 flex-col items-center rounded-full bg-slate-900 px-2 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition hover:bg-slate-800"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        aria-label="Open feedback drawer"
      >
        Feedback
      </button>

      <button
        type="button"
        onClick={handleOpen}
        className="md:hidden fixed bottom-4 right-4 z-50 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
        aria-label="Open feedback drawer"
      >
        Feedback
      </button>
    </>
  );
}
