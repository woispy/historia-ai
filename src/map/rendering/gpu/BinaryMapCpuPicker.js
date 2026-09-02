const EPSILON = 1e-10;

export function pickProvinceFromBinaryAsset(assetSource, worldX, worldY) {
  if (!assetSource || !Number.isFinite(worldX) || !Number.isFinite(worldY)) return null;

  for (let tileIndex = 0; tileIndex < assetSource.tileCount; tileIndex += 1) {
    const tile = assetSource.tileRecord(tileIndex);
    if (!tile || tile[1] < 3) continue;
    const geometry = assetSource.geometryView(tile[0], tile[1]);
    if (pointInPolygon(worldX, worldY, geometry)) {
      return assetSource.getProvinceId(tile[2]) ?? null;
    }
  }

  return null;
}

function pointInPolygon(x, y, geometry) {
  let inside = false;
  const pointCount = Math.floor(geometry.length / 2);
  if (pointCount < 3) return false;

  let previousX = geometry[(pointCount - 1) * 2];
  let previousY = geometry[(pointCount - 1) * 2 + 1];

  for (let index = 0; index < pointCount; index += 1) {
    const currentX = geometry[index * 2];
    const currentY = geometry[index * 2 + 1];

    if (pointOnSegment(x, y, previousX, previousY, currentX, currentY)) return true;

    const crosses = (currentY > y) !== (previousY > y);
    if (crosses) {
      const intersectionX = ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
      if (x < intersectionX) inside = !inside;
    }

    previousX = currentX;
    previousY = currentY;
  }

  return inside;
}

function pointOnSegment(px, py, ax, ay, bx, by) {
  const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  if (Math.abs(cross) > EPSILON) return false;
  return px >= Math.min(ax, bx) - EPSILON && px <= Math.max(ax, bx) + EPSILON
    && py >= Math.min(ay, by) - EPSILON && py <= Math.max(ay, by) + EPSILON;
}
