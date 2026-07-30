/**
 * Creates an engine-ready scenario.
 *
 * The factory converts validated scenario data
 * into the structure expected by the engine.
 *
 * Future versions may also:
 *
 * - apply defaults
 * - migrate old versions
 * - preprocess data
 */

export function createScenario(rawScenario) {
  if (!rawScenario) {
    throw new Error("Scenario data is required.");
  }

  return {
    ...rawScenario,
    initialized: true,
  };
}