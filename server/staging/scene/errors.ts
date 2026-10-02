export type SceneInputErrorCode = "INVALID_IMAGE" | "UNSUPPORTED_IMAGE" | "UNSUPPORTED_TRANSPARENCY" | "IMAGE_TOO_LARGE" | "INVALID_SELECTION" | "SELECTION_ALIGNMENT_UNKNOWN" | "INVALID_TRANSFORM" | "ARTIFACT_HASH_MISMATCH" | "ARTIFACT_SIZE_MISMATCH" | "ARTIFACT_INVALID" | "ARTIFACT_ALREADY_PUBLISHED" | "ARTIFACT_PATH_VIOLATION" | "ARTIFACT_CONFLICT" | "ARTIFACT_MISSING" | "ARTIFACT_BUSY" | "ARTIFACT_LIMIT" | "ARTIFACT_IO";
/** Bounded public diagnostics; never attach native errors, paths or image metadata. */
export class SceneInputError extends Error {
    constructor(readonly code: SceneInputErrorCode) { super(code); this.name = "SceneInputError"; }
}
export function reject(code: SceneInputErrorCode): never { throw new SceneInputError(code); }
