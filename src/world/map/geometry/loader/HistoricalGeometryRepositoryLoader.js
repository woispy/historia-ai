import {
  createGeometryRepository,
  addGeometry,
} from "../GeometryRepository.js";
import { loadHistoricalGeometryManifest } from "./HistoricalGeometryManifestLoader.js";

export function loadHistoricalGeometryRepository(date) {
  const assets = loadHistoricalGeometryManifest(date);
  if (!assets) return null;

  let repository = createGeometryRepository();

  for (const asset of assets) {
    if (!asset?.id || !Array.isArray(asset.polygons)) {
      throw new Error("Invalid historical geometry asset.");
    }

    repository = addGeometry(repository, asset);
  }

  return repository;
}
