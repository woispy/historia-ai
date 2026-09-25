import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const inputPath = path.resolve(root, process.argv[2] ?? "data/build/gis/1326/cliopatria-extraction-input.json");
const record = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

assert(record.schemaVersion === 1, "Extraction input schema must be v1.");
assert(record.sourceId === "cliopatria-v0.2.0", "Extraction input source ID mismatch.");
assert(record.scenarioDate === "1326-04-07", "Extraction input scenario date mismatch.");
assert(record.immutableReference?.type === "git-commit", "Extraction input must retain an immutable git reference.");
assert(record.immutableReference?.sha === "ad28a69", "Extraction input immutable commit drifted.");
assert(record.immutableReference?.sourceBlobSha === "cefab0f4b622e2e7fb3daf68d4f461f83991204c", "Extraction input source blob SHA drifted.");
assert(record.archive?.path, "Extraction input must retain archive path.");
assert(/^[0-9a-f]{64}$/.test(record.archive.rawSha256 ?? ""), "Extraction input archive SHA-256 is invalid.");
assert(Number.isInteger(record.archive.byteLength) && record.archive.byteLength > 0, "Extraction input archive byte length is invalid.");
assert(record.archive.acquisitionRecord, "Extraction input must retain its acquisition record path.");
assert(record.member?.format === "GeoJSON", "Extraction input member format must be GeoJSON.");
assert(record.member?.featureCollectionValidated === true, "Extraction input must record FeatureCollection validation.");
assert(typeof record.member.path === "string" && record.member.path.length > 0, "Extraction input member path is missing.");
assert(!path.posix.isAbsolute(record.member.path) && !record.member.path.split("/").includes(".."), "Extraction input member path is unsafe.");
assert(typeof record.member.extractedPath === "string" && record.member.extractedPath.length > 0, "Extraction input extracted path is missing.");
assert(/^[0-9a-f]{64}$/.test(record.member.sha256 ?? ""), "Extraction input extracted GeoJSON SHA-256 is invalid.");
assert(record.extractionPolicy === "Exactly one .geojson archive member; cross-platform extraction; no inferred member selection.", "Extraction policy drifted.");
assert(record.promotion === "BLOCKED_UNTIL_TEMPORAL_EXTRACTION_RECONCILIATION_REVIEW", "Extraction input must remain promotion-blocked.");

const extractedPath = path.resolve(root, record.member.extractedPath);
const extracted = fs.readFileSync(extractedPath);
assert(sha256(extracted) === record.member.sha256, "Extracted GeoJSON SHA-256 does not match the extraction input record.");
const parsed = JSON.parse(extracted.toString("utf8"));
assert(parsed?.type === "FeatureCollection" && Array.isArray(parsed.features), "Retained extracted member is not a valid GeoJSON FeatureCollection.");

console.log(JSON.stringify({
  sourceId: record.sourceId,
  scenarioDate: record.scenarioDate,
  member: record.member.path,
  extractedSha256: record.member.sha256,
  featureCount: parsed.features.length,
  validation: "PASS",
  promotion: "BLOCKED"
}, null, 2));
