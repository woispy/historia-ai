/**
 * ============================================================================
 * Historia AI
 * Scenario Factory
 * ============================================================================
 *
 * Converts a validated scenario definition
 * into an engine-ready immutable scenario.
 */

export function createScenario(
  scenarioDefinition
) {
  if (!scenarioDefinition) {
    throw new Error(
      "Scenario definition is required."
    );
  }

  return Object.freeze({
    ...scenarioDefinition,

    initialized: true,
  });
}