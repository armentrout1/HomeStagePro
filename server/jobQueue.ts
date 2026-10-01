import { createHash, randomUUID } from "node:crypto";
import { client } from "./db";
import { createDurableWorker, type DurableTask, type DurableStore } from "./durableWorker";
import { jobFiles, type JobFiles } from "./jobFiles";
import { generateStagedRoom } from "./openai";
import { refundFailed, runJob } from "./stagingJobs";
import type { Request } from "express";

type Claimed = DurableTask & { tokenId: string; roomType: string; mode: string; hasMask: boolean; inputHash: string };
const concurrencyLimit = () => Math.max(1, Math.min(4, Number(process.env.STAGING_CONCURRENCY) || 2));

export function createJobWorker(generate = generateStagedRoom, files: JobFiles = jobFiles) {
  const store: DurableStore = {
    async claim() {
      return client.begin(async (tx) => {
        // Serialize claims across replicas, not just within this Node process.
        await tx`SELECT pg_advisory_xact_lock(743001)`;
        const [count] = await tx`SELECT count(*)::int AS n FROM staging_work WHERE phase='running'`;
        if (count.n >= concurrencyLimit()) return null;
        const [row] = await tx`SELECT w.*,j.token_id,j.input_hash FROM staging_work w JOIN staging_jobs j ON j.id=w.job_id
          WHERE w.phase='queued' AND w.attempts<3 AND j.state='processing' ORDER BY w.created_at LIMIT 1 FOR UPDATE OF w SKIP LOCKED`;
        if (!row) return null;
        const lease = randomUUID();
        await tx`UPDATE staging_work SET phase='running',lease=${lease},lease_until=now()+interval '2 minutes',attempts=attempts+1 WHERE job_id=${row.job_id}`;
        return { id: row.job_id, inputPath: row.input_path, lease, tokenId: row.token_id, roomType: row.room_type, mode: row.edit_mode, hasMask: row.has_mask, inputHash: row.input_hash } as Claimed;
      });
    },
    async heartbeat(task) {
      await client`UPDATE staging_work SET lease_until=now()+interval '2 minutes' WHERE job_id=${task.id} AND lease=${task.lease} AND phase='running'`;
    },
    async finish(task) {
      await client`UPDATE staging_work SET phase=CASE WHEN (SELECT state FROM staging_jobs WHERE id=${task.id})='completed' THEN 'done' ELSE 'failed' END,
        lease=NULL,lease_until=NULL WHERE job_id=${task.id} AND lease=${task.lease} AND phase='running'`;
    },
    async fail(task) {
      await refundFailed(task.id, "This staging was interrupted. Your credit was restored; please try again.", task.lease);
      await this.finish(task);
    },
  };
  return createDurableWorker(store, async (task) => {
    const job = task as Claimed;
    const source = await files.get(job.inputPath, job.hasMask);
    const payload = { requestId: job.id, image: source.image, mask: source.mask, roomType: job.roomType, mode: job.mode };
    const hash = createHash("sha256").update(JSON.stringify({ ...payload, requestId: undefined })).digest("hex");
    if (hash !== job.inputHash) throw new Error("Persisted input does not match the accepted request");
    // Persist the paid-call boundary BEFORE calling any provider. An expired lease
    // after this point is ambiguous and gets a refund, never an automatic replay.
    const [marked] = await client`UPDATE staging_work SET provider_started_at=now() WHERE job_id=${job.id} AND lease=${job.lease} AND phase='running'
      AND lease_until>now() AND EXISTS (SELECT 1 FROM access_grants WHERE token_id=${job.tokenId} AND revoked_at IS NULL AND NOT billing_blocked AND expires_at>now()) RETURNING job_id`;
    if (!marked) throw new Error("Job lease or pack is no longer active");
    await runJob({ body: payload, stagingEntitlement: { quality: "high" } } as Request, job.id, generate, job.lease);
  }, concurrencyLimit());
}

export async function recoverDurableJobs() {
  await client.begin(async (tx) => {
    const expired = await tx`SELECT * FROM staging_work WHERE
      (phase='running' AND lease_until<now()) OR (phase='queued' AND created_at<now()-interval '30 minutes')
      ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED`;
    for (const job of expired) {
      if (!job.provider_started_at && job.phase === "running" && job.attempts < 3 && new Date(job.created_at).getTime() > Date.now() - 30 * 60000) {
        await tx`UPDATE staging_work SET phase='queued',lease=NULL,lease_until=NULL WHERE job_id=${job.job_id}`;
      } else {
        const [failed] = await tx`UPDATE staging_jobs SET state='failed',completed_at=now(),error='This staging was interrupted. Your credit was restored; please try again.' WHERE id=${job.job_id} AND state='processing' RETURNING token_id`;
        if (failed) await tx`UPDATE usage_entitlements SET paid_used=GREATEST(0,paid_used-1),updated_at=now() WHERE token_id=${failed.token_id}`;
        await tx`UPDATE staging_work SET phase='failed',lease=NULL,lease_until=NULL WHERE job_id=${job.job_id}`;
      }
    }
  });
}

export async function cleanTemporaryInputs(files: JobFiles = jobFiles) {
  const rows = await client`SELECT job_id,input_path FROM staging_work WHERE phase IN ('done','failed') AND input_deleted_at IS NULL LIMIT 20`;
  for (const row of rows) {
    await files.remove(row.input_path);
    await client`UPDATE staging_work SET input_deleted_at=now() WHERE job_id=${row.job_id} AND input_deleted_at IS NULL`;
  }
}

/** Opt-in runtime integration. Does not change HTTP parsing, DB pooling, or shutdown behavior. */
export function startJobQueue() {
  if (process.env.STAGING_DURABLE_QUEUE !== "true") return;
  const worker = createJobWorker();
  let maintaining = false;
  const maintain = async () => {
    if (maintaining) return;
    maintaining = true;
    try { await recoverDurableJobs(); await cleanTemporaryInputs(); }
    catch { console.error("Queue maintenance deferred; will retry"); }
    finally { maintaining = false; }
  };
  void maintain();
  setInterval(() => void maintain(), 30_000).unref();
  setInterval(() => { void worker.tick().catch(() => console.error("Queue claim deferred; will retry")); }, 1000).unref();
}
