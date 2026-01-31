import sharp from "sharp";

// Auto mask v1: conservative center-editable region.
export type AutoMaskOptions = {
  topPct?: number;
  bottomPct?: number;
  sidePct?: number;
  cornerRadiusPct?: number;
};

const DEFAULT_OPTIONS: Required<AutoMaskOptions> = {
  topPct: 0.38,
  bottomPct: 0.08,
  sidePct: 0.16,
  cornerRadiusPct: 0.04,
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

export async function generateAutoMaskPng(
  width: number,
  height: number,
  opts: AutoMaskOptions = {}
): Promise<Buffer> {
  if (width <= 0 || height <= 0) {
    throw new Error("Width and height must be positive integers");
  }

  const {
    topPct = DEFAULT_OPTIONS.topPct,
    bottomPct = DEFAULT_OPTIONS.bottomPct,
    sidePct = DEFAULT_OPTIONS.sidePct,
    cornerRadiusPct = DEFAULT_OPTIONS.cornerRadiusPct,
  } = opts;

  const sideMarginMax = Math.floor((width - 1) / 2);
  const sideMargin = clamp(Math.round(clamp(sidePct, 0, 0.5) * width), 0, sideMarginMax);
  const rectWidth = Math.max(1, width - sideMargin * 2);

  const topMargin = clamp(Math.round(clamp(topPct, 0, 0.9) * height), 0, height - 1);
  const bottomMarginLimit = Math.max(height - topMargin - 1, 0);
  const bottomMargin = clamp(
    Math.round(clamp(bottomPct, 0, 0.9) * height),
    0,
    bottomMarginLimit
  );
  const rectHeight = Math.max(1, height - topMargin - bottomMargin);

  const cornerRadius = clamp(
    Math.round(cornerRadiusPct * Math.min(width, height)),
    0,
    Math.floor(Math.min(rectWidth, rectHeight) / 2)
  );

  const roundedRectSvg = Buffer.from(`
    <svg width="${rectWidth}" height="${rectHeight}" viewBox="0 0 ${rectWidth} ${rectHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${rectWidth}" height="${rectHeight}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white" />
    </svg>
  `);

  const roundedRectPng = await sharp(roundedRectSvg).png().toBuffer();

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      {
        input: roundedRectPng,
        left: sideMargin,
        top: topMargin,
      },
    ])
    .png()
    .toBuffer();
}
