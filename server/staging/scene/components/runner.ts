import { isRealImplementation, realLicense, realConfiguration } from "./real";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import type { ComponentRun, Frame, ElementClass } from "../../../../shared/staging/scene-map";
import { stableJson, validateArtifactBytes, type SceneArtifactStore, type SceneArtifact } from "../artifacts";
import { canonicalFrame, transformRect } from "../coordinates";
import { COMPONENT_ERRORS, reject, SceneInputError, type ComponentErrorCode } from "../errors";
import { ComponentLicenseRegistry, SyntheticArtifactCache, type LicenseUse } from "../licenses";
import { ComponentRegistry, type Registration } from "./registry";
import { syntheticConfiguration } from "./fake";
import { syntheticWorkerSha256 } from "./backend";
import { analysisInputSchema, componentResultSchema, freeze, type AnalysisInput, type ComponentResult, type Task } from "./types";
const same = (a: unknown, b: unknown) => stableJson(a).equals(stableJson(b));
function bounded(error: unknown): ComponentErrorCode {
    return error instanceof SceneInputError && (COMPONENT_ERRORS as readonly string[]).includes(error.code) ? error.code as ComponentErrorCode : "COMPONENT_EXECUTION_FAILED";
}
/** Local receipts are deliberately not serializable authority. No full scene orchestrator/publication here. */
export class ComponentRunner {
    private receipts = new WeakMap<object, {
        store: SceneArtifactStore;
        input: string;
    }>();
    constructor(private readonly registry: ComponentRegistry, private readonly licenses: ComponentLicenseRegistry, private readonly cache?: SyntheticArtifactCache) { }
    async run(request: {
        id: string;
        version: string;
        task: Task;
        input: AnalysisInput;
        store: SceneArtifactStore;
        dependencies?: readonly ComponentResult[];
        signal?: AbortSignal;
        use?: LicenseUse;
    }): Promise<ComponentResult> {
        const entry = this.registry.get(request.id, request.version, request.task);
        const real = isRealImplementation(entry.component);
        const license = real ? await realLicense(entry.component, request.use ?? "evaluation") : this.licenses.approved(entry.licenseId, entry.id, entry.version, request.use ?? "evaluation");
        let actualCodeHash: string;
        try {
            actualCodeHash = real ? license.codeSha256 : await syntheticWorkerSha256();
        }
        catch {
            reject("COMPONENT_LICENSE_BLOCKED");
        }
        if (license.revision !== entry.codeRevision || license.codeSha256 !== actualCodeHash || (license.noWeights && license.sha256 !== license.codeSha256))
            reject("COMPONENT_LICENSE_BLOCKED");
        if (!real && !license.noWeights) {
            if (!this.cache)
                reject("COMPONENT_LICENSE_BLOCKED");
            await this.cache.verify(license as import("../licenses").LicenseRecord);
        }
        const parsed = analysisInputSchema.safeParse(request.input);
        if (!parsed.success)
            reject("COMPONENT_ARTIFACT_INVALID");
        const input = freeze(parsed.data), store = request.store;
        const inputKey = stableJson(input).toString();
        if (!same(input.frame, canonicalFrame(input.canonical.width, input.canonical.height)) || input.canonical.frameId !== input.frame.id)
            reject("COMPONENT_ARTIFACT_INVALID");
        try {
            await validateArtifactBytes(input.canonical, await store.read(input.canonical), { canonicalRgb: true });
            if (input.selectionRestriction) {
                const m = input.selectionRestriction;
                if (m.frameId !== input.frame.id || m.width !== input.frame.width || m.height !== input.frame.height)
                    reject("COMPONENT_ARTIFACT_INVALID");
                await validateArtifactBytes(m, await store.read(m));
            }
        }
        catch {
            reject("COMPONENT_ARTIFACT_INVALID");
        }
        const dependencies = [...request.dependencies ?? []];
        if (dependencies.length < entry.dependencies.length)
            reject("COMPONENT_DEPENDENCY_MISSING");
        if (dependencies.length !== entry.dependencies.length)
            reject("COMPONENT_DEPENDENCY_INVALID");
        const roles = new Set<Task>();
        for (const dependency of dependencies) {
            const receipt = this.receipts.get(dependency);
            if (!receipt || receipt.store !== store || receipt.input !== inputKey || dependency.status !== "completed" || roles.has(dependency.run.task) || !entry.dependencies.includes(dependency.run.task))
                reject("COMPONENT_DEPENDENCY_INVALID");
            roles.add(dependency.run.task);
            // Re-read dependency artifacts: immutable receipts don't excuse modified local files.
            try {
                for (const artifact of dependency.artifacts)
                    await store.read(artifact);
            }
            catch {
                reject("COMPONENT_DEPENDENCY_INVALID");
            }
        }
        if (entry.dependencies.some(task => !roles.has(task)))
            reject("COMPONENT_DEPENDENCY_MISSING");
        const config = {
            schemaVersion: "component-config/1", adapterId: entry.id, adapterVersion: entry.version, task: entry.task, supportedClasses: entry.supportedClasses, dependencies: entry.dependencies, policy: entry.policy, implementation: real ? realConfiguration(entry.component) : syntheticConfiguration(entry.component), codeSha256: license.codeSha256
        };
        const persistManifest = async (value: unknown) => {
            try {
                const ref = await store.put(stableJson(value), { mediaType: "application/json" });
                await store.read(ref);
                return ref;
            }
            catch {
                reject("COMPONENT_ARTIFACT_INVALID");
            }
        };
        const configManifest = await persistManifest(config);
        const runtimeManifest = await persistManifest({
            schemaVersion: "component-runtime/1", node: process.version, platform: process.platform, arch: process.arch, backend: entry.policy.backend, resourcePolicyId: entry.policy.id, memory: real ? "host-cgroup-8GiB-gpu-advisory" : "advisory-no-os-cap", network: real ? "docker-network-none" : "application-blocked-no-os-firewall", worker: real ? "scene-local-1" : "synthetic-worker-v1", licenseId: license.id
        });
        const started = performance.now(), signal = request.signal ?? new AbortController().signal;
        const run: ComponentRun = {
            id: `component-${randomUUID()}`, adapterId: entry.id, adapterVersion: entry.version, task: entry.task, codeRevision: entry.codeRevision,
            weights: license.noWeights ? [] : [{
                    name: license.artifactName, revision: "modelRevision" in license ? license.modelRevision : license.revision, sha256: license.sha256, licenseEvidenceId: license.weightsLicense!.snapshot.evidenceId
                }],
            runtimeManifest, configManifest, configSha256: configManifest.sha256, inputSha256: input.canonical.sha256, inputFrameId: input.frame.id,
            seed: entry.policy.seed, deterministic: !real, nondeterminism: real ? ["cuda-numerical-determinism-not-qualified"] : [], startedAt: new Date().toISOString(), elapsedMs: 0, peakMemoryBytes: null, status: "completed", failureCode: null,
        };
        const written = new Map<string, SceneArtifact>();
        let bytesWritten = 0;
        const check = () => {
            if (signal.aborted)
                reject("COMPONENT_CANCELLED");
            if (performance.now() - started >= entry.policy.deadlineMs)
                reject("COMPONENT_TIMEOUT");
        };
        try {
            check();
            const raw = await entry.component.analyze(input, {
                run: freeze(structuredClone(run)), dependencies: freeze(dependencies), signal, policy: entry.policy,
                readCanonical: async () => { check(); return store.read(input.canonical); },
                putArtifact: async (bytes, description) => {
                    check();
                    bytesWritten += bytes.byteLength;
                    if (bytesWritten > entry.policy.artifactByteLimit || written.size >= 256)
                        reject("COMPONENT_RESOURCE_LIMIT");
                    try {
                        const ref = await store.put(bytes, description);
                        await store.read(ref);
                        written.set(ref.id, ref);
                        check();
                        return ref;
                    }
                    catch (error) {
                        if (error instanceof SceneInputError && error.code.startsWith("COMPONENT_"))
                            throw error;
                        reject("COMPONENT_ARTIFACT_INVALID");
                    }
                },
            });
            check();
            const result = componentResultSchema.safeParse(raw);
            if (!result.success)
                reject("COMPONENT_OUTPUT_INVALID");
            const value = result.data;
            if (!same(value.run, {
                ...run, status: value.status, failureCode: value.status === "completed" ? null : value.code
            }))
                reject("COMPONENT_OUTPUT_INVALID");
            if (value.status === "completed")
                await validateOutput(value, input, entry, written, dependencies, store);
            check();
            const accepted = freeze({ ...value, run: { ...value.run, elapsedMs: performance.now() - started } });
            this.receipts.set(accepted, { store, input: inputKey });
            return accepted;
        }
        catch (error) {
            const code = bounded(error);
            const status = code === "COMPONENT_TIMEOUT" ? "timed-out" : code === "COMPONENT_CANCELLED" ? "cancelled" : "failed";
            return freeze(componentResultSchema.parse({
                status, code, run: {
                    ...run, status, failureCode: code, elapsedMs: performance.now() - started
                }
            }));
        }
    }
}
async function validateOutput(result: Extract<ComponentResult, {
    status: "completed";
}>, input: AnalysisInput, entry: Registration, written: Map<string, SceneArtifact>, dependencies: readonly ComponentResult[], store: SceneArtifactStore): Promise<void> {
    const invalid = () => reject("COMPONENT_OUTPUT_INVALID");
    const frames = new Map<string, Frame>();
    for (const frame of result.frames) {
        if (frames.has(frame.id))
            invalid();
        frames.set(frame.id, frame);
        const [x, y, w, h] = transformRect(frame.toCanonical, frame.validPixels);
        if (x < -1e-8 || y < -1e-8 || x + w > input.frame.width + 1e-8 || y + h > input.frame.height + 1e-8)
            invalid();
    }
    if (!same(frames.get(input.frame.id) ?? null, input.frame))
        invalid();
    const artifacts = new Map<string, SceneArtifact>();
    for (const artifact of result.artifacts) {
        if (artifacts.has(artifact.id) || !same(written.get(artifact.id) ?? null, artifact))
            reject("COMPONENT_ARTIFACT_INVALID");
        artifacts.set(artifact.id, artifact);
        if ("frameId" in artifact) {
            const frame = frames.get(artifact.frameId);
            if (!frame || frame.width !== artifact.width || frame.height !== artifact.height)
                reject("COMPONENT_ARTIFACT_INVALID");
        }
        try {
            await validateArtifactBytes(artifact, await store.read(artifact), { nonnegativeFloat: true });
        }
        catch {
            reject("COMPONENT_ARTIFACT_INVALID");
        }
    }
    if (artifacts.size !== written.size)
        reject("COMPONENT_ARTIFACT_INVALID");
    const elements = new Map<string, string>();
    for (const d of dependencies)
        if (d.status === "completed" && "elements" in d.output)
            for (const e of d.output.elements) {
                if (elements.has(e.id)) invalid();
                elements.set(e.id, e.class);
            }
    const out = result.output;
    if ("elements" in out) {
        for (const e of out.elements) {
            if (elements.has(e.id) || !entry.supportedClasses.includes(e.class) || !same(e.componentRunIds, [result.run.id]))
                invalid();
            elements.set(e.id, e.class);
        }
        for (const [key, coverage] of Object.entries(out.coverage)) {
            if (!coverage)
                reject("COMPONENT_OUTPUT_INVALID");
            const count = out.elements.filter(e => e.class === key).length;
            const supported = entry.supportedClasses.includes(key as ElementClass);
            const unavailable = coverage.inspection === "unsupported" || coverage.inspection === "failed";
            if (coverage.observedCount !== count || (!supported && !unavailable) || (unavailable && count !== 0))
                invalid();
        }
        for (const e of out.elements)
            if (!out.coverage[e.class])
                invalid();
    }
    const referenced = new Set<string>();
    function inspect(v: unknown): void {
        if (Array.isArray(v)) {
            v.forEach(inspect);
            return;
        }
        if (!v || typeof v !== "object")
            return;
        const o = v as Record<string, unknown>;
        // No component-issued trust, metric calibration or evidence claims, regardless of score.
        if (o.state === "verified" || o.absence === "independently-reviewed" || o.unit === "metre" ||
            ("evidenceIds" in o && (!Array.isArray(o.evidenceIds) || o.evidenceIds.length !== 0)) ||
            (o.calibratedProbability !== undefined && o.calibratedProbability !== null) ||
            (o.calibrationEvidenceId !== undefined && o.calibrationEvidenceId !== null) || "evidenceId" in o)
            invalid();
        if (typeof o.frameId === "string" && !frames.has(o.frameId))
            invalid();
        if (typeof o.componentRunId === "string" && o.componentRunId !== result.run.id)
            invalid();
        for (const key of ["relatedElementIds", "elementIds", "supportElementIds"])
            if (Array.isArray(o[key])) {
                for (const id of o[key] as string[])
                    if (!elements.has(id) || key === "supportElementIds" && elements.get(id) !== "floor")
                        invalid();
            }
        if ("sha256" in o && "key" in o) {
            if (!same(artifacts.get(o.id as string) ?? null, o))
                reject("COMPONENT_ARTIFACT_INVALID");
            referenced.add(o.id as string);
        }
        Object.values(o).forEach(inspect);
    }
    inspect(out);
    if (referenced.size !== artifacts.size)
        reject("COMPONENT_ARTIFACT_INVALID");
}
