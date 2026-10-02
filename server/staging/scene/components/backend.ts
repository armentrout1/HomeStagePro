import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { stableJson, sha256 } from "../artifacts";
import { reject, SceneInputError, type ComponentErrorCode } from "../errors";
import type { ExecutionPolicy } from "./types";
export interface ExecutionBackend {
    readonly id: string;
    execute(input: unknown, policy: ExecutionPolicy, signal: AbortSignal, onStarted?: (pid: number) => void): Promise<{
        json: unknown;
        binary: Buffer;
    }>;
}
// Fixed source entrypoint. Neither registry entries nor the worker payload can select executable/module paths.
const worker = fileURLToPath(new URL("./synthetic-worker.mjs", import.meta.url));
export async function syntheticWorkerSha256(): Promise<string> { return sha256(await readFile(worker)); }
export const subprocessBackend: ExecutionBackend = Object.freeze({
    id: "synthetic-subprocess-v1",
    async execute(input: unknown, policy: ExecutionPolicy, signal: AbortSignal, onStarted?: (pid: number) => void) {
        const serialized = stableJson(input);
        if (serialized.length > policy.inputByteLimit)
            reject("COMPONENT_RESOURCE_LIMIT");
        if (signal.aborted)
            reject("COMPONENT_CANCELLED");
        return new Promise<{
            json: unknown;
            binary: Buffer;
        }>((resolve, rejectPromise) => {
            const env: NodeJS.ProcessEnv = { NODE_ENV: "test", TZ: "UTC" };
            // Windows process startup needs SystemRoot; no PATH/NODE_OPTIONS/proxy/API credentials.
            if (process.platform === "win32" && process.env.SystemRoot)
                env.SystemRoot = process.env.SystemRoot;
            const child = spawn(process.execPath, [worker], {
                shell: false, windowsHide: true, env, stdio: ["pipe", "pipe", "pipe", "pipe"]
            });
            const stdout: Buffer[] = [], binary: Buffer[] = [];
            let outputBytes = 0, binaryBytes = 0, stderrBytes = 0;
            let failure: ComponentErrorCode | undefined;
            let escalation: ReturnType<typeof setTimeout> | undefined;
            const stop = (code: ComponentErrorCode) => {
                if (failure)
                    return;
                failure = code;
                child.kill("SIGTERM");
                escalation = setTimeout(() => child.kill("SIGKILL"), 100);
            };
            const cancelled = () => stop("COMPONENT_CANCELLED");
            signal.addEventListener("abort", cancelled, { once: true });
            const timer = setTimeout(() => stop("COMPONENT_TIMEOUT"), policy.deadlineMs);
            if (signal.aborted)
                cancelled();
            child.stdout.on("data", (chunk: Buffer) => {
                outputBytes += chunk.length;
                if (outputBytes > policy.outputByteLimit)
                    stop("COMPONENT_RESOURCE_LIMIT");
                else if (!failure)
                    stdout.push(chunk);
            });
            child.stderr.on("data", (chunk: Buffer) => {
                stderrBytes += chunk.length;
                if (stderrBytes > policy.stderrByteLimit)
                    stop("COMPONENT_RESOURCE_LIMIT");
                // Never retain/forward untrusted stderr.
            });
            (child.stdio[3] as Readable).on("data", (chunk: Buffer) => {
                binaryBytes += chunk.length;
                if (binaryBytes > policy.artifactByteLimit)
                    stop("COMPONENT_RESOURCE_LIMIT");
                else if (!failure)
                    binary.push(chunk);
            });
            child.on("error", () => stop("COMPONENT_EXECUTION_FAILED"));
            child.stdin.on("error", () => stop("COMPONENT_EXECUTION_FAILED"));
            // Resolve only after process exit AND stream closure. No abandoned computation or retry.
            child.on("close", code => {
                clearTimeout(timer);
                if (escalation)
                    clearTimeout(escalation);
                signal.removeEventListener("abort", cancelled);
                if (failure || code !== 0) {
                    rejectPromise(new SceneInputError(failure ?? "COMPONENT_EXECUTION_FAILED"));
                    return;
                }
                try {
                    resolve({ json: JSON.parse(Buffer.concat(stdout).toString("utf8")), binary: Buffer.concat(binary) });
                }
                catch {
                    rejectPromise(new SceneInputError("COMPONENT_OUTPUT_INVALID"));
                }
            });
            child.stdin.end(serialized);
            if (child.pid && onStarted) {
                try {
                    onStarted(child.pid);
                }
                catch {
                    stop("COMPONENT_EXECUTION_FAILED");
                }
            }
        });
    },
});
