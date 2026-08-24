const ANATOLIA_BBOX = [25.45, 35.72, 44.85, 42.35];

// European Thrace is inside the broad Anatolia envelope but must never be
// classified as part of the Anatolia geometry override. The southern edge
// follows the Gallipoli/Marmara transition so Çanakkale remains in scope.
const EUROPEAN_THRACE_EXCLUSION = [
  [25.45, 42.35],
  [28.65, 42.35],
  [29.15, 41.35],
  [28.70, 40.72],
  [27.75, 40.48],
  [26.85, 40.38],
  [25.45, 40.72],
];

function pointOnSegment(point, start, end) {
  const cross = (end[0] - start[0]) * (point[1] - start[1])
    - (end[1] - start[1]) * (point[0] - start[0]);
  if (Math.abs(cross) > 1e-9) return false;
  return point[0] >= Math.min(start[0], end[0]) - 1e-9
    && point[0] <= Math.max(start[0], end[0]) + 1e-9
    && point[1] >= Math.min(start[1], end[1]) - 1e-9
    && point[1] <= Math.max(start[1], end[1]) + 1e-9;
}

function pointInPolygon(point, polygon) {
  for (let index = 0; index < polygon.length; index += 1) {
    if (pointOnSegment(point, polygon[index], polygon[(index + 1) % polygon.length])) return true;
  }
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const prior = polygon[previous];
    if ((current[1] > point[1]) !== (prior[1] > point[1])
      && point[0] < ((prior[0] - current[0]) * (point[1] - current[1]))
        / ((prior[1] - current[1]) || Number.EPSILON) + current[0]) {
      inside = !inside;
    }
  }
  return inside;
}

export function isAnatoliaGeometryPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  const [longitude, latitude] = point;
  if (longitude < ANATOLIA_BBOX[0] || longitude > ANATOLIA_BBOX[2]
    || latitude < ANATOLIA_BBOX[1] || latitude > ANATOLIA_BBOX[3]) return false;
  return !pointInPolygon(point, EUROPEAN_THRACE_EXCLUSION);
}

export { ANATOLIA_BBOX, EUROPEAN_THRACE_EXCLUSION };
