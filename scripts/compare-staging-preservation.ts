import { readFile,writeFile,mkdir } from "node:fs/promises";
import { resolve,join } from "node:path";
import { createHash } from "node:crypto";
import { comparePreservation } from "../benchmarks/staging/preservation";

// Offline review artifact: no providers, tokens, storage clients or acceptance writes.
const [runArg,regionsArg]=process.argv.slice(2);
if(!runArg||!regionsArg)throw new Error("Usage: compare-staging-preservation.ts <run-directory> <regions.json>");
const directory=resolve(runArg),run=JSON.parse(await readFile(join(directory,"report.json"),"utf8"));
const configBytes=await readFile(resolve(regionsArg)),config=JSON.parse(configBytes.toString());
const escape=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
const diagnostics=[];let html="";
for(const result of run.results){
  if(!/^[a-z0-9-]+$/.test(result.caseId))throw new Error("Invalid case ID");
  if(result.status!=="candidate-generated")continue;
  const regions=config[result.caseId];
  if(!regions?.length){diagnostics.push({caseId:result.caseId,status:"missing-regions"});continue;}
  const caseDir=join(directory,result.caseId),dest=join(caseDir,"preservation");await mkdir(dest,{recursive:true});
  const original=await readFile(join(caseDir,"original.png")),candidate=await readFile(join(caseDir,"candidate.png"));
  const comparison=await comparePreservation(original,candidate,regions);
  const measurements=[];
  html+=`<section><h2>${escape(result.caseId)}</h2><p>Candidate resized for diagnostic comparison: ${comparison.candidateWasResized}. A changed pixel is a review signal, not proof of damage.</p><div class="pair"><img alt="Original room" src="${result.caseId}/original.png"><img alt="Candidate room" src="${result.caseId}/candidate.png"></div>`;
  for(const r of comparison.comparisons){
    measurements.push({region:r.region,meanAbsoluteError:r.meanAbsoluteError,fractionPixelsOver16:r.fractionPixelsOver16});
    html+=`<h3>${escape(r.region.label)}</h3><p>Mean absolute RGB change: ${r.meanAbsoluteError.toFixed(2)}/255; pixels exceeding 16 in any channel: ${(r.fractionPixelsOver16*100).toFixed(1)}%. Inspect original / candidate / amplified difference below.</p><div class="trio">`;
    for(const name of ["before","after","difference"] as const){const filename=`${r.region.id}-${name}.png`;await writeFile(join(dest,filename),r[name]);html+=`<figure><img alt="${escape(r.region.label)} ${name}" src="${result.caseId}/preservation/${filename}"><figcaption>${name}</figcaption></figure>`;}
    html+="</div>";
  }
  html+="</section>";
  diagnostics.push({caseId:result.caseId,status:"review-required",sourceSha256:createHash("sha256").update(original).digest("hex"),candidateSha256:createHash("sha256").update(candidate).digest("hex"),normalizedTo:comparison.normalizedTo,candidateWasResized:comparison.candidateWasResized,measurements});
}
await writeFile(join(directory,"preservation.json"),JSON.stringify({runId:run.runId,regionsHash:createHash("sha256").update(configBytes).digest("hex"),diagnostics,releaseReady:false,automaticAcceptance:false},null,2));
await writeFile(join(directory,"preservation.html"),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Room preservation review</title><style>body{font:16px/1.55 system-ui;max-width:1350px;margin:40px auto;padding:0 20px;background:#f4f5f7;color:#172333}h1{font-size:32px}section{background:white;padding:24px;margin:24px 0;border-radius:12px}.pair,.trio{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.trio{grid-template-columns:repeat(3,minmax(0,1fr))}img{width:100%;height:auto}figure{margin:0}figcaption{font-weight:bold}p{max-width:95ch}@media(max-width:700px){.pair,.trio{grid-template-columns:1fr}}</style><h1>Room preservation review</h1><p>Internal diagnostic evidence. Zero automatic approvals. These regions sample visible permanent features; they do not establish whole-room preservation, furniture completeness, measured scale, or safe clearance. Legitimate shadows, reflections, occlusion and output resampling also change pixels. Never paste original rectangles over finished furniture to improve these scores.</p>${html}</html>`);
console.log(JSON.stringify({report:join(directory,"preservation.html"),cases:diagnostics.length,automaticAcceptance:false}));
