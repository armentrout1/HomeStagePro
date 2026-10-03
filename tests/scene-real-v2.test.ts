import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sha256 } from "../server/staging/scene/artifacts";
import { normalizeLabel, mapV2, consolidateV2, elementsV2, selectMasks, detectionOnly, priority } from "../server/staging/scene/components/real-v2-mapping";
import { realComponentV2, v2License } from "../server/staging/scene/components/real-v2";
import { ComponentRegistry } from "../server/staging/scene/components/registry";
import { PROMPT_HASH, REAL_IDS, responseSchema } from "../server/staging/scene/components/real-v2-runtime";
import { openingReview, subtypeReview } from "../benchmarks/staging/scene-v2-review";
import { boxMetrics, type Annotation } from "../benchmarks/staging/scene-smoke";
import { sceneElementSchema, type SceneElement } from "../shared/staging/scene-map";
const box = (label = "window", group = "windows", score = .8, coords = [0, 0, 50, 50]) => ({ label, group, score, box: coords });
const elements = (values: unknown[]) => elementsV2(consolidateV2(values, 100, 100), "run", "canonical", 100, 100);
for (const [input, expected] of [["  BUILT - in   Cabinet. ", "built-in cabinet"], ["built \u2011 in shelving", "built-in shelving"], ["( window ) ;", "window"], ["\uFF37\uFF29\uFF2E\uFF24\uFF2F\uFF37", "window"], ["\twall\noutlet!", "wall outlet"]])
    test(`V2 exact normalization ${JSON.stringify(input)}`, () => assert.equal(normalizeLabel(input), expected));
test("normalization maps only complete known phrases from the originating group", () => {
    assert.equal(mapV2("built - in cabinet", "builtins").class, "built-in");
    assert.equal(mapV2("electrical outlet wall outlet", "electrical").class, "outlet");
    assert.equal(mapV2("sofa couch", "seating").subtype, "sofa");
    for (const [label, group] of [["door window", "windows"], ["built-in cabinet built-in shelving", "builtins"], ["built-in cabinet staircase", "builtins"], ["window", "furniture-other"], ["built - cabinet", "builtins"], ["windwo", "windows"], ["", "windows"]])
        assert.equal(mapV2(label, group).class, "unknown");
    assert.equal(mapV2("cabinet", "furniture-other").class, "furniture");
});
test("V2 vocabulary has separate window and surface groups and exact content hash", async () => {
    const bytes = await readFile(new URL("../scripts/staging_runtime/bindings/scene-vocabulary-v2.json", import.meta.url));
    assert.equal(sha256(bytes), PROMPT_HASH);
    const v = JSON.parse(bytes.toString());
    assert.equal(v.version, "roomstager-r1-detection-v2");
    assert.equal(v.groups.find((g: any) => g.id === "windows").text, "window.");
    assert.equal(v.groups.filter((g: any) => g.experimentalSurface).length, 3);
});
test("V2 retains provenance and ambiguity while consolidating only compatible aliases", () => {
    const h = consolidateV2([box("electrical outlet", "electrical"), box("wall outlet", "electrical", .7), box("door", "doors-0"), box("window", "windows")], 100, 100);
    assert.equal(h.length, 3);
    assert.equal(h.find(x => x.class === "outlet")?.contributions.length, 2);
    assert.ok(h.every(x => x.label && x.normalizedLabel && x.group && Number.isFinite(x.score)));
});
test("architecture-first budget processes at most 32 and keeps other detections explicit", () => {
    const e = elements([box(), box("sofa", "seating"), box("floor", "surface-floor")]);
    const many: SceneElement[] = [e.find(x => x.class === "window")!, ...Array.from({ length: 68 }, (_, i) => ({ ...e.find(x => x.class === "furniture")!, id: `f-${i}`, detectionConfidence: { ...e[0].detectionConfidence, rawScore: .99, reasons: [] } })), e.find(x => x.class === "floor")!];
    const s = selectMasks(many);
    assert.equal(s.selected.length, 32);
    assert.equal(s.selected[0].class, "window");
    assert.equal(s.dispositions.filter(x => x.status === "mask-not-attempted-budget").length, 37);
    assert.equal(s.dispositions.filter(x => x.status === "mask-not-attempted-experimental").length, 1);
    const uns = s.dispositions.find(x => x.status === "mask-not-attempted-budget")!, source = many.find(e => e.id === uns.id)!;
    const only = detectionOnly(source, "sam", 0, uns.status);
    assert.equal(only.shape.kind, "polygon");
    assert.ok(only.geometryConfidence.reasons.includes("detection-only"));
    assert.ok(only.geometryConfidence.reasons.includes("mask-not-attempted-budget"));
    assert.equal(only.geometryConfidence.state, "unknown");
    assert.equal(sceneElementSchema.safeParse(only).success, true);
    assert.deepEqual(selectMasks([...many].reverse()).selected.map(e => e.id), s.selected.map(e => e.id));
});
test("critical overflow abstains and unknown critical-origin proposals cannot be silently discarded", () => {
    const [e] = elements([box("unrecognized", "windows")]);
    assert.equal(priority(e), 1);
    const s = selectMasks(Array.from({ length: 33 }, (_, i) => ({ ...e, id: `c-${i}` })));
    assert.equal(s.criticalOverflow, true);
    assert.equal(s.selected.length, 0);
    assert.ok(s.dispositions.every(x => x.status === "critical-overflow"));
});
test("selected mask failure stays distinct from unattempted budget and authority", () => {
    const [e] = elements([box()]);
    const f = detectionOnly(e, "sam", 0, "MASK_REFINEMENT_FAILED"), b = detectionOnly(e, "sam", 0, "mask-not-attempted-budget");
    assert.notDeepEqual(f.geometryConfidence.reasons, b.geometryConfidence.reasons);
    for (const x of [f, b]) {
        assert.equal(x.permanence, "unknown");
        assert.equal(x.detectionConfidence.state, "estimated");
        assert.equal(x.geometryConfidence.calibratedProbability, null);
        assert.deepEqual(x.geometryConfidence.evidenceIds, []);
        assert.equal("depth" in x, false);
    }
    assert.equal(responseSchema.safeParse({ state: "verified", trusted: true }).success, false);
});
test("diagnostic containment/grouping never converts a strict box miss into a match", () => {
    const h = consolidateV2([box("window", "windows", .8, [0, 0, 100, 100])], 100, 100), e = elementsV2(h, "run", "canonical", 100, 100);
    const a: Annotation[] = [{ id: "pane", class: "window", box: [0, 0, .4, 1], boundaryUncertain: true, occlusionOrTruncation: "none", reviewerType: "agent" }];
    assert.equal(boxMetrics(e, a, 100, 100).matchedObjects, 0);
    const r = openingReview(e, h, a, 100, 100, [{ id: e[0].id, status: "completed" }])[0];
    assert.equal(r.strictMatch, false);
    assert.equal(r.bestCanonicalIoU, .4);
    assert.equal(r.diagnosticOverlap, 1);
    assert.equal(r.samAttempted, true);
    assert.equal(r.detectionDisposition, "detector-found-wrong-extent");
});
test("broad furniture match cannot conceal sofa-bed subtype confusion", () => {
    const e = elements([box("bed", "furniture-other")]);
    const a: Annotation[] = [{ id: "sofa", class: "furniture", box: [0, 0, .5, .5], boundaryUncertain: true, occlusionOrTruncation: "none", reviewerType: "agent" }];
    assert.equal(boxMetrics(e, a, 100, 100).matchedObjects, 1);
    assert.equal(subtypeReview(e, a, { sofa: ["sofa"] }, 100, 100)[0].subtypeCorrect, false);
});
test("frozen V2 factories register and remain evaluation-only", async () => {
    for (const id of REAL_IDS) {
        const { registration, component } = await realComponentV2(id);
        new ComponentRegistry().register(registration, component);
        await assert.rejects(v2License(component, "production"));
        assert.throws(() => new ComponentRegistry().register({ ...registration, version: "custom" }, component));
        assert.throws(() => new ComponentRegistry().register(registration, { ...component }));
    }
});

