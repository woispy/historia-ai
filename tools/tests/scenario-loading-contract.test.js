import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadScenario,
  loadScenarioDefinition,
} from "../../src/scenarios/index.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const scenarioLoaderSource = fs.readFileSync(
  path.join(projectRoot, "src/scenarios/ScenarioLoader.js"),
  "utf8",
);

const resourceLoaderSource = fs.readFileSync(
  path.join(projectRoot, "src/scenarios/ResourceLoader.js"),
  "utf8",
);

assert.doesNotMatch(
  scenarioLoaderSource,
  /typeof import\.meta\.glob\s*===\s*["']function["']/,
);
assert.doesNotMatch(
  resourceLoaderSource,
  /typeof import\.meta\.glob\s*===\s*["']function["']/,
);
assert.match(scenarioLoaderSource, /import\.meta\.env\?\.DEV\s*\|\|\s*import\.meta\.env\?\.PROD/);
assert.match(resourceLoaderSource, /import\.meta\.env\?\.DEV\s*\|\|\s*import\.meta\.env\?\.PROD/);
assert.match(scenarioLoaderSource, /import\.meta\.glob\(/);
assert.match(resourceLoaderSource, /import\.meta\.glob\(/);

const definition = loadScenarioDefinition("1300");
assert.equal(definition.id, "1300");
assert.equal(definition.startDate, "1300-01-01");
assert.equal(definition.resources.length, 11);

const scenario = loadScenario("1300");
assert.equal(scenario.id, "1300");
assert.equal(Object.keys(scenario.data.countries).length > 0, true);
assert.equal(Object.keys(scenario.data.provinces).length > 0, true);
assert.equal(Object.keys(scenario.data.cities).length > 0, true);

console.log(
  "scenario-loading-contract.test.js: Node fallback and Vite glob contracts passed",
);
