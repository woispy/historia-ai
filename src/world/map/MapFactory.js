import regionsData from "./data/regions.json" with { type: "json" };
import terrainData from "./data/terrain.json" with { type: "json" };

import { createRegion } from "./RegionFactory.js";
import { createTerrain } from "./TerrainFactory.js";
import { createTopology } from "./topology/index.js";
import { bootstrapGeometry } from "./geometry/index.js";
import { bootstrapProvinces } from "../../provinces/index.js";
import { createDictionary } from "../../utils/createDictionary.js";
import { getHistoricalWorldPolity, HISTORICAL_WORLD_1300 } from "../historical/HistoricalWorld1300Registry.js";
import { createHistoricalMapDescriptor } from "./HistoricalMapContract.js";

function createPoliticalWorld(historicalDate) {
  if (historicalDate === HISTORICAL_WORLD_1300.date) {
    return createHistoricalMapDescriptor({
      date: historicalDate,
      polities: HISTORICAL_WORLD_1300.polities,
    });
  }

  return createHistoricalMapDescriptor({
    date: historicalDate,
    polities: [],
  });
}

/**
 * Creates the complete World Map.
 *
 * `regions` are physical/cartographic regions only. Political identity lives
 * under `politicalWorld` and is sourced from the dated historical registry.
 * This prevents modern country geometry from becoming a historical province.
 */
export function createMap(provinceRepository = null, historicalDate = null) {
  const politicalWorld = createPoliticalWorld(historicalDate);

  return {
    geometry: bootstrapGeometry(historicalDate),
    provinces: provinceRepository ?? bootstrapProvinces(),
    regions: createDictionary(regionsData.map(createRegion)),
    physicalRegions: createDictionary(regionsData.map(createRegion)),
    terrain: createDictionary(terrainData.map(createTerrain)),
    topology: createTopology(),
    politicalWorld,
    historical: {
      date: historicalDate,
      polityResolver: getHistoricalWorldPolity,
    },
  };
}
