import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
process.env.OPENAI_API_KEY ||= "test-not-a-key";
const { renderStaging } = await import("../server/stagingPipeline");
const { LayerRejected } = await import("../server/utils/furnitureLayer");
async function setup(mode: "furnish" | "replace" = "furnish") {
  const original = await sharp({ create: { width: 64, height: 48, channels: 3, background: "gray" } }).png().toBuffer();
  const mask = await sharp({ create: { width: 64, height: 48, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
  const raw = Buffer.alloc(64 * 48 * 4);
  for (let y = 24; y < 40; y++) for (let x = 22; x < 40; x++) { raw[(y * 64 + x) * 4] = 200; raw[(y * 64 + x) * 4 + 3] = 255; }
  const layer = await sharp(raw, { raw: { width: 64, height: 48, channels: 4 } }).png().toBuffer();
  const calls: string[] = [];
  const services: any = {
    edit: async (_params: unknown, options: any) => { assert.equal(options.maxRetries, 0); calls.push("edit"); return { data: [{ b64_json: original.toString("base64") }] }; },
    segmentFurniture: async () => { calls.push("segment"); return { layer }; },
    analyzeRoomLayout: async () => ({ noFurnitureZones: [], preferredPlacements: ["clear floor"], notes: [] }),
    planRemoval: async () => ({ kind: "ready", mask, floor: "wood" }),
    checkStagingQuality: async (_a: unknown, _b: unknown, _c: unknown, phase: string) => { calls.push(phase); return { acceptable: true, reason: "none", observations: [] }; },
  };
  return { input: { original, mime: "image/png", mask, roomType: "Bedroom", mode }, services, calls };
}
test("a rejected complete layer gets at most one corrective generation", async () => {
  const f = await setup();
  f.services.segmentFurniture = async () => { throw new LayerRejected("protected overlap"); };
  const result = await renderStaging(f.input, f.services);
  assert.equal(result.success, false);
  assert.deepEqual(f.calls, ["edit", "edit"]);
  assert.equal(result.metrics.attempts.length, 2);
});
test("ambiguous provider failure is never automatically replayed", async () => {
  const f = await setup();
  f.services.edit = async () => { f.calls.push("edit"); throw new Error("timeout"); };
  await assert.rejects(renderStaging(f.input, f.services), /timeout/);
  assert.deepEqual(f.calls, ["edit"]);
});
test("replacement validates cleared background before generating replacement furniture", async () => {
  const f = await setup("replace");
  const result = await renderStaging(f.input, f.services);
  assert.equal(result.success, true);
  assert.deepEqual(f.calls, ["edit", "remove", "edit", "segment", "replace"]);
});
test("failed removal review prevents replacement generation", async () => {
  const f = await setup("replace");
  f.services.checkStagingQuality = async () => ({ acceptable: false, reason: "surface_changed" });
  assert.equal((await renderStaging(f.input, f.services)).success, false);
  assert.deepEqual(f.calls, ["edit"]);
});

test("replacement receives previous furniture as a design-avoidance reference", async () => {
  const f = await setup("replace");
  const edit = f.services.edit;
  let checked = false;
  f.services.edit = async (params: any, options: any) => {
    if (f.calls.includes("remove")) {
      assert.equal(params.image.length, 3);
      assert.equal(params.image[2].name, "previous-furniture.png");
      assert.match(params.prompt, /visibly different main furniture design/);
      checked = true;
    }
    return edit(params, options);
  };
  assert.equal((await renderStaging(f.input, f.services)).success, true);
  assert.equal(checked, true);
});
