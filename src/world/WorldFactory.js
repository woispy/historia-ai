import { createMap } from "./map";

/**
 * Creates the runtime world from a loaded scenario.
 *
 * The world is intentionally mutable.
 * Runtime systems (economy, diplomacy, war...)
 * will update this object during gameplay.
 */
export function createWorld(scenario) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  return {
    map: createMap(),

    ...scenario.data,
  };
}