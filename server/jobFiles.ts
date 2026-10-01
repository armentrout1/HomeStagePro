import { createHash } from "node:crypto";
import { supabase } from "./supabase";
import sharp from "sharp";

export const jobBucket = "roomstager-images";
export const storagePrefix = () => {
  // Never infer production from NODE_ENV: Railway staging also uses production builds.
  const origin = new URL(process.env.PUBLIC_APP_URL || "http://localhost").origin;
  return `roomstager-v2/${createHash("sha256").update(origin).digest("hex").slice(0,16)}`;
};
export const isOwnedStoragePath = (path: string) => path.startsWith(`${storagePrefix()}/`) && !path.includes("..");
export interface JobFiles {
  put(path: string, value: { image: string; mask?: string }): Promise<void>;
  get(path: string, hasMask: boolean): Promise<{ image: string; mask?: string }>;
  remove(path: string): Promise<void>;
}
export const jobFiles: JobFiles = {
  async put(path, value) {
    if (!isOwnedStoragePath(path)) throw new Error("Invalid input path");
    const source = Buffer.from(value.image, "base64");
    const metadata = await sharp(source).metadata();
    const mime = metadata.format === "jpeg" ? "image/jpeg" : metadata.format === "webp" ? "image/webp" : "image/png";
    const { error } = await supabase.storage.from(jobBucket).upload(`${path}/source`, source, { contentType: mime, upsert: true });
    if (error) throw new Error("Could not persist the private job photo");
    if (value.mask) {
      const result = await supabase.storage.from(jobBucket).upload(`${path}/mask`, Buffer.from(value.mask, "base64"), { contentType: "image/png", upsert: true });
      if (result.error) throw new Error("Could not persist the private job selection");
    }
  },
  async get(path, hasMask) {
    if (!isOwnedStoragePath(path)) throw new Error("Invalid input path");
    const { data, error } = await supabase.storage.from(jobBucket).download(`${path}/source`);
    if (error || !data) throw new Error("Could not load the private job input");
    const image = Buffer.from(await data.arrayBuffer()).toString("base64");
    if (!hasMask) return { image };
    const selection = await supabase.storage.from(jobBucket).download(`${path}/mask`);
    if (selection.error || !selection.data) throw new Error("Could not load the private job selection");
    return { image, mask: Buffer.from(await selection.data.arrayBuffer()).toString("base64") };
  },
  async remove(path) {
    if (!isOwnedStoragePath(path)) throw new Error("Invalid input path");
    const { error } = await supabase.storage.from(jobBucket).remove([`${path}/source`, `${path}/mask`]);
    if (error) throw new Error("Could not remove temporary job input");
  },
};
