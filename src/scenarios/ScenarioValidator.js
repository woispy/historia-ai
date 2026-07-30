/**
 * Validates a loaded scenario.
 *
 * This placeholder always succeeds.
 * Future versions will validate:
 *
 * - required files
 * - duplicate ids
 * - invalid references
 * - missing entities
 */

export function validateScenario(scenario) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}