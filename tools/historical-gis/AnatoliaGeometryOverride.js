const ANATOLIA_BBOX = [25.45, 35.72, 44.85, 42.35];

// The Phase 2D override covers Anatolian land, not European Thrace/Istanbul.
// This boundary follows the southern Marmara/Thrace transition rather than
// excluding only the two regression-test coordinates.
const EUROPEAN_THRACE_EXCLUSION = [
  [25.45, 40.30],
  [26.00, 40.30],
  [27.00, 40.50],
  [28.00, 40.55],
  [29.00, 40.60],
  [29.30, 40.85],
  [29.30, 42.35],
  [25.45, 42.35],
];

function pointInPolygon(point, polygon) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const [x, y] = polygon[index];
    const [previousX, previousY] = polygon[previous];
    if ((y > point[1]) !== (previousY > point[1])
      && point[0] < ((previousX - x) * (point[1] - y)) / ((previousY - y) || Number.EPSILON) + x) {
      inside = !inside;
    }
  }
  return inside;
}

export function isAnatoliaGeometryPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  const [longitude, latitude] = point;
  if (
    longitude < ANATOLIA_BBOX[0]
    || longitude > ANATOLIA_BBOX[2]
    || latitude < ANATOLIA_BBOX[1]
    || latitude > ANATOLIA_BBOX[3]
  ) return false;
  return !pointInPolygon(point, EUROPEAN_THRACE_EXCLUSION);
}
