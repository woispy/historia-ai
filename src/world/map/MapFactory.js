import regionsData from "./data/regions.json";
import terrainData from "./data/terrain.json";

import { createRegion } from "./RegionFactory.js";
import { createTerrain } from "./TerrainFactory.js";
import { createTopology } from "./topology/index.js";
import { bootstrapGeometry } from "./geometry/index.js";
import { bootstrapProvinces } from "../../provinces/index.js";
import { createDictionary } from "../../utils/createDictionary.js";

/**
 * Creates the complete World Map.
 *
 * The province repository can be supplied by WorldBootstrap so the map and
 * simulation always render the same historical province state.
 */
export function createMap(provinceRepository = null, historicalDate = null) {
  return {
    geometry: bootstrapGeometry(historicalDate),
    provinces: provinceRepository ?? bootstrapProvinces(),
    regions: createDictionary(regionsData.map(createRegion)),
    terrain: createDictionary(terrainData.map(createTerrain)),
    topology: createTopology(),
  };
}
