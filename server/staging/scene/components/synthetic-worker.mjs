// Fixed synthetic worker only. This is not a sandbox for arbitrary/unreviewed code.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dgram from "node:dgram";
import childProcess from "node:child_process";

const deny = () => { throw new Error("COMPONENT_NETWORK_FORBIDDEN"); };
globalThis.fetch = deny;
globalThis.WebSocket = class { constructor() { deny(); } };
http.request = http.get = https.request = https.get = deny;
net.Socket.prototype.connect = deny;
net.Server.prototype.listen = deny;
tls.connect = dgram.createSocket = deny;
for (const method of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) childProcess[method] = deny;
syncBuiltinESMExports();
// Windows startup and native packages can synthesize additional environment entries.
// Scrub at the worker boundary as well as providing an explicit spawn environment.
const scrubEnvironment = () => {
    for (const key of Object.keys(process.env)) if (!["NODE_ENV", "TZ", "SystemRoot"].includes(key)) delete process.env[key];
};
scrubEnvironment();
const { default: sharp } = await import("sharp");
scrubEnvironment();
const buffers = [];
let count = 0;
for await (const chunk of process.stdin) {
    count += chunk.length;
    if (count > 1024 * 1024) process.exit(2);
    buffers.push(chunk);
}
const request = JSON.parse(Buffer.concat(buffers).toString("utf8"));
const { input, run, scenario, dependencies } = request;
const send = value => process.stdout.write(JSON.stringify(value));
if (scenario === "probe") {
    send({ pid: process.pid, env: Object.keys(process.env).sort() });
} else if (scenario === "hang" || scenario === "resist-term") {
    // Test observes this PID on the binary channel before requesting cancellation.
    fs.writeSync(3, Buffer.from(String(process.pid)));
    if (scenario === "resist-term") process.on("SIGTERM", () => {});
    while (true) { /* synchronous synthetic native-work analogue */ }
} else if (scenario === "stdout-limit" || scenario === "stderr-limit" || scenario === "binary-limit") {
    const fd = scenario === "stdout-limit" ? 1 : scenario === "stderr-limit" ? 2 : 3;
    while (true) fs.writeSync(fd, Buffer.alloc(4096, 65));
} else if (scenario?.startsWith("network-")) {
    const calls = { http: () => http.get("http://127.0.0.1:9"), https: () => https.get("https://127.0.0.1:9"), fetch: () => fetch("http://127.0.0.1:9"), socket: () => net.connect(9, "127.0.0.1"), tls: () => tls.connect(9), udp: () => dgram.createSocket("udp4"), child: () => childProcess.spawn(process.execPath, []) };
    try { calls[scenario.slice(8)](); send({ escaped: true }); }
    catch { send({ status: "failed", run: { ...run, status: "failed", failureCode: "COMPONENT_NETWORK_FORBIDDEN" }, code: "COMPONENT_NETWORK_FORBIDDEN" }); }
} else {
    const confidence = { state: "estimated", rawScore: 0.999, scoreType: "synthetic", calibratedProbability: null, calibrationId: null, evidenceIds: [], reasons: ["synthetic-only"] };
    const frames = [input.frame], artifacts = [], binary = [];
    const add = (bytes, metadata) => {
        const ref = { id: `temporary-${artifacts.length}`, key: `temporary-${artifacts.length}`, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, ...metadata };
        artifacts.push(ref); binary.push(bytes); return ref;
    };
    const raster = { frameId: input.frame.id, width: input.frame.width, height: input.frame.height, channels: 1, dtype: "uint8", encoding: "png", mediaType: "image/png" };
    const mask = async () => add(await sharp(Buffer.alloc(raster.width * raster.height, 255), { raw: { width: raster.width, height: raster.height, channels: 1 } }).toColourspace("b-w").png().toBuffer(), { ...raster, semantics: "binary-membership" });
    let output;
    if (run.task === "detection" || run.task === "segmentation") {
        const shape = run.task === "detection" ? { kind: "polygon", polygon: { frameId: input.frame.id, space: "normalized-image", exterior: [[0,0],[1,0],[1,1],[0,1]], holes: [] } } : { kind: "mask", mask: await mask(), outline: null };
        output = { task: run.task, elements: [{ id: `${run.id}-floor`, class: "floor", subtype: null, shape, visibility: "visible", permanence: "unknown", detectionConfidence: confidence, geometryConfidence: confidence, boundaryUncertaintyPixels: null, permanenceConfidence: confidence, componentRunIds: [run.id], relatedElementIds: [], opening: null }], coverage: { floor: { inspection: "partial", observedCount: 1, absence: "not-established", confidence }, window: { inspection: "unsupported", observedCount: 0, absence: "not-established", confidence: { ...confidence, state: "unknown", rawScore: null, scoreType: null } } } };
    } else if (run.task === "depth") {
        const bytes = Buffer.alloc(raster.width * raster.height * 4);
        for (let i = 0; i < bytes.length; i += 4) bytes.writeFloatLE(1 + i / 4, i);
        output = { task: "depth", depth: { values: add(bytes, { ...raster, dtype: "float32-le", encoding: "raw-row-major", mediaType: "application/octet-stream" }), valid: await mask(), representation: "relative-depth", largerMeans: "farther", unit: "relative", calibrationEvidenceId: null, uncertainty: null, confidence, componentRunId: run.id } };
    } else if (run.task === "edges") {
        const strength = add(await sharp(Buffer.alloc(raster.width * raster.height, 128), { raw: { width: raster.width, height: raster.height, channels: 1 } }).toColourspace("b-w").png().toBuffer(), raster);
        output = { task: "edges", edges: { strength, structuralLines: [], confidence, componentRunId: run.id } };
    } else {
        const segmentation = dependencies.find(d => d.output.task === "segmentation");
        output = { task: "floor-fit", floor: { supportElementIds: segmentation.output.elements.map(e => e.id), cameraFrameId: "canonical-camera", normal: [0,1,0], offset: -1, unit: "relative", floorBasis: { originCamera: [0,1,0], xAxisCamera: [1,0,0], yAxisCamera: [0,0,1] }, floorToCanonicalPixels: null, cameraIntrinsics: null, calibrationEvidenceId: null, reprojectionErrorPixels: null, scaleRelativeErrorBound: null, confidence, alternatives: 0 } };
    }
    const result = { status: "completed", run, output, frames, artifacts };
    if (scenario === "malformed") result.extra = "not allowed";
    if (scenario === "wrong-task") output.task = "floor-fit";
    if (scenario === "wrong-source") run.inputSha256 = "0".repeat(64);
    if (scenario === "wrong-version") run.adapterVersion = "wrong";
    if (scenario === "wrong-frame") frames[0].toCanonical[2] = 1;
    if (scenario === "verified") { confidence.state = "verified"; confidence.evidenceIds = ["self-approved"]; }
    if (scenario === "calibrated") { confidence.calibratedProbability = 1; confidence.calibrationId = "self-approved"; }
    if (scenario === "absence") output.coverage.floor.absence = "independently-reviewed";
    if (scenario === "unsupported") output.coverage.window.inspection = "complete-visible-frame";
    if (scenario === "trusted-context") result.trustedContext = {};
    if (scenario === "bad-reference") output.elements[0].relatedElementIds = ["missing"];
    if (scenario === "bad-artifact") artifacts[0].sha256 = "0".repeat(64);
    if (scenario === "bad-dimensions") artifacts[0].width += 1;
    if (scenario === "foreign-artifact") output.elements[0].shape.mask = { ...artifacts[0], id: "foreign-id", key: "foreign-key" };
    if (scenario === "duplicate-frame") frames.push({ ...input.frame });
    if (scenario === "unknown-frame") output.elements[0].shape.polygon.frameId = "unknown-frame";
    if (scenario === "wrong-count") output.coverage.floor.observedCount = 0;
    if (scenario === "unsupported-element") output.elements[0].class = "window";
    if (scenario === "failure") { send({ status: "failed", run: { ...run, status: "failed", failureCode: "COMPONENT_EXECUTION_FAILED" }, code: "COMPONENT_EXECUTION_FAILED" }); }
    else { for (const bytes of binary) fs.writeSync(3, bytes); send(result); }
}
