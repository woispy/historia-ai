import provincesData from "./data/provinces.json";
import regionsData from "./data/regions.json";
import terrainData from "./data/terrain.json";

import { createProvince } from "./ProvinceFactory";
import { createRegion } from "./RegionFactory";
import { createTerrain } from "./TerrainFactory";
import { createTopology } from "./topology";

import { createDictionary } from "../../utils/createDictionary";

export function createMap() {
  const provinces = provincesData.map(createProvince);

  const regions = regionsData.map(createRegion);

  const terrain = terrainData.map(createTerrain);

  return {
    provinces: createDictionary(provinces),

    regions: createDictionary(regions),

    terrain: createDictionary(terrain),

    topology: createTopology(),
  };
}