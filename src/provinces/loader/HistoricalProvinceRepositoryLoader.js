import { loadProvinceAssets } from "./ProvinceAssetLoader.js";
import { loadHistoricalRuntimeAsset } from "../../world/map/loader/HistoricalRuntimeManifestLoader.js";
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

  const historicalRuntime = await loadHistoricalRuntimeAsset(date);
  if (!historicalRuntime?.provinces) {
    throw new Error(
      `Historical province runtime asset is missing for ${String(date)}. `
      + "Generate the historical GIS runtime assets before starting a dated scenario."
    );
  }

  return createHistoricalProvinceRepository(
    buildRepository(historicalRuntime.provinces),
    historicalRegistry,
  );
}
