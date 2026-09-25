import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const SOURCE_ID = "cliopatria-v0.2.0";
const SCENARIO_DATE = "1326-04-07";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}
function required(name) {
  const value = arg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}
function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve(stdout) : reject(new Error(`${command} failed with code ${code}: ${stderr.trim()}`)));
  });
}

const archivePath = required("--archive");
const acquisitionPath = path.resolve(process.cwd(), arg("--acquisition", "data/build/gis/1326/source-snapshots/cliopatria-v0.2.0.acquisition.json"));
const manifestPath = path.resolve(process.cwd(), arg("--manifest", "data/gis/1326/acquisition-manifest.json"));
const outputPath = path.resolve(process.cwd(), arg("--output", "data/build/gis/1326/cliopatria-extraction-input.json"));

const acquisition = JSON.parse(await fs.readFile(acquisitionPath, "utf8"));
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const source = manifest.sources?.find(item => item.id === SOURCE_ID);

if (acquisition.sourceId !== SOURCE_ID) throw new Error("Acquisition source ID mismatch.");
if (acquisition.immutableReference?.sha !== "ad28a69") throw new Error("Immutable source commit mismatch.");
if (acquisition.immutableReference?.sourceBlobSha !== "cefab0f4b622e2e7fb3daf68d4f461f83991204c") throw new Error("Immutable source blob mismatch.");
if (acquisition.promotion !== "BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW") throw new Error("Acquisition must remain promotion-blocked.");
if (source?.snapshot?.status !== "acquired") throw new Error("Tracked acquisition manifest does not contain a verified acquired snapshot.");

const archive = await fs.readFile(archivePath);
const archiveSha = sha256(archive);
if (archiveSha !== acquisition.rawSha256) throw new Error(`Archive SHA-256 mismatch: expected ${acquisition.rawSha256}, got ${archiveSha}`);
if (archive.length !== acquisition.byteLength) throw new Error("Archive byte length mismatch.");

let listing;
try {
  listing = await run("tar", ["-tf", archivePath]);
} catch (error) {
  throw new Error(`Deterministic archive inspection requires the system 'tar' command: ${error.message}`);
}
const members = listing.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
const geojsonMembers = members.filter(value => value.toLowerCase().endsWith(".geojson"));
if (geojsonMembers.length !== 1) {
  throw new Error(`Expected exactly one GeoJSON member in Cliopatria archive; found ${geojsonMembers.length}: ${geojsonMembers.join(", ")}`);
}
const member = geojsonMembers[0];

const extractDir = path.resolve(process.cwd(), "data/build/gis/1326/source-snapshots/cliopatria-v0.2.0");
await fs.rm(extractDir, { recursive: true, force: true });
await fs.mkdir(extractDir, { recursive: true });
await run("tar", ["-xf", archivePath, "-C", extractDir, member]);

const extractedPath = path.join(extractDir, member);
const extracted = await fs.readFile(extractedPath, "utf8");
JSON.parse(extracted);
const extractedSha = sha256(Buffer.from(extracted, "utf8"));

const record = {
  schemaVersion: 1,
  sourceId: SOURCE_ID,
  scenarioDate: SCENARIO_DATE,
  archive: {
    path: archivePath.replace(/\\/g, "/"),
    rawSha256: archiveSha,
    byteLength: archive.length,
    acquisitionRecord: acquisitionPath.replace(/\\/g, "/")
  },
  member: {
    path: member,
    extractedPath: extractedPath.replace(/\\/g, "/"),
    sha256: extractedSha,
    format: "GeoJSON",
    featureCollectionValidated: true
  },
  immutableReference: acquisition.immutableReference,
  extractionPolicy: "Exactly one .geojson archive member; no inferred member selection.",
  promotion: "BLOCKED_UNTIL_TEMPORAL_EXTRACTION_RECONCILIATION_REVIEW"
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(record, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  sourceId: SOURCE_ID,
  scenarioDate: SCENARIO_DATE,
  archiveSha256: archiveSha,
  member,
  extractedSha256: extractedSha,
  outputPath,
  promotion: record.promotion
}, null, 2));
