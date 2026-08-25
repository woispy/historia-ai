import {
  createGeometryRepository,
  addGeometry,
} from "../GeometryRepository.js";
import { loadHistoricalRuntimeAsset } from "../../loader/HistoricalRuntimeManifestLoader.js";

export async function loadHistoricalGeometryRepository(date) {
  const runtimeAsset = await loadHistoricalRuntimeAsset(date);
  const assets = runtimeAsset?.geometries ?? null;
  if (!assets) return null;

  let repository = createGeometryRepository();
  for (const asset of assets) {
    if (!asset?.identity?.id || !Array.isArray(asset.polygons)) {
      throw new Error("Invalid historical geometry asset.");
    }
    repository = addGeometry(repository, {
      ...asset,
      id: asset.identity.id,
    });
  }
  return repository;
}
