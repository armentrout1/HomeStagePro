import { Button } from "@/components/ui/button";
import { FeedbackCtas } from "@/components/feedback/FeedbackCtas";
import { cn } from "@/lib/utils";

type DrawerFooterProps = {
  rating: number | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  onSubmit: () => void;
  onClose: () => void;
};

export function DrawerFooter({
  rating,
  canSubmit,
  isSubmitting,
  hasSubmitted,
  onSubmit,
  onClose,
}: DrawerFooterProps) {
  return (
    <div className="border-t border-slate-200 bg-white px-6 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <FeedbackCtas rating={rating} />
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Required fields marked with *
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="sm:hidden"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            className={cn(
              "text-white shadow-[0_15px_35px_-15px_rgba(15,23,42,0.9)] transition disabled:bg-slate-400 disabled:shadow-none",
              hasSubmitted ? "bg-emerald-600 hover:bg-emerald-600" : "bg-slate-900 hover:bg-slate-800",
            )}
          >
            {hasSubmitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
}
