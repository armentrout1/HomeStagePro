import { readFileSync } from "node:fs";
import { ELEMENT_CLASSES, type SceneElement, type ElementClass } from "../../../../shared/staging/scene-map";
import { nativeDetection, type NativeDetection } from "./real-v2-runtime";
import { mapLabel, iou, detectionElements } from "./real-mapping";
import { reject } from "../errors";
const vocabulary = JSON.parse(readFileSync(new URL("../../../../scripts/staging_runtime/bindings/scene-vocabulary-v2.json", import.meta.url), "utf8")) as {
    groups: {
        id: string;
        text: string;
        critical: boolean;
        experimentalSurface: boolean;
    }[];
};
export const MAPPING_VERSION = "roomstager-r1-mapping-v2";
export const SELECTION_VERSION = "architecture-first-v2";
export function normalizeLabel(raw: string) {
    return raw.normalize("NFKC").toLowerCase().replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s*-\s*/g, "-").replace(/[.,;:!?()\[\]{}"'`]/g, " ").replace(/\s+/g, " ").trim();
}
export function mapV2(raw: string, group: string): {
    normalizedLabel: string;
    class: ElementClass;
    subtype: string;
    phrases: string[];
} {
    const label = normalizeLabel(raw), g = vocabulary.groups.find(g => g.id === group);
    const allowed = (g?.text.split(".").map(t => t.trim()).filter(Boolean) ?? []).sort((a, b) => b.length - a.length || a.localeCompare(b, "en"));
    const paths: string[][] = [];
    function walk(rest: string, parts: string[]) {
        if (paths.length > 32 || parts.length > 16)
            return;
        if (!rest) {
            paths.push(parts);
            return;
        }
        for (const phrase of allowed)
            if (rest === phrase || rest.startsWith(phrase + " "))
                walk(rest.slice(phrase.length).trim(), [...parts, phrase]);
    }
    if (label.length <= 128)
        walk(label, []);
    const keys = new Set(paths.flatMap(p => p.map(v => JSON.stringify(mapLabel(v)))));
    if (paths.length && keys.size === 1) {
        const [cls, subtype] = JSON.parse(Array.from(keys)[0]);
        return { normalizedLabel: label, class: cls, subtype, phrases: paths[0] };
    }
    return { normalizedLabel: label, class: "unknown", subtype: "ambiguous-native-label", phrases: paths[0] ?? [] };
}
export type V2Hypothesis = NativeDetection & ReturnType<typeof mapV2> & {
    contributions: NativeDetection[];
};
function compare(a: V2Hypothesis, b: V2Hypothesis) { return b.score - a.score || ELEMENT_CLASSES.indexOf(a.class) - ELEMENT_CLASSES.indexOf(b.class) || a.box[0] - b.box[0] || a.box[1] - b.box[1] || a.box[2] - b.box[2] || a.box[3] - b.box[3] || a.normalizedLabel.localeCompare(b.normalizedLabel, "en") || a.group.localeCompare(b.group, "en"); }
export function consolidateV2(raw: unknown[], width: number, height: number): V2Hypothesis[] {
    if (raw.length > 4096)
        reject("COMPONENT_RESOURCE_LIMIT");
    const values = raw.map(r => nativeDetection.parse(r));
    for (const g of vocabulary.groups)
        if (values.filter(x => x.group === g.id).length > 128)
            reject("COMPONENT_RESOURCE_LIMIT");
    for (const d of values) {
        const [x, y, r, b] = d.box;
        if (!(0 <= x && x < r && r <= width && 0 <= y && y < b && b <= height) || d.score < .10)
            reject("COMPONENT_OUTPUT_INVALID");
    }
    const sorted = values.map(d => ({ ...d, ...mapV2(d.label, d.group), contributions: [d] })).sort(compare), kept: V2Hypothesis[] = [];
    for (const d of sorted) {
        const same = kept.find(k => k.class === d.class && k.subtype === d.subtype && (d.class !== "unknown" || k.normalizedLabel === d.normalizedLabel && k.group === d.group) && iou(k.box, d.box) >= .80);
        if (same)
            same.contributions.push(...d.contributions);
        else
            kept.push(d);
    }
    if (kept.length > 256)
        reject("COMPONENT_RESOURCE_LIMIT");
    return kept;
}
export function elementsV2(h: V2Hypothesis[], run: string, frame: string, w: number, hgt: number): SceneElement[] {
    const els = detectionElements(h as unknown as Parameters<typeof detectionElements>[0], run, frame, w, hgt);
    return els.map((e, i) => ({ ...e, detectionConfidence: { ...e.detectionConfidence, reasons: [...e.detectionConfidence.reasons, `native-group:${h[i].group}`, ...(Buffer.from(h[i].normalizedLabel, "utf8").toString("hex").match(/.{1,100}/g) ?? []).map((chunk, n) => `label-${n}:${chunk}`)] } }));
}
const critical = new Set(["door", "opening", "window"]), architecture = new Set(["fireplace", "built-in", "stairs"]), fixtures = new Set(["fixed-light", "vent", "outlet", "fixed-appliance", "plumbing-fixture", "mirror"]);
export const originGroup = (e: SceneElement) => e.detectionConfidence.reasons.find(x => x.startsWith("native-group:"))?.slice(13) ?? "";
export function priority(e: SceneElement) { const g = originGroup(e); if (critical.has(e.class) || g === "windows" || g.startsWith("doors-"))
    return 1; if (architecture.has(e.class))
    return 2; if (fixtures.has(e.class))
    return 3; if (e.class === "furniture")
    return 4; if (["floor", "wall", "ceiling"].includes(e.class) || g.startsWith("surface-"))
    return 6; return 5; }
export type MaskDisposition = "selected" | "mask-not-attempted-budget" | "mask-not-attempted-experimental" | "critical-overflow" | "completed" | "MASK_REFINEMENT_FAILED";
export function labelOf(e: SceneElement) { return Buffer.from(e.detectionConfidence.reasons.filter(x => /^label-\d+:/.test(x)).map(x => x.split(":")[1]).join(""), "hex").toString("utf8"); }
export function selectMasks(elements: SceneElement[]) {
    const criticalOverflow = elements.filter(e => priority(e) === 1).length > 32;
    const ordered = elements.map((e, i) => ({ e, i })).filter(x => priority(x.e) < 6).sort((a, b) => {
        const ap = a.e.shape, bp = b.e.shape;
        if (ap.kind !== "polygon" || bp.kind !== "polygon")
            reject("COMPONENT_DEPENDENCY_INVALID");
        const ac = ap.polygon.exterior.flat(), bc = bp.polygon.exterior.flat();
        let xy = 0;
        for (let i = 0; i < ac.length && !xy; i++)
            xy = ac[i] - bc[i];
        return priority(a.e) - priority(b.e) || (b.e.detectionConfidence.rawScore ?? 0) - (a.e.detectionConfidence.rawScore ?? 0) || ELEMENT_CLASSES.indexOf(a.e.class) - ELEMENT_CLASSES.indexOf(b.e.class) || xy || labelOf(a.e).localeCompare(labelOf(b.e), "en") || originGroup(a.e).localeCompare(originGroup(b.e), "en") || a.e.id.localeCompare(b.e.id, "en");
    });
    const selected = criticalOverflow ? [] : ordered.slice(0, 32).map(x => x.e), ids = new Set(selected.map(e => e.id));
    const dispositions = elements.map(e => ({ id: e.id, status: (criticalOverflow ? "critical-overflow" : ids.has(e.id) ? "selected" : priority(e) === 6 ? "mask-not-attempted-experimental" : "mask-not-attempted-budget") as MaskDisposition }));
    return { policy: SELECTION_VERSION, criticalOverflow, selected, dispositions };
}
export function detectionOnly(e: SceneElement, runId: string, index: number, status: MaskDisposition): SceneElement { return { ...e, id: `only-${runId}-${index}`, shape: e.shape, geometryConfidence: { ...e.geometryConfidence, state: "unknown", rawScore: null, scoreType: null, reasons: ["detection-only", status] }, componentRunIds: [runId], relatedElementIds: [e.id] }; }
