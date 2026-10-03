/** Explicit local-only operator command. No environment/customer activation, downloads, or external providers. */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { LocalSceneArtifactStore, sha256 } from "../server/staging/scene/artifacts";
import { preprocessImage } from "../server/staging/scene/preprocess";
import { ComponentRegistry } from "../server/staging/scene/components/registry";
import { ComponentLicenseRegistry } from "../server/staging/scene/licenses";
import { ComponentRunner } from "../server/staging/scene/components/runner";
import { realComponentV3 as realComponent, v3Diagnostics as realDiagnostics } from "../server/staging/scene/components/real-v3";
import { REAL_IDS, REPO, admission, assertAdmissionHealthy, PROMPT_HASH, qualifiedBinding } from "../server/staging/scene/components/real-v3-runtime";
import { openingReview, subtypeReview, architectureReview } from "../benchmarks/staging/scene-v2-review";
import { diagnostic, boxMetrics, escapeHtml, type Annotation } from "../benchmarks/staging/scene-smoke";
const args = process.argv.slice(2);
if (args.length !== 1 || args[0] !== "--execute-frozen-v3-seven-sources")
    throw new Error("Explicit seven-source local evaluation flag required");
const initialAdmission = await admission();
const annotationsBytes = await readFile(path.join(REPO, "benchmarks/staging/scene-smoke-annotations.json"));
const reviewed = JSON.parse(annotationsBytes.toString()) as {
    cases: {
        id: string;
        roomIdentity: string;
        source: string;
        sourceSha256: string;
        localEvaluationApproved: boolean;
        annotations: Annotation[];
    }[];
};
const manifest = JSON.parse((await readFile(path.join(REPO, "benchmarks/staging/manifest.json"))).toString());
if (reviewed.cases.length !== 7 || manifest.cases.length !== 7)
    throw new Error("Expected exactly seven sources");
