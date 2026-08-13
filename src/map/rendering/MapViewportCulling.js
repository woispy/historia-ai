/**
 * World-space viewport culling helpers.
 *
 * The map repeats horizontally, so longitude visibility is evaluated as one or
 * two wrapped ranges. Geometry is culled before React creates SVG path nodes,
 * which keeps deep zoom interaction bounded by the visible region instead of
 * the total number of provinces.
 */

const WORLD_MIN_X = -180;
const WORLD_MAX_X = 180;
const WORLD_WIDTH = 360;
const WORLD_HEIGHT = 180;

function normalizeLongitude(value) {
  let longitude = Number(value) || 0;
  while (longitude > WORLD_MAX_X) longitude -= WORLD_WIDTH;
  while (longitude < WORLD_MIN_X) longitude += WORLD_WIDTH;
  return longitude;
}

export function getViewportBounds(camera = {}, padding = 0.08) {
  const zoom = Math.max(0.001, Number(camera.zoom) || 1);
  const viewWidth = WORLD_WIDTH / zoom;
  const viewHeight = WORLD_HEIGHT / zoom;
  const horizontalPadding = viewWidth * Math.max(0, Number(padding) || 0);
  const verticalPadding = viewHeight * Math.max(0, Number(padding) || 0);
  const centerX = Number(camera.x) || 0;
  const centerY = Number(camera.y) || 0;

  return {
    minX: centerX - viewWidth / 2 - horizontalPadding,
    maxX: centerX + viewWidth / 2 + horizontalPadding,
    minY: centerY - viewHeight / 2 - verticalPadding,
    maxY: centerY + viewHeight / 2 + verticalPadding,
  };
}

export function boundsOverlap(a, b) {
  if (!a || !b) return false;
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

export function getGeometryBounds(geometry) {
  const polygons = geometry?.polygons ?? [];
  let bounds = null;

  for (const polygon of polygons) {
    if (!Array.isArray(polygon)) continue;
    for (const point of polygon) {
      if (!Array.isArray(point) || point.length < 2) continue;
      const x = Number(point[0]);
      const y = Number(point[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (!bounds) {
        bounds = { minX: x, minY: y, maxX: x, maxY: y };
      } else {
        bounds.minX = Math.min(bounds.minX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.maxY = Math.max(bounds.maxY, y);
      }
    }
  }

  return bounds;
}

function wrappedRanges(bounds) {
  const minX = bounds.minX;
  const maxX = bounds.maxX;
  if (minX >= WORLD_MIN_X && maxX <= WORLD_MAX_X) {
    return [{ minX, maxX }];
  }

  const normalizedMin = normalizeLongitude(minX);
  const normalizedMax = normalizeLongitude(maxX);
  if (normalizedMin <= normalizedMax) {
    return [{ minX: normalizedMin, maxX: normalizedMax }];
  }

  return [
    { minX: normalizedMin, maxX: WORLD_MAX_X },
    { minX: WORLD_MIN_X, maxX: normalizedMax },
  ];
}

export function isGeometryVisible(geometryBounds, viewportBounds) {
  if (!geometryBounds || !viewportBounds) return true;
  if (
    geometryBounds.maxY < viewportBounds.minY ||
    geometryBounds.minY > viewportBounds.maxY
  ) {
    return false;
  }

  const geometryRanges = wrappedRanges(geometryBounds);
  const viewportRanges = wrappedRanges(viewportBounds);
  return viewportRanges.some((viewportRange) => (
    geometryRanges.some((geometryRange) => boundsOverlap(
      { ...geometryRange, minY: geometryBounds.minY, maxY: geometryBounds.maxY },
      { ...viewportRange, minY: viewportBounds.minY, maxY: viewportBounds.maxY },
    ))
  ));
}

export function getSegmentBounds(start, end) {
  if (!Array.isArray(start) || !Array.isArray(end)) return null;
  return {
    minX: Math.min(Number(start[0]) || 0, Number(end[0]) || 0),
    minY: Math.min(Number(start[1]) || 0, Number(end[1]) || 0),
    maxX: Math.max(Number(start[0]) || 0, Number(end[0]) || 0),
    maxY: Math.max(Number(start[1]) || 0, Number(end[1]) || 0),
  };
}
