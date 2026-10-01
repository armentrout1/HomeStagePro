import { z } from "zod";
import { openai } from "../openaiClient";
const verdictSchema = z.object({
  acceptable: z.boolean(),
  reason: z.enum([
    "none",
    "architecture_changed",
    "surface_changed",
    "cut_off_furniture",
    "task_not_completed",
  ]),
});
/** A second image check catches obvious failures; it is not a guarantee of listing accuracy. */
export async function checkStagingQuality(
  original: Buffer,
  originalMime: string,
  edited: Buffer,
  mode: string,
  selectionGuide?: Buffer,
) {
  const response = await openai.responses.create(
    {
      model: process.env.STAGING_REVIEW_MODEL || "gpt-6-luna",
      store: false,
      max_output_tokens: 1500,
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            ...(selectionGuide ? [{ type: "input_text" as const, text: "A third image is an annotated selection guide, not a result. Orange pixels identify where edits are permitted; untinted regions must remain unchanged. Judge task completion only inside the orange region. Existing furniture outside it is intentionally unchanged. Do not require the whole room to be emptied or furnished when only part is selected. The edited result must not contain orange annotation tint." }] : []),
            {
              type: "input_text",
              text: `Compare the original room photo (first) and edited result (second). Task: ${mode}. Accept only if the result remains the same room and camera perspective, fixed windows/doors/built-ins are unchanged, and no added object is visibly sliced off at an artificial edit-selection boundary. Inspect ALL new objects, including wall art and its frame, plant leaves, lamps, curtains, furniture, rugs and their shadows. Compare the orange guide boundary with each object's visible outline in the result: a missing top frame, abruptly flat plant top, incomplete rug corner or straight cut through an object at that boundary must be rejected as cut_off_furniture, even when the main sofa or bed looks good. The selection edge is not a physical occluder. Natural occlusion by real objects and cropping at the outer photograph edge are fine; cropping at an internal selection edge is not. For remove, the visible selected furniture should be removed; for furnish there should be plausible furnishings; for replace the selected main movable furniture must visibly change design or styling, not merely lose small accessories while retaining the same bed or sofa. Reject an unchanged main furnishing in replacement mode as task_not_completed. Reject artificial straight tone seams at selection boundaries, ghosted or translucent old/new furniture, visible floor or wall material changes, missing wood grain or tile lines, large smooth/blurred patches, and artificial dark vignettes in exposed floor areas. A new rug may cover flooring, but uncovered floor must retain the original material, texture and sharpness. Normal localized contact shadows under furniture are acceptable. Return a concise structured verdict. Reject obvious structural changes or implausible cut-off objects.`,
            },
            {
              type: "input_image",
              image_url: `data:${originalMime};base64,${original.toString("base64")}`,
              detail: "high",
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${edited.toString("base64")}`,
              detail: "high",
            },
            ...(selectionGuide ? [{ type: "input_image" as const, image_url: `data:image/png;base64,${selectionGuide.toString("base64")}`, detail: "high" as const }] : []),
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "staging_quality",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["acceptable", "reason"],
            properties: {
              acceptable: { type: "boolean" },
              reason: {
                type: "string",
                enum: [
                  "none",
                  "architecture_changed",
                  "surface_changed",
                  "cut_off_furniture",
                  "task_not_completed",
                ],
              },
            },
          },
        },
      },
    },
    { timeout: 30_000, maxRetries: 0 },
  );
  return verdictSchema.parse(JSON.parse(response.output_text));
}
