import {
  buildAnatoliaPhase2DAssets,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV5.js";

const ANATOLIA_OVERRIDE_BBOX = [26.5, 35.7, 44.8, 41.6];
const MARMARA_THRACE_EXCLUSION = [
  [26.5, 42.2],
  [29.5, 42.2],
  [29.5, 41.25],
  [29.05, 40.72],
  [28.45, 40.48],
  [27.55, 40.45],
  [26.5, 40.65],
];

function pointInPolygon([longitude, latitude], polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const current = polygon[index];
    const prior = polygon[previous];
    if ((current[1] > latitude) !== (prior[1] > latitude)
      && longitude < ((prior[0] - current[0]) * (latitude - current[1])) / ((prior[1] - current[1]) || 1e-12) + current[0]) {
      inside = !inside;
    }
  }
  return inside;
}

export function isAnatoliaGeometryPoint([longitude, latitude]) {
  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = ANATOLIA_OVERRIDE_BBOX;
  if (longitude < minLongitude || longitude > maxLongitude || latitude < minLatitude || latitude > maxLatitude) return false;
  return !pointInPolygon([longitude, latitude], MARMARA_THRACE_EXCLUSION);
}

export { buildAnatoliaPhase2DAssets, isPhysicalLandPoint };
