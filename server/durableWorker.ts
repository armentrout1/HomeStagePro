/** Inactive until wired to a queue store. A claimed job is never automatically rerun. */
export interface DurableTask { id: string; inputPath: string; lease: string }
export interface DurableStore {
  claim(): Promise<DurableTask | null>;
  heartbeat(task: DurableTask): Promise<void>;
  finish(task: DurableTask): Promise<void>;
  fail(task: DurableTask): Promise<void>;
}
export function createDurableWorker(store: DurableStore, execute: (task: DurableTask) => Promise<void>, concurrency = 2) {
  let active = 0;
  let claiming = false;
  let stopped = false;
  const tick = async () => {
    if (claiming || stopped) return;
    claiming = true;
    try {
      while (!stopped && active < concurrency) {
        const task = await store.claim();
        if (!task) break;
        active++;
        void (async () => {
          const timer = setInterval(() => { void store.heartbeat(task).catch(() => {}); }, 30000);
          timer.unref();
          try { await execute(task); await store.finish(task); }
          catch { await store.fail(task); }
          finally { clearInterval(timer); active--; }
        })().catch(() => console.error("Worker persistence failed; recovery required"));
      }
    } finally { claiming = false; }
  };
  return { tick, stop: () => { stopped = true; }, active: () => active };
}
