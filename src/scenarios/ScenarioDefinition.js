/**
 * ============================================================================
 * Historia AI
 * ScenarioDefinition
 * ============================================================================
 *
 * Purpose
 * -------
 * Represents a fully loaded scenario definition.
 *
 * This object is the standard data model exchanged between:
 *
 * ScenarioLoader
 * ScenarioValidator
 * WorldFactory
 * GameSession
 *
 * It contains only scenario data.
 * It never contains runtime state.
 */

export function createScenarioDefinition({
  id,
  name,
  description = "",
  version = 1,
  startDate,
  world,
  resources = [],
  data = {},
}) {
  if (!id) {
    throw new Error("ScenarioDefinition requires an id.");
  }

  if (!name) {
    throw new Error("ScenarioDefinition requires a name.");
  }

  if (!startDate) {
    throw new Error("ScenarioDefinition requires a start date.");
  }

  if (!world) {
    throw new Error("ScenarioDefinition requires a world.");
  }

  return Object.freeze({
    id,
    name,
    description,
    version,
    startDate,
    world,
    resources: Object.freeze([...resources]),
    data: Object.freeze({
      ...data,
    }),
  });
}