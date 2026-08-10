/**
 * ============================================================================
 * Historia AI
 * Province Asset Factory
 * ============================================================================
 *
 * Creates immutable Province Assets.
 *
 * This module is responsible only for assembling
 * the final Province Asset.
 */

export function createProvinceAsset({
  header,
  metadata,
  properties,
}) {
  return Object.freeze({
    header,

    identity: {
      id:
        metadata.id,

      name:
        metadata.name,
    },

    references: {
      geometryId:
        properties.geometryId,

      countryId:
        null,

      capitalCityId:
        null,
    },

    ownership: {
      countryId:
        null,

      ownerId:
        null,
    },

    administration: {
      governorId:
        null,
    },

    population: {
      total:
        0,
    },

    economy: {
      development:
        0,

      wealth:
        0,
    },

    military: {
      supplyLimit:
        0,
    },

    culture: {
      primaryCulture:
        null,
    },

    religion: {
      primaryReligion:
        null,
    },
  });
}