import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ELEMENT_CLASSES, type SceneElement } from "../../../../shared/staging/scene-map";
import { stableJson } from "../artifacts";
import { reject } from "../errors";
import { freeze, type VisionComponent, type ExecutionPolicy } from "./types";
import type { Registration } from "./registry";
import { qualifiedBinding, executeReal, realId, PROMPT_HASH, REPO, type RealId } from "./real-v2-runtime";
import { V2_DESCRIPTOR_SHA256 } from "./real-v2-pins";
import { consolidateV2, elementsV2, selectMasks, detectionOnly, MAPPING_VERSION, SELECTION_VERSION, type MaskDisposition } from "./real-v2-mapping";
import { convertMasks } from "./real";
import { coverage } from "./real-mapping";
const known = new WeakMap<VisionComponent, Omit<Registration, "component">>(), configs = new WeakMap<VisionComponent, unknown>(), diagnostics = new WeakMap<VisionComponent, unknown>();
export const isRealV2 = (c: VisionComponent) => known.has(c);
export const v2RegistrationMatches = (v: unknown, c: VisionComponent) => known.has(c) && stableJson(v).equals(stableJson(known.get(c)));
export const v2Configuration = (c: VisionComponent) => configs.get(c);
export const v2Diagnostics = (c: VisionComponent) => diagnostics.get(c);
export async function v2License(c: VisionComponent, use: string) {
    if (!known.has(c) || use !== "evaluation")
        reject("COMPONENT_LICENSE_BLOCKED");
    const { binding, record } = await qualifiedBinding(realId(c.id)), weight = record.files.find(f => f.role === "weights")!;
    return { id: record.id, revision: "dab2a2d8f3a09088f5cd277aa2632ef118841fda", noWeights: false, artifactName: "model-safetensors", sha256: weight.sha256, codeSha256: binding.sourceSha256["scene_worker_v2.py"], weightsLicense: { snapshot: { evidenceId: `${record.id}-weights` } }, modelRevision: record.revision };
}
export async function realComponentV2(id: RealId) {
    const { record, binding } = await qualifiedBinding(realId(id));
    if (!binding.sourceSha256["bindings/scene-final-policy-v2.json"])
        reject("COMPONENT_LICENSE_BLOCKED");
    const final = z.object({ version: z.literal("roomstager-r1-final-policy-v2"), frozen: z.literal(true), profile: z.enum(["t10", "t15", "t20", "t25"]), noncriticalThreshold: z.literal(.25), mappingVersion: z.literal(MAPPING_VERSION), selectionVersion: z.literal(SELECTION_VERSION), studyEvidenceSha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict().parse(JSON.parse(await readFile(path.join(REPO, "scripts/staging_runtime/bindings/scene-final-policy-v2.json"), "utf8")));
    const task = record.task;
    const policy: ExecutionPolicy = { id: `real-${task}-v1`, task, deadlineMs: 120000, memoryLimitBytes: 8589934592, memoryEnforcement: "host-cgroup", inputByteLimit: 1048576, outputByteLimit: 1048576, artifactByteLimit: 16777216, stderrByteLimit: 65536, seed: 0, network: "disabled", backend: "qualified-local-container-v1" };
    const registration = freeze({ id, version: "scene-local-2", task, execution: "local" as const, supportedClasses: [...ELEMENT_CLASSES], dependencies: task === "segmentation" ? ["detection" as const] : [], policy, licenseId: id, codeRevision: "dab2a2d8f3a09088f5cd277aa2632ef118841fda" });
    const component: VisionComponent = { id, version: registration.version, task, supportedClasses: registration.supportedClasses, execution: "local", async analyze(input, context) {
            const image = await context.readCanonical(), source = context.dependencies.flatMap(d => d.status === "completed" && d.output.task === "detection" ? d.output.elements : []);
            const selection = selectMasks(source);
            if (task === "segmentation" && selection.criticalOverflow) {
                diagnostics.set(component, { selection, wholeCaseAbstention: "critical-overflow" });
                reject("COMPONENT_RESOURCE_LIMIT");
            }
            const prompted = task === "detection" ? [] : selection.selected;
            const boxes = prompted.map(e => { if (e.shape.kind !== "polygon" || e.shape.polygon.exterior.length !== 4)
                reject("COMPONENT_DEPENDENCY_INVALID"); const p = e.shape.polygon.exterior; return { id: e.id, box: [p[0][0] * input.frame.width, p[0][1] * input.frame.height, p[2][0] * input.frame.width, p[2][1] * input.frame.height] }; });
            const transport = await executeReal(id, image, input.frame.width, input.frame.height, boxes, context.signal, final.profile), { result, binary } = transport;
            if (Object.keys(result.studyDetections).length)
                reject("COMPONENT_OUTPUT_INVALID");
            if (task === "detection") {
                if (binary.length || result.masks.length)
                    reject("COMPONENT_OUTPUT_INVALID");
                const hypotheses = consolidateV2(result.detections, input.frame.width, input.frame.height), elements = elementsV2(hypotheses, context.run.id, input.frame.id, input.frame.width, input.frame.height);
                diagnostics.set(component, { ...transport, binary: undefined, hypotheses });
                return { status: "completed", run: context.run, output: { task, elements, coverage: coverage(elements) }, frames: [input.frame], artifacts: [] };
            }
            const converted = await convertMasks(result, binary, prompted, input, context);
            const states = new Map(selection.dispositions.map(d => [d.id, d.status]));
            for (const m of result.masks)
                states.set(m.id, m.status === "completed" ? "completed" : "MASK_REFINEMENT_FAILED");
            const only = source.flatMap((e, i) => states.get(e.id) === "completed" ? [] : [detectionOnly(e, context.run.id, i, states.get(e.id)!)]), elements: SceneElement[] = [...converted.elements, ...only];
            diagnostics.set(component, { ...transport, binary: undefined, selection: { ...selection, selected: prompted.map(e => e.id), dispositions: source.map(e => ({ id: e.id, status: states.get(e.id) as MaskDisposition })) } });
            return { status: "completed", run: context.run, output: { task, elements, coverage: coverage(elements, converted.failed) }, frames: [input.frame], artifacts: converted.artifacts };
        } };
    known.set(component, registration);
    configs.set(component, freeze({ registration, runtimeDescriptorSha256: V2_DESCRIPTOR_SHA256, promptHash: PROMPT_HASH, finalPolicy: final, maxSamPrompts: 32, multimask: false }));
    return { registration, component: freeze(component) };
}
