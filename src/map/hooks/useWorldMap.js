import { useMemo } from "react";
import { getProvinces } from "../../provinces";
import { getGeometry } from "../../world/map/geometry";
import { getCountry } from "../../countries";

export function useWorldMap(gameSession) {
  return useMemo(() => {
    if (!gameSession) return { provinces: [] };

    const provinceRepository = gameSession.world.repositories.provinces;
    const countryRepository = gameSession.world.repositories.countries;
    const geometryRepository = gameSession.world.map.geometry;

    const provinces = getProvinces(provinceRepository).map((province) => ({
      province,
      country: province.owner ? getCountry(countryRepository, province.owner) : null,
      geometry: province.geometryId
        ? getGeometry(geometryRepository, province.geometryId)
        : null,
    }));

    return { provinces };
  }, [gameSession]);
}
