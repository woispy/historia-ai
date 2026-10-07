import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const input = path.join(root, "data/gis/1326/anchor-candidate-registry.json");
const dir = path.join(root, "data/build/gis/1326");
await fs.mkdir(dir, { recursive: true });

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["tools/historical-gis/cli/validate-1326-anchor-candidate-registry.js", ...args], {
      cwd: root, stdio: ["ignore", "pipe", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(stderr || `exit ${code}`)));
  });
}

async function expectFailure(file) {
  await assert.rejects(run(["--input", file]));
}

await run(["--input", input]);

const original = JSON.parse(await fs.readFile(input, "utf8"));

const duplicate = path.join(dir, "test-anchor-registry-duplicate.json");
await fs.writeFile(duplicate, JSON.stringify({
  ...original,
  anchors: [...original.anchors, original.anchors[0]]
}, null, 2));
await expectFailure(duplicate);

const sameSourceTypes = path.join(dir, "test-anchor-registry-same-source-types.json");
const mutated = structuredClone(original);
mutated.anchors[0].coordinateEvidenceRefs[1].sourceType = "GEONAMES";
await fs.writeFile(sameSourceTypes, JSON.stringify(mutated, null, 2));
await expectFailure(sameSourceTypes);

const generated = path.join(dir, "test-anchor-registry-generated.json");
const generatedMutation = structuredClone(original);
generatedMutation.policy.geometryGeneration = true;
await fs.writeFile(generated, JSON.stringify(generatedMutation, null, 2));
await expectFailure(generated);

const averaged = path.join(dir, "test-anchor-registry-averaged-point.json");
const averagedMutation = structuredClone(original);
averagedMutation.anchors[0].geometry.coordinates = [29.060125, 40.19559];
await fs.writeFile(averaged, JSON.stringify(averagedMutation, null, 2));
await expectFailure(averaged);

console.log("1326 anchor candidate registry contract passed: independent coordinate-source guard, no-generation policy, and source-point identity guard.");
