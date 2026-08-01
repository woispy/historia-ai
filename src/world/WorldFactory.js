import {
  bootstrapWorld,
} from "./WorldBootstrap";

/**
 * ============================================================================
 * World Factory
 * ============================================================================
 */

export function createWorld(
  scenario
) {
  if (!scenario) {
    throw new Error(
      "Scenario is required."
    );
  }

  return bootstrapWorld(
    scenario
  );
}