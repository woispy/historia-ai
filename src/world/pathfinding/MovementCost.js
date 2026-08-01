import {
  getProvince,
} from "../../provinces";

/**
 * ============================================================================
 * Historia AI
 * Movement Cost
 * ============================================================================
 */

export function getMovementCost(
  runtime,
  provinceId
) {
  const province =
    getProvince(
      runtime.repositories.provinces,
      provinceId
    );

  if (!province) {
    return 1;
  }

  const terrain =
    runtime.map.terrain.byId[
      province.terrain
    ];

  if (!terrain) {
    return 1;
  }

  return terrain.movementCost;
}