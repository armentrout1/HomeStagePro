import { frameSchema, mat3Schema, xySchema, SCENE_LIMITS, type Frame, type Mat3, type XY } from "../../../shared/staging/scene-map";
import { reject } from "./errors";
export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export type Rect = [
    number,
    number,
    number,
    number
];
export function dimensions(width: number, height: number) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width * height > SCENE_LIMITS.pixels)
        reject("IMAGE_TOO_LARGE");
}
export function affine(value: unknown): Mat3 {
    const parsed = mat3Schema.safeParse(value);
    if (!parsed.success || parsed.data[6] !== 0 || parsed.data[7] !== 0 || parsed.data[8] !== 1)
        reject("INVALID_TRANSFORM");
    return parsed.data;
}
export function transformPoint(matrix: Mat3, point: XY): XY {
    const m = affine(matrix), p = xySchema.safeParse(point);
    if (!p.success)
        reject("INVALID_TRANSFORM");
    const result: XY = [m[0] * p.data[0] + m[1] * p.data[1] + m[2], m[3] * p.data[0] + m[4] * p.data[1] + m[5]];
    if (!result.every(Number.isFinite))
        reject("INVALID_TRANSFORM");
    return result;
}
/** compose(a,b) applies b first, then a; column-vector convention. */
export function compose(a: Mat3, b: Mat3): Mat3 {
    a = affine(a);
    b = affine(b);
    const result = Array.from({ length: 9 }, (_, i) => [0, 1, 2].reduce((s, k) => s + a[Math.floor(i / 3) * 3 + k] * b[k * 3 + i % 3], 0));
    return affine(result);
}
export function invert(matrix: Mat3): Mat3 {
    const m = affine(matrix), scale = Math.max(Math.abs(m[0]), Math.abs(m[1]), Math.abs(m[3]), Math.abs(m[4]));
    const a = m[0] / scale, b = m[1] / scale, c = m[3] / scale, d = m[4] / scale, det = a * d - b * c;
    const x = d / det / scale, y = -b / det / scale, z = -c / det / scale, w = a / det / scale;
    return affine([x, y, -x * m[2] - y * m[5], z, w, -z * m[2] - w * m[5], 0, 0, 1]);
}
/** Returns the enclosing rectangle of four transformed continuous edge corners. */
export function transformRect(matrix: Mat3, rect: Rect): Rect {
    if (!Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isFinite) || rect[2] <= 0 || rect[3] <= 0)
        reject("INVALID_TRANSFORM");
    const [x, y, w, h] = rect, points = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(p => transformPoint(matrix, p as XY));
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]), left = Math.min(...xs), top = Math.min(...ys);
    return [left, top, Math.max(...xs) - left, Math.max(...ys) - top];
}
export function normalizedToPixels(point: XY, width: number, height: number): XY {
    dimensions(width, height);
    if (!xySchema.safeParse(point).success || point.some(v => v < 0 || v > 1))
        reject("INVALID_TRANSFORM");
    return [point[0] * width, point[1] * height];
}
export function pixelsToNormalized(point: XY, width: number, height: number): XY {
    dimensions(width, height);
    if (!xySchema.safeParse(point).success || point[0] < 0 || point[1] < 0 || point[0] > width || point[1] > height)
        reject("INVALID_TRANSFORM");
    return [point[0] / width, point[1] / height];
}
/** EXIF maps encoded pixel EDGES, so translation uses W/H, not W-1/H-1. */
export function exifTransform(width: number, height: number, orientation: number) {
    dimensions(width, height);
    const matrices: Mat3[] = [IDENTITY, [-1, 0, width, 0, 1, 0, 0, 0, 1], [-1, 0, width, 0, -1, height, 0, 0, 1], [1, 0, 0, 0, -1, height, 0, 0, 1], [0, 1, 0, 1, 0, 0, 0, 0, 1], [0, -1, height, 1, 0, 0, 0, 0, 1], [0, -1, height, -1, 0, width, 0, 0, 1], [0, 1, 0, -1, 0, width, 0, 0, 1]];
    if (!Number.isInteger(orientation) || orientation < 1 || orientation > 8)
        reject("INVALID_TRANSFORM");
    return {
        toCanonical: affine(matrices[orientation - 1]), width: orientation >= 5 ? height : width, height: orientation >= 5 ? width : height
    };
}
export function canonicalFrame(width: number, height: number): Frame {
    dimensions(width, height);
    return frameSchema.parse({
        id: "canonical", width, height, toCanonical: [...IDENTITY], validPixels: [0, 0, width, height]
    });
}
/** Integer contain-fit with explicit padding; no crop. Rounding is floor, minimum one pixel. */
export function modelFrame(canonical: Frame, options: {
    id: string;
    width: number;
    height: number;
    padding: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    allowUpscale: boolean;
}) {
    if (!frameSchema.safeParse(canonical).success || canonical.toCanonical.some((v, i) => v !== IDENTITY[i]) || canonical.validPixels.some((v, i) => v !== [0, 0, canonical.width, canonical.height][i]))
        reject("INVALID_TRANSFORM");
    dimensions(options.width, options.height);
    const p = options.padding;
    if (![p.left, p.top, p.right, p.bottom].every(v => Number.isSafeInteger(v) && v >= 0))
        reject("INVALID_TRANSFORM");
    const availableWidth = options.width - p.left - p.right, availableHeight = options.height - p.top - p.bottom;
    if (availableWidth < 1 || availableHeight < 1)
        reject("INVALID_TRANSFORM");
    const scale = Math.min(availableWidth / canonical.width, availableHeight / canonical.height, options.allowUpscale ? Infinity : 1);
    const width = Math.max(1, Math.floor(canonical.width * scale)), height = Math.max(1, Math.floor(canonical.height * scale));
    const left = p.left + Math.floor((availableWidth - width) / 2), top = p.top + Math.floor((availableHeight - height) / 2);
    const toCanonical = affine([canonical.width / width, 0, -left * canonical.width / width, 0, canonical.height / height, -top * canonical.height / height, 0, 0, 1]);
    const parsed = frameSchema.safeParse({
        id: options.id, width: options.width, height: options.height, toCanonical, validPixels: [left, top, width, height]
    });
    if (!parsed.success)
        reject("INVALID_TRANSFORM");
    return {
        frame: parsed.data, fromCanonical: invert(toCanonical), resize: {
            width, height, left, top
        }, rounding: "floor-minimum-one" as const
    };
}
