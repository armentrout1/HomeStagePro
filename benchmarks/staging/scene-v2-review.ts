import type { SceneElement } from "../../shared/staging/scene-map";
import { boxMetrics, elementBox, type Annotation } from "./scene-smoke";
import { iou } from "../../server/staging/scene/components/real-mapping";
import type { V2Hypothesis, MaskDisposition } from "../../server/staging/scene/components/real-v2-mapping";
export function openingReview(elements: SceneElement[], hypotheses: V2Hypothesis[], annotations: Annotation[], w: number, h: number, states: {
    id: string;
    status: MaskDisposition;
}[]) {
    const strict = boxMetrics(elements, annotations, w, h);
    return annotations.filter(a => ["door", "window", "opening"].includes(a.class)).map(a => {
        const box = a.box.map((v, i) => v * (i % 2 ? h : w));
        const all = elements.map((e, i) => ({ e, hyp: hypotheses[i], iou: iou(elementBox(e, w, h), box) })).sort((a, b) => b.iou - a.iou);
        const best = all.find(p => p.e.class === a.class), alt = all.find(p => p.e.class !== a.class), match = strict.matches.find(m => m.annotation === a.id)!;
        const predicted = best ? elementBox(best.e, w, h) : null;
        const intersection = predicted ? Math.max(0, Math.min(box[2], predicted[2]) - Math.max(box[0], predicted[0])) * Math.max(0, Math.min(box[3], predicted[3]) - Math.max(box[1], predicted[1])) : 0;
        const overlap = predicted ? intersection / Math.min((box[2] - box[0]) * (box[3] - box[1]), (predicted[2] - predicted[0]) * (predicted[3] - predicted[1])) : 0;
        const state = best ? states.find(s => s.id === best.e.id)?.status ?? "not-run" : "no-box";
        return { annotation: a.id, class: a.class, strictMatch: !!match.match, strictMatchedElement: match.match, bestCanonicalIoU: best?.iou ?? 0, bestElement: best?.e.id ?? null, nativeLabel: best?.hyp?.label ?? null, normalizedLabel: best?.hyp?.normalizedLabel ?? null, score: best?.e.detectionConfidence.rawScore ?? null, samAttempted: ["completed", "MASK_REFINEMENT_FAILED"].includes(state), maskStatus: state,
            detectionDisposition: match.match ? "strict-match" : alt && alt.iou >= .5 && alt.e.class === "unknown" ? "class-mapping-failure-candidate" : best && best.iou > 0 ? "detector-found-wrong-extent" : alt && alt.iou >= .5 ? "class-confusion" : "detector-miss",
            diagnosticOverlap: overlap, groupingReview: !match.match && overlap >= .5 ? "possible-pane-assembly-or-extent-mismatch-not-a-strict-match" : "not-established", alternativeClass: alt?.e.class ?? null, alternativeIoU: alt?.iou ?? 0 };
    });
}
export function subtypeReview(elements: SceneElement[], annotations: Annotation[], expected: Record<string, string[]>, w: number, h: number) {
    return annotations.filter(a => expected[a.id]).map(a => {
        const box = a.box.map((v, i) => v * (i % 2 ? h : w));
        const candidates = elements.filter(e => e.class === a.class).map(e => ({ e, iou: iou(elementBox(e, w, h), box) })).filter(x => x.iou >= .5).sort((a, b) => (b.e.detectionConfidence.rawScore ?? 0) - (a.e.detectionConfidence.rawScore ?? 0) || b.iou - a.iou);
        const best = candidates[0];
        return { annotation: a.id, expected: expected[a.id], predicted: best?.e.subtype ?? null, matchedCanonicalBox: !!best, subtypeCorrect: best ? expected[a.id].includes(best.e.subtype ?? "") : null, otherSubtypes: candidates.map(x => x.e.subtype) };
    });
}
export function architectureReview(caseId: string, elements: SceneElement[], annotations: Annotation[], w: number, h: number) {
    const tracked = ["stairs", "fireplace", "plumbing-fixture", "door", "opening", "built-in"];
    return elements.filter(e => tracked.includes(e.class)).map(e => {
        const best = Math.max(0, ...annotations.filter(a => a.class === e.class).map(a => iou(elementBox(e, w, h), a.box.map((v, i) => v * (i % 2 ? h : w)))));
        const absent = e.class === "stairs" || e.class === "fireplace" && !["living-fireplace-wood", "living-low-resolution"].includes(caseId) || e.class === "plumbing-fixture" && caseId !== "public-cayley-furnished" || e.class === "built-in" && caseId !== "public-cayley-furnished" || ["door", "opening"].includes(e.class) && !annotations.some(a => a.class === e.class);
        return { id: e.id, class: e.class, subtype: e.subtype, score: e.detectionConfidence.rawScore, bestAnnotatedIoU: best, review: absent ? "agent-visible-scene-false-hypothesis" : best >= .5 ? "matches-minimal-annotation" : "unmatched-needs-extent-grouping-review", scope: "development-agent-review-not-absence-authority" };
    });
}
