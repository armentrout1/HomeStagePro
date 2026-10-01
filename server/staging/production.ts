import { supabase } from "../supabase";
import { jobBucket, storagePrefix } from "../jobFiles";
import { makeImageThumbnail } from "../utils/imageThumbnail";
import { legacyProvider } from "./providers/legacy";
import { createStagingService } from "./service";
import type { StagingService } from "../../shared/staging/contracts";

// Only the existing, explicitly limited engine is wired into the application.
// Benchmark candidates cannot be enabled through a customer request or env override.
export const stageRoom: StagingService = async input => {
  const result = await createStagingService({
    provider: legacyProvider,
    artifacts: {
      bucket: jobBucket, prefix: storagePrefix(),
      async put(path, bytes, mime) {
        const { error } = await supabase.storage.from(jobBucket).upload(path, bytes, { contentType: mime, upsert: true });
        if (error) throw new Error("Could not persist the private staging result");
      },
    },
    thumbnail: makeImageThumbnail,
  })(input);
  if (result.metrics) console.info(JSON.stringify({ event: "staging_quality", requestId: input.requestId, ...result.metrics }));
  return result;
};
