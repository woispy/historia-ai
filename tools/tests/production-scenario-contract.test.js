import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(
  fs.readFileSync(path.join(root, "data/scenarios/production.json"), "utf8"),
);
const mapbinSource = fs.readFileSync(
  path.join(root, "tools/build/build-mapbin.js"),
  "utf8",
);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

assert.equal(contract.scenarioId, "1326");
assert.equal(contract.startDate, "1326-04-07");
assert.equal(contract.productionDate, "1326-04-07");
assert.equal(
  contract.runtimePath,
  "src/world/map/assets/historical/1326/runtime.json",
);
assert.equal(contract.authorityRequired, true);

assert.doesNotMatch(
  mapbinSource,
  /historical[\\/]1300[\\/]runtime\.json/,
);
assert.match(mapbinSource, /MapBin input is required/);
assert.match(packageJson.scripts["build:production"], /assert:production-scenario/);
assert.match(
  packageJson.scripts["build:production"],
  /historical\/1326\/runtime\.json/,
);
assert.match(
  packageJson.scripts["build:legacy-map"],
  /historical\/1300\/runtime\.json/,
);

console.log(
  "production-scenario-contract.test.js: explicit 1326 contract and no implicit 1300 MapBin fallback passed",
);
