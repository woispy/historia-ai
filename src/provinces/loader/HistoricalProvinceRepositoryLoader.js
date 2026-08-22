import { loadProvinceAssets } from "./ProvinceAssetLoader.js";
import { loadHistoricalRuntimeProvinceIndex } from "../../world/map/loader/HistoricalRuntimeManifestLoader.js";
import { createProvince } from "../ProvinceFactory.js";
import {
  createProvinceRepository,
  addProvince,
} from "../ProvinceRepository.js";
import { createHistoricalProvinceRepository } from "../HistoricalProvinceRepository.js";

function buildRepository(assets) {
  if (!Array.isArray(assets)) throw new Error("Province Assets must be an array.");
  let repository = createProvinceRepository();
  for (const asset of assets) {
    if (!asset?.identity) throw new Error("Invalid Province Asset.");
    repository = addProvince(repository, createProvince(asset));
  }
  return repository;
}

export async function loadHistoricalProvinceRepository(historicalRegistry) {
  const date = historicalRegistry?.date ?? null;

  if (!date) {
    return createHistoricalProvinceRepository(
      buildRepository(loadProvinceAssets()),
      historicalRegistry,
    );
  }

  // Historical bootstrap owns only lightweight province metadata. Polygon
  // geometry is a viewport asset and is loaded by the map-time regional layer.
  const provinceIndex = await loadHistoricalRuntimeProvinceIndex(date);
  return createHistoricalProvinceRepository(
    buildRepository(provinceIndex),
    historicalRegistry,
  );
}
