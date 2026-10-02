import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fixture, policy, license, evidence, registration, syntheticBytes } from "./scene-component-fixtures";
import { componentResultSchema, type ComponentResult } from "../server/staging/scene/components/types";
import { subprocessBackend } from "../server/staging/scene/components/backend";
import { syntheticComponent } from "../server/staging/scene/components/fake";
import { ComponentRunner } from "../server/staging/scene/components/runner";
import { SyntheticArtifactCache } from "../server/staging/scene/licenses";
import { LocalSceneArtifactStore, stableJson } from "../server/staging/scene/artifacts";
test("five synthetic tasks succeed through explicit dependencies and byte-verified artifacts", async (t) => {
    const f = await fixture(t), completed: ComponentResult[] = [];
    for (const task of ["detection", "segmentation", "depth", "edges", "floor-fit"] as const) {
        const request = await f.add(task);
        const result = await f.runner.run({ ...request, dependencies: task === "floor-fit" ? completed.slice(1) : [] });
        assert.equal(result.status, "completed", JSON.stringify(result));
        assert.ok(componentResultSchema.safeParse(result).success);
        assert.ok(result.run.elapsedMs > 0);
        assert.equal(result.run.peakMemoryBytes, null);
        const config = JSON.parse((await f.store.read(result.run.configManifest)).toString());
        const runtime = JSON.parse((await f.store.read(result.run.runtimeManifest)).toString());
        assert.equal(config.policy.seed, 17);
        assert.equal(config.implementation.scenario, "success");
        assert.equal(runtime.memory, "advisory-no-os-cap");
        assert.equal(runtime.resourcePolicyId, `synthetic-${task}`);
        assert.equal(result.run.configSha256, result.run.configManifest.sha256);
        if (result.status === "completed")
            for (const artifact of result.artifacts)
                assert.equal((await f.store.read(artifact)).length, artifact.bytes);
        completed.push(result);
    }
});
test("deterministic computational results, explicit partial coverage, high scores remain estimated", async (t) => {
    const f = await fixture(t), req = await f.add(), a = await f.runner.run(req), b = await f.runner.run(req);
    assert.equal(a.status, "completed");
    assert.equal(b.status, "completed");
    if (a.status !== "completed" || b.status !== "completed" || !("elements" in a.output))
        return;
    const normalize = (r: ComponentResult) => JSON.stringify(r.status === "completed" ? r.output : null).replaceAll(r.run.id, "RUN");
    assert.equal(normalize(a), normalize(b));
    assert.equal(a.run.configSha256, b.run.configSha256);
    assert.equal(a.output.elements[0].detectionConfidence.state, "estimated");
    assert.equal(a.output.elements[0].detectionConfidence.rawScore, 0.999);
    assert.equal(a.output.coverage.floor?.inspection, "partial");
    assert.equal(a.output.coverage.window?.inspection, "unsupported");
    assert.ok(Object.isFrozen(a));
    assert.ok(Object.isFrozen(a.output.elements[0]));
});
for (const scenario of ["malformed", "wrong-task", "wrong-source", "wrong-version", "wrong-frame", "verified", "calibrated", "absence", "unsupported", "trusted-context", "bad-reference", "duplicate-frame", "unknown-frame", "wrong-count", "unsupported-element"] as const)
    test(`reject untrusted ${scenario}`, async (t) => {
        const f = await fixture(t), result = await f.runner.run(await f.add("detection", scenario));
        assert.equal(result.status, "failed");
        assert.equal(result.code, "COMPONENT_OUTPUT_INVALID");
        assert.equal("output" in result, false);
    });
for (const scenario of ["bad-artifact", "bad-dimensions", "foreign-artifact"] as const)
    test(`reject actual artifact ${scenario}`, async (t) => {
        const f = await fixture(t), result = await f.runner.run(await f.add("segmentation", scenario));
        assert.equal(result.status, "failed");
        assert.equal(result.code, "COMPONENT_ARTIFACT_INVALID");
    });
test("terminal failure is bounded and never manufactures a successful observation", async (t) => {
    const f = await fixture(t), result = await f.runner.run(await f.add("detection", "failure"));
    assert.equal(result.status, "failed");
    assert.equal(result.run.failureCode, "COMPONENT_EXECUTION_FAILED");
    assert.equal("output" in result, false);
    assert.equal(JSON.stringify(result).includes(f.root), false);
});
for (const scenario of ["stdout-limit", "stderr-limit", "binary-limit"] as const)
    test(`enforce bounded ${scenario}`, async (t) => {
        const f = await fixture(t), result = await f.runner.run(await f.add("detection", scenario, { policy: { outputByteLimit: 4096, artifactByteLimit: 4096 } }));
        assert.equal(result.status, "failed");
        assert.equal(result.run.failureCode, "COMPONENT_RESOURCE_LIMIT");
    });
