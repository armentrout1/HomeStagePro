import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { stagingRequestSchema } from "../shared/staging/contracts";

const args = process.argv.slice(2);
const option = (name: string, fallback = "") => {const index=args.indexOf(name);return index<0?fallback:args[index+1]??fallback;};
const manifestPath = resolve(option("--manifest", "benchmarks/staging/manifest.json"));
const caseSchema = stagingRequestSchema.omit({requestId:true,image:true,mask:true}).extend({
  id:z.string().regex(/^[a-z0-9-]+$/),source:z.string(),split:z.enum(["development","held-out"]),
  sourceKind:z.string(),externalProviderConsent:z.boolean(),requiredFurniture:z.array(z.string()),preserve:z.array(z.string()),knownRisks:z.array(z.string()),expectedInputOutcome:z.string().optional(),
});
const manifest = z.object({version:z.string(),target:z.object({development:z.number(),heldOut:z.number(),repeatedCases:z.number()}),cases:z.array(caseSchema)}).parse(JSON.parse(await readFile(manifestPath,"utf8")));
const ids = option("--cases").split(",").filter(Boolean);
if (ids.some(id=>!manifest.cases.some(item=>item.id===id))) throw new Error("Unknown benchmark case");
const chosen = manifest.cases.filter(item=>!ids.length||ids.includes(item.id));
const outputRoot = resolve(option("--out", "temp/staging-benchmarks"));
const runId = `${new Date().toISOString().replace(/[:.]/g,"-")}-${randomUUID().slice(0,8)}`;
const output = join(outputRoot, runId);
await mkdir(output,{recursive:true});
const inventory = [];
for (const item of manifest.cases) {
  const source = await readFile(resolve(item.source));
  const meta = await sharp(source).metadata();
  inventory.push({...item,sha256:createHash("sha256").update(source).digest("hex"),width:meta.width,height:meta.height,needsResolutionReview:Math.min(meta.width||0,meta.height||0)<512});
}
const distinct = new Set(inventory.map(item=>item.sha256)).size;
const report: { [key:string]:unknown; results: unknown[] } = {runId,createdAt:new Date().toISOString(),manifestVersion:manifest.version,
  manifestHash:createHash("sha256").update(await readFile(manifestPath)).digest("hex"),mode:args.includes("--execute")?"execute":"inventory",
  provider:option("--provider","full-scene"),target:manifest.target,availableSources:inventory.length,distinctFileHashes:distinct,
  development:inventory.filter(item=>item.split==="development").length,heldOut:inventory.filter(item=>item.split==="held-out").length,
  releaseReady:false,coverageNote:"File hashes do not detect resized copies or repeated rooms. Manually verify source diversity. Missing held-out/removal coverage blocks release.",inventory,results:[]};
const save = () => writeFile(join(output,"report.json"),JSON.stringify(report,null,2));
await save();
if (args.includes("--execute")) {
  const maxCalls = Number(option("--max-calls","0"));
  if (!Number.isInteger(maxCalls)||maxCalls<1||maxCalls>4||chosen.length>maxCalls) throw new Error("Explicit --max-calls (1..4) must cover the selected smoke cases; no automatic broad run");
  if (!ids.length) throw new Error("Select explicit --cases for paid smoke testing");
  if (chosen.some(item=>item.split==="held-out")) throw new Error("Held-out evaluation needs a frozen release candidate; not a smoke run");
  if (inventory.some(item=>ids.includes(item.id)&&item.needsResolutionReview)) throw new Error("Resolve low-resolution input before paid rendering");
  if (option("--provider","full-scene")!=="full-scene") throw new Error("Provider not enabled: specialized account access and terms review required");
  const {fullSceneProvider} = await import("../benchmarks/staging/providers/full-scene");
  let attempted = 0;
  for (const item of chosen) {
    const started=Date.now(),caseDir=join(output,item.id);await mkdir(caseDir);
    const source=await readFile(resolve(item.source));
    const original=await sharp(source).png().toBuffer();
    const {width,height}=await sharp(original).metadata();
    const mask=await sharp({create:{width:width!,height:height!,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
    await writeFile(join(caseDir,"original.png"),original);
    const pending={caseId:item.id,status:"submitted-outcome-unknown",visualAcceptance:"unreviewed",startedAt:new Date().toISOString()};
    report.results.push(pending);report.attemptedProviderCalls=++attempted;await save();
    try {
      const result=await fullSceneProvider.render({original,mime:"image/png",mask,roomType:item.roomType,mode:item.mode});
      if(result.success)await writeFile(join(caseDir,"candidate.png"),result.image);
      report.results[report.results.length-1]={caseId:item.id,status:result.success?"candidate-generated":"provider-rejected",elapsedMs:Date.now()-started,metrics:result.metrics,visualAcceptance:"unreviewed",estimatedCostUsd:null};
    } catch(error) {
      // Do not emit provider bodies, headers or secrets. Do not replay an unknown submission.
      report.results[report.results.length-1]={caseId:item.id,status:"failed-or-unknown",errorType:error instanceof Error?error.name:"Error",elapsedMs:Date.now()-started,visualAcceptance:"unreviewed",estimatedCostUsd:null};
      await save(); break;
    }
    await writeFile(join(caseDir,"review.json"),JSON.stringify({reviewer:"",reviewedAt:"",checks:{completeFurniture:"uncertain",architecturePreserved:"uncertain",noClippedOrFadedObjects:"uncertain",realisticScaleAndPerspective:"uncertain",floorContactAndShadows:"uncertain",accessClear:"uncertain"},notes:[]},null,2));
    await save();
  }
}
console.log(JSON.stringify({report:join(output,"report.json"),sources:inventory.length,results:report.results.length,releaseReady:false}));
