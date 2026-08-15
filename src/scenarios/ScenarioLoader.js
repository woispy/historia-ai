import { createScenarioDefinition } from "./ScenarioDefinition.js";
import { loadResourceFolder } from "./ResourceLoader.js";

/**
 * Loads scenario definitions in both Vite/browser and native Node ESM.
 *
 * Browser builds use Vite's import.meta.glob transform.
 * Native runtime tests resolve scenario.json directly through Node's
 * synchronous builtin filesystem API.
 */
const viteScenarioFiles =
  typeof import.meta.glob === "function"
    ? import.meta.glob(
        "../../data/scenarios/*/scenario.json",
        {
          eager: true,
          import: "default",
        }
      )
    : null;

const nodeProcess = globalThis.process;

const nodeFs =
  nodeProcess &&
  typeof nodeProcess.getBuiltinModule === "function"
    ? nodeProcess.getBuiltinModule("fs")
    : null;

function loadNodeScenario(scenarioId) {
  if (!nodeFs) {
    return null;
  }

  const fileUrl = new URL(
    `../../data/scenarios/${scenarioId}/scenario.json`,
    import.meta.url
  );

  if (!nodeFs.existsSync(fileUrl)) {
    return null;
  }

  return JSON.parse(
    nodeFs.readFileSync(fileUrl, "utf8")
  );
}

function getScenarioData(scenarioId) {
  if (!viteScenarioFiles) {
    return loadNodeScenario(scenarioId);
  }

  const filePath = Object.keys(viteScenarioFiles).find((path) =>
    path.endsWith(`/${scenarioId}/scenario.json`)
  );

  return filePath ? viteScenarioFiles[filePath] : null;
}

export function loadScenarioDefinition(scenarioId) {
  if (!scenarioId) {
    throw new Error("Scenario id is required.");
  }

  const scenario = getScenarioData(scenarioId);

  if (!scenario) {
    throw new Error(`Scenario "${scenarioId}" was not found.`);
  }

  return createScenarioDefinition({
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    version: scenario.version,
    startDate: scenario.startDate,
    world: scenario.world,
    resources: scenario.resources,
    data: {},
  });
}

/**
 * Loads a complete scenario.
 *
 * Returns the immutable ScenarioDefinition together with
 * every resource declared by the scenario.
 */
export function loadScenario(scenarioId) {
  const definition = loadScenarioDefinition(scenarioId);

  const data = {};

  for (const resourceName of definition.resources) {
    data[resourceName] = loadResourceFolder(
      scenarioId,
      resourceName
    );
  }

  return Object.freeze({
    ...definition,
    data: Object.freeze(data),
  });
}
