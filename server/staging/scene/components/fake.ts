import { z } from "zod";
import { idSchema, elementClassSchema } from "../../../../shared/staging/scene-map";
import { parseArtifact, stableJson, validateArtifactBytes, type SceneArtifact } from "../artifacts";
import { reject } from "../errors";
import { subprocessBackend } from "./backend";
import { taskSchema, freeze, type VisionComponent, type AnalysisInput, type ComponentContext } from "./types";
const specSchema = z.object({
    id: idSchema, version: z.literal("1"), task: taskSchema,
    supportedClasses: z.array(elementClassSchema).max(18),
    scenario: z.enum(["success", "hang", "resist-term", "stdout-limit", "stderr-limit", "binary-limit", "network-http", "network-https", "network-fetch", "network-socket", "network-tls", "network-udp", "network-child", "malformed", "wrong-task", "wrong-source", "wrong-version", "wrong-frame", "verified", "calibrated", "absence", "unsupported", "trusted-context", "bad-reference", "bad-artifact", "bad-dimensions", "foreign-artifact", "duplicate-frame", "unknown-frame", "wrong-count", "unsupported-element", "failure"]),
}).strict();
const known = new WeakSet<object>();
const configurations = new WeakMap<object, z.infer<typeof specSchema>>();
export function isRegisteredImplementation(component: VisionComponent): boolean { return known.has(component); }
export function syntheticConfiguration(component: VisionComponent): unknown { return configurations.get(component); }
/** R1.3 factory is deliberately synthetic-only. Future backends need explicit reviewed code changes. */
export function syntheticComponent(value: z.input<typeof specSchema>): VisionComponent {
    const parsed = specSchema.safeParse(value);
    if (!parsed.success)
        reject("COMPONENT_NOT_REGISTERED");
    const spec = freeze(parsed.data);
    const component: VisionComponent = {
        id: spec.id, version: spec.version, task: spec.task, supportedClasses: spec.supportedClasses, execution: "local",
        async analyze(input: AnalysisInput, context: ComponentContext) {
            const transport = await subprocessBackend.execute({
                input, run: context.run, dependencies: context.dependencies, scenario: spec.scenario
            }, context.policy, context.signal);
            const raw = transport.json as Record<string, unknown>;
            if (!raw || typeof raw !== "object")
                reject("COMPONENT_OUTPUT_INVALID");
            if (raw.status !== "completed") {
                if (transport.binary.length)
                    reject("COMPONENT_OUTPUT_INVALID");
                return raw;
            }
            if (!Array.isArray(raw.artifacts) || raw.artifacts.length > 256)
                reject("COMPONENT_OUTPUT_INVALID");
            const substitutions = new Map<string, SceneArtifact>();
            let offset = 0;
            for (const value of raw.artifacts) {
                let ref: SceneArtifact;
                try {
                    ref = parseArtifact(value);
                }
                catch {
                    reject("COMPONENT_ARTIFACT_INVALID");
                }
                if (substitutions.has(stableJson(ref).toString()))
                    reject("COMPONENT_ARTIFACT_INVALID");
                const bytes = transport.binary.subarray(offset, offset + ref.bytes);
                offset += ref.bytes;
                try {
                    await validateArtifactBytes(ref, bytes);
                }
                catch {
                    reject("COMPONENT_ARTIFACT_INVALID");
                }
                const { id, key, sha256, bytes: size, ...description } = ref;
                substitutions.set(stableJson(ref).toString(), await context.putArtifact(bytes, description));
            }
            if (offset !== transport.binary.length)
                reject("COMPONENT_ARTIFACT_INVALID");
            // Replace exact temporary reference objects only; mismatches remain unresolved and reject.
            const replace = (v: unknown): unknown => {
                if (Array.isArray(v))
                    return v.map(replace);
                if (v && typeof v === "object") {
                    const match = substitutions.get(stableJson(v).toString());
                    if (match)
                        return match;
                    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, replace(x)]));
                }
                return v;
            };
            return replace(raw);
        },
    };
    known.add(component);
    configurations.set(component, spec);
    return freeze(component);
}
