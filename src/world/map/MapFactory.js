import provincesData from "./data/provinces.json";
import regionsData from "./data/regions.json";
import terrainData from "./data/terrain.json";

import {
  createProvince,
  createProvinceRepositoryFromArray,
} from "../../provinces";

import { createRegion } from "./RegionFactory";
import { createTerrain } from "./TerrainFactory";
import { createTopology } from "./topology";

import { createDictionary } from "../../utils/createDictionary";

/**
 * ============================================================================
 * Map Factory
 * ============================================================================
 *
 * Geometry + Runtime repositories.
 */

export function createMap() {
  const provinceModels =
    provincesData.map(createProvince);

  return {
    provinces:
      createProvinceRepositoryFromArray(
        provinceModels
      ),

    regions: createDictionary(
      regionsData.map(createRegion)
    ),

    terrain: createDictionary(
      terrainData.map(createTerrain)
    ),

    topology: createTopology(),
  };
}