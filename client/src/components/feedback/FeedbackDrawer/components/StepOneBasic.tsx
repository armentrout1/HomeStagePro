import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  RATING_VALUES,
  UNSET_OPTION,
} from "@/components/feedback/FeedbackDrawer/types";
import { GOAL_OPTIONS, ISSUE_OPTIONS } from "@/components/feedback/feedbackOptions";

interface StepOneBasicProps {
  control: any;
  register: any;
  rating: number | null;
  goal: string;
  isSubmitting: boolean;
  isBasicsSubmitDisabled: boolean;
  onSetRating: (value: number) => void;
  onTellUsMore: () => void;
  onBackToBasics: () => void;
  onSubmitBasics: () => void;
  basicsSaved: boolean;
  isShowingMore: boolean;
}

export function StepOneBasic({
  control,
  register,
  rating,
  goal,
  isSubmitting,
  isBasicsSubmitDisabled,
  onSetRating,
  onTellUsMore,
  onBackToBasics,
  onSubmitBasics,
  basicsSaved,
  isShowingMore,
}: StepOneBasicProps) {
  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-medium">Overall rating *</Label>
          <div className="flex items-center gap-2 text-xs">
            {basicsSaved && <span className="font-medium text-emerald-600">Saved</span>}
            <span className="text-muted-foreground">1 = Needs work, 5 = Love it</span>
          </div>
        </div>
        <input type="hidden" {...register("rating", { required: true })} />
        <div className="mt-3 flex gap-2">
          {RATING_VALUES.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => onSetRating(value)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition",
                rating === value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
              aria-label={`Set rating to ${value}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-goal">What brings you here today? *</Label>
        <Controller
          control={control}
          name="goal"
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
              <SelectTrigger id="feedback-goal">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-issue">Biggest issue (optional)</Label>
        <Controller
          control={control}
          name="issue"
          render={({ field }) => (
            <Select
              value={field.value || UNSET_OPTION}
              onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
            >
              <SelectTrigger id="feedback-issue">
                <SelectValue placeholder="Select an issue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET_OPTION}>No issues</SelectItem>
                {ISSUE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-freeform">Anything else?</Label>
        <Textarea
          id="feedback-freeform"
          placeholder="Share more context, feature requests, or blockers"
          rows={4}
          {...register("freeformFeedback")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={isBasicsSubmitDisabled}
          onClick={onSubmitBasics}
          className={cn(
            "text-white shadow-[0_15px_35px_-15px_rgba(15,23,42,0.9)] transition disabled:bg-slate-400 disabled:shadow-none",
            basicsSaved
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-slate-900 hover:bg-slate-800",
          )}
        >
          {basicsSaved ? "Basics saved" : isSubmitting ? "Submitting..." : "Submit basics"}
        </Button>
        <p className="text-xs text-muted-foreground">Rating & goal required.</p>
      </div>

      <div className="h-px w-full bg-slate-400" />

      <div className="flex items-center justify-between rounded-md border border-dashed border-slate-200 p-4">
        <div>
          <p className="text-sm font-medium">Want to share more?</p>
          <p className="text-xs text-muted-foreground">
            Tell us who you are and what would make RoomStager better.
          </p>
        </div>
        {!isShowingMore ? (
          <div className="flex flex-col items-end gap-2 text-right">
            {basicsSaved && (
              <span className="text-xs text-muted-foreground">Optional questions are below.</span>
            )}
            <Button type="button" variant="outline" onClick={onTellUsMore}>
              {basicsSaved ? "Continue" : "Tell us more"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:text-left">
            <span className="text-xs font-semibold text-slate-500">Additional questions below</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackToBasics}
              className="border-slate-300 text-slate-700 shadow-sm hover:border-slate-400"
            >
              Back to basics
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
