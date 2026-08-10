import {
  loadProvinceAssets,
} from "./ProvinceAssetLoader.js";
import {
  createProvince,
} from "../ProvinceFactory.js";
import {
  createProvinceRepository,
  addProvince,
} from "../ProvinceRepository.js";
import {
  createHistoricalProvinceRepository,
} from "../HistoricalProvinceRepository.js";

/**
 * Builds the province runtime from the generated province assets and then
 * applies the historical ownership registry for the active scenario date.
 *
 * Geometry remains an asset concern; ownership remains a historical-state
 * concern. Keeping those layers separate lets a later GIS import replace the
 * geometry without rewriting the simulation state model.
 */
export function loadHistoricalProvinceRepository(historicalRegistry) {
  const assets = loadProvinceAssets();

  if (!Array.isArray(assets)) {
    throw new Error("Province Assets must be an array.");
  }

  let repository = createProvinceRepository();

  for (const asset of assets) {
    if (!asset?.identity) {
      throw new Error("Invalid Province Asset.");
    }

    repository = addProvince(repository, createProvince(asset));
  }

  return createHistoricalProvinceRepository(repository, historicalRegistry);
}
