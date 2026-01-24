import { Button } from "@/components/ui/button";
import { FeedbackCtas } from "@/components/feedback/FeedbackCtas";

type DrawerFooterProps = {
  rating: number | null;
  step: 1 | 2;
  onLeaveReview: () => void;
};

export function DrawerFooter({
  rating,
  step,
  onLeaveReview,
}: DrawerFooterProps) {
  return (
    <div className="border-t border-slate-200 bg-white px-6 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <FeedbackCtas rating={rating} />
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            {step === 2 ? "Step 2 of 2" : "Step 1 of 2"} · Required fields marked with *
          </p>
        </div>
        <div className="flex items-center gap-3">
          {rating !== null && rating >= 4 && (
            <Button type="button" variant="outline" size="sm" onClick={onLeaveReview}>
              Leave a review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
