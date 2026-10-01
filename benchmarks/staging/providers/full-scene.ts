import { createHash } from "node:crypto";
import { toFile } from "openai";
import { openai } from "../../../server/openaiClient";
import { stagingOutputSize } from "../../../server/utils/selectionGuide";
import sharp from "sharp";
import type { StagingProvider } from "../../../server/staging/providers/types";

// Experiment only: this candidate intentionally has no production import path.
// It tests whether extraction is the bottleneck; architecture may still drift.
export const fullSceneProvider: StagingProvider = {
  id: "openai-full-scene-benchmark-v1",
  capabilities: { completeArrangements: true, measuredGeometry: false, removal: false, exactUncoveredPixels: false },
  async render(input) {
    if (input.mode !== "furnish" || !["Bedroom", "Living Room"].includes(input.roomType)) throw new Error("UNSUPPORTED_BENCHMARK_CASE");
    const {width, height} = await sharp(input.original).metadata();
    if (!width || !height) throw new Error("INVALID_IMAGE");
    const packageText = input.roomType === "Bedroom"
      ? "a complete bed with bedding and pillows, at least one complete bedside table (two when space allows), and a complete area rug beneath the bed, with its naturally visible edges intact"
      : "a complete sofa, a complete coffee table and a complete area rug, with additional seating only if it fits comfortably";
    const prompt = `Virtually stage this exact real-estate photograph with a coordinated warm contemporary furniture arrangement: ${packageText}. This must be a complete professionally staged room, not one isolated item. Preserve the original camera, framing, room shape and all permanent architecture: windows, doors, wall panels, fireplace, ceiling, built-ins, flooring, trim, outlets and fixed lights. Keep the original visible background appearance. Furniture may naturally occlude floor and lower walls; do not erase furniture to expose the background. Keep doors, windows and walking paths usable. All feet rest on the original floor plane. Use realistic size and perspective. Match lighting and localized shadows. Complete opaque furniture, crisp edges, no fading, cutouts, ghosting, missing legs, half tables, dissolved rugs or broad relighting. Never remove an item from the required set merely to make the task easier. If space is tight, choose a sensible compact arrangement. Return only the full staged photograph.`;
    const model = "gpt-image-2.5-sunburst";
    const started = Date.now();
    const response = await openai.images.edit({ model, image: await toFile(input.original, "room.png", {type: input.mime}), prompt,
      quality: "high", output_format: "png", size: stagingOutputSize(width,height), stream: false }, {timeout:240_000,maxRetries:0});
    const bytes = response.data?.[0]?.b64_json;
    if (!bytes) throw new Error("NO_IMAGE_RETURNED");
    return {success:true,image:Buffer.from(bytes,"base64"),metrics:{promptHash:createHash("sha256").update(prompt).digest("hex"),model,elapsedMs:Date.now()-started,usage:response.usage,visualAcceptance:"unreviewed"}};
  },
};
