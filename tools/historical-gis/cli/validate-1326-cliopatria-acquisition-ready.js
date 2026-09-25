import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/gis/1326/acquisition-manifest.json"), "utf8"));
const source = manifest.sources?.find(item => item.id === "cliopatria-v0.2.0");
if (!source) throw new Error("Cliopatria source is missing from the acquisition manifest.");
if (manifest.scenarioDate !== "1326-04-07") throw new Error("Scenario date mismatch.");
if (source.status !== "acquisition-required" && source.status !== "acquired") throw new Error("Cliopatria source is not in a valid acquisition state.");
if (source.snapshot?.immutableReference?.type !== "git-commit") throw new Error("Cliopatria immutable reference must be a git commit.");
if (source.snapshot.immutableReference.sha !== "ad28a69") throw new Error("Cliopatria immutable commit reference drifted.");
if (source.snapshot.immutableReference.sourceBlobSha !== "cefab0f4b622e2e7fb3daf68d4f461f83991204c") throw new Error("Cliopatria source blob reference drifted.");
if (source.snapshot.sourceTag !== "v0.2.0") throw new Error("Cliopatria source tag drifted.");
if (source.url !== "https://github.com/Seshat-Global-History-Databank/cliopatria/releases/tag/v0.2.0") throw new Error("Cliopatria release URL drifted.");
if (source.snapshot.status === "reference-pinned-not-acquired") {
  if (source.snapshot.rawSha256 !== null || source.snapshot.retainedArtifact !== null) throw new Error("Unacquired snapshot must not claim retained bytes.");
} else if (source.snapshot.status === "acquired") {
  if (source.status !== "acquired") throw new Error("Acquired snapshot requires acquired source status.");
  if (!/^[0-9a-f]{64}$/.test(source.snapshot.rawSha256 ?? "")) throw new Error("Acquired snapshot requires raw SHA-256.");
  if (!source.snapshot.retainedArtifact) throw new Error("Acquired snapshot requires retained artifact.");
  if (!source.snapshot.acquiredAt) throw new Error("Acquired snapshot requires acquisition timestamp.");
} else {
  throw new Error("Unexpected Cliopatria snapshot state.");
}
console.log(JSON.stringify({
  sourceId: source.id,
  scenarioDate: manifest.scenarioDate,
  snapshotStatus: source.snapshot.status,
  acquisitionReady: true,
  promotion: "BLOCKED_UNTIL_VERIFIED_ACQUISITION_AND_EXTRACTION"
}, null, 2));
