import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { SceneElement } from "../../shared/staging/scene-map";
import type { SceneArtifactStore } from "../../server/staging/scene/artifacts";
import { iou } from "../../server/staging/scene/components/real-mapping";

export type Annotation = { id: string; class: string; box: number[]; polygon?: number[][]; boundaryUncertain: boolean; occlusionOrTruncation: string; reviewerType: string; lowResolutionStress?: boolean };
const surfaces = ["floor", "wall", "ceiling"];
export const escapeHtml = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const palette = ["#f59e0b", "#2563eb", "#16a34a", "#ef4444", "#8b5cf6", "#0891b2", "#db2777", "#84cc16"];
const classes = ["floor", "wall", "ceiling", "window", "door", "opening", "fireplace", "built-in", "fixed-light", "vent", "outlet", "fixed-appliance", "plumbing-fixture", "mirror", "stairs", "furniture", "foreground-object", "unknown"];
function colour(cls: string) { return palette[Math.max(0, classes.indexOf(cls)) % palette.length]; }
export function elementBox(e: SceneElement, width: number, height: number): number[] {
    if (e.shape.kind !== "polygon") throw new Error("Expected detector box");
    const pts = e.shape.polygon.exterior;
    return [Math.min(...pts.map(p => p[0])) * width, Math.min(...pts.map(p => p[1])) * height, Math.max(...pts.map(p => p[0])) * width, Math.max(...pts.map(p => p[1])) * height];
}
export function boxMetrics(elements: SceneElement[], annotations: Annotation[], width: number, height: number) {
    const used = new Set<string>();
    const reviewed = annotations.filter(a => !surfaces.includes(a.class));
    const matches = reviewed.map(a => {
        const box = a.box.map((v, i) => v * (i % 2 ? height : width));
        const candidates = elements.filter(e => e.class === a.class && !used.has(e.id)).map(e => ({ e, iou: iou(elementBox(e, width, height), box) })).sort((a, b) => b.iou - a.iou || a.e.id.localeCompare(b.e.id));
        const best = candidates[0];
        if (best?.iou >= .5) { used.add(best.e.id); return { annotation: a.id, class: a.class, match: best.e.id, iou: best.iou }; }
        return { annotation: a.id, class: a.class, match: null, iou: best?.iou ?? 0 };
    });
    const matched = matches.filter(m => m.match !== null).length;
    return { annotationType: "agent-reviewed-visible-boxes-not-human-ground-truth", matching: "annotation order; highest IoU unused same-class prediction; IoU>=0.5", annotatedObjects: reviewed.length, matchedObjects: matched,
        boxRecall: reviewed.length ? matched / reviewed.length : null, matches,
        criticalMisses: matches.filter(m => !m.match && ["door", "window", "opening"].includes(m.class)),
        unmatchedPredictions: elements.filter(e => !used.has(e.id) && !surfaces.includes(e.class)).map(e => ({ id: e.id, class: e.class, subtype: e.subtype })),
        unmatchedMeaning: "Candidates for visual false-positive review; annotation is minimal and grouping/occlusion can disagree.",
        falseSafeRegionRate: null, falseSafeRegionReason: "N/A: no R2 safe-region system exists", normalizedBoundaryError: null, boundaryReason: "Coarse agent polygons/boxes with uncertain boundaries do not support precise boundary accuracy." };
}
export async function diagnostic(directory: string, original: Buffer, detections: SceneElement[], masks: SceneElement[], store: SceneArtifactStore, annotations: Annotation[], report: Record<string, unknown>) {
    const { info, data } = await sharp(original).raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    await writeFile(path.join(directory, "original.png"), original);
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${detections.map((e, i) => {
        const [x, y, r, b] = elementBox(e, width, height);
        return `<rect x="${x}" y="${y}" width="${r - x}" height="${b - y}" fill="none" stroke="${colour(e.class)}" stroke-width="2"/><text x="${x + 2}" y="${Math.max(14, y + 14)}" fill="${colour(e.class)}" stroke="white" stroke-width=".3" font-size="14">${i}: ${escapeHtml(e.subtype ?? e.class)}</text>`;
    }).join("")}</svg>`;
    await writeFile(path.join(directory, "detections.png"), await sharp(original).composite([{ input: Buffer.from(overlay) }]).png().toBuffer());
    const blended = Buffer.from(data), classified = Buffer.alloc(width * height * 3, 35), unknown = Buffer.alloc(width * height * 3), covered = new Uint8Array(width * height);
    const decoded = new Map<string, Buffer>();
    for (const element of masks) {
        if (element.shape.kind !== "mask") continue;
        const ref = element.shape.mask;
        const pixels = await sharp(await store.read(ref)).toColourspace("b-w").raw().toBuffer();
        if (pixels.length !== width * height) throw new Error("Diagnostic mask dimensions mismatch");
        decoded.set(element.id, pixels);
        const hex = colour(element.class).slice(1), rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
        for (let p = 0; p < pixels.length; p++) if (pixels[p]) {
            covered[p] = 1;
            for (let c = 0; c < 3; c++) { blended[p * 3 + c] = Math.round(data[p * 3 + c] * .5 + rgb[c] * .5); classified[p * 3 + c] = rgb[c]; }
        }
    }
    for (let p = 0; p < covered.length; p++) for (let c = 0; c < 3; c++) unknown[p * 3 + c] = covered[p] ? Math.round(data[p * 3 + c] * .3) : [220, 40, 160][c];
    for (const [file, pixels] of [["masks.png", blended], ["classes.png", classified], ["unknown.png", unknown]] as const) await writeFile(path.join(directory, file), await sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer());
    const maskMetrics = [];
    for (const a of annotations.filter(a => a.polygon)) {
        // Primary mask is selected by detector confidence, never by annotation overlap.
        const candidate = masks.filter(e => e.class === a.class).sort((a, b) => (b.detectionConfidence.rawScore ?? 0) - (a.detectionConfidence.rawScore ?? 0))[0];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="black"/><polygon points="${a.polygon!.map(p => `${p[0] * width},${p[1] * height}`).join(" ")}" fill="white"/></svg>`;
        const truth = await sharp(Buffer.from(svg)).removeAlpha().greyscale().raw().toBuffer();
        const predicted = candidate ? decoded.get(candidate.id)! : Buffer.alloc(width * height);
        let intersection = 0, union = 0;
        for (let i = 0; i < truth.length; i++) { const t = truth[i] >= 128, p = predicted[i] > 0; if (t && p) intersection++; if (t || p) union++; }
        maskMetrics.push({ annotation: a.id, class: a.class, prediction: candidate?.id ?? null, coarseAgentMaskIoU: candidate && union ? intersection / union : null, maskAvailable: !!candidate, scope: "Approximate visible-floor smoke polygon; not precision ground truth" });
    }
    const complete = { ...report, maskMetrics };
    await writeFile(path.join(directory, "report.json"), JSON.stringify(complete, null, 2));
    const compact = { caseId: report.caseId, sourceSha256: report.sourceSha256, promptVersion: report.promptVersion, promptHash: report.promptHash, thresholds: report.thresholds, detectionCount: detections.length, maskCount: masks.length, metrics: report.metrics, maskMetrics, timings: report.timings, blockers: report.blockers, runtimeBinding: report.runtimeBinding };
    const legend = classes.map(c => `<span style="border-left:12px solid ${colour(c)};padding:4px">${c}</span>`).join(" ");
    const panel = (title: string, file: string) => `<section><h2>${title}</h2><a href="${file}"><img src="${file}" alt="${title}"></a></section>`;
    await writeFile(path.join(directory, "index.html"), `<!doctype html><meta charset="utf-8"><title>R1.4B2 smoke diagnostic</title><style>body{font:16px system-ui;background:#101827;color:#edf2f7;margin:24px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img{width:100%;height:auto}section{background:#1e293b;padding:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}a{color:#93c5fd}h1{font-size:24px}</style><h1>R1.4B2 scene-understanding smoke — evaluation only / not architecture-safe</h1><p>No editing or placement authority. Click any panel for full-resolution inspection. Agent annotations are not independent human ground truth.</p><p>${legend}</p><main>${panel("1. Original", "original.png")}${panel("2. DINO labels / boxes", "detections.png")}${panel("3. SAM masks", "masks.png")}${panel("4. Canonical class proposals (overlaps use display order)", "classes.png")}${panel("5. Uncovered pixels in magenta; all pixels remain unverified", "unknown.png")}<section><h2>6. Metrics and blockers</h2><p><a href="report.json">Full machine-readable evidence</a></p><pre>${escapeHtml(JSON.stringify(compact, null, 2))}</pre></section></main>`);
    return complete;
}
