import { loadProvinceAssets } from "./ProvinceAssetLoader.js";
import { loadHistoricalProvinceManifest } from "./HistoricalProvinceManifestLoader.js";
import { createProvince } from "../ProvinceFactory.js";
import {
  createProvinceRepository,
  addProvince,
} from "../ProvinceRepository.js";
import { createHistoricalProvinceRepository } from "../HistoricalProvinceRepository.js";

function buildRepository(assets) {
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

  return repository;
}

/**
 * Prefer imported historical province assets for the requested date. If none
 * exist yet, fall back to the generated baseline assets and apply the
 * historical ownership registry as a provisional runtime layer.
 */
export function loadHistoricalProvinceRepository(historicalRegistry) {
  const date = historicalRegistry?.date ?? null;
  const historicalAssets = loadHistoricalProvinceManifest(date);
  const assets = historicalAssets ?? loadProvinceAssets();

  return createHistoricalProvinceRepository(
    buildRepository(assets),
    historicalRegistry,
  );
}
