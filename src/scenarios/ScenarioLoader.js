import { createScenarioDefinition } from "./ScenarioDefinition.js";
import { loadResourceFolder } from "./ResourceLoader.js";

/**
 * Loads every scenario.json file at build time.
 *
 * Key:
 * ../../data/scenarios/1300/scenario.json
 */
const scenarioFiles = import.meta.glob(
  "../../data/scenarios/*/scenario.json",
  {
    eager: true,
    import: "default",
  }
);

export function loadScenarioDefinition(scenarioId) {
  if (!scenarioId) {
    throw new Error("Scenario id is required.");
  }

  const filePath = Object.keys(scenarioFiles).find((path) =>
    path.endsWith(`/${scenarioId}/scenario.json`)
  );

  if (!filePath) {
    throw new Error(`Scenario "${scenarioId}" was not found.`);
  }

  const scenario = scenarioFiles[filePath];

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