import regionsData from "./data/regions.json";
import terrainData from "./data/terrain.json";

import {
  createRegion,
} from "./RegionFactory.js";

import {
  createTerrain,
} from "./TerrainFactory.js";

import {
  createTopology,
} from "./topology/index.js";

import {
  bootstrapGeometry,
} from "./geometry/index.js";

import {
  bootstrapProvinces,
} from "../../provinces/index.js";

import {
  createDictionary,
} from "../../utils/createDictionary.js";

/**
 * ============================================================================
 * Historia AI
 * Map Factory
 * ============================================================================
 *
 * Creates the complete World Map.
 */

export function createMap() {
  return {
    geometry:
      bootstrapGeometry(),

    provinces:
      bootstrapProvinces(),

    regions:
      createDictionary(
        regionsData.map(
          createRegion
        )
      ),

    terrain:
      createDictionary(
        terrainData.map(
          createTerrain
        )
      ),

    topology:
      createTopology(),
  };
}