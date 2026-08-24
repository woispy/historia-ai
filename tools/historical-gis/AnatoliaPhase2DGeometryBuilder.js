export {
  buildAnatoliaPhase2DAssets,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV9.js";

const ANATOLIA_GEOMETRY_BBOX = [25.45, 35.72, 44.85, 42.35];

export const isAnatoliaGeometryPoint = (point) => point?.length === 2
  && point[0] >= ANATOLIA_GEOMETRY_BBOX[0] && point[0] <= ANATOLIA_GEOMETRY_BBOX[2]
  && point[1] >= ANATOLIA_GEOMETRY_BBOX[1] && point[1] <= ANATOLIA_GEOMETRY_BBOX[3];
