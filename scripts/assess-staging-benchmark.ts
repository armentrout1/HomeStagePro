import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { evaluateVisualReview } from "../benchmarks/staging/evaluation";
import { estimateImageCost, pricingSource } from "../benchmarks/staging/cost";

// Read local evidence only. This command cannot invoke a provider.
const directory=resolve(process.argv[2]||"temp/staging-benchmarks");
const run=JSON.parse(await readFile(join(directory,"report.json"),"utf8"));
const results=[];
for(const result of run.results){
  if(!/^[a-z0-9-]+$/.test(result.caseId))throw new Error("Invalid case ID");
  let review;
  try {review=JSON.parse(await readFile(join(directory,result.caseId,"review.json"),"utf8"));}
  catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
  results.push({caseId:result.caseId,generationStatus:result.status,elapsedMs:result.elapsedMs,
    visualAcceptance:result.status==="candidate-generated"?evaluateVisualReview(review):"not-delivered",
    review,estimatedGenerationCostUsd:estimateImageCost(result.metrics?.model,result.metrics?.usage)});
}
const assessment={runId:run.runId,assessedAt:new Date().toISOString(),results,
  accepted:results.filter(r=>r.visualAcceptance==="accepted").length,total:results.length,
  estimatedGenerationCostUsd:results.every(r=>r.estimatedGenerationCostUsd!==null)?results.reduce((sum,r)=>sum+r.estimatedGenerationCostUsd!,0):null,
  pricingSource,pricingChecked:"2026-10-01",releaseReady:false,
  limitations:["Smoke tests only; source coverage incomplete.","No furnished-room removal or held-out evaluation in this run.","Agent visual review is not independent human acceptance.","A successful image response is not a production quality sign-off."]};
await writeFile(join(directory,"assessment.json"),JSON.stringify(assessment,null,2));
console.log(JSON.stringify(assessment));
