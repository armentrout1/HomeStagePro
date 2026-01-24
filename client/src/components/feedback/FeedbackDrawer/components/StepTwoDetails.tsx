import { Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FEATURE_OPTIONS,
  PERSONA_OPTIONS,
  PRICING_PREFERENCE_OPTIONS,
  USAGE_FREQUENCY_OPTIONS,
  WATERMARK_PREF_OPTIONS,
  WATERMARK_TEXT_OPTIONS,
  WTP_RANGE_OPTIONS,
} from "@/components/feedback/feedbackOptions";
import { UNSET_OPTION } from "@/components/feedback/FeedbackDrawer/types";
interface StepTwoDetailsProps {
  control: any;
  register: any;
  showWatermarkText: boolean;
  showTestimonialConsent: boolean;
  canPublishTestimonial: boolean;
}

export function StepTwoDetails({
  control,
  register,
  showWatermarkText,
  showTestimonialConsent,
  canPublishTestimonial,
}: StepTwoDetailsProps) {
  return (
    <section className="space-y-6 rounded-lg bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Optional details</p>
          <p className="text-xs text-muted-foreground">
            Helps us tailor the roadmap and follow up if needed.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="feedback-persona">Who are you?</Label>
          <Controller
            control={control}
            name="persona"
            render={({ field }) => (
              <Select
                value={field.value || UNSET_OPTION}
                onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
              >
                <SelectTrigger id="feedback-persona">
                  <SelectValue placeholder="Select a persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_OPTION}>Prefer not to say</SelectItem>
                  {PERSONA_OPTIONS.map((option) => (
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
          <Label htmlFor="feedback-usage">How often do you stage?</Label>
          <Controller
            control={control}
            name="usageFrequency"
            render={({ field }) => (
              <Select
                value={field.value || UNSET_OPTION}
                onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
              >
                <SelectTrigger id="feedback-usage">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_OPTION}>I'm not sure</SelectItem>
                  {USAGE_FREQUENCY_OPTIONS.map((option) => (
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
          <Label htmlFor="feedback-pricing">Preferred pricing</Label>
          <Controller
            control={control}
            name="pricingPreference"
            render={({ field }) => (
              <Select
                value={field.value || UNSET_OPTION}
                onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
              >
                <SelectTrigger id="feedback-pricing">
                  <SelectValue placeholder="Select pricing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_OPTION}>No preference</SelectItem>
                  {PRICING_PREFERENCE_OPTIONS.map((option) => (
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
          <Label htmlFor="feedback-wtp">Willingness to pay</Label>
          <Controller
            control={control}
            name="willingnessToPayRange"
            render={({ field }) => (
              <Select
                value={field.value || UNSET_OPTION}
                onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
              >
                <SelectTrigger id="feedback-wtp">
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_OPTION}>Not sure yet</SelectItem>
                  {WTP_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="feedback-watermark">Watermark preference</Label>
          <Controller
            control={control}
            name="watermarkPreference"
            render={({ field }) => (
              <Select
                value={field.value || UNSET_OPTION}
                onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
              >
                <SelectTrigger id="feedback-watermark">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_OPTION}>No preference</SelectItem>
                  {WATERMARK_PREF_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {showWatermarkText && (
          <div className="space-y-2">
            <Label htmlFor="feedback-watermark-text">Watermark text</Label>
            <Controller
              control={control}
              name="watermarkTextPreference"
              render={({ field }) => (
                <Select
                  value={field.value || UNSET_OPTION}
                  onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
                >
                  <SelectTrigger id="feedback-watermark-text">
                    <SelectValue placeholder="Select text" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET_OPTION}>I'll upload custom text later</SelectItem>
                    {WATERMARK_TEXT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-feature">Feature request</Label>
        <Controller
          control={control}
          name="requestedFeature"
          render={({ field }) => (
            <Select
              value={field.value || UNSET_OPTION}
              onValueChange={(val) => field.onChange(val === UNSET_OPTION ? "" : val)}
            >
              <SelectTrigger id="feedback-feature">
                <SelectValue placeholder="Pick a top request" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET_OPTION}>Something else</SelectItem>
                {FEATURE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {showTestimonialConsent && (
        <div className="space-y-4 rounded-md border border-slate-200 p-4">
          <p className="text-sm font-semibold">Testimonial (optional)</p>
          <Controller
            control={control}
            name="canPublishTestimonial"
            render={({ field }) => (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="feedback-testimonial"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                />
                <Label htmlFor="feedback-testimonial" className="text-sm font-normal">
                  RoomStager may publish my feedback as a testimonial.
                </Label>
              </div>
            )}
          />

          {canPublishTestimonial && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="testimonial-name">Name</Label>
                <Input
                  id="testimonial-name"
                  placeholder="Jane Agent"
                  {...register("testimonialName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testimonial-email">Email</Label>
                <Input
                  id="testimonial-email"
                  type="email"
                  placeholder="you@email.com"
                  {...register("email")}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="testimonial-company">Company (optional)</Label>
                <Input
                  id="testimonial-company"
                  placeholder="Acme Realty Group"
                  {...register("testimonialCompany")}
                />
              </div>
              <Controller
                control={control}
                name="canShareBeforeAfter"
                render={({ field }) => (
                  <div className="col-span-2 flex items-start gap-2">
                    <Checkbox
                      id="testimonial-media"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                    <Label htmlFor="testimonial-media" className="text-sm font-normal">
                      You may share my before and after images.
                    </Label>
                  </div>
                )}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
