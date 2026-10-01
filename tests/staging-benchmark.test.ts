import test from "node:test";
import assert from "node:assert/strict";
import { criticalChecks, evaluateVisualReview, type VisualReview } from "../benchmarks/staging/evaluation";
import { estimateImageCost } from "../benchmarks/staging/cost";
test("provider success cannot stand in for complete-room acceptance", () => {
  assert.equal(evaluateVisualReview(),"unreviewed");
  const review:VisualReview={reviewer:"manual-evaluation",reviewedAt:"2026-10-01T12:00:00Z",checks:Object.fromEntries(criticalChecks.map(key=>[key,"pass"])),notes:[]};
  assert.equal(evaluateVisualReview(review),"accepted");
  review.checks.completeFurniture="fail";
  assert.equal(evaluateVisualReview(review),"rejected");
  review.checks.completeFurniture="uncertain";
  assert.equal(evaluateVisualReview(review),"uncertain");
  delete review.checks.completeFurniture;
  assert.equal(evaluateVisualReview(review),"uncertain");
});

test("unknown model or missing usage cannot become a zero-cost benchmark", () => {
  assert.equal(estimateImageCost("unknown",{}),null);
  assert.equal(estimateImageCost("gpt-image-2.5-sunburst",{}),null);
  assert.equal(estimateImageCost("gpt-image-2.5-sunburst",{input_tokens_details:{image_tokens:704,text_tokens:238},output_tokens:1372}),0.047982);
});
