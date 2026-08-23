const BORDER_KEY_PRECISION = 5;
const CARTOGRAPHIC_BOW = 0.055;
const MAX_BOW_RATIO = 0.18;
const MIN_CURVE_LENGTH = 0.08;

function pointKey(point) {
  return `${Number(point[0]).toFixed(BORDER_KEY_PRECISION)}:${Number(point[1]).toFixed(BORDER_KEY_PRECISION)}`;
}

function edgeKey(start, end) {
  const a = pointKey(start);
  const b = pointKey(end);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function deterministicBoundaryBow(key) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 4294967295 - 0.5) * 2;
}

function deterministicBoundaryShape(key) {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (Math.imul(hash ^ key.charCodeAt(index), 31) + index) | 0;
  }
  return ((hash >>> 0) / 4294967295 - 0.5) * 0.22;
}

/**
 * Draw shared historical province borders as restrained cartographic curves.
 *
 * Province topology remains authoritative. Only the presentation stroke is
 * curved, and both neighbouring provinces resolve the exact same deterministic
 * edge key, so no visual gap can be introduced between them. The slightly
 * stronger bow and tiny asymmetric control-point offset make the mesh read as
 * a historical cartographic boundary rather than a mathematical Voronoi grid.
 */
export function buildCartographicInternalBoundaryPath(provinces) {
  const edges = new Map();

  for (const entry of provinces) {
    const provinceId = entry?.province?.id ?? entry?.historicalProvince?.id ?? entry?.id ?? null;
    for (const polygon of entry?.geometry?.polygons ?? []) {
      if (!Array.isArray(polygon) || polygon.length < 3) continue;
      for (let index = 0; index < polygon.length; index += 1) {
        const start = polygon[index];
        const end = polygon[(index + 1) % polygon.length];
        if (!Array.isArray(start) || !Array.isArray(end)) continue;
        const key = edgeKey(start, end);
        const current = edges.get(key);
        if (current) {
          current.count += 1;
          if (provinceId && current.provinceId && provinceId !== current.provinceId) {
            current.provinceIds.add(provinceId);
          }
        } else {
          edges.set(key, {
            key,
            start,
            end,
            count: 1,
            provinceId,
            provinceIds: new Set(provinceId ? [provinceId] : []),
          });
        }
      }
    }
  }

  return [...edges.values()]
    .filter((edge) => edge.count >= 2 && edge.provinceIds.size >= 2)
    .map(({ key, start, end }) => {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const normal = [-dy / length, dx / length];
      const bowLimit = Math.min(CARTOGRAPHIC_BOW, length * MAX_BOW_RATIO);
      const bow = length < MIN_CURVE_LENGTH ? 0 : deterministicBoundaryBow(key) * bowLimit;
      const shape = deterministicBoundaryShape(key);
      const oneThird = [
        start[0] + dx / 3 + normal[0] * bow * (1 - shape),
        start[1] + dy / 3 + normal[1] * bow * (1 - shape),
      ];
      const twoThirds = [
        start[0] + (dx * 2) / 3 + normal[0] * bow * (1 + shape),
        start[1] + (dy * 2) / 3 + normal[1] * bow * (1 + shape),
      ];
      return `M ${start[0]} ${start[1]} C ${oneThird[0]} ${oneThird[1]} ${twoThirds[0]} ${twoThirds[1]} ${end[0]} ${end[1]}`;
    })
    .join(" ");
}
