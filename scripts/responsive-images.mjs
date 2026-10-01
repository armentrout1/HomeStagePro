import sharp from "sharp";
for (const name of ["living-1-before", "living-1-after"]) {
  for (const width of [480, 960]) {
    await sharp(`client/public/staging-examples/${name}.webp`).resize({ width }).webp({ quality: 82 }).toFile(`dist/public/staging-examples/${name}-${width}.webp`);
  }
}
