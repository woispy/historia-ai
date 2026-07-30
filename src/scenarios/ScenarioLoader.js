/**
 * Loads a scenario from a data source.
 *
 * This is currently a placeholder implementation.
 * Future versions will load scenario files from:
 *
 * data/scenarios/<scenarioId>/
 */

export function loadScenario(scenarioId) {
  if (!scenarioId) {
    throw new Error("Scenario id is required.");
  }

  return {
    id: scenarioId,
    loaded: false,
    data: null,
  };
}