import { stableJson, type SceneArtifact } from "../artifacts";
import { reject } from "../errors";
/** Multiple scene hypotheses may reference the same content-addressed mask. Publish its exact ref once. */
export function uniqueMaskArtifacts(artifacts: readonly SceneArtifact[]): SceneArtifact[] {
 const unique = new Map<string, SceneArtifact>();
 for (const artifact of artifacts) {
  const previous = unique.get(artifact.id);
  if (previous && !stableJson(previous).equals(stableJson(artifact))) reject("COMPONENT_ARTIFACT_INVALID");
  unique.set(artifact.id, artifact);
 }
 return Array.from(unique.values());
}
