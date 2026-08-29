import {
  buildAnatoliaPhase2DAssets as buildV11Assets,
  isAnatoliaGeometryPoint,
  isPhysicalLandPoint,
  isPhysicalLandPointLegacy,
} from "./AnatoliaPhase2DGeometryBuilderV11.js";

export { isAnatoliaGeometryPoint, isPhysicalLandPoint, isPhysicalLandPointLegacy };

export function buildAnatoliaPhase2DAssets() {
  const assets = buildV11Assets();
  const generator = "Historia AI Phase 2D Geometry Builder";
  for (const asset of [...assets.provinces, ...assets.geometries]) {
    if (asset.header) asset.header.generator = generator;
  }
  return assets;
}
