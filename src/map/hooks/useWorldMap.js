import { useMemo } from "react";

import {
  getProvinces,
} from "../../provinces";

import {
  getGeometry,
} from "../../world/map/geometry";

/**
 * ============================================================================
 * Historia AI
 * useWorldMap
 * ============================================================================
 *
 * Creates render-ready map data.
 */

export function useWorldMap(
  gameSession
) {
  return useMemo(() => {
    if (!gameSession) {
      return {
        provinces: [],
      };
    }

    const provinceRepository =
      gameSession.world.repositories.provinces;

    const geometryRepository =
      gameSession.world.map.geometry;

    const provinces =
      getProvinces(
        provinceRepository
      ).map((province) => ({
        province,

        geometry:
          province.geometryId
            ? getGeometry(
                geometryRepository,
                province.geometryId
              )
            : null,
      }));

    return {
      provinces,
    };
  }, [gameSession]);
}