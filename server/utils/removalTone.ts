import sharp from "sharp";
/**
 * Fit a smooth RGB offset to protected boundary pixels, without copying old
 * furniture into the edit. Harmonic interpolation on a coarse grid corrects
 * broad lighting steps; high-frequency generated texture remains intact.
 * This is only an internal edit adjustment; the caller restores all protected
 * pixels exactly and independently reviews the final image.
 */
export async function matchBoundaryTone(source: Buffer, output: Buffer, maskRgba: Buffer, width: number, height: number) {
    const cell = 16, gw = Math.ceil(width / cell), gh = Math.ceil(height / cell), size = gw * gh;
    const counts = new Uint32Array(size), fixed = new Uint8Array(size), field = new Float32Array(size * 3);
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const p = y * width + x;
            if (maskRgba[p * 4 + 3] !== 255)
                continue;
            const g = Math.floor(y / cell) * gw + Math.floor(x / cell);
            counts[g]++;
            for (let c = 0; c < 3; c++)
                field[g * 3 + c] += source[p * 3 + c] - output[p * 3 + c];
        }
    let known = 0;
    for (let g = 0; g < size; g++)
        if (counts[g]) {
            fixed[g] = 1;
            known++;
            for (let c = 0; c < 3; c++)
                field[g * 3 + c] = Math.max(-64, Math.min(64, field[g * 3 + c] / counts[g]));
        }
    if (!known)
        return;
    // Fixed iteration and grid caps bound work even for maximum-size uploads.
    // Red/black relaxation propagates boundary color without any source texture
    // from editable pixels (which could contain the furniture being removed).
    for (let iteration = 0; iteration < 240; iteration++) {
        let delta = 0;
        for (let parity = 0; parity < 2; parity++)
            for (let y = 0; y < gh; y++)
                for (let x = (y + parity) % 2; x < gw; x += 2) {
                    const g = y * gw + x;
                    if (fixed[g])
                        continue;
                    for (let c = 0; c < 3; c++) {
                        let sum = 0, n = 0;
                        if (x) {
                            sum += field[(g - 1) * 3 + c];
                            n++;
                        }
                        if (x + 1 < gw) {
                            sum += field[(g + 1) * 3 + c];
                            n++;
                        }
                        if (y) {
                            sum += field[(g - gw) * 3 + c];
                            n++;
                        }
                        if (y + 1 < gh) {
                            sum += field[(g + gw) * 3 + c];
                            n++;
                        }
                        if (n) {
                            const next = sum / n;
                            delta = Math.max(delta, Math.abs(next - field[g * 3 + c]));
                            field[g * 3 + c] = next;
                        }
                    }
                }
        if (delta < .02)
            break;
    }
    const encoded = Buffer.from(field.map(v => Math.round(v) + 128));
    const correction = await sharp(encoded, { raw: { width: gw, height: gh, channels: 3 } }).resize(width, height, { kernel: 'cubic' }).raw().toBuffer();
    for (let p = 0; p < width * height; p++)
        if (maskRgba[p * 4 + 3] < 255)
            for (let c = 0; c < 3; c++) {
                const i = p * 3 + c;
                output[i] = Math.max(0, Math.min(255, output[i] + correction[i] - 128));
            }
}
