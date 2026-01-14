import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, "../client/public/home");

const images = [
  {
    filename: "article-1.webp",
    width: 800,
    height: 533,
    startColor: "#dbeafe",
    endColor: "#bfdbfe"
  },
  {
    filename: "article-2.webp",
    width: 800,
    height: 533,
    startColor: "#fde68a",
    endColor: "#fcd34d"
  },
  {
    filename: "article-3.webp",
    width: 800,
    height: 533,
    startColor: "#fbcfe8",
    endColor: "#f472b6"
  },
  {
    filename: "testimonial-1.webp",
    width: 128,
    height: 128,
    startColor: "#e0f2fe",
    endColor: "#bae6fd"
  },
  {
    filename: "testimonial-2.webp",
    width: 128,
    height: 128,
    startColor: "#fecaca",
    endColor: "#fda4af"
  }
];

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function createGradientBuffer(width, height, startHex, endHex) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  const buffer = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    const ratio = height === 1 ? 0 : y / (height - 1);
    const r = Math.round(start.r * (1 - ratio) + end.r * ratio);
    const g = Math.round(start.g * (1 - ratio) + end.g * ratio);
    const b = Math.round(start.b * (1 - ratio) + end.b * ratio);

    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      buffer[offset] = r;
      buffer[offset + 1] = g;
      buffer[offset + 2] = b;
    }
  }

  return buffer;
}

await fs.mkdir(outDir, { recursive: true });

await Promise.all(
  images.map(async ({ filename, width, height, startColor, endColor }) => {
    const gradient = createGradientBuffer(width, height, startColor, endColor);
    const quality = filename.startsWith("article") ? 82 : 78;

    await sharp(gradient, {
      raw: {
        width,
        height,
        channels: 3
      }
    })
      .webp({ quality })
      .toFile(path.join(outDir, filename));
  })
);

console.log(`Generated ${images.length} WebP placeholders in ${outDir}`);
