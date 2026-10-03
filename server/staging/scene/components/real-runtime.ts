import { readFile, lstat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { sha256 } from "../artifacts";
import { reject, SceneInputError } from "../errors";
import { REAL_DESCRIPTOR_SHA256 } from "./real-pins";

export const REAL_IDS = ["grounding-dino-tiny-hf-v1", "sam21-small-hf-v1"] as const;
export type RealId = typeof REAL_IDS[number];
export const PROMPT_HASH = "b6d5c6eac170017a9dc88396924d1bee670d99b1bed3541599469d52f525afcc";
export const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
const ROOT = path.join(REPO, "scripts/staging_runtime");
const DOCKER = "C:/Program Files/Docker/Docker/resources/bin/docker.exe";
const PYTHON = "C:/Python312/python.exe";
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => ["PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "USERPROFILE", "PROGRAMDATA", "PROGRAMFILES"].includes(k.toUpperCase())));
const exec = promisify(execFile);
const cli = (args: string[]) => exec(DOCKER, args, { env, windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 });
type FilePin = { filename: string; sha256: string; bytes: number; role: string };
export type RealRecord = { id: RealId; task: "detection" | "segmentation"; revision: string; decision: string; production: boolean; files: FilePin[]; evidence: { filename: string; sha256: string; role: string }[] };
export function realId(value: string): RealId {
    if (!(REAL_IDS as readonly string[]).includes(value)) reject("COMPONENT_NOT_REGISTERED");
    return value as RealId;
}
export async function checked(file: string, expected: string): Promise<Buffer> {
    let cursor = path.resolve(file);
    while (path.dirname(cursor) !== cursor) {
        if ((await lstat(cursor)).isSymbolicLink()) reject("COMPONENT_LICENSE_BLOCKED");
        cursor = path.dirname(cursor);
    }
    const bytes = await readFile(file);
    if (sha256(bytes) !== expected) reject("COMPONENT_LICENSE_BLOCKED");
    return bytes;
}
export async function qualifiedBinding(id: RealId) {
    realId(id);
    const binding = JSON.parse((await checked(path.join(ROOT, "bindings/scene-runtime.json"), REAL_DESCRIPTOR_SHA256)).toString()) as {
        runtimeImage: string; sourceSha256: Record<string, string>; baselineDescriptorsSha256: string; qualificationSha256: string; recordsSha256: string;
    };
    for (const [file, digest] of Object.entries(binding.sourceSha256)) await checked(path.join(ROOT, file), digest);
    await checked(path.join(ROOT, "bindings/descriptors.json"), binding.baselineDescriptorsSha256);
    const qualified = JSON.parse((await checked(path.join(REPO, "docs/staging/r1-runtime-evidence/qualification.json"), binding.qualificationSha256)).toString());
    if (!qualified.completed || qualified.modelCompatibility[id]?.status !== "COMPATIBILITY_QUALIFIED_FOR_EVALUATION") reject("COMPONENT_LICENSE_BLOCKED");
    const records = JSON.parse((await checked(path.join(REPO, "licenses/staging-components/real-local/records.json"), binding.recordsSha256)).toString()) as RealRecord[];
    const record = records.find(r => r.id === id);
    if (!record || record.production || record.decision !== "approved-for-evaluation") reject("COMPONENT_LICENSE_BLOCKED");
    for (const evidence of record.evidence) await checked(path.join(REPO, "licenses/staging-components/real-local", evidence.filename), evidence.sha256);
    return { binding, record };
}
async function verifyModels(record: RealRecord) {
    const folder = path.join(REPO, ".model-cache/r14b1/models", record.id, record.revision);
    for (const pin of record.files) {
        const file = path.join(folder, pin.filename);
        let cursor = file;
        while (path.dirname(cursor) !== cursor) {
            if ((await lstat(cursor)).isSymbolicLink()) reject("COMPONENT_LICENSE_BLOCKED");
            cursor = path.dirname(cursor);
        }
        if ((await lstat(file)).size !== pin.bytes) reject("COMPONENT_LICENSE_BLOCKED");
        const hash = createHash("sha256");
        for await (const chunk of createReadStream(file)) hash.update(chunk);
        if (hash.digest("hex") !== pin.sha256) reject("COMPONENT_LICENSE_BLOCKED");
    }
    return folder;
}
let admissionBlocked = false;
export function assertAdmissionHealthy() { if (admissionBlocked) throw new Error("ADMISSION_FAILED_STOP_EVALUATION"); }
export async function admission() {
    assertAdmissionHealthy();
    try {
    const { stdout } = await exec(PYTHON, ["-B", path.join(ROOT, "admission.py")], { env, windowsHide: true, timeout: 15000, maxBuffer: 4096 });
    const value = JSON.parse(stdout);
    if (value.status !== "MEMORY_ADMISSION_PASSED_NOT_EXECUTION_APPROVAL") throw new Error(value.status);
    return value as { availableHostBytes: number; availableGpuMiB: number; status: string };
    } catch (error) { admissionBlocked = true; throw error; }
}
const finite = z.number().finite();
export const nativeDetection = z.object({ group: z.enum(["openings", "architecture", "fixtures-electrical", "fixtures-plumbing-appliances", "furniture-seating-tables", "furniture-other", "surfaces"]), label: z.string().min(1).max(128), box: z.tuple([finite, finite, finite, finite]), score: finite.min(0).max(1) }).strict();
export type NativeDetection = z.infer<typeof nativeDetection>;
const mask = z.object({ id: z.string().regex(/^[A-Za-z0-9-]{1,128}$/), status: z.enum(["completed", "failed"]), score: finite.min(0).max(1).nullable(), offset: z.number().int().nonnegative(), bytes: z.number().int().nonnegative(), sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(), failure: z.literal("MASK_REFINEMENT_FAILED").nullable() }).strict();
export const responseSchema = z.object({
    version: z.literal("scene-local/1"), implementationId: z.enum(REAL_IDS), task: z.enum(["detection", "segmentation"]), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/), width: z.number().int().min(1).max(2048), height: z.number().int().min(1).max(2048), promptHash: z.literal(PROMPT_HASH), status: z.literal("completed"), failure: z.null(), detections: z.array(nativeDetection).max(896), masks: z.array(mask).max(32), networkAttempts: z.literal(0),
    keys: z.object({ missing: z.array(z.string()).max(0), unexpected: z.array(z.string()).max(0), excludedVideo: z.array(z.string().max(256)).max(160) }).strict(),
    resources: z.object({ loadSeconds: finite.nonnegative(), inferenceSeconds: finite.nonnegative(), hostRssBytes: finite.nonnegative(), gpuPeakAllocatedBytes: finite.nonnegative(), gpuPeakReservedBytes: finite.nonnegative(), gpuFreeBytes: finite.nonnegative(), gpuTotalBytes: finite.nonnegative() }).strict()
}).strict();
export type NativeResult = z.infer<typeof responseSchema>;
export function decodeResponse(bytes: Buffer): { result: NativeResult; binary: Buffer } {
    if (bytes.length < 12 || bytes.subarray(0, 4).toString() !== "R1B1") reject("COMPONENT_OUTPUT_INVALID");
    const j = bytes.readUInt32BE(4), b = bytes.readUInt32BE(8);
    if (j > 1024 * 1024 || b > 16 * 1024 * 1024 || bytes.length !== 12 + j + b) reject("COMPONENT_RESOURCE_LIMIT");
    const parsed = responseSchema.safeParse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(12, 12 + j))));
    if (!parsed.success) reject("COMPONENT_OUTPUT_INVALID");
    return { result: parsed.data, binary: bytes.subarray(12 + j) };
}
let busy = false;
/** Explicit evaluation factory is the only caller. No customer route imports this module. */
export async function executeReal(id: RealId, image: Buffer, width: number, height: number, boxes: { id: string; box: number[] }[], signal: AbortSignal) {
    if (busy) reject("COMPONENT_RESOURCE_LIMIT");
    busy = true;
    let name: string | undefined;
    try {
        if (signal.aborted) reject("COMPONENT_CANCELLED");
        const { binding, record } = await qualifiedBinding(id);
        const models = await verifyModels(record);
        const inspected = JSON.parse((await cli(["image", "inspect", binding.runtimeImage])).stdout)[0];
        if (inspected.Descriptor.digest !== binding.runtimeImage) reject("COMPONENT_LICENSE_BLOCKED");
        const admitted = await admission();
        if (signal.aborted) reject("COMPONENT_CANCELLED");
        if (boxes.length > 32 || image.length > 32 * 1024 * 1024) reject("COMPONENT_RESOURCE_LIMIT");
        const meta = Buffer.from(JSON.stringify({ version: "scene-local/1", implementationId: id, task: record.task, sourceSha256: sha256(image), width, height, promptHash: PROMPT_HASH, boxes }));
        if (meta.length > 1024 * 1024) reject("COMPONENT_RESOURCE_LIMIT");
        const header = Buffer.alloc(12); header.write("R1B1"); header.writeUInt32BE(meta.length, 4); header.writeUInt32BE(image.length, 8);
        name = `roomstager-r14b2-${randomUUID()}`;
        const args = ["run", "--pull=never", "--name", name, "--network", "none", "--read-only", "--user", "65534:65534", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--memory", "8g", "--memory-swap", "8g", "--cpus", "2", "--pids-limit", "64", "--tmpfs", "/tmp:rw,noexec,nosuid,size=67108864", "--gpus", "all"];
        for (const key of ["HF_HUB_OFFLINE=1", "TRANSFORMERS_OFFLINE=1", "HF_HUB_DISABLE_TELEMETRY=1", "HF_HUB_DISABLE_PROGRESS_BARS=1", "HOME=/tmp"]) args.push("--env", key);
        args.push("--mount", `type=bind,source=${models},target=/models,readonly`, "--mount", `type=bind,source=${path.join(ROOT, "bindings")},target=/bindings,readonly`);
        for (const file of ["scene_worker.py", "scene_protocol.py", "compat_worker.py", "compat_protocol.py", "protocol.py"]) args.push("--mount", `type=bind,source=${path.join(ROOT, file)},target=/opt/qualification/${file},readonly`);
        args.push("--entrypoint", "python", "-i", binding.runtimeImage, "-B", "/opt/qualification/scene_worker.py");
        const output = await new Promise<Buffer>((resolve, rejectPromise) => {
            const child = spawn(DOCKER, args, { env, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
            const chunks: Buffer[] = []; let count = 0, errors = 0, failure: SceneInputError | undefined;
            const stop = (code: "COMPONENT_TIMEOUT" | "COMPONENT_CANCELLED" | "COMPONENT_RESOURCE_LIMIT" | "COMPONENT_EXECUTION_FAILED") => {
                if (failure) return;
                failure = new SceneInputError(code);
                void cli(["rm", "-f", name!]).catch(() => {}).finally(() => child.kill());
            };
            const abort = () => stop("COMPONENT_CANCELLED");
            const timer = setTimeout(() => stop("COMPONENT_TIMEOUT"), 120000);
            signal.addEventListener("abort", abort, { once: true });
            if (signal.aborted) abort();
            child.stdout.on("data", (b: Buffer) => { count += b.length; if (count > 17 * 1024 * 1024 + 12) stop("COMPONENT_RESOURCE_LIMIT"); else chunks.push(b); });
            child.stderr.on("data", (b: Buffer) => { errors += b.length; if (errors > 65536) stop("COMPONENT_RESOURCE_LIMIT"); });
            child.stdin.on("error", () => stop("COMPONENT_EXECUTION_FAILED"));
            child.on("error", () => stop("COMPONENT_EXECUTION_FAILED"));
            child.on("close", code => { clearTimeout(timer); signal.removeEventListener("abort", abort); if (failure || code !== 0) rejectPromise(failure ?? new SceneInputError("COMPONENT_EXECUTION_FAILED")); else resolve(Buffer.concat(chunks)); });
            child.stdin.end(Buffer.concat([header, meta, image]));
        });
        await verifyModels(record);
        const value = decodeResponse(output), result = value.result;
        if (result.implementationId !== id || result.task !== record.task || result.sourceSha256 !== sha256(image) || result.width !== width || result.height !== height) reject("COMPONENT_OUTPUT_INVALID");
        const excluded = id === REAL_IDS[1] ? JSON.parse((await readFile(path.join(ROOT, "bindings/sam-video-exclusions.json"))).toString()) : [];
        if (JSON.stringify(excluded) !== JSON.stringify(result.keys.excludedVideo)) reject("COMPONENT_OUTPUT_INVALID");
        return { ...value, admission: admitted, runtimeImage: binding.runtimeImage };
    } finally {
        try {
            if (name) {
                await cli(["rm", "-f", name]).catch(() => {});
                const left = await cli(["ps", "-a", "--filter", `name=${name}`, "--format", "{{.Names}}"]);
                if (left.stdout.trim()) throw new Error("CONTAINER_CLEANUP_FAILED");
            }
        } finally { busy = false; }
    }
}
