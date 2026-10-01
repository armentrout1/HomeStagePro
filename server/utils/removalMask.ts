import sharp from "sharp";
export type RemovalPolygon = Array<{
    x: number;
    y: number;
}>;
/** Intersect conservative object bounds with user alpha. Fully protected pixels stay protected. */
export async function createRemovalMask(userMask: Buffer, polygons: RemovalPolygon[]): Promise<Buffer> {
    if (!polygons.length || polygons.length > 24 || polygons.some(p => p.length < 3 || p.length > 40 || p.some(v => !Number.isFinite(v.x) || !Number.isFinite(v.y) || v.x < 0 || v.x > 1000 || v.y < 0 || v.y > 1000)))
        throw new Error("INVALID_REMOVAL_POLYGONS");
    const { data, info } = await sharp(userMask, { limitInputPixels: 40000000 }).ensureAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    // A small outward margin accommodates localization uncertainty and contact shadows.
    // It is clipped by user alpha below, including partially protected pixels.
    const margin = Math.min(32, Math.max(2, Math.round(Math.min(info.width, info.height) * .035)));
    const shapes = polygons.map(p => {
        const xs = p.map(v => v.x / 1000 * info.width), ys = p.map(v => v.y / 1000 * info.height);
        const x = Math.min(...xs), y = Math.min(...ys);
        return `<rect x="${x}" y="${y}" width="${Math.max(...xs) - x}" height="${Math.max(...ys) - y}"/>`;
    }).join("");
    const silhouette = await sharp(Buffer.from(`<svg width="${info.width}" height="${info.height}" xmlns="http://www.w3.org/2000/svg"><g fill="white" stroke="white" stroke-width="${margin * 2}" stroke-linejoin="round">${shapes}</g></svg>`)).ensureAlpha().extractChannel(3).raw().toBuffer();
    let editable = 0;
    for (let p = 0; p < silhouette.length; p++) {
        const alpha = 255 - Math.round((255 - data[p * 4 + 3]) * silhouette[p] / 255);
        data[p * 4] = data[p * 4 + 1] = data[p * 4 + 2] = 0;
        data[p * 4 + 3] = alpha;
        if (alpha < 255)
            editable++;
    }
    if (!editable)
        throw new Error("NO_REMOVAL_AREA");
    return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}
