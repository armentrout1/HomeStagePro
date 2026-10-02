import { z } from "zod";
import { artifactRefSchema, rasterRefSchema, maskRefSchema, frameSchema, sceneElementSchema, classCoverageSchema, elementClassSchema, depthEstimateSchema, edgeEstimateSchema, floorEstimateSchema, componentRunSchema, type ComponentRun, type ElementClass } from "../../../../shared/staging/scene-map";
import type { ArtifactDescription, SceneArtifact } from "../artifacts";
import { COMPONENT_ERRORS } from "../errors";
export const taskSchema = z.enum(["detection", "segmentation", "depth", "edges", "floor-fit"]);
export type Task = z.infer<typeof taskSchema>;
export const analysisInputSchema = z.object({
    canonical: rasterRefSchema, frame: frameSchema, selectionRestriction: maskRefSchema.nullable()
}).strict();
export type AnalysisInput = z.infer<typeof analysisInputSchema>;
const observations = { elements: z.array(sceneElementSchema).max(512), coverage: z.record(elementClassSchema, classCoverageSchema) };
export const outputSchema = z.discriminatedUnion("task", [
    z.object({ task: z.literal("detection"), ...observations }).strict(),
    z.object({ task: z.literal("segmentation"), ...observations }).strict(),
    z.object({ task: z.literal("depth"), depth: depthEstimateSchema }).strict(),
    z.object({ task: z.literal("edges"), edges: edgeEstimateSchema }).strict(),
    z.object({ task: z.literal("floor-fit"), floor: floorEstimateSchema.nullable() }).strict(),
]);
export const componentResultSchema = z.discriminatedUnion("status", [
    z.object({
        status: z.literal("completed"), run: componentRunSchema, output: outputSchema, frames: z.array(frameSchema).min(1).max(64), artifacts: z.array(z.union([maskRefSchema, rasterRefSchema, artifactRefSchema])).max(256)
    }).strict(),
    ...(["failed", "timed-out", "cancelled"] as const).map(status => z.object({
        status: z.literal(status), run: componentRunSchema, code: z.enum(COMPONENT_ERRORS)
    }).strict()),
]).superRefine((v, c) => {
    if (v.run.status !== v.status || (v.status !== "completed" && v.run.failureCode !== v.code) || (v.status === "completed" && v.output.task !== v.run.task))
        c.addIssue({ code: "custom", message: "Inconsistent result" });
});
export type ComponentResult = z.infer<typeof componentResultSchema>;
export type ComponentOutput = z.infer<typeof outputSchema>;
export const policySchema = z.object({
    id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/), task: taskSchema,
    deadlineMs: z.number().int().min(50).max(60000), memoryLimitBytes: z.number().int().min(16 * 1024 * 1024).max(1024 * 1024 * 1024),
    memoryEnforcement: z.literal("advisory"), inputByteLimit: z.number().int().min(1024).max(1024 * 1024),
    outputByteLimit: z.number().int().min(128).max(8 * 1024 * 1024), artifactByteLimit: z.number().int().min(1).max(16 * 1024 * 1024),
    stderrByteLimit: z.number().int().min(128).max(65536), seed: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    network: z.literal("disabled"), backend: z.literal("synthetic-subprocess-v1"),
}).strict();
export type ExecutionPolicy = z.infer<typeof policySchema>;
export interface ComponentContext {
    run: ComponentRun;
    dependencies: readonly ComponentResult[];
    signal: AbortSignal;
    policy: ExecutionPolicy;
    // No publication, file paths, network client or authority surface.
    putArtifact(bytes: Uint8Array, description: ArtifactDescription): Promise<SceneArtifact>;
}
export interface VisionComponent {
    readonly id: string;
    readonly version: string;
    readonly task: Task;
    readonly supportedClasses: readonly ElementClass[];
    readonly execution: "local";
    analyze(input: AnalysisInput, context: ComponentContext): Promise<unknown>;
}
export function freeze<T>(value: T): T {
    if (value && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}
