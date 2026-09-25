import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const SOURCE_ID = "cliopatria-v0.2.0";
const SCENARIO_DATE = "1326-04-07";
const EXPECTED_COMMIT = "ad28a69";
const EXPECTED_BLOB = "cefab0f4b622e2e7fb3daf68d4f461f83991204c";
const EXPECTED_TAG = "v0.2.0";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}
function abs(value) {
  return path.resolve(root, value);
}
function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
function requireHex(value, label) {
  if (!/^[0-9a-f]{64}$/.test(value ?? "")) throw new Error(`${label} must be a 64-character SHA-256.`);
}

const manifestPath = abs(arg("--manifest", "data/gis/1326/acquisition-manifest.json"));
const acquisitionPathArg = arg("--acquisition");
const extractionPathArg = arg("--extraction-input");
const candidatesPathArg = arg("--candidates");
const requireCandidateReady = arg("--require-candidate-ready", "false") === "true";

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
if (manifest.scenarioDate !== SCENARIO_DATE) throw new Error("Scenario date mismatch.");
const source = manifest.sources?.find(item => item.id === SOURCE_ID);
if (!source) throw new Error("Cliopatria source is missing from acquisition manifest.");
if (source.snapshot?.sourceTag !== EXPECTED_TAG) throw new Error("Source tag drifted.");
if (source.snapshot?.immutableReference?.type !== "git-commit") throw new Error("Immutable reference must be a git commit.");
if (source.snapshot.immutableReference.sha !== EXPECTED_COMMIT) throw new Error("Immutable commit drifted.");
if (source.snapshot.immutableReference.sourceBlobSha !== EXPECTED_BLOB) throw new Error("Source blob SHA drifted.");
if (source.snapshot.sourceFile !== "cliopatria.geojson.zip") throw new Error("Source file drifted.");

const snapshotStatus = source.snapshot?.status;
if (snapshotStatus === "reference-pinned-not-acquired") {
  if (source.status !== "acquisition-required") throw new Error("Reference-pinned snapshot requires acquisition-required source status.");
  if (source.snapshot.rawSha256 !== null || source.snapshot.retainedArtifact !== null || source.snapshot.acquiredAt !== null) {
    throw new Error("Reference-pinned state cannot carry acquired byte metadata.");
  }
  if (acquisitionPathArg || extractionPathArg || candidatesPathArg) {
    throw new Error("Illegal transition: downstream artifact was supplied while snapshot is not acquired.");
  }
  console.log(JSON.stringify({
    sourceId: SOURCE_ID,
    scenarioDate: SCENARIO_DATE,
    state: "REFERENCE_PINNED_NOT_ACQUIRED",
    nextAllowedState: "ACQUIRED_UNVERIFIED",
    promotion: "BLOCKED"
  }, null, 2));
  process.exit(0);
}
if (snapshotStatus !== "acquired" || source.status !== "acquired") {
  throw new Error(`Unsupported Cliopatria acquisition state: ${snapshotStatus ?? "missing"}.`);
}
if (!source.snapshot.retainedArtifact) throw new Error("Acquired snapshot requires retained artifact.");
requireHex(source.snapshot.rawSha256, "Manifest rawSha256");
if (!source.snapshot.acquiredAt) throw new Error("Acquired snapshot requires acquiredAt.");

let state = "ACQUIRED_UNVERIFIED";
let acquisition = null;

if (acquisitionPathArg) {
  acquisition = JSON.parse(await fs.readFile(abs(acquisitionPathArg), "utf8"));
  if (acquisition.sourceId !== SOURCE_ID) throw new Error("Acquisition source ID mismatch.");
  if (acquisition.sourceTag !== EXPECTED_TAG) throw new Error("Acquisition source tag mismatch.");
  if (acquisition.immutableReference?.sha !== EXPECTED_COMMIT) throw new Error("Acquisition commit mismatch.");
  if (acquisition.immutableReference?.sourceBlobSha !== EXPECTED_BLOB) throw new Error("Acquisition blob SHA mismatch.");
  if (acquisition.retainedArtifact !== EXPECTED_ARCHIVE) throw new Error("Acquisition retained artifact mismatch.");
  if (acquisition.rawSha256 !== source.snapshot.rawSha256) throw new Error("Manifest/acquisition SHA mismatch.");
  if (acquisition.byteLength !== source.snapshot.byteLength) throw new Error("Manifest/acquisition byteLength mismatch.");
  requireHex(acquisition.rawSha256, "Acquisition rawSha256");

  const archivePath = abs(acquisition.retainedArtifact);
  const archive = await fs.readFile(archivePath);
  if (archive.length !== acquisition.byteLength) throw new Error("Retained archive byteLength mismatch.");
  if (sha256(archive) !== acquisition.rawSha256) throw new Error("Retained archive SHA-256 mismatch.");
  state = "VERIFIED";
}

