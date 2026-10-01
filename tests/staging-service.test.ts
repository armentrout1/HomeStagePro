import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { createStagingService } from "../server/staging/service";
import type { StagingProvider } from "../server/staging/providers/types";
import type { StagingRequest } from "../shared/staging/contracts";

async function fixture() {
  const image = await sharp({ create: { width: 80, height: 60, channels: 3, background: "white" } }).png().toBuffer();
  const input: StagingRequest = { requestId: randomUUID(), image: image.toString("base64"), roomType: "Bedroom", mode: "furnish" };
  let calls = 0;
  const writes: { path: string; mime: string }[] = [];
  const provider: StagingProvider = {
    id: "test-engine",
    capabilities: { completeArrangements: true, measuredGeometry: false, removal: true, exactUncoveredPixels: true },
    async render(renderInput) {
      calls++;
      assert.equal(renderInput.roomType, "Bedroom");
      assert.equal((await sharp(renderInput.mask).metadata()).format, "png");
      return { success: true, image, metrics: { promptHash: "fixture" } };
    },
  };
  const deps = { provider, artifacts: { bucket: "private", prefix: "test-environment", async put(path: string, _image: Buffer, mime: string) { writes.push({ path, mime }); } },
    thumbnail: async () => image, now: () => new Date("2026-10-01T12:00:00Z") };
  return { input, provider, writes, deps, calls: () => calls };
}

test("service preserves history paths without HTTP, signing links or accessing credits", async () => {
  const f = await fixture();
  const result = await createStagingService(f.deps)(f.input);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.originalStoragePath, `test-environment/results/2026-10/${f.input.requestId}/original.png`);
  assert.equal(result.stagedStoragePath.endsWith("/staged.png"), true);
  assert.equal(result.thumbnailStoragePath?.endsWith("/thumbnail.webp"), true);
  assert.equal(result.metrics.provider, "test-engine");
  assert.equal("imageUrl" in result, false);
  assert.equal(f.calls(), 1); assert.equal(f.writes.length, 3);
});

test("invalid image, invalid request ID and fully protected mask fail before render or storage", async () => {
  const f = await fixture(); const service = createStagingService(f.deps);
  assert.equal((await service({ ...f.input, image: "not-valid-image-data!!!!" })).success, false);
  assert.equal((await service({ ...f.input, requestId: "../../outside" })).success, false);
  const mask = await sharp({create:{width:80,height:60,channels:4,background:{r:0,g:0,b:0,alpha:1}}}).png().toBuffer();
  assert.equal((await service({ ...f.input, mask: mask.toString("base64") })).success, false);
  assert.equal(f.calls(), 0); assert.equal(f.writes.length, 0);
});

test("quality rejection preserves evidence but never saves a successful result or invokes fallback", async () => {
  const f = await fixture();
  f.provider.render = async () => ({ success: false, code: "QUALITY_REVIEW_FAILED", metrics: { promptHash: "rejected", reason: "missing furniture" } });
  const result = await createStagingService(f.deps)(f.input);
  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.code, "QUALITY_REVIEW_FAILED");
  assert.equal(result.metrics?.reason, "missing furniture"); assert.equal(f.writes.length, 0);
});

test("ambiguous provider errors propagate once, without storage or automatic retry", async () => {
  const f = await fixture(); let attempts = 0;
  f.provider.render = async () => { attempts++; throw new Error("timeout"); };
  await assert.rejects(createStagingService(f.deps)(f.input), /timeout/);
  assert.equal(attempts, 1); assert.equal(f.writes.length, 0);
});

test("result storage failure does not replay paid generation", async () => {
  const f = await fixture(); let uploads = 0;
  f.deps.artifacts.put = async () => { if (++uploads === 2) throw new Error("storage failed"); };
  await assert.rejects(createStagingService(f.deps)(f.input), /storage failed/);
  assert.equal(f.calls(), 1); assert.equal(uploads, 2);
});

test("thumbnail failure retains original/full result and reports no thumbnail path", async () => {
  const f = await fixture(); f.deps.thumbnail = async () => { throw new Error("thumbnail failed"); };
  const result = await createStagingService(f.deps)(f.input);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.thumbnailStoragePath, null);
  assert.equal(f.writes.length, 2);
});
