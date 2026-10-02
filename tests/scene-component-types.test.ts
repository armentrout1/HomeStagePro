import test from "node:test";
import assert from "node:assert/strict";
import { fixture, policy } from "./scene-component-fixtures";
import { componentResultSchema, policySchema } from "../server/staging/scene/components/types";
test("strict envelope prevents status/run contradictions and model-issued authority", async (t) => {
    const f = await fixture(t), result = await f.runner.run(await f.add());
    assert.equal(result.status, "completed");
    for (const changed of [
        { ...result, trustedContext: {} }, { ...result, architectureAuthorization: true }, { ...result, billing: { charge: 1 } },
        { ...result, run: {
                ...result.run, status: "failed", failureCode: "COMPONENT_EXECUTION_FAILED"
            } },
        {
            status: "cancelled", run: {
                ...result.run, status: "timed-out", failureCode: "COMPONENT_TIMEOUT"
            }, code: "COMPONENT_CANCELLED"
        },
        {
            status: "failed", run: {
                ...result.run, status: "failed", failureCode: "arbitrary"
            }, code: "arbitrary"
        },
    ])
        assert.equal(componentResultSchema.safeParse(changed).success, false);
});
test("resource policy declares advisory memory and bounded enforceable controls", () => {
    assert.equal(policySchema.safeParse(policy()).success, true);
    for (const delta of [{ deadlineMs: 0 }, { deadlineMs: 60001 }, { memoryEnforcement: "hard" }, { outputByteLimit: Infinity }, { network: "enabled" }, { backend: "arbitrary-path" }, { seed: -1 }])
        assert.equal(policySchema.safeParse({ ...policy(), ...delta }).success, false);
});