if (extractionPathArg) {
  if (state !== "VERIFIED") throw new Error("Illegal transition: extraction requires a verified acquisition record.");
  const extraction = JSON.parse(await fs.readFile(abs(extractionPathArg), "utf8"));
  if (extraction.sourceId !== SOURCE_ID || extraction.scenarioDate !== SCENARIO_DATE) throw new Error("Extraction identity mismatch.");
  if (extraction.promotion !== "BLOCKED_UNTIL_TEMPORAL_EXTRACTION_RECONCILIATION_REVIEW") throw new Error("Extraction must remain promotion-blocked.");
  if (extraction.archive?.acquisitionRecord !== abs(acquisitionPathArg).replace(/\\/g, "/")) throw new Error("Extraction must bind the supplied acquisition record.");
  if (extraction.archive?.rawSha256 !== acquisition.rawSha256) throw new Error("Extraction archive SHA does not match acquisition.");
  if (extraction.member?.format !== "GeoJSON" || extraction.member?.featureCollectionValidated !== true) throw new Error("Extraction member is not a validated GeoJSON FeatureCollection.");
  requireHex(extraction.member.sha256, "Extraction member SHA-256");
  const extractedPath = abs(extraction.member.extractedPath);
  const extracted = await fs.readFile(extractedPath);
  if (sha256(extracted) !== extraction.member.sha256) throw new Error("Extracted GeoJSON SHA-256 mismatch.");
  state = "EXTRACTED";
}

if (candidatesPathArg || requireCandidateReady) {
  if (!candidatesPathArg) throw new Error("Candidate-ready validation requires --candidates.");
  if (state !== "EXTRACTED") throw new Error("Illegal transition: candidate-ready requires a validated extraction input.");
  const candidates = JSON.parse(await fs.readFile(abs(candidatesPathArg), "utf8"));
  if (candidates.source?.sourceId !== SOURCE_ID || candidates.scenarioDate !== SCENARIO_DATE) throw new Error("Candidate packet identity mismatch.");
  if (candidates.promotion !== "BLOCKED") throw new Error("Candidate packet must remain promotion-blocked.");
  if (candidates.source?.extractionInputPath !== undefined && extractionPathArg) {
    const expected = abs(extractionPathArg).replace(/\\/g, "/");
    if (candidates.source.extractionInputPath !== expected) throw new Error("Candidate packet extraction input binding drifted.");
  }
  requireHex(candidates.candidatePacketSha256, "Candidate packet SHA-256");
  const recomputed = sha256(Buffer.from(JSON.stringify(candidates.candidates), "utf8"));
  if (recomputed !== candidates.candidatePacketSha256) throw new Error("Candidate packet SHA-256 mismatch.");
  state = "CANDIDATE_READY";
}

const next = {
  ACQUIRED_UNVERIFIED: "VERIFIED",
  VERIFIED: "EXTRACTED",
  EXTRACTED: "CANDIDATE_READY",
  CANDIDATE_READY: "REVIEW_QUEUE_READY"
}[state] ?? "REVIEW_QUEUE_READY";

console.log(JSON.stringify({
  sourceId: SOURCE_ID,
  scenarioDate: SCENARIO_DATE,
  state,
  nextAllowedState: next,
  suppliedArtifacts: {
    acquisitionRecord: Boolean(acquisitionPathArg),
    extractionInput: Boolean(extractionPathArg),
    candidatePacket: Boolean(candidatesPathArg)
  },
  promotion: "BLOCKED"
}, null, 2));
