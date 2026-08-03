import {
  getGeometryByProvince,
} from "../../../world/map/geometry/GeometryQueries";

import {
  getCountryCapital,
} from "../../../countries";

/**
 * ============================================================================
 * Historia AI
 * Camera Focus Service
 * ============================================================================
 */

/**
 * Returns the focus point of a province.
 */
export function getProvinceFocus(
  geometryRepository,
  provinceId
) {
  const geometry =
    getGeometryByProvince(
      geometryRepository,
      provinceId
    );

  if (!geometry) {
    return null;
  }

  return {
    x: geometry.position.x,

    y: geometry.position.y,

    provinceId,
  };
}

/**
 * Returns the focus point of a country's capital.
 */
export function getCountryFocus(
  countryRepository,
  geometryRepository,
  countryId
) {
  const capitalProvince =
    getCountryCapital(
      countryRepository,
      countryId
    );

  if (!capitalProvince) {
    return null;
  }

  return getProvinceFocus(
    geometryRepository,
    capitalProvince
  );
}