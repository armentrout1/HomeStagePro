import { ELEMENT_CLASSES, type Confidence, type SceneElement, type ElementClass, type ClassCoverage } from "../../../../shared/staging/scene-map";
import { reject } from "../errors";
import { nativeDetection, type NativeDetection } from "./real-runtime";

const aliases: Record<string, [ElementClass, string]> = {};
const add = (names: string[], cls: ElementClass, subtype: string) => names.forEach(name => { aliases[name] = [cls, subtype]; });
add(["door"], "door", "door");
for (const label of ["sliding door", "balcony door", "closet door"]) add([label], "door", label.replaceAll(" ", "-"));
add(["doorway", "open doorway"], "opening", "doorway");
for (const cls of ["window", "fireplace", "mirror", "floor", "wall", "ceiling"] as const) add([cls], cls, cls);
add(["built-in cabinet"], "built-in", "cabinet"); add(["built-in shelving"], "built-in", "shelving");
add(["staircase", "stairs"], "stairs", "stairs"); add(["electrical outlet", "wall outlet"], "outlet", "outlet"); add(["vent", "air vent"], "vent", "vent");
for (const label of ["light fixture", "ceiling light", "ceiling fan"]) add([label], "fixed-light", label.replaceAll(" ", "-"));
for (const label of ["sink", "toilet", "bathtub", "shower"]) add([label], "plumbing-fixture", label);
for (const label of ["stove", "oven", "refrigerator", "dishwasher"]) add([label], "fixed-appliance", label);
add(["sofa", "couch"], "furniture", "sofa"); add(["chair", "armchair"], "furniture", "chair");
for (const label of ["loveseat", "sectional", "coffee table", "dining table", "table", "desk", "bed", "nightstand", "dresser", "cabinet", "rug"]) add([label], "furniture", label.replaceAll(" ", "-"));
add(["furniture"], "furniture", "unknown-furniture"); add(["foreground object"], "foreground-object", "foreground-object");
export function mapLabel(label: string): [ElementClass, string] { return aliases[label.trim().toLowerCase()] ?? ["unknown", "ambiguous-native-label"]; }
export function iou(a: number[], b: number[]) {
    const intersection = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    return intersection / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - intersection);
}
export type Hypothesis = NativeDetection & { class: ElementClass; subtype: string; contributions: NativeDetection[] };
const groups = ["openings", "architecture", "fixtures-electrical", "fixtures-plumbing-appliances", "furniture-seating-tables", "furniture-other", "surfaces"];
export function consolidate(raw: unknown[], width: number, height: number): Hypothesis[] {
    if (raw.length > 896) reject("COMPONENT_RESOURCE_LIMIT");
    const parsed = raw.map(r => nativeDetection.parse(r));
    for (const d of parsed) {
        const [x, y, r, b] = d.box;
        if (!(0 <= x && x < r && r <= width && 0 <= y && y < b && b <= height) || d.score < .20) reject("COMPONENT_OUTPUT_INVALID");
    }
    for (const group of groups) if (parsed.filter(d => d.group === group).length > 128) reject("COMPONENT_RESOURCE_LIMIT");
    parsed.sort((a, b) => b.score - a.score || groups.indexOf(a.group) - groups.indexOf(b.group) || a.box[0] - b.box[0] || a.box[1] - b.box[1] || a.box[2] - b.box[2] || a.box[3] - b.box[3] || a.label.localeCompare(b.label, "en"));
    const kept: Hypothesis[] = [];
    for (const item of parsed) {
        const [cls, subtype] = mapLabel(item.label);
        const existing = kept.find(d => d.class === cls && d.subtype === subtype && (cls !== "unknown" || d.label === item.label) && iou(d.box, item.box) >= .80);
        if (existing) existing.contributions.push(item);
        else kept.push({ ...item, class: cls, subtype, contributions: [item] });
    }
    if (kept.length > 128) reject("COMPONENT_RESOURCE_LIMIT");
    return kept;
}
export function confidence(score: number | null, type: string | null, reason: string): Confidence {
    return { state: score === null ? "unknown" : "estimated", rawScore: score, scoreType: type, calibratedProbability: null, calibrationId: null, evidenceIds: [], reasons: [reason] };
}
export const unknown = () => confidence(null, null, "not-established");
export function detectionElements(hypotheses: Hypothesis[], runId: string, frameId: string, width: number, height: number): SceneElement[] {
    return hypotheses.map((d, i) => {
        const [x, y, r, b] = d.box;
        return { id: `det-${runId}-${i}`, class: d.class, subtype: d.subtype,
            shape: { kind: "polygon", polygon: { frameId, space: "normalized-image", exterior: [[x / width, y / height], [r / width, y / height], [r / width, b / height], [x / width, b / height]], holes: [] } },
            visibility: "uncertain", permanence: "unknown", detectionConfidence: confidence(d.score, "dino-max-token-sigmoid", "uncalibrated-model-score"),
            geometryConfidence: confidence(d.score, "dino-max-token-sigmoid", "box-only-not-object-boundary"), boundaryUncertaintyPixels: null, permanenceConfidence: unknown(), componentRunIds: [runId],
            relatedElementIds: hypotheses.flatMap((other, j) => j !== i && other.class !== d.class && iou(d.box, other.box) >= .5 ? [`det-${runId}-${j}`] : []),
            opening: ["door", "opening"].includes(d.class) ? { state: "unknown", hingeImageSide: "unknown", swing: "unknown", confidence: unknown() } : null };
    });
}
export function coverage(elements: SceneElement[], failedClasses: ElementClass[] = []): Record<ElementClass, ClassCoverage> {
    return Object.fromEntries(ELEMENT_CLASSES.map(cls => {
        const count = elements.filter(e => e.class === cls).length;
        return [cls, { inspection: failedClasses.includes(cls) && count === 0 ? "failed" : "partial", observedCount: count, absence: "not-established",
            confidence: confidence(null, null, ["floor", "wall", "ceiling"].includes(cls) ? "experimental-surface-not-qualified" : "model-only-inspection") }];
    })) as Record<ElementClass, ClassCoverage>;
}
