import provincesData from "./data/provinces.json";
import regionsData from "./data/regions.json";
import terrainData from "./data/terrain.json";

import {
  createProvince,
  createProvinceRepositoryFromArray,
} from "../../provinces";

import {
  createRegion,
} from "./RegionFactory";

import {
  createTerrain,
} from "./TerrainFactory";

import {
  createTopology,
} from "./topology";

import {
  bootstrapGeometry,
} from "./geometry";

import {
  createDictionary,
} from "../../utils/createDictionary";

/**
 * ============================================================================
 * Historia AI
 * Map Factory
 * ============================================================================
 *
 * Creates the complete World Map.
 */

export function createMap() {
  const provinceModels =
    provincesData.map(createProvince);

  return {
    geometry:
      bootstrapGeometry(),

    provinces:
      createProvinceRepositoryFromArray(
        provinceModels
      ),

    regions:
      createDictionary(
        regionsData.map(createRegion)
      ),

    terrain:
      createDictionary(
        terrainData.map(createTerrain)
      ),

    topology:
      createTopology(),
  };
}