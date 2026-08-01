/**
 * ============================================================================
 * Historia AI
 * Scenario Bootstrap
 * ============================================================================
 *
 * Prepares the loaded scenario for runtime.
 *
 * This layer performs no repository creation.
 * Repository creation belongs to WorldBootstrap.
 */

export function bootstrapScenario(
  scenario
) {
  if (!scenario) {
    throw new Error(
      "Scenario is required."
    );
  }

  return Object.freeze({
    ...scenario,
  });
}