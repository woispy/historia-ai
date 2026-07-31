import { bootstrapWorld } from "./WorldBootstrap";

/**
 * ============================================================================
 * World Factory
 * ============================================================================
 *
 * Validates input and delegates world creation
 * to the bootstrap layer.
 */

export function createWorld(scenario) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  return bootstrapWorld(scenario);
}