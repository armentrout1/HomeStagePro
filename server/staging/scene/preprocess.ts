import sharp from "sharp";
import { z } from "zod";
import { frameSchema, rasterRefSchema, maskRefSchema, sourceIdentitySchema, type Frame, type MaskRef, type SourceIdentity } from "../../../shared/staging/scene-map";
import { canonicalFrame, exifTransform, affine, transformRect, type Rect } from "./coordinates";
import { sha256, stableJson, type SceneArtifactStore, type SceneArtifact } from "./artifacts";
import { reject, SceneInputError } from "./errors";
const MAX_INPUT_BYTES = 10 * 1024 * 1024, MAX_SOURCE_EDGE = 2048, MAX_PIXELS = 16000000;
const decodeOptions = {
    limitInputPixels: MAX_PIXELS, failOn: "warning" as const, sequentialRead: true
};
const configSchema = z.object({ pngCompressionLevel: z.number().int().min(0).max(9).default(9) }).strict();
export type SelectionInput = {
    bytes: Uint8Array;
    sourceUploadedSha256: string;
    alignment: "encoded-pixels" | "canonical-pixels" | Frame;
};
const formatMime = {
    png: "image/png", jpeg: "image/jpeg", webp: "image/webp"
} as const;
function signature(bytes: Buffer): keyof typeof formatMime {
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        return "png";
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
        return "jpeg";
    if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP")
        return "webp";
    reject("UNSUPPORTED_IMAGE");
}
function pngOptions(level: number) { return {
    compressionLevel: level, adaptiveFiltering: false, palette: false, progressive: false, force: true
} as const; }
function fullIdentity(frame: Frame) { return frame.toCanonical.every((v, i) => v === [1, 0, 0, 0, 1, 0, 0, 0, 1][i]) && frame.validPixels.every((v, i) => v === [0, 0, frame.width, frame.height][i]); }
/** Every protected source-pixel footprint marks every intersected destination pixel. */
export async function selectionRestriction(input: Uint8Array, sourceFrame: Frame, canonical: Frame, compressionLevel = 9): Promise<Buffer> {
    try {
        if (!(input instanceof Uint8Array))
            reject("INVALID_SELECTION");
        if (input.byteLength > MAX_INPUT_BYTES)
            reject("IMAGE_TOO_LARGE");
        const bytes = Buffer.from(input);
        if (!frameSchema.safeParse(sourceFrame).success || !frameSchema.safeParse(canonical).success || !fullIdentity(canonical))
            reject("SELECTION_ALIGNMENT_UNKNOWN");
        const m = affine(sourceFrame.toCanonical);
        // Only axis-aligned scale/padding and EXIF permutations. No guessed shear/perspective rasterization.
        if (!((m[1] === 0 && m[3] === 0) || (m[0] === 0 && m[4] === 0)))
            reject("SELECTION_ALIGNMENT_UNKNOWN");
        if (signature(bytes) !== "png")
            reject("INVALID_SELECTION");
        const meta = await sharp(bytes, decodeOptions).metadata();
        if (meta.width !== sourceFrame.width || meta.height !== sourceFrame.height || !meta.hasAlpha || meta.depth !== "uchar" || (meta.pages ?? 1) !== 1 || (meta.orientation ?? 1) !== 1)
            reject("INVALID_SELECTION");
        const [vx, vy, vw, vh] = sourceFrame.validPixels;
        if (![vx, vy, vw, vh].every(Number.isInteger))
            reject("SELECTION_ALIGNMENT_UNKNOWN");
        const bounds = transformRect(m, sourceFrame.validPixels as Rect);
        // Only tolerate floating-point cancellation at known full-frame edges. Never repair a crop.
        const edgeTolerance = 1e-9;
        if (bounds.some((v, i) => Math.abs(v - [0, 0, canonical.width, canonical.height][i]) > edgeTolerance))
            reject("SELECTION_ALIGNMENT_UNKNOWN");
        const alpha = await sharp(bytes, decodeOptions).extractChannel("alpha").raw().toBuffer();
        const restriction = Buffer.alloc(canonical.width * canonical.height);
        for (let y = 0; y < sourceFrame.height; y++)
            for (let x = 0; x < sourceFrame.width; x++) {
                if (alpha[y * sourceFrame.width + x] === 0)
                    continue;
                if (x < vx || x >= vx + vw || y < vy || y >= vy + vh)
                    reject("INVALID_SELECTION");
                // Avoid per-pixel schema parsing; the matrix and dimensions were validated above.
                const ax = m[0] * x + m[1] * y + m[2], ay = m[3] * x + m[4] * y + m[5];
                const bx = m[0] * (x + 1) + m[1] * (y + 1) + m[2], by = m[3] * (x + 1) + m[4] * (y + 1) + m[5];
                const left = Math.min(ax, bx), top = Math.min(ay, by), right = Math.max(ax, bx), bottom = Math.max(ay, by);
                if (left < -edgeTolerance || top < -edgeTolerance || right > canonical.width + edgeTolerance || bottom > canonical.height + edgeTolerance)
                    reject("SELECTION_ALIGNMENT_UNKNOWN");
                // Intersect only the admitted round-off fringe with the canvas; no interpolation or threshold loss.
                for (let j = Math.max(0, Math.floor(top)); j < Math.min(canonical.height, Math.ceil(bottom)); j++)
                    for (let i = Math.max(0, Math.floor(left)); i < Math.min(canonical.width, Math.ceil(right)); i++)
                        restriction[j * canonical.width + i] = 255;
            }
        return await sharp(restriction, { raw: {
                width: canonical.width, height: canonical.height, channels: 1
            } }).toColourspace("b-w").png(pngOptions(compressionLevel)).toBuffer();
    }
    catch (e) {
        if (e instanceof SceneInputError)
            throw e;
        reject("INVALID_SELECTION");
    }
}
export type PreprocessedSceneInput = {
    source: SourceIdentity;
    frames: Frame[];
    canonicalBytes: Buffer;
    restrictionBytes: Buffer | null;
    stableManifestBytes: Buffer;
    artifacts: SceneArtifact[];
};
/** Offline input preparation only. Caller supplies authorized bytes and a run-scoped store. */
export async function preprocessImage(input: {
    bytes: Uint8Array;
    mediaType: string;
    selection?: SelectionInput;
    config?: z.input<typeof configSchema>;
}, store: SceneArtifactStore): Promise<PreprocessedSceneInput> {
    try {
        if (!(input.bytes instanceof Uint8Array))
            reject("INVALID_IMAGE");
        if (input.bytes.byteLength > MAX_INPUT_BYTES)
            reject("IMAGE_TOO_LARGE");
        if (input.selection && (!(input.selection.bytes instanceof Uint8Array) || input.selection.bytes.byteLength > MAX_INPUT_BYTES))
            reject("INVALID_SELECTION");
        const bytes = Buffer.from(input.bytes), selection = input.selection ? {
            ...input.selection, bytes: Buffer.from(input.selection.bytes), alignment: structuredClone(input.selection.alignment)
        } : undefined;
        if (bytes.length === 0)
            reject("INVALID_IMAGE");
        if (bytes.length > MAX_INPUT_BYTES)
            reject("IMAGE_TOO_LARGE");
        const parsed = configSchema.safeParse(input.config ?? {});
        if (!parsed.success)
            reject("INVALID_IMAGE");
        const format = signature(bytes);
        if (input.mediaType !== formatMime[format])
            reject("UNSUPPORTED_IMAGE");
        const meta = await sharp(bytes, decodeOptions).metadata();
        if (meta.format !== format)
            reject("INVALID_IMAGE");
        const w = meta.width, h = meta.height;
        if (!w || !h)
            reject("INVALID_IMAGE");
        if (w > MAX_SOURCE_EDGE || h > MAX_SOURCE_EDGE || w / h > 3 || h / w > 3 || w * h > MAX_PIXELS)
            reject("IMAGE_TOO_LARGE");
        if ((meta.pages ?? 1) !== 1)
            reject("UNSUPPORTED_IMAGE");
        if (meta.hasAlpha) {
            if (meta.depth !== "uchar")
                reject("UNSUPPORTED_TRANSPARENCY");
            const alpha = await sharp(bytes, decodeOptions).extractChannel("alpha").raw().toBuffer();
            if (alpha.some((v: number) => v !== 255))
                reject("UNSUPPORTED_TRANSPARENCY");
        }
        const orientation = meta.orientation ?? 1, oriented = exifTransform(w, h, orientation);
        const canonical = canonicalFrame(oriented.width, oriented.height);
        const encoded = frameSchema.parse({
            id: "encoded", width: w, height: h, toCanonical: oriented.toCanonical, validPixels: [0, 0, w, h]
        });
        const config = {
            schemaVersion: "preprocess-config/1", pngCompressionLevel: parsed.data.pngCompressionLevel, color: "embedded-icc-to-srgb-or-decoder-default", alpha: "reject-nonopaque-remove-opaque", orientation: "exif-once", resize: "none", crop: "none", metadata: "strip", maskResampling: "any-positive-area-footprint", limits: {
                bytes: MAX_INPUT_BYTES, edge: MAX_SOURCE_EDGE, aspectRatio: 3, intermediatePixels: MAX_PIXELS
            }
        };
        const uploadedSha256 = sha256(bytes), configHash = sha256(stableJson(config));
        const canonicalBytes = await sharp(bytes, decodeOptions).autoOrient().withIccProfile("srgb", { attach: false }).toColourspace("srgb").removeAlpha().png(pngOptions(parsed.data.pngCompressionLevel)).toBuffer();
        const canonicalMeta = await sharp(canonicalBytes, decodeOptions).metadata();
        if (canonicalMeta.width !== canonical.width || canonicalMeta.height !== canonical.height || canonicalMeta.channels !== 3 || canonicalMeta.depth !== "uchar" || canonicalMeta.exif || canonicalMeta.icc || canonicalMeta.xmp || canonicalMeta.iptc || canonicalMeta.orientation)
            reject("INVALID_IMAGE");
        let selectionFrame: Frame | null = null, restrictionBytes: Buffer | null = null;
        if (selection) {
            if (selection.sourceUploadedSha256 !== uploadedSha256)
                reject("SELECTION_ALIGNMENT_UNKNOWN");
            const frame = selection.alignment === "encoded-pixels" ? encoded : selection.alignment === "canonical-pixels" ? canonical : selection.alignment;
            const result = frameSchema.safeParse(frame);
            if (!result.success)
                reject("SELECTION_ALIGNMENT_UNKNOWN");
            selectionFrame = result.data;
            if ([encoded, canonical].some(f => f.id === selectionFrame!.id && !stableJson(f).equals(stableJson(selectionFrame))))
                reject("SELECTION_ALIGNMENT_UNKNOWN");
            restrictionBytes = await selectionRestriction(selection.bytes, selectionFrame, canonical, parsed.data.pngCompressionLevel);
        }
        // Perform all input/selection checks before writing any artifacts.
        const canonicalRef = rasterRefSchema.parse(await store.put(canonicalBytes, {
            mediaType: "image/png", frameId: "canonical", width: canonical.width, height: canonical.height, channels: 3, dtype: "uint8", encoding: "png"
        }));
        let restriction: MaskRef | null = null;
        if (restrictionBytes)
            restriction = maskRefSchema.parse(await store.put(restrictionBytes, {
                mediaType: "image/png", frameId: "canonical", width: canonical.width, height: canonical.height, channels: 1, dtype: "uint8", encoding: "png", semantics: "binary-membership"
            }));
        const outputs = [{ role: "canonical", artifact: withoutLocation(canonicalRef) }, ...(restriction ? [{ role: "restriction", artifact: withoutLocation(restriction) }] : [])];
        const manifest = {
            schemaVersion: "preprocess/1", uploadedSha256, decoded: {
                format, width: w, height: h, orientation, space: meta.space, depth: meta.depth, hasAlpha: meta.hasAlpha, hadIcc: !!meta.icc
            }, canonical: {
                width: canonical.width, height: canonical.height, sha256: canonicalRef.sha256
            }, orientationTransform: oriented.toCanonical, selection: selection ? {
                originalSha256: sha256(selection.bytes), frame: selectionFrame, restrictionSha256: restriction!.sha256
            } : null, config, configSha256: configHash, runtime: {
                node: process.version, platform: process.platform, arch: process.arch, imageLibraries: sharp.versions, simd: sharp.simd(), concurrency: sharp.concurrency()
            }, outputs
        };
        const stableManifestBytes = stableJson(manifest), preprocessingManifest = await store.put(stableManifestBytes, { mediaType: "application/json" });
        const source = sourceIdentitySchema.parse({
            uploadedSha256, canonical: canonicalRef, selection: restriction, originalSelectionSha256: selection ? sha256(selection.bytes) : null, preprocessingVersion: "preprocess-1", preprocessingConfigSha256: configHash, preprocessingManifest, sourceRole: "original", architectureSourceSha256: canonicalRef.sha256, parentSceneId: null, clearingQaRecordId: null, reconstructionMask: null
        });
        return {
            source, frames: [canonical, encoded, ...(selectionFrame && !["canonical", "encoded"].includes(selectionFrame.id) ? [selectionFrame] : [])], canonicalBytes, restrictionBytes, stableManifestBytes, artifacts: [canonicalRef, ...(restriction ? [restriction] : [])]
        };
    }
    catch (e) {
        if (e instanceof SceneInputError)
            throw e;
        if (e instanceof Error && /pixel limit/i.test(e.message))
            reject("IMAGE_TOO_LARGE");
        reject("INVALID_IMAGE");
    }
}
function withoutLocation(ref: SceneArtifact) { const { id: _id, key: _key, ...metadata } = ref; return metadata; }
