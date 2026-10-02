import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { artifactRefSchema, rasterRefSchema, maskRefSchema, idSchema, SCENE_LIMITS, type ArtifactRef, type RasterRef, type MaskRef } from "../../../shared/staging/scene-map";
import { SceneInputError, reject } from "./errors";
export type SceneArtifact = ArtifactRef | RasterRef | MaskRef;
export type ArtifactDescription = {
    mediaType: string;
    frameId?: string;
    width?: number;
    height?: number;
    channels?: number;
    dtype?: RasterRef["dtype"];
    encoding?: RasterRef["encoding"];
    semantics?: "binary-membership";
};
export const ARTIFACT_MAX_BYTES = 64 * 1024 * 1024;
const RUN_MAX_BYTES = 128 * 1024 * 1024;
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export function stableJson(value: unknown): Buffer {
    function stable(v: unknown, depth = 0): unknown {
        if (depth > 64)
            reject("ARTIFACT_INVALID");
        if (v === null || typeof v === "string" || typeof v === "boolean")
            return v;
        if (typeof v === "number" && Number.isFinite(v))
            return v;
        if (Array.isArray(v))
            return v.map(x => stable(x, depth + 1));
        if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype)
            return Object.fromEntries(Object.keys(v).sort().map(k => [k, stable((v as Record<string, unknown>)[k], depth + 1)]));
        reject("ARTIFACT_INVALID");
    }
    return Buffer.from(JSON.stringify(stable(value)) + "\n");
}
export function parseArtifact(value: unknown): SceneArtifact {
    if (!value || typeof value !== "object")
        reject("ARTIFACT_INVALID");
    const result = ("semantics" in value ? maskRefSchema : "frameId" in value ? rasterRefSchema : artifactRefSchema).safeParse(value);
    if (!result.success)
        reject("ARTIFACT_INVALID");
    return result.data;
}
/** Actual content checks. Roles such as depth/error must request nonnegative where applicable. */
export async function validateArtifactBytes(value: unknown, input: Uint8Array, options: {
    nonnegativeFloat?: boolean;
    canonicalRgb?: boolean;
} = {}): Promise<SceneArtifact> {
    const ref = parseArtifact(value);
    if (!(input instanceof Uint8Array))
        reject("ARTIFACT_INVALID");
    if (input.byteLength > ARTIFACT_MAX_BYTES)
        reject("ARTIFACT_LIMIT");
    const bytes = Buffer.from(input);
    if (ref.bytes > ARTIFACT_MAX_BYTES || bytes.length > ARTIFACT_MAX_BYTES)
        reject("ARTIFACT_LIMIT");
    if (bytes.length !== ref.bytes)
        reject("ARTIFACT_SIZE_MISMATCH");
    if (sha256(bytes) !== ref.sha256)
        reject("ARTIFACT_HASH_MISMATCH");
    try {
        if (ref.mediaType === "image/png") {
            if (!bytes.subarray(0, 8).equals(PNG))
                reject("ARTIFACT_INVALID");
            const image = sharp(bytes, { limitInputPixels: SCENE_LIMITS.pixels, failOn: "warning" });
            const meta = await image.metadata();
            if (meta.format !== "png" || (meta.pages ?? 1) !== 1)
                reject("ARTIFACT_INVALID");
            if (!meta.width || !meta.height || !meta.channels || meta.width * meta.height * meta.channels * (meta.depth === "ushort" ? 2 : 1) > ARTIFACT_MAX_BYTES)
                reject("ARTIFACT_LIMIT");
            if (options.canonicalRgb && (meta.channels !== 3 || meta.depth !== "uchar" || meta.space !== "srgb" || meta.exif || meta.icc || meta.xmp || meta.iptc || meta.orientation))
                reject("ARTIFACT_INVALID");
            if ("frameId" in ref) {
                if (ref.encoding !== "png" || meta.width !== ref.width || meta.height !== ref.height || meta.channels !== ref.channels || meta.depth !== (ref.dtype === "uint16" ? "ushort" : "uchar"))
                    reject("ARTIFACT_INVALID");
            }
            // Force a full decode, not merely a valid header.
            const decoded = await image.raw({ depth: meta.depth === "ushort" ? "ushort" : "uchar" }).toBuffer();
            if ("semantics" in ref && decoded.some((v: number) => v !== 0 && v !== 255))
                reject("ARTIFACT_INVALID");
        }
        else if (ref.mediaType === "application/json") {
            const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
            JSON.parse(decoded);
            if ("frameId" in ref)
                reject("ARTIFACT_INVALID");
        }
        else if (ref.mediaType === "application/octet-stream" && "frameId" in ref && ref.encoding === "raw-row-major") {
            if (ref.dtype === "float32-le")
                for (let i = 0; i < bytes.length; i += 4) {
                    const sample = bytes.readFloatLE(i);
                    if (!Number.isFinite(sample) || (options.nonnegativeFloat && sample < 0))
                        reject("ARTIFACT_INVALID");
                }
        }
        else
            reject("ARTIFACT_INVALID");
        return ref;
    }
    catch (error) {
        if (error instanceof SceneInputError)
            throw error;
        reject("ARTIFACT_INVALID");
    }
}
const envelopeSchema = z.object({
    schemaVersion: z.literal("preprocessing-bundle/1"), runId: idSchema, preprocessingManifest: artifactRefSchema, artifacts: z.array(z.unknown()).min(1).max(2048)
}).strict();
async function verifyOutputs(bytes: Buffer, artifacts: SceneArtifact[], read: (ref: SceneArtifact) => Promise<Buffer>) {
    try {
        const manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        if (manifest.schemaVersion !== "preprocess/1" || !Array.isArray(manifest.outputs) || manifest.outputs.length !== artifacts.length || artifacts.length < 1 || artifacts.length > 2)
            reject("ARTIFACT_INVALID");
        const seen = new Set<string>();
        for (const output of manifest.outputs) {
            if (!output || Object.keys(output).sort().join(",") !== "artifact,role" || !["canonical", "restriction"].includes(output.role) || seen.has(output.role))
                reject("ARTIFACT_INVALID");
            seen.add(output.role);
            const ref = artifacts.find(r => { const { id: _id, key: _key, ...metadata } = r; return stableJson(metadata).equals(stableJson(output.artifact)); });
            if (!ref || !("frameId" in ref) || ref.frameId !== "canonical" || ref.encoding !== "png" || ref.dtype !== "uint8" || (output.role === "canonical" ? (ref.channels !== 3 || "semantics" in ref) : !("semantics" in ref)))
                reject("ARTIFACT_INVALID");
        }
        if (!seen.has("canonical"))
            reject("ARTIFACT_INVALID");
        const canonical = artifacts.find(r => "channels" in r && r.channels === 3) as RasterRef;
        if (manifest.canonical?.sha256 !== canonical.sha256 || manifest.canonical?.width !== canonical.width || manifest.canonical?.height !== canonical.height || manifest.configSha256 !== sha256(stableJson(manifest.config)))
            reject("ARTIFACT_INVALID");
        const restriction = artifacts.find(r => "semantics" in r);
        if (restriction ? manifest.selection?.restrictionSha256 !== restriction.sha256 : manifest.selection !== null)
            reject("ARTIFACT_INVALID");
        await validateArtifactBytes(canonical, await read(canonical), { canonicalRgb: true });
        if (artifacts.some(r => !("width" in r) || r.width !== canonical.width || r.height !== canonical.height))
            reject("ARTIFACT_INVALID");
    }
    catch (e) {
        if (e instanceof SceneInputError)
            throw e;
        reject("ARTIFACT_INVALID");
    }
}
export interface SceneArtifactStore {
    readonly runId: string;
    put(bytes: Uint8Array, description: ArtifactDescription): Promise<SceneArtifact>;
    read(ref: SceneArtifact): Promise<Buffer>;
    publishPreprocessing(manifest: ArtifactRef, artifacts: SceneArtifact[]): Promise<ArtifactRef>;
}
const samePath = (a: string, b: string) => process.platform === "win32" ? path.normalize(a).toLowerCase() === path.normalize(b).toLowerCase() : a === b;
async function safePath(target: string) {
    const parts: string[] = [];
    let current = path.resolve(target);
    while (true) {
        parts.unshift(current);
        const parent = path.dirname(current);
        if (parent === current)
            break;
        current = parent;
    }
    for (const item of parts) {
        const stat = await fs.lstat(item);
        if (stat.isSymbolicLink() || !samePath(await fs.realpath(item), item))
            reject("ARTIFACT_PATH_VIOLATION");
        if (item !== target && !stat.isDirectory())
            reject("ARTIFACT_PATH_VIOLATION");
    }
}
function errno(error: unknown, code: string) { return !!error && typeof error === "object" && "code" in error && error.code === code; }
async function exists(target: string) { try {
    await fs.lstat(target);
    return true;
}
catch (e) {
    if (errno(e, "ENOENT"))
        return false;
    throw e;
} }
async function io<T>(work: () => Promise<T>): Promise<T> { try {
    return await work();
}
catch (e) {
    if (e instanceof SceneInputError)
        throw e;
    reject(errno(e, "ENOENT") ? "ARTIFACT_MISSING" : "ARTIFACT_IO");
} }
/** Private, single-owner offline directories only; not a hostile multi-user filesystem sandbox. */
export class LocalSceneArtifactStore implements SceneArtifactStore {
    private constructor(readonly runId: string, private readonly directory: string, private readonly artifactDirectory: string) { }
    static async open(privateRoot: string, runId: string): Promise<LocalSceneArtifactStore> {
        return io(async () => {
            if (!idSchema.safeParse(runId).success || runId.length > 40 || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(runId) || !path.isAbsolute(privateRoot) || privateRoot.startsWith("\\\\") || privateRoot.startsWith("//"))
                reject("ARTIFACT_PATH_VIOLATION");
            const root = path.resolve(privateRoot);
            await safePath(root);
            if (!(await fs.lstat(root)).isDirectory())
                reject("ARTIFACT_PATH_VIOLATION");
            const directory = path.join(root, runId), artifactDirectory = path.join(directory, "artifacts");
            for (const dir of [directory, artifactDirectory]) {
                await safePath(path.dirname(dir));
                try {
                    await fs.mkdir(dir, { mode: 0o700 });
                }
                catch (e) {
                    if (!errno(e, "EEXIST"))
                        throw e;
                }
                await safePath(dir);
                if (!(await fs.lstat(dir)).isDirectory())
                    reject("ARTIFACT_PATH_VIOLATION");
            }
            return new LocalSceneArtifactStore(runId, directory, artifactDirectory);
        });
    }
    private async guard() { await safePath(this.directory); await safePath(this.artifactDirectory); }
    private file(key: string) { return path.join(this.artifactDirectory, key); }
    private owned(ref: SceneArtifact) {
        const ext = ref.mediaType === "image/png" ? "png" : ref.mediaType === "application/json" ? "json" : "bin";
        if (ref.id !== `a-${this.runId}-${ref.sha256}` || ref.key !== `${ref.id}.${ext}`)
            reject("ARTIFACT_PATH_VIOLATION");
    }
    private async readFile(target: string, maxBytes: number): Promise<Buffer> {
        await this.guard();
        await safePath(target);
        const before = await fs.lstat(target);
        if (!before.isFile() || before.nlink !== 1 || before.size > maxBytes)
            reject("ARTIFACT_PATH_VIOLATION");
        const handle = await fs.open(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
        try {
            const actual = await handle.stat();
            if (actual.dev !== before.dev || actual.ino !== before.ino || actual.size !== before.size)
                reject("ARTIFACT_PATH_VIOLATION");
            const bytes = await handle.readFile();
            await safePath(target);
            const after = await fs.lstat(target);
            if (after.dev !== actual.dev || after.ino !== actual.ino || after.size !== bytes.length || after.nlink !== 1)
                reject("ARTIFACT_PATH_VIOLATION");
            return bytes;
        }
        finally {
            await handle.close();
        }
    }
    /** Link a fully flushed temporary file into a new name: atomic visibility, no replacement. */
    private async install(target: string, bytes: Buffer) {
        await this.guard();
        await safePath(path.dirname(target));
        const temp = path.join(path.dirname(target), `tmp-${randomUUID()}`);
        const handle = await fs.open(temp, "wx", 0o600);
        try {
            await handle.writeFile(bytes);
            await handle.sync();
        }
        finally {
            await handle.close();
        }
        try {
            await this.guard();
            await fs.link(temp, target);
        }
        finally {
            await this.guard();
            await fs.unlink(temp);
        }
    }
    private async mutate<T>(work: () => Promise<T>): Promise<T> {
        return io(async () => {
            await this.guard();
            if (await exists(path.join(this.directory, "manifest.json")))
                reject("ARTIFACT_ALREADY_PUBLISHED");
            const lockPath = path.join(this.directory, "mutation.lock");
            let lock;
            try {
                lock = await fs.open(lockPath, "wx", 0o600);
            }
            catch (e) {
                if (errno(e, "EEXIST"))
                    reject("ARTIFACT_BUSY");
                throw e;
            }
            try {
                if (await exists(path.join(this.directory, "manifest.json")))
                    reject("ARTIFACT_ALREADY_PUBLISHED");
                return await work();
            }
            finally {
                await lock.close();
                await this.guard();
                await fs.unlink(lockPath);
            }
        });
    }
    async put(input: Uint8Array, description: ArtifactDescription): Promise<SceneArtifact> {
        if (!(input instanceof Uint8Array))
            reject("ARTIFACT_INVALID");
        if (input.byteLength > ARTIFACT_MAX_BYTES)
            reject("ARTIFACT_LIMIT");
        const bytes = Buffer.from(input);
        description = { ...description };
        return this.mutate(async () => {
            const allowed = ["mediaType", "frameId", "width", "height", "channels", "dtype", "encoding", "semantics"];
            if (!description || Object.keys(description).some(k => !allowed.includes(k)))
                reject("ARTIFACT_INVALID");
            const digest = sha256(bytes), id = `a-${this.runId}-${digest}`, ext = description.mediaType === "image/png" ? "png" : description.mediaType === "application/json" ? "json" : "bin";
            const ref = parseArtifact({
                ...description, id, key: `${id}.${ext}`, sha256: digest, bytes: bytes.length
            });
            await validateArtifactBytes(ref, bytes);
            const target = this.file(ref.key), metadata = `${target}.meta.json`;
            if (await exists(metadata)) {
                const prior = await this.readFile(metadata, 8192);
                if (!prior.equals(stableJson(ref)))
                    reject("ARTIFACT_CONFLICT");
                await this.read(ref);
                return ref;
            }
            const entries = await fs.readdir(this.artifactDirectory);
            let total = 0, count = 0;
            for (const name of entries)
                if (!name.endsWith(".meta.json") && !name.startsWith("tmp-")) {
                    const file = this.file(name);
                    await safePath(file);
                    const stat = await fs.lstat(file);
                    if (!stat.isFile() || stat.nlink !== 1)
                        reject("ARTIFACT_PATH_VIOLATION");
                    total += stat.size;
                    count++;
                }
            const present = await exists(target);
            if (total + (present ? 0 : bytes.length) > RUN_MAX_BYTES || count + (present ? 0 : 1) > 2048)
                reject("ARTIFACT_LIMIT");
            if (present)
                await validateArtifactBytes(ref, await this.readFile(target, ARTIFACT_MAX_BYTES));
            else
                await this.install(target, bytes);
            await this.install(metadata, stableJson(ref));
            return ref;
        });
    }
    async read(value: SceneArtifact): Promise<Buffer> {
        return io(async () => {
            const ref = parseArtifact(value);
            if (ref.id === `publication-${this.runId}`)
                return this.readPublication(ref);
            this.owned(ref);
            const metadata = await this.readFile(`${this.file(ref.key)}.meta.json`, 8192);
            if (!metadata.equals(stableJson(ref)))
                reject("ARTIFACT_CONFLICT");
            const bytes = await this.readFile(this.file(ref.key), ARTIFACT_MAX_BYTES);
            await validateArtifactBytes(ref, bytes);
            return bytes;
        });
    }
    async publishPreprocessing(manifest: ArtifactRef, artifacts: SceneArtifact[]): Promise<ArtifactRef> {
        return this.mutate(async () => {
            const parsed = artifactRefSchema.safeParse(manifest);
            if (!parsed.success || parsed.data.mediaType !== "application/json" || artifacts.length < 1 || artifacts.length > 2047)
                reject("ARTIFACT_INVALID");
            const refs = [...artifacts.map(parseArtifact), parsed.data];
            if (new Set(refs.map(r => r.id)).size !== refs.length || new Set(refs.map(r => r.key)).size !== refs.length)
                reject("ARTIFACT_CONFLICT");
            for (const ref of refs)
                await this.read(ref);
            await verifyOutputs(await this.read(parsed.data), refs.slice(0, -1), ref => this.read(ref));
            const envelope = envelopeSchema.parse({
                schemaVersion: "preprocessing-bundle/1", runId: this.runId, preprocessingManifest: parsed.data, artifacts: refs
            });
            const bytes = stableJson(envelope);
            if (bytes.length > ARTIFACT_MAX_BYTES)
                reject("ARTIFACT_LIMIT");
            await this.install(path.join(this.directory, "manifest.json"), bytes);
            return artifactRefSchema.parse({
                id: `publication-${this.runId}`, key: `publication-${this.runId}.json`, sha256: sha256(bytes), bytes: bytes.length, mediaType: "application/json"
            });
        });
    }
    async readPublication(expected?: ArtifactRef): Promise<Buffer> {
        return io(async () => {
            const bytes = await this.readFile(path.join(this.directory, "manifest.json"), ARTIFACT_MAX_BYTES);
            if (expected) {
                const receipt = artifactRefSchema.safeParse(expected);
                if (!receipt.success || receipt.data.id !== `publication-${this.runId}` || receipt.data.key !== `publication-${this.runId}.json` || receipt.data.mediaType !== "application/json")
                    reject("ARTIFACT_INVALID");
                await validateArtifactBytes(receipt.data, bytes);
            }
            let decoded: unknown;
            try {
                decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
            }
            catch {
                reject("ARTIFACT_INVALID");
            }
            const parsed = envelopeSchema.safeParse(decoded);
            if (!parsed.success || parsed.data.runId !== this.runId)
                reject("ARTIFACT_INVALID");
            const refs = parsed.data.artifacts.map(parseArtifact);
            refs.forEach(ref => this.owned(ref));
            if (new Set(refs.map(r => r.id)).size !== refs.length)
                reject("ARTIFACT_CONFLICT");
            if (!refs.some(r => stableJson(r).equals(stableJson(parsed.data.preprocessingManifest))))
                reject("ARTIFACT_INVALID");
            for (const ref of refs)
                await this.read(ref);
            await verifyOutputs(await this.read(parsed.data.preprocessingManifest), refs.filter(r => r.id !== parsed.data.preprocessingManifest.id), ref => this.read(ref));
            return bytes;
        });
    }
}
