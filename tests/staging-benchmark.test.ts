import test from "node:test";
import assert from "node:assert/strict";
import { criticalChecks, evaluateVisualReview, type VisualReview } from "../benchmarks/staging/evaluation";
import { estimateImageCost } from "../benchmarks/staging/cost";
import sharp from "sharp";
import { comparePreservation } from "../benchmarks/staging/preservation";
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

test("preservation diagnostics isolate a changed fixture without scoring added furniture", async()=>{
  const original=await sharp({create:{width:100,height:100,channels:3,background:'white'}}).png().toBuffer();
  const changed=await sharp(original).composite([{input:await sharp({create:{width:20,height:20,channels:3,background:'black'}}).png().toBuffer(),left:0,top:0}]).png().toBuffer();
  const regions=[{id:'fixture',label:'Fixture',x:0,y:0,width:.2,height:.2},{id:'other',label:'Other',x:.5,y:.5,width:.2,height:.2}];
  const result=await comparePreservation(original,changed,regions);
  assert.equal(result.comparisons[0].meanAbsoluteError,255);
  assert.equal(result.comparisons[0].fractionPixelsOver16,1);
  assert.equal(result.comparisons[1].meanAbsoluteError,0);
  assert.equal('accepted' in result,false);
  await assert.rejects(comparePreservation(original,await sharp(original).resize(100,50).png().toBuffer(),regions),/aspect ratio/);
  await assert.rejects(comparePreservation(original,changed,[{...regions[0],x:.99}]),/Region must fit/);
  await assert.rejects(comparePreservation(original,changed,[regions[0],regions[0]]),/Duplicate region/);
});
