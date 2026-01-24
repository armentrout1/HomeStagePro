import { Controller } from "react-hook-form";

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
import { RATING_VALUES, UNSET_OPTION } from "@/components/feedback/FeedbackDrawer/types";
import { GOAL_OPTIONS, ISSUE_OPTIONS } from "@/components/feedback/feedbackOptions";

interface StepOneBasicProps {
  control: any;
  register: any;
  rating: number | null;
  goal: string;
  onSetRating: (value: number) => void;
}

export function StepOneBasic({
  control,
  register,
  rating,
  goal,
  onSetRating,
}: StepOneBasicProps) {
  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-medium">Overall rating *</Label>
          <span className="text-xs text-muted-foreground">1 = Needs work, 5 = Love it</span>
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
    </section>
  );
}
