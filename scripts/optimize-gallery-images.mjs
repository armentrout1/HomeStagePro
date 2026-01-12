import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const galleryDir = path.resolve(__dirname, "..", "client", "public", "gallery");

async function optimizeAfterImages() {
  const entries = await readdir(galleryDir, { withFileTypes: true });
  const targetFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith("-after.jpg"))
    .map((entry) => entry.name);

  if (targetFiles.length === 0) {
    console.log("No '-after.jpg' files found to optimize.");
    return;
  }

  await Promise.all(
    targetFiles.map(async (fileName) => {
      const sourcePath = path.join(galleryDir, fileName);
      const outputName = `${path.parse(fileName).name}.webp`;
      const outputPath = path.join(galleryDir, outputName);

      console.log(`Optimizing ${fileName} → ${outputName}`);

      await sharp(sourcePath)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      console.log(`Created ${outputName}`);
    })
  );

  console.log("Optimization complete.");
}

optimizeAfterImages().catch((error) => {
  console.error("Failed to optimize gallery images:", error);
  process.exitCode = 1;
});
