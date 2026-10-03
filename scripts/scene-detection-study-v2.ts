import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { LocalSceneArtifactStore, sha256 } from "../server/staging/scene/artifacts";
import { preprocessImage } from "../server/staging/scene/preprocess";
import { executeReal, admission, REPO, REAL_IDS } from "../server/staging/scene/components/real-v2-runtime";
import { consolidateV2, elementsV2, selectMasks, priority } from "../server/staging/scene/components/real-v2-mapping";
import { boxMetrics } from "../benchmarks/staging/scene-smoke";
if (process.argv.slice(2).join(" ") !== "--seven-source-predeclared-study")
    throw new Error("Explicit study flag required");
const initialAdmission = await admission();
const annotations = JSON.parse(await readFile(path.join(REPO, "benchmarks/staging/scene-smoke-annotations.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(REPO, "benchmarks/staging/manifest.json"), "utf8"));
const baseline = JSON.parse(await readFile(path.join(REPO, "docs/staging/r1-detection-segmentation-smoke.json"), "utf8"));
const output = path.join(REPO, ".model-cache/r14b1/detection-study-v2", randomUUID());
await mkdir(output, { recursive: true, mode: 0o700 });
const cases: any[] = [];
console.log(JSON.stringify({ output, initialAdmission }));
for (const source of annotations.cases) {
    const item = manifest.cases.find((x: any) => x.id === source.id);
    const bytes = await readFile(path.join(REPO, source.source));
    if (!item || item.split !== "development" || item.source !== source.source || item.roomIdentity !== source.roomIdentity || !source.localEvaluationApproved || sha256(bytes) !== source.sourceSha256)
        throw new Error("SOURCE_NOT_APPROVED");
    if (item.provenance) {
        const p = JSON.parse(await readFile(path.join(REPO, item.provenance), "utf8"));
        if (!p.some((x: any) => x.preparedSha256 === source.sourceSha256 && x.license === "CC0-1.0"))
            throw new Error("PROVENANCE_MISMATCH");
    }
    const store = await LocalSceneArtifactStore.open(output, source.id), prep = await preprocessImage({ bytes, mediaType: source.source.endsWith("webp") ? "image/webp" : "image/jpeg" }, store);
    const started = Date.now();
    const transport = await executeReal(REAL_IDS[0], prep.canonicalBytes, prep.frames[0].width, prep.frames[0].height, [], AbortSignal.timeout(120000), "study");
    const rows = [];
    for (const profile of ["t10", "t15", "t20", "t25"] as const) {
        const raw = [...transport.result.detections, ...transport.result.studyDetections[profile] ?? []];
        try {
            const h = consolidateV2(raw, prep.frames[0].width, prep.frames[0].height), e = elementsV2(h, "study", "canonical", prep.frames[0].width, prep.frames[0].height), metrics = boxMetrics(e, source.annotations, prep.frames[0].width, prep.frames[0].height), selection = selectMasks(e);
            const old = baseline.cases.find((x: any) => x.caseId === source.id).objectBoxMetrics.matches.filter((x: any) => x.match && ["door", "opening", "window"].includes(x.class));
            rows.push({ profile, criticalMisses: metrics.criticalMisses.length, regressions: old.filter((x: any) => !metrics.matches.find(y => y.annotation === x.annotation)?.match).length, criticalOverflow: selection.criticalOverflow, criticalHypotheses: e.filter(x => priority(x) === 1).length, unmatchedCritical: e.filter(x => priority(x) === 1 && !metrics.matches.some(m => m.match === x.id)).length, hypotheses: h.length, unknown: h.filter(x => x.class === "unknown").length, matches: metrics.matches, metrics, selection: selection.dispositions });
        }
        catch (error) {
            rows.push({ profile, failed: true, error: String(error) });
        }
    }
    const row = { caseId: source.id, sourceSha256: source.sourceSha256, canonical: prep.source.canonical, transport: { ...transport, binary: undefined }, seconds: (Date.now() - started) / 1000, rows };
    cases.push(row);
    await writeFile(path.join(output, source.id, "study.json"), JSON.stringify(row, null, 2));
    await writeFile(path.join(output, "summary.json"), JSON.stringify({ initialAdmission, cases }, null, 2));
    console.log(JSON.stringify({ caseId: source.id, rows: rows.map(({ metrics, matches, selection, ...r }: any) => r) }));
}
const totals = ["t10", "t15", "t20", "t25"].map(profile => {
    const rows = cases.map(c => c.rows.find((r: any) => r.profile === profile));
    return { profile, failed: rows.some(r => r.failed), criticalMisses: rows.reduce((s, r) => s + (r.criticalMisses ?? 1000), 0), regressions: rows.reduce((s, r) => s + (r.regressions ?? 1000), 0), criticalOverflow: rows.filter(r => r.criticalOverflow).length, unmatchedCritical: rows.reduce((s, r) => s + (r.unmatchedCritical ?? 1000), 0), criticalHypotheses: rows.reduce((s, r) => s + (r.criticalHypotheses ?? 1000), 0) };
});
totals.sort((a, b) => Number(a.failed) - Number(b.failed) || a.criticalMisses - b.criticalMisses || a.regressions - b.regressions || a.criticalOverflow - b.criticalOverflow || a.unmatchedCritical - b.unmatchedCritical || a.criticalHypotheses - b.criticalHypotheses || b.profile.localeCompare(a.profile));
await writeFile(path.join(output, "tradeoff.json"), JSON.stringify({ totals, selected: totals.find(t => !t.failed)?.profile ?? null }, null, 2));
console.log(JSON.stringify({ completed: true, output, totals }));
