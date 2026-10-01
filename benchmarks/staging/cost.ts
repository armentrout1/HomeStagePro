import { z } from "zod";

// Standard API prices checked 2026-10-01. Excludes taxes, hosting and review.
// Conservatively charges uncached input rates; not an invoice or spend limit.
export const pricingSource = "https://developers.openai.com/api/docs/pricing";
const usageSchema = z.object({input_tokens_details:z.object({image_tokens:z.number().nonnegative(),text_tokens:z.number().nonnegative()}),output_tokens:z.number().nonnegative()});
export function estimateImageCost(model: unknown, usage: unknown): number | null {
  if(model!=="gpt-image-2.5-sunburst")return null;
  const parsed=usageSchema.safeParse(usage);if(!parsed.success)return null;
  const value=parsed.data;
  return (value.input_tokens_details.image_tokens*8+value.input_tokens_details.text_tokens*5+value.output_tokens*30)/1_000_000;
}
