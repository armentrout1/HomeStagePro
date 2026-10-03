import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { LocalSceneArtifactStore, sha256, stableJson } from "../server/staging/scene/artifacts";
import { preprocessImage } from "../server/staging/scene/preprocess";
import { ComponentLicenseRegistry, type LicenseRecord } from "../server/staging/scene/licenses";
import { ComponentRegistry } from "../server/staging/scene/components/registry";
import { ComponentRunner } from "../server/staging/scene/components/runner";
import { syntheticComponent } from "../server/staging/scene/components/fake";
import { syntheticWorkerSha256 } from "../server/staging/scene/components/backend";
import type { Task, SyntheticExecutionPolicy as ExecutionPolicy } from "../server/staging/scene/components/types";
// Synthetic exact-revision fixture, not an assertion that this is an upstream commit.
export const revision = "1".repeat(40);
export const evidenceBytes = readFileSync(new URL("../licenses/staging-components/synthetic-test-evidence.txt", import.meta.url));
export const evidence = new Map([["synthetic-evidence", evidenceBytes]]);
export const syntheticBytes = stableJson({ synthetic: true, values: [1, 2, 3] });
export async function license(id = "fake-detection", weights = false): Promise<LicenseRecord> {
    const terms = {
        identifier: "TEST-ONLY", category: "commercial-compatible" as const, commercialEvaluation: "yes" as const, commercialHosting: "yes" as const, redistribution: "no" as const, obligations: ["Synthetic tests only"], restrictions: ["Not a real model approval"], compatible: true, snapshot: {
            evidenceId: "synthetic-evidence", sha256: sha256(evidenceBytes), date: "2026-10-02"
        }
    };
    const codeSha256 = await syntheticWorkerSha256();
    return {
        id: `${id}-license`, artifactName: "synthetic-fixture", adapterId: id, adapterVersion: "1", upstreamRepository: "local-synthetic-test-fixture", revision, sourceUrl: "https://example.invalid/never-fetch", sha256: weights ? sha256(syntheticBytes) : codeSha256, codeSha256, synthetic: true, codeLicense: terms, weightsLicense: weights ? structuredClone(terms) : null, noWeights: !weights, lineage: [], reviewer: "synthetic-test-harness", reviewDate: "2026-10-02", decision: "approved-for-evaluation"
    };
}
export function policy(task: Task = "detection", changes: Partial<ExecutionPolicy> = {}): ExecutionPolicy {
    return {
        id: `synthetic-${task}`, task, deadlineMs: 5000, memoryLimitBytes: 128 * 1024 * 1024, memoryEnforcement: "advisory", inputByteLimit: 1024 * 1024, outputByteLimit: 128 * 1024, artifactByteLimit: 1024 * 1024, stderrByteLimit: 1024, seed: 17, network: "disabled", backend: "synthetic-subprocess-v1", ...changes
    };
}
export function registration(task: Task = "detection", options: {
    id?: string;
    dependencies?: Task[];
    policy?: Partial<ExecutionPolicy>;
} = {}) {
    const id = options.id ?? `fake-${task}`;
    return {
        id, version: "1", task, execution: "local" as const, supportedClasses: task === "detection" || task === "segmentation" ? ["floor" as const] : [], dependencies: options.dependencies ?? (task === "floor-fit" ? ["segmentation", "depth", "edges"] as Task[] : []), policy: policy(task, options.policy), licenseId: `${id}-license`, codeRevision: revision
    };
}
export async function fixture(t: TestContext) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "roomstager-r13-"));
    t.after(async () => {
        const resolved = path.resolve(root);
        assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
        assert.ok(path.basename(resolved).startsWith("roomstager-r13-"));
        await fs.rm(resolved, { recursive: true, force: true });
    });
    const store = await LocalSceneArtifactStore.open(root, "synthetic");
    const bytes = await sharp({ create: {
            width: 5, height: 3, channels: 3, background: {
                r: 11, g: 23, b: 79
            }
        } }).png().toBuffer();
    const prepared = await preprocessImage({ bytes, mediaType: "image/png" }, store);
    const input = {
        canonical: prepared.source.canonical, frame: prepared.frames[0], selectionRestriction: null
    };
    const registry = new ComponentRegistry(), licenses = new ComponentLicenseRegistry();
    const runner = new ComponentRunner(registry, licenses);
    async function add(task: Task = "detection", scenario: Parameters<typeof syntheticComponent>[0]["scenario"] = "success", options: Parameters<typeof registration>[1] = {}) {
        const r = registration(task, options);
        const component = syntheticComponent({
            id: r.id, version: "1", task, supportedClasses: r.supportedClasses, scenario
        });
        registry.register(r, component);
        licenses.register(await license(r.id), evidence);
        return {
            id: r.id, version: "1", task, input, store
        };
    }
    return {
        root, store, input, registry, licenses, runner, add
    };
}