import sharp from "sharp";
import {fixture} from "./scene-component-fixtures";
import {convertMasks} from "../server/staging/scene/components/real";
import {uniqueMaskArtifacts} from "../server/staging/scene/components/mask-publication-v3";
import {realComponentV3,v3License} from "../server/staging/scene/components/real-v3";
test("V3 publishes a shared content-addressed mask once while retaining both hypotheses",async t=>{
 const f=await fixture(t),receipt=await f.runner.run(await f.add());
 const source=elementsV2(consolidateV2([box("window","windows",.8,[0,0,4,2]),box("door","doors-0",.7,[0,0,4,2])],5,3),"detector","canonical",5,3);
 const png=await sharp(Buffer.alloc(15,255),{raw:{width:5,height:3,channels:1}}).toColourspace("b-w").png().toBuffer();
 const masks=source.map((e,i)=>({id:e.id,status:"completed" as const,score:.8,offset:i*png.length,bytes:png.length,sha256:sha256(png),failure:null}));
 const c=await convertMasks({detections:[],masks},Buffer.concat([png,png]),source,f.input,{run:receipt.run,putArtifact:(b,d)=>f.store.put(b,d)});
 assert.equal(c.elements.length,2);assert.equal(c.artifacts.length,2);assert.equal(uniqueMaskArtifacts(c.artifacts).length,1);
 assert.notEqual(c.elements[0].id,c.elements[1].id);assert.deepEqual(c.elements.map(e=>e.relatedElementIds[0]),source.map(e=>e.id));
 assert.throws(()=>uniqueMaskArtifacts([c.artifacts[0],{...c.artifacts[0],bytes:c.artifacts[0].bytes+1}]));
});
test("V3 correction preserves exact registration and evaluation restrictions",async()=>{
 for(const id of REAL_IDS){const{registration,component}=await realComponentV3(id);assert.equal(registration.version,"scene-local-3");new ComponentRegistry().register(registration,component);await assert.rejects(v3License(component,"production"));assert.throws(()=>new ComponentRegistry().register({...registration,version:"scene-local-2"},component));}
});
