import { z } from "zod";
import { idSchema, sha256Schema, type ArtifactRef } from "../../../shared/staging/scene-map";
import { sha256, type SceneArtifactStore } from "./artifacts";
import { reject } from "./errors";
import { freeze } from "./components/types";
const text = z.string().min(1).max(512);
const permission = z.enum(["yes", "no", "unclear"]);
const terms = z.object({
    identifier: text, category: z.enum(["commercial-compatible", "noncommercial", "unknown"]),
    commercialEvaluation: permission, commercialHosting: permission, redistribution: permission,
    obligations: z.array(text).max(64), restrictions: z.array(text).max(64), compatible: z.boolean(),
    snapshot: z.object({
        evidenceId: idSchema, sha256: sha256Schema, date: z.string().date()
    }).strict(),
}).strict();
export const licenseRecordSchema = z.object({
    id: idSchema, artifactName: idSchema, adapterId: idSchema, adapterVersion: text,
    upstreamRepository: text, revision: z.string().regex(/^[a-f0-9]{40}$/), sourceUrl: z.string().url().max(1024), sha256: sha256Schema,
    synthetic: z.literal(true), codeSha256: sha256Schema, codeLicense: terms, weightsLicense: terms.nullable(), noWeights: z.boolean(),
    lineage: z.array(z.object({
        operation: text, revision: z.string().regex(/^[a-f0-9]{40}$/), sha256: sha256Schema
    }).strict()).max(64),
    reviewer: text, reviewDate: z.string().date(), decision: z.enum(["pending", "approved-for-evaluation", "approved-for-production", "rejected"]),
}).strict().refine(v => v.noWeights === (v.weightsLicense === null), "Weight license required separately");
export type LicenseRecord = z.infer<typeof licenseRecordSchema>;
export type LicenseUse = "evaluation" | "production";
/** Trusted operator decisions, not adapter-issued declarations and not legal advice. Synthetic records only in R1.3. */
export class ComponentLicenseRegistry {
    private records = new Map<string, LicenseRecord>();
    register(value: unknown, evidence: ReadonlyMap<string, Uint8Array>): void {
        const parsed = licenseRecordSchema.safeParse(value);
        if (!parsed.success || this.records.has(parsed.data.id))
            reject("COMPONENT_LICENSE_BLOCKED");
        const record = parsed.data;
        for (const license of [record.codeLicense, record.weightsLicense]) {
            if (!license)
                continue;
            const bytes = evidence.get(license.snapshot.evidenceId);
            if (!bytes || bytes.byteLength > 65536 || sha256(bytes) !== license.snapshot.sha256)
                reject("COMPONENT_LICENSE_BLOCKED");
        }
        this.records.set(record.id, freeze(record));
    }
    approved(id: string, adapterId: string, version: string, use: LicenseUse, redistribute = false): LicenseRecord {
        const r = this.records.get(id);
        if (!r || r.adapterId !== adapterId || r.adapterVersion !== version || !["evaluation", "production"].includes(use))
            reject("COMPONENT_LICENSE_BLOCKED");
        if (r.decision !== "approved-for-production" && !(use === "evaluation" && r.decision === "approved-for-evaluation"))
            reject("COMPONENT_LICENSE_BLOCKED");
        for (const license of [r.codeLicense, r.weightsLicense]) {
            if (!license)
                continue;
            if (license.category !== "commercial-compatible" || !license.compatible || license.commercialEvaluation !== "yes" ||
                (use === "production" && license.commercialHosting !== "yes") || (redistribute && license.redistribution !== "yes"))
                reject("COMPONENT_LICENSE_BLOCKED");
        }
        return r;
    }
}
/** Offline acquisition boundary: accepts already-obtained synthetic JSON bytes; contains no URL fetcher. */
export class SyntheticArtifactCache {
    private available = new Map<string, {
        revision: string;
        ref: ArtifactRef;
    }>();
    constructor(private readonly store: SceneArtifactStore) { }
    async install(record: LicenseRecord, bytes: Uint8Array, revision: string, licenses: ComponentLicenseRegistry): Promise<void> {
        const approved = licenses.approved(record.id, record.adapterId, record.adapterVersion, "evaluation");
        if (approved !== record || record.noWeights || revision !== record.revision || sha256(bytes) !== record.sha256)
            reject("COMPONENT_LICENSE_BLOCKED");
        try {
            const ref = await this.store.put(bytes, { mediaType: "application/json" });
            await this.store.read(ref);
            this.available.set(record.id, { revision, ref });
        }
        catch {
            reject("COMPONENT_LICENSE_BLOCKED");
        }
    }
    async verify(record: LicenseRecord): Promise<ArtifactRef> {
        const local = this.available.get(record.id);
        if (!local || local.revision !== record.revision || local.ref.sha256 !== record.sha256)
            reject("COMPONENT_LICENSE_BLOCKED");
        try {
            const bytes = await this.store.read(local.ref);
            if (sha256(bytes) !== record.sha256)
                reject("COMPONENT_LICENSE_BLOCKED");
            return local.ref;
        }
        catch {
            reject("COMPONENT_LICENSE_BLOCKED");
        }
    }
}
