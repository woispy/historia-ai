import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contractPath = path.join(root, "data/scenarios/production.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

if (contract.schemaVersion !== 1) {
  throw new Error(`Unsupported production scenario contract schema: ${contract.schemaVersion}`);
}
if (contract.scenarioId !== "1326") {
  throw new Error(`Production scenario must be 1326, got ${contract.scenarioId}.`);
}
if (contract.startDate !== "1326-04-07" || contract.productionDate !== "1326-04-07") {
  throw new Error(
    `Production scenario date must be 1326-04-07, got ${contract.productionDate ?? contract.startDate}.`,
  );
}
if (contract.authorityRequired !== true) {
  throw new Error("Production scenario must require authoritative geometry.");
}

const runtimePath = path.resolve(root, contract.runtimePath);
if (!fs.existsSync(runtimePath)) {
  throw new Error(
    [
      "1326 production runtime is absent.",
      `Expected: ${path.relative(root, runtimePath)}`,
      "Production build is intentionally fail-closed; do not substitute 1300 or synthetic geometry.",
    ].join(" "),
  );
}

const runtime = JSON.parse(fs.readFileSync(runtimePath, "utf8"));
if (runtime.historicalDate !== "1326-04-07") {
  throw new Error(
    `1326 runtime historicalDate mismatch: expected 1326-04-07, got ${runtime.historicalDate}.`,
  );
}
if (runtime.source?.authorityStatus !== "canonical") {
  throw new Error(
    `1326 runtime is not canonical authority: ${runtime.source?.authorityStatus ?? "missing"}.`,
  );
}

console.log("Production scenario contract passed: 1326-04-07 canonical runtime is present.");
