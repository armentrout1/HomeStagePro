import test from "node:test";
import assert from "node:assert/strict";
import { ComponentRegistry } from "../server/staging/scene/components/registry";
import { syntheticComponent } from "../server/staging/scene/components/fake";
import { ComponentLicenseRegistry, SyntheticArtifactCache } from "../server/staging/scene/licenses";
import { registration, license, evidence, fixture, syntheticBytes } from "./scene-component-fixtures";
const component = (r = registration()) => syntheticComponent({
    id: r.id, version: "1", task: r.task, supportedClasses: r.supportedClasses, scenario: "success"
});
test("registry requires explicit known identity, task, local backend, classes and implementation", () => {
    const registry = new ComponentRegistry(), r = registration(), c = component(r);
    registry.register(r, c);
    assert.equal(registry.get(r.id, r.version, r.task).component, c);
    assert.throws(() => registry.register(r, c), /COMPONENT_NOT_REGISTERED/);
    assert.throws(() => registry.get("missing", "1", "depth"), /COMPONENT_NOT_REGISTERED/);
    assert.throws(() => registry.get(r.id, "1", "depth"), /COMPONENT_TASK_MISMATCH/);
    assert.throws(() => new ComponentRegistry().register({ ...r, execution: "remote" } as never, c), /COMPONENT_NOT_REGISTERED/);
    assert.throws(() => new ComponentRegistry().register(r, { ...c }), /COMPONENT_NOT_REGISTERED/);
    assert.throws(() => new ComponentRegistry().register({ ...r, task: "edges" }, c), /COMPONENT_TASK_MISMATCH/);
    assert.throws(() => new ComponentRegistry().register({ ...r, id: "different" }, c), /COMPONENT_NOT_REGISTERED/);
    assert.throws(() => new ComponentRegistry().register({ ...r, supportedClasses: ["wall"] }, c), /COMPONENT_NOT_REGISTERED/);
    assert.throws(() => new ComponentRegistry().register({ ...r, path: "arbitrary.mjs" } as never, c), /COMPONENT_NOT_REGISTERED/);
    assert.throws(() => new ComponentRegistry().register({ ...r, policy: { ...r.policy, network: "enabled" } } as never, c), /COMPONENT_NOT_REGISTERED/);
});
test("registry freezes configuration and rejects cyclic/duplicate dependency roles", () => {
    const registry = new ComponentRegistry(), a = registration("detection", { dependencies: ["segmentation"] }), b = registration("segmentation", { dependencies: ["detection"] });
    registry.register(a, component(a));
    a.dependencies.length = 0;
    assert.deepEqual(registry.get(a.id, "1", "detection").dependencies, ["segmentation"]);
    assert.throws(() => registry.register(b, component(b)), /COMPONENT_DEPENDENCY_INVALID/);
    const duplicate = registration("edges", { dependencies: ["depth", "depth"] });
    assert.throws(() => registry.register(duplicate, component(duplicate)), /COMPONENT_DEPENDENCY_INVALID/);
    const self = registration("depth", { dependencies: ["depth"] });
    assert.throws(() => registry.register(self, component(self)), /COMPONENT_DEPENDENCY_INVALID/);
});
for (const decision of ["pending", "rejected"] as const)
    test(`license ${decision} blocks execution`, async () => {
        const r = await license(), registry = new ComponentLicenseRegistry();
        registry.register({ ...r, decision }, evidence);
        assert.throws(() => registry.approved(r.id, r.adapterId, "1", "evaluation"), /COMPONENT_LICENSE_BLOCKED/);
    });
test("evaluation approval is separate from production and redistribution", async () => {
    const r = await license(), registry = new ComponentLicenseRegistry();
    registry.register(r, evidence);
    assert.equal(registry.approved(r.id, r.adapterId, "1", "evaluation").decision, "approved-for-evaluation");
    assert.throws(() => registry.approved(r.id, r.adapterId, "1", "production"), /COMPONENT_LICENSE_BLOCKED/);
    assert.throws(() => registry.approved(r.id, r.adapterId, "1", "evaluation", true), /COMPONENT_LICENSE_BLOCKED/);
    const production = new ComponentLicenseRegistry();
    production.register({ ...r, decision: "approved-for-production" }, evidence);
    assert.equal(production.approved(r.id, r.adapterId, "1", "production").decision, "approved-for-production");
});
for (const field of ["codeLicense", "weightsLicense"] as const) {
    for (const change of [{ category: "noncommercial" }, { category: "unknown" }, { compatible: false }, { commercialEvaluation: "no" }, { commercialEvaluation: "unclear" }]) {
        test(`independent ${field} blocks ${JSON.stringify(change)}`, async () => {
            const r = await license("fake-detection", true), registry = new ComponentLicenseRegistry();
            registry.register({ ...r, [field]: { ...r[field], ...change } }, evidence);
            assert.throws(() => registry.approved(r.id, r.adapterId, "1", "evaluation"), /COMPONENT_LICENSE_BLOCKED/);
        });
    }
}
test("license record rejects missing weights terms, evidence, mutable revisions and non-synthetic records", async () => {
    const r = await license("fake-detection", true);
    for (const value of [{ ...r, weightsLicense: null }, { ...r, codeLicense: null }, { ...r, revision: "latest" }, { ...r, synthetic: false }])
        assert.throws(() => new ComponentLicenseRegistry().register(value, evidence), /COMPONENT_LICENSE_BLOCKED/);
    assert.throws(() => new ComponentLicenseRegistry().register(r, new Map()), /COMPONENT_LICENSE_BLOCKED/);
    assert.throws(() => new ComponentLicenseRegistry().register(r, new Map([["synthetic-evidence", Buffer.from("changed")]])), /COMPONENT_LICENSE_BLOCKED/);
});
test("synthetic cache requires exact reviewed bytes/revision, no automatic acquisition", async (t) => {
    const f = await fixture(t), original = await license("fake-detection", true);
    f.licenses.register(original, evidence);
    const r = f.licenses.approved(original.id, original.adapterId, "1", "evaluation"), cache = new SyntheticArtifactCache(f.store);
    await assert.rejects(cache.verify(r), /COMPONENT_LICENSE_BLOCKED/);
    await assert.rejects(cache.install(r, syntheticBytes, "0".repeat(40), f.licenses), /COMPONENT_LICENSE_BLOCKED/);
    await assert.rejects(cache.install(r, Buffer.from("{}"), r.revision, f.licenses), /COMPONENT_LICENSE_BLOCKED/);
    await assert.rejects(cache.install({ ...r }, syntheticBytes, r.revision, f.licenses), /COMPONENT_LICENSE_BLOCKED/);
    await cache.install(r, syntheticBytes, r.revision, f.licenses);
    assert.equal((await cache.verify(r)).sha256, r.sha256);
});
