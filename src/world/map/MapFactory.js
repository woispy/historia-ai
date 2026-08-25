import regionsData from "./data/regions.json" with { type: "json" };
import terrainData from "./data/terrain.json" with { type: "json" };

import { createRegion } from "./RegionFactory.js";
import { createTerrain } from "./TerrainFactory.js";
import { createTopology } from "./topology/index.js";
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
 * Creates the lightweight World Map descriptor.
 *
 * Geometry is intentionally deferred. Generated Natural Earth geometry is
 * large, grows with world detail, and is not required to create the game
 * session. The map renderer owns the explicit geometry-loading boundary.
 *
 * This keeps historical identity/state in the synchronous game bootstrap while
 * preventing hundreds of generated geometry JSON files from becoming part of
 * the initial JavaScript dependency graph.
 */
export function createMap(provinceRepository = null, historicalDate = null) {
  const politicalWorld = createPoliticalWorld(historicalDate);

  return {
    geometry: null,
    geometryRuntime: {
      status: "deferred",
      date: historicalDate,
      source: "generated-geometry-assets",
    },
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
