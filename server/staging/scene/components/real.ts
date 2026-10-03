import { ELEMENT_CLASSES, type SceneElement, type MaskRef } from "../../../../shared/staging/scene-map";
import { stableJson, sha256, type SceneArtifact } from "../artifacts";
import { reject } from "../errors";
import { freeze, type VisionComponent, type ExecutionPolicy, type ComponentContext, type AnalysisInput } from "./types";
import type { Registration } from "./registry";
import { qualifiedBinding, executeReal, realId, PROMPT_HASH, type RealId, type NativeResult } from "./real-runtime";
import { REAL_DESCRIPTOR_SHA256 } from "./real-pins";
import { consolidate, detectionElements, coverage, confidence } from "./real-mapping";

const known = new WeakMap<VisionComponent, Omit<Registration, "component">>();
const diagnostics = new WeakMap<VisionComponent, unknown>();
export const realDiagnostics = (component: VisionComponent) => diagnostics.get(component);
export const isRealImplementation = (component: VisionComponent) => known.has(component);
export function realRegistrationMatches(value: unknown, component: VisionComponent) { return known.has(component) && stableJson(value).equals(stableJson(known.get(component))); }
export const realConfiguration = (component: VisionComponent) => ({ implementation: known.get(component), runtimeDescriptorSha256: REAL_DESCRIPTOR_SHA256, promptHash: PROMPT_HASH, mappingVersion: "roomstager-r1-mapping-v1", thresholds: { box: .20, text: .20, duplicateIoU: .80 }, maxRetained: 128, maxSamPrompts: 32, multimask: false });
export async function realLicense(component: VisionComponent, use: string) {
    if (!known.has(component) || use !== "evaluation") reject("COMPONENT_LICENSE_BLOCKED");
    const { binding, record } = await qualifiedBinding(realId(component.id));
    const weight = record.files.find(f => f.role === "weights")!;
    return { id: record.id, revision: "dab2a2d8f3a09088f5cd277aa2632ef118841fda", noWeights: false, artifactName: "model-safetensors", sha256: weight.sha256,
        codeSha256: binding.sourceSha256["scene_worker.py"], weightsLicense: { snapshot: { evidenceId: `${record.id}-weights` } }, modelRevision: record.revision };
}
export async function realComponent(id: RealId): Promise<{ registration: Omit<Registration, "component">; component: VisionComponent }> {
    const { record } = await qualifiedBinding(realId(id));
    const task = record.task;
    const policy: ExecutionPolicy = { id: `real-${task}-v1`, task, deadlineMs: 120000, memoryLimitBytes: 8589934592, memoryEnforcement: "host-cgroup", inputByteLimit: 1048576, outputByteLimit: 1048576, artifactByteLimit: 16777216, stderrByteLimit: 65536, seed: 0, network: "disabled", backend: "qualified-local-container-v1" };
    const registration = freeze({ id, version: "scene-local-1", task, execution: "local" as const, supportedClasses: [...ELEMENT_CLASSES], dependencies: task === "segmentation" ? ["detection" as const] : [], policy, licenseId: id, codeRevision: "dab2a2d8f3a09088f5cd277aa2632ef118841fda" });
    const component: VisionComponent = {
        id, version: registration.version, task, supportedClasses: registration.supportedClasses, execution: "local",
        async analyze(input, context) {
            const image = await context.readCanonical();
            const source = context.dependencies.flatMap(d => d.status === "completed" && d.output.task === "detection" ? d.output.elements : []);
            if (source.length > 32 && task === "segmentation") reject("COMPONENT_RESOURCE_LIMIT");
            const boxes = task === "detection" ? [] : source.map(e => {
                if (e.shape.kind !== "polygon" || e.shape.polygon.exterior.length !== 4) reject("COMPONENT_DEPENDENCY_INVALID");
                const xy = e.shape.polygon.exterior;
                return { id: e.id, box: [xy[0][0] * input.frame.width, xy[0][1] * input.frame.height, xy[2][0] * input.frame.width, xy[2][1] * input.frame.height] };
            });
            const transport = await executeReal(id, image, input.frame.width, input.frame.height, boxes, context.signal);
            const { result, binary } = transport;
            const artifacts: SceneArtifact[] = [];
            let elements: SceneElement[];
            const failed: SceneElement["class"][] = [];
            if (task === "detection") {
                if (binary.length || result.masks.length) reject("COMPONENT_OUTPUT_INVALID");
                const hypotheses = consolidate(result.detections, input.frame.width, input.frame.height);
                elements = detectionElements(hypotheses, context.run.id, input.frame.id, input.frame.width, input.frame.height);
                diagnostics.set(component, { ...transport, binary: undefined, hypotheses });
            } else {
                const converted = await convertMasks(result, binary, source, input, context);
                elements = converted.elements; artifacts.push(...converted.artifacts); failed.push(...converted.failed);
                diagnostics.set(component, { ...transport, binary: undefined });
            }
            return { status: "completed", run: context.run, output: { task, elements, coverage: coverage(elements, failed) }, frames: [input.frame], artifacts };
        }
    };
    known.set(component, registration);
    return { registration, component: freeze(component) };
}

/** Host-only conversion; writes pass through the same R1.2 validator used by ComponentRunner. */
export async function convertMasks(result: NativeResult, binary: Buffer, source: SceneElement[], input: AnalysisInput, context: Pick<ComponentContext, "putArtifact" | "run">) {
    if (result.detections.length || result.masks.length !== source.length) reject("COMPONENT_OUTPUT_INVALID");
    const elements: SceneElement[] = [], artifacts: SceneArtifact[] = [];
    const failed: SceneElement["class"][] = []; let offset = 0;
    for (let i = 0; i < source.length; i++) {
        const m = result.masks[i], detection = source[i];
        if (m.id !== detection.id || m.offset !== offset) reject("COMPONENT_OUTPUT_INVALID");
        if (m.status === "failed") {
            if (m.bytes !== 0 || m.score !== null || m.sha256 !== null || m.failure !== "MASK_REFINEMENT_FAILED") reject("COMPONENT_OUTPUT_INVALID");
            failed.push(detection.class); continue;
        }
        const bytes = binary.subarray(offset, offset + m.bytes); offset += m.bytes;
        if (!m.bytes || m.score === null || m.failure !== null || sha256(bytes) !== m.sha256) reject("COMPONENT_OUTPUT_INVALID");
        const mask = await context.putArtifact(bytes, { mediaType: "image/png", frameId: input.frame.id, width: input.frame.width, height: input.frame.height, channels: 1, dtype: "uint8", encoding: "png", semantics: "binary-membership" }) as MaskRef;
        artifacts.push(mask);
        elements.push({ ...detection, id: `mask-${context.run.id}-${i}`, shape: { kind: "mask", mask, outline: null }, geometryConfidence: confidence(m.score, "sam-predicted-iou", "uncalibrated-mask-score"), componentRunIds: [context.run.id], relatedElementIds: [detection.id] });
    }
    if (offset !== binary.length) reject("COMPONENT_OUTPUT_INVALID");
    return { elements, artifacts, failed };
}