const output = path.join(REPO, ".model-cache/r14b1/scene-smoke-v3", randomUUID());
await mkdir(output, { recursive: true, mode: 0o700 });
console.log(JSON.stringify({ output, initialAdmission }));
const rows: unknown[] = [];
const subtypes = JSON.parse(await readFile(path.join(REPO, "benchmarks/staging/scene-subtypes-v2.json"), "utf8"));
for (const source of reviewed.cases) {
    const item = manifest.cases.find((c: {
        id: string;
    }) => c.id === source.id);
    if (!item || item.source !== source.source || item.roomIdentity !== source.roomIdentity || item.split !== "development" || !source.localEvaluationApproved)
        throw new Error("SOURCE_NOT_APPROVED");
    const bytes = await readFile(path.join(REPO, source.source));
    if (sha256(bytes) !== source.sourceSha256)
        throw new Error("SOURCE_HASH_MISMATCH");
    if (item.provenance) {
        const provenance = JSON.parse((await readFile(path.join(REPO, item.provenance))).toString());
        if (!provenance.some((p: {
            preparedSha256: string;
            license: string;
        }) => p.preparedSha256 === source.sourceSha256 && p.license === "CC0-1.0"))
            throw new Error("PROVENANCE_MISMATCH");
    }
    await admission();
    const store = await LocalSceneArtifactStore.open(output, source.id);
    const prepared = await preprocessImage({ bytes, mediaType: source.source.endsWith("webp") ? "image/webp" : "image/jpeg" }, store);
    const input = { canonical: prepared.source.canonical, frame: prepared.frames[0], selectionRestriction: null };
    const registry = new ComponentRegistry(), runner = new ComponentRunner(registry, new ComponentLicenseRegistry());
    const detector = await realComponent(REAL_IDS[0]), segmenter = await realComponent(REAL_IDS[1]);
    registry.register(detector.registration, detector.component);
    registry.register(segmenter.registration, segmenter.component);
    const started = performance.now(), signal = AbortSignal.timeout(300000);
    const detection = await runner.run({ id: REAL_IDS[0], version: detector.registration.version, task: "detection", input, store, signal });
    assertAdmissionHealthy();
    const detectionSeconds = (performance.now() - started) / 1000;
    // Separate mandatory admission after DINO has exited and its container has been removed.
    const beforeSam = await admission();
    const samStarted = performance.now();
    const segmentation = detection.status === "completed" ? await runner.run({ id: REAL_IDS[1], version: segmenter.registration.version, task: "segmentation", input, store, dependencies: [detection], signal }) : null;
    assertAdmissionHealthy();
    const segmentationSeconds = (performance.now() - samStarted) / 1000;
    const elements = detection.status === "completed" && detection.output.task === "detection" ? detection.output.elements : [];
    const masks = segmentation?.status === "completed" && segmentation.output.task === "segmentation" ? segmentation.output.elements.filter(e => e.shape.kind === "mask") : [];
    const binding = await qualifiedBinding(REAL_IDS[0]);
    const d = realDiagnostics(detector.component) as any, s = realDiagnostics(segmenter.component) as any;
    const dispositions = s?.selection?.dispositions ?? [];
    const report = { phase: "R1.4B3-V3-artifact-fix", selection: s?.selection ?? null, openingReview: openingReview(elements, d?.hypotheses ?? [], source.annotations, input.frame.width, input.frame.height, dispositions), subtypeReview: subtypeReview(elements, source.annotations, subtypes.cases[source.id] ?? {}, input.frame.width, input.frame.height), architectureReview: architectureReview(source.id, elements, source.annotations, input.frame.width, input.frame.height), caseId: source.id, roomIdentity: source.roomIdentity, sourceSha256: source.sourceSha256, canonical: input.canonical, annotationsSha256: sha256(annotationsBytes), annotationReview: "agent-before-predictions", evaluationOnly: true, architectureSafe: false,
        promptVersion: "roomstager-r1-detection-v2", promptHash: PROMPT_HASH, thresholds: { criticalBox: .20, criticalText: .20, noncriticalBox: .25, noncriticalText: .25, duplicateIoU: .80 }, runtimeBinding: binding.binding,
        detectionCount: elements.length, maskCount: masks.length, detection, segmentation, detectorDiagnostics: realDiagnostics(detector.component), segmentationDiagnostics: realDiagnostics(segmenter.component),
        timings: { detectionSeconds, segmentationSeconds, wholeSequenceSeconds: (performance.now() - started) / 1000 }, beforeSam,
        lowResolutionStress: input.frame.width < 300 || input.frame.height < 200, metrics: boxMetrics(elements, source.annotations, input.frame.width, input.frame.height),
        blockers: ["evaluation-only", "not-architecture-safe", "no-edit-or-placement-authority", "minimal-agent-annotations", "surfaces-experimental", ...(detection.status !== "completed" ? ["detection-failed"] : []), ...(segmentation?.status !== "completed" ? ["segmentation-failed-or-abstained"] : [])] };
    const completed = await diagnostic(path.join(output, source.id), prepared.canonicalBytes, elements, masks, store, source.annotations, report);
    rows.push(completed);
    await writeFile(path.join(output, "summary.json"), JSON.stringify({ initialAdmission, cases: rows }, null, 2));
    console.log(JSON.stringify({ caseId: source.id, detection: detection.status, segmentation: segmentation?.status, count: elements.length, masks: masks.length, criticalMisses: report.metrics.criticalMisses, timings: report.timings }));
}
await writeFile(path.join(output, "index.html"), `<!doctype html><meta charset="utf-8"><title>R1.4B3 V3 seven-source smoke</title><h1>Evaluation only — not architecture-safe</h1><p>Seven development sources; agent annotations; no production qualification.</p><ul>${reviewed.cases.map(c => `<li><a href="${c.id}/index.html">${escapeHtml(c.id)}</a></li>`).join("")}</ul>`);
console.log(JSON.stringify({ completed: true, output, cases: rows.length }));
