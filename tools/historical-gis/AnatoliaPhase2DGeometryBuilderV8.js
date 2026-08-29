import {
  buildAnatoliaPhase2DAssets as buildV12Assets,
  isAnatoliaGeometryPoint,
  isPhysicalLandPoint,
  isPhysicalLandPointLegacy,
} from "./AnatoliaPhase2DGeometryBuilderV12.js";

export { isAnatoliaGeometryPoint, isPhysicalLandPoint, isPhysicalLandPointLegacy };

export function buildAnatoliaPhase2DAssets() {
  const assets = buildV12Assets();
  const generator = "Historia AI Phase 2D Geometry Builder";
  for (const asset of [...assets.provinces, ...assets.geometries]) {
    if (asset.header) asset.header.generator = generator;
  }
  return assets;
}
