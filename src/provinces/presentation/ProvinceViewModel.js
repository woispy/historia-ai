/**
 * ============================================================================
 * Historia AI
 * Province View Model
 * ============================================================================
 *
 * Player-facing representation of a Province.
 *
 * This object is designed for UI components.
 */

export function createProvinceViewModel({
  id,

  displayName,

  owner,

  controller,

  terrain,

  population,

  development,

  governor,

  fortLevel,

  hasPort,

  hasRiver,

  culture,

  religion,
}) {
  return Object.freeze({
    id,

    displayName,

    owner,

    controller,

    terrain,

    population,

    development,

    governor,

    fortLevel,

    hasPort,

    hasRiver,

    culture,

    religion,
  });
}