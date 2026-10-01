import { test } from "node:test";
import assert from "node:assert/strict";
import { createDurableWorker, type DurableTask } from "../server/durableWorker";
const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
test("worker bounds concurrent executions, persists failures, and never reruns a claimed task", async () => {
  const ready: DurableTask[] = [1,2,3].map((n) => ({id:String(n),inputPath:String(n),lease:String(n)}));
  const finished: string[] = [], failed: string[] = [], started: string[] = [];
  const release: (()=>void)[] = [];
  const worker = createDurableWorker({
    async claim() { return ready.shift() || null; }, async heartbeat() {},
    async finish(t) { finished.push(t.id); }, async fail(t) { failed.push(t.id); },
  }, async (t) => { started.push(t.id); await new Promise<void>((resolve) => release.push(resolve)); if(t.id==="2") throw new Error("provider outcome unknown"); }, 2);
  await Promise.all([worker.tick(), worker.tick()]);
  assert.equal(worker.active(),2); assert.deepEqual(started,["1","2"]);
  release.splice(0).forEach((f)=>f()); await settle(); await worker.tick();
  assert.deepEqual(started,["1","2","3"]); assert.deepEqual(failed,["2"]);
  worker.stop(); release.splice(0).forEach((f)=>f()); await settle(); await worker.tick();
  assert.deepEqual(finished,["1","3"]); assert.equal(worker.active(),0);
});
