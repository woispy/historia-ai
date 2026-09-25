import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-packet-"));
const validator = path.join(root, "tools/historical-gis/cli/validate-1326-cliopatria-candidates.js");
const sha = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const makeCandidate = (index, id, longitude) => ({
  sourceFeatureIndex: index, sourceFeatureId: id, name: id, fromYear: 1200, toYear: 1400,
  type: "POLITY", wikidataId: null, seshatId: null,
  geometry: { type: "Polygon", coordinates: [[[longitude,40],[longitude + 0.1,40],[longitude + 0.1,40.1],[longitude,40.1],[longitude,40]]] },
  reconciliationStatus: "pending", geometryAuthorityStatus: "candidate-evidence-only"
});

function makeReport(candidates) {
  return {
    schemaVersion: 1, scenarioDate: "1326-04-07",
    source: { sourceId: "cliopatria-v0.2.0", sourceTag: "v0.2.0",
      immutableReference: { type: "git-commit", sha: "ad28a69", sourceBlobSha: "cefab0f4b622e2e7fb3daf68d4f461f83991204c" },
      extractedGeojsonSha256: sha, inputSha256: sha },
    temporalRule: "FromYear <= 1326 <= ToYear",
    counts: { inputFeatures: candidates.length, candidates: candidates.length, excluded: { outsideTemporalRange: 0, nonPolity: 0, missingGeometry: 0 } },
    candidates,
    candidatePacketSha256: crypto.createHash("sha256").update(JSON.stringify(candidates)).digest("hex")
  };
}

async function runCase(name, report, success) {
  const input = path.join(temp, name + ".json");
  await fs.writeFile(input, JSON.stringify(report));
  const result = await new Promise(resolve => {
    const child = spawn(process.execPath, [validator, "--input", input], { cwd: root, stdio: ["ignore","pipe","pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", code => resolve({ code, stderr }));
  });
  assert.equal(result.code === 0, success, result.stderr);
}

const a = makeCandidate(1, "A", 29);
const b = makeCandidate(2, "B", 30);
const baseline = makeReport([a, b]);
await runCase("baseline", baseline, true);
await runCase("reordered", { ...makeReport([b, a]), candidatePacketSha256: baseline.candidatePacketSha256 }, false);
await runCase("mutated", { ...makeReport([makeCandidate(1, "A", 29.2), b]), candidatePacketSha256: baseline.candidatePacketSha256 }, false);
await runCase("dropped", { ...makeReport([a]), candidatePacketSha256: baseline.candidatePacketSha256 }, false);

console.log("1326 candidate packet runtime integrity contract passed.");