test("artifact quota and serialized input ceiling fail closed", async (t) => {
    const f = await fixture(t);
    const result = await f.runner.run(await f.add("segmentation", "success", { policy: { artifactByteLimit: 1 } }));
    assert.equal(result.run.failureCode, "COMPONENT_RESOURCE_LIMIT");
    const inputLimit = await f.runner.run(await f.add("detection", "success", { policy: { inputByteLimit: 1024 } }));
    assert.equal(inputLimit.run.failureCode, "COMPONENT_RESOURCE_LIMIT");
});
for (const scenario of ["network-http", "network-https", "network-fetch", "network-socket", "network-tls", "network-udp", "network-child"] as const)
    test(`worker blocks ${scenario} before any transport`, async (t) => {
        const f = await fixture(t), result = await f.runner.run(await f.add("detection", scenario));
        assert.equal(result.run.failureCode, "COMPONENT_NETWORK_FORBIDDEN");
    });
test("worker does not inherit credentials, proxies, NODE_OPTIONS or arbitrary environment", async () => {
    const names = ["OPENAI_API_KEY", "HTTPS_PROXY", "NODE_OPTIONS", "R13_TEST_SECRET"];
    const previous = names.map(name => process.env[name]);
    try {
        for (const name of names)
            process.env[name] = "synthetic-sentinel";
        const r = await subprocessBackend.execute({ scenario: "probe" }, policy(), new AbortController().signal);
        const probe = r.json as {
            pid: number;
            env: string[];
        };
        for (const name of names)
            assert.equal(probe.env.includes(name), false);
        assert.ok(probe.env.every(key => ["NODE_ENV", "TZ", "SystemRoot"].includes(key)), JSON.stringify(probe.env));
        assert.throws(() => process.kill(probe.pid, 0));
    }
    finally {
        names.forEach((name, i) => { if (previous[i] === undefined)
            delete process.env[name];
        else
            process.env[name] = previous[i]; });
    }
});
for (const mode of ["timeout", "cancel", "resist-term"] as const)
    test(`actual worker termination/no orphan/no retry: ${mode}`, async () => {
        const abort = new AbortController();
        let pid = 0, starts = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const before = Date.now();
        try {
            await assert.rejects(subprocessBackend.execute({ scenario: mode === "resist-term" ? "resist-term" : "hang" }, policy("detection", { deadlineMs: mode === "cancel" ? 5000 : 700 }), abort.signal, value => {
                pid = value;
                starts++;
                if (mode === "cancel")
                    timer = setTimeout(() => abort.abort(), 500);
            }), new RegExp(mode === "cancel" ? "COMPONENT_CANCELLED" : "COMPONENT_TIMEOUT"));
            assert.ok(pid > 0);
            assert.equal(starts, 1);
            assert.ok(Date.now() - before < 4000);
            assert.throws(() => process.kill(pid, 0));
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    });
test("runner records timeout and pre-cancelled disposition", async (t) => {
    const f = await fixture(t), req = await f.add("detection", "hang", { policy: { deadlineMs: 200 } });
    const timed = await f.runner.run(req);
    assert.equal(timed.status, "timed-out");
    assert.equal(timed.run.failureCode, "COMPONENT_TIMEOUT");
    const abort = new AbortController();
    abort.abort();
    const cancelled = await f.runner.run({ ...req, signal: abort.signal });
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.run.failureCode, "COMPONENT_CANCELLED");
});
test("dependencies require exact issued, frozen, completed receipts from same store/source", async (t) => {
    const f = await fixture(t), segmentation = await f.add("segmentation"), depth = await f.add("depth"), edges = await f.add("edges"), floor = await f.add("floor-fit");
    const deps = [await f.runner.run(segmentation), await f.runner.run(depth), await f.runner.run(edges)];
    await assert.rejects(f.runner.run(floor), /COMPONENT_DEPENDENCY_MISSING/);
    await assert.rejects(f.runner.run({ ...floor, dependencies: [deps[0], deps[0], deps[2]] }), /COMPONENT_DEPENDENCY_INVALID/);
    await assert.rejects(f.runner.run({ ...floor, dependencies: [structuredClone(deps[0]), ...deps.slice(1)] }), /COMPONENT_DEPENDENCY_INVALID/);
    const failed = await f.runner.run(await f.add("segmentation", "failure", { id: "failed-segmentation" }));
    await assert.rejects(f.runner.run({ ...floor, dependencies: [failed, ...deps.slice(1)] }), /COMPONENT_DEPENDENCY_INVALID/);
    const incompatible = await f.runner.run(await f.add("detection"));
    await assert.rejects(f.runner.run({ ...floor, dependencies: [incompatible, ...deps.slice(1)] }), /COMPONENT_DEPENDENCY_INVALID/);
    const otherPixels = await sharp({ create: {
            width: 5, height: 3, channels: 3, background: {
                r: 200, g: 100, b: 10
            }
        } }).png().toBuffer();
    const otherCanonical = await f.store.put(otherPixels, {
        mediaType: "image/png", frameId: "canonical", width: 5, height: 3, channels: 3, dtype: "uint8", encoding: "png"
    });
    await assert.rejects(f.runner.run({
        ...floor, input: { ...f.input, canonical: otherCanonical as typeof f.input.canonical }, dependencies: deps
    }), /COMPONENT_DEPENDENCY_INVALID/);
    const other = await LocalSceneArtifactStore.open(f.root, "different-run");
    const ref = await other.put(await f.store.read(f.input.canonical), {
        mediaType: "image/png", frameId: "canonical", width: 5, height: 3, channels: 3, dtype: "uint8", encoding: "png"
    });
    await assert.rejects(f.runner.run({
        ...floor, store: other, input: { ...f.input, canonical: ref as typeof f.input.canonical }, dependencies: deps
    }), /COMPONENT_DEPENDENCY_INVALID/);
    const dependency = deps[0];
    if (dependency.status === "completed") {
        const artifact = dependency.artifacts[0];
        await fs.writeFile(path.join(f.root, f.store.runId, "artifacts", artifact.key), Buffer.from("corrupted"));
        await assert.rejects(f.runner.run({ ...floor, dependencies: deps }), /COMPONENT_DEPENDENCY_INVALID/);
    }
});
test("input bytes, dimensions, canonical transform and foreign ownership validate before execution", async (t) => {
    const f = await fixture(t), req = await f.add();
    for (const input of [{ ...f.input, canonical: { ...f.input.canonical, sha256: "0".repeat(64) } }, { ...f.input, frame: { ...f.input.frame, width: 6 } }, { ...f.input, frame: { ...f.input.frame, toCanonical: [1, 0, 1, 0, 1, 0, 0, 0, 1] } }])
        await assert.rejects(f.runner.run({ ...req, input: input as typeof req.input }), /COMPONENT_ARTIFACT_INVALID/);
    const other = await LocalSceneArtifactStore.open(f.root, "other");
    await assert.rejects(f.runner.run({ ...req, store: other }), /COMPONENT_ARTIFACT_INVALID/);
});
test("synthetic weight cache is required and evaluation is not production approval", async (t) => {
    const f = await fixture(t), r = registration(), component = syntheticComponent({
        id: r.id, version: "1", task: "detection", supportedClasses: ["floor"], scenario: "success"
    });
    f.registry.register(r, component);
    const original = await license(r.id, true);
    f.licenses.register(original, evidence);
    const req = {
        id: r.id, version: "1", task: "detection" as const, input: f.input, store: f.store
    };
    await assert.rejects(f.runner.run(req), /COMPONENT_LICENSE_BLOCKED/);
    const cache = new SyntheticArtifactCache(f.store), runner = new ComponentRunner(f.registry, f.licenses, cache);
    await assert.rejects(runner.run(req), /COMPONENT_LICENSE_BLOCKED/);
    const approved = f.licenses.approved(original.id, r.id, "1", "evaluation");
    await cache.install(approved, syntheticBytes, approved.revision, f.licenses);
    assert.equal((await runner.run(req)).status, "completed");
    await assert.rejects(runner.run({ ...req, use: "production" }), /COMPONENT_LICENSE_BLOCKED/);
});
for (const change of [{ revision: "0".repeat(40) }, { codeSha256: "0".repeat(64) }, { sha256: "0".repeat(64) }])
    test(`actual worker pin must match ${Object.keys(change)[0]}`, async (t) => {
        const f = await fixture(t), r = registration();
        f.registry.register(r, syntheticComponent({
            id: r.id, version: "1", task: "detection", supportedClasses: ["floor"], scenario: "success"
        }));
        f.licenses.register({ ...await license(r.id), ...change }, evidence);
        await assert.rejects(f.runner.run({
            id: r.id, version: "1", task: "detection", input: f.input, store: f.store
        }), /COMPONENT_LICENSE_BLOCKED/);
    });
test("runner cancellation during active computation is recorded after worker exits", async (t) => {
    const f = await fixture(t), request = await f.add("detection", "hang"), controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 500);
    try {
        const result = await f.runner.run({ ...request, signal: controller.signal });
        assert.equal(result.status, "cancelled");
        assert.equal(result.run.failureCode, "COMPONENT_CANCELLED");
    }
    finally {
        clearTimeout(timer);
    }
});
