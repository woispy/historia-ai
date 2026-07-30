import { createScenarioDefinition } from "./ScenarioDefinition";

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
 * Currently only the ScenarioDefinition is loaded.
 * Future versions will also load countries,
 * cities, provinces and every other resource.
 */
export function loadScenario(scenarioId) {
  return loadScenarioDefinition(scenarioId);
}