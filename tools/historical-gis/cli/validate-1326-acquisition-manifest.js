import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const load = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));

const manifest = load("data/gis/1326/acquisition-manifest.json");
const registry = load("data/gis/1326/registry.json");
const evidence = load("data/gis/1326/evidence-matrix.json");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(manifest.schemaVersion === 1, "1326 acquisition manifest schema must be v1.");
assert(manifest.scenarioDate === "1326-04-07", "1326 acquisition manifest date must be 1326-04-07.");
assert(manifest.authorityStatus === "evidence-only", "1326 acquisition manifest must remain evidence-only.");
assert(registry.date === "1326-04-07", "1326 registry date must be 1326-04-07.");
assert(registry.authorityStatus === "evidence-registry-only", "1326 registry must remain evidence-registry-only.");
assert(registry.canonicalGeometry?.status === "not-promoted", "1326 canonical geometry must remain not-promoted.");
assert(evidence.scenarioDate === "1326-04-07", "1326 evidence matrix date must be 1326-04-07.");
assert(evidence.authorityStatus === "evidence-only", "1326 evidence matrix must remain evidence-only.");

const requiredFields = ["id", "provider", "dataset", "role", "url", "format", "status"];
assert(Array.isArray(manifest.sources) && manifest.sources.length > 0, "1326 acquisition manifest must define sources.");

for (const source of manifest.sources) {
  for (const field of requiredFields) {
    assert(typeof source[field] === "string" && source[field].length > 0, `1326 source ${source.id ?? "<unknown>"} is missing ${field}.`);
  }
  assert(
    source.status === "acquisition-required" || source.status === "reference-acquisition-or-citation-required",
    `1326 source ${source.id} has unexpected intake status: ${source.status}.`,
  );
  assert(!source.url.startsWith("file:"), `1326 source ${source.id} must retain an external source URL.`);
  if (source.snapshot) {
    assert(source.snapshot.status === "reference-pinned-not-acquired", `1326 source ${source.id} snapshot must remain reference-pinned-not-acquired until raw acquisition is verified.`);
    assert(typeof source.snapshot.sourceTag === "string" && source.snapshot.sourceTag.length > 0, `1326 source ${source.id} snapshot must record its source tag.`);
    assert(source.snapshot.immutableReference?.type === "git-commit", `1326 source ${source.id} snapshot must use an immutable git-commit reference.`);
    assert(/^[0-9a-f]{7,40}$/.test(source.snapshot.immutableReference?.sha ?? ""), `1326 source ${source.id} snapshot commit must be a hexadecimal git SHA.`);
    assert(source.snapshot.rawSha256 === null, `1326 source ${source.id} raw SHA-256 must remain null before byte acquisition.`);
    assert(/^[0-9a-f]{40}$/.test(source.snapshot.immutableReference.sourceBlobSha ?? ""), `1326 source ${source.id} snapshot must record the exact Git blob SHA when source bytes are addressable.`);
    assert(source.snapshot.retainedArtifact === null, `1326 source ${source.id} retained artifact must remain null before acquisition.`);
  }
}

const manifestText = JSON.stringify(manifest).toLowerCase();
for (const guard of ["copying 1300", "synthetic fallback geometry", "back-projecting later 1326 territorial changes"]) {
  assert(manifestText.includes(guard), `1326 manifest must retain forbidden-operation guard: ${guard}.`);
}

console.log(JSON.stringify({
  scenarioDate: manifest.scenarioDate,
  sourceCount: manifest.sources.length,
  authorityStatus: manifest.authorityStatus,
  canonicalGeometryStatus: registry.canonicalGeometry.status,
  intakeGate: "PASS",
  promotion: "BLOCKED_UNTIL_SOURCE_SNAPSHOTS_AND_RECONCILIATION"
}, null, 2));
