const BORDER_KEY_PRECISION = 5;
const CARTOGRAPHIC_BOW = 0.008;

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
  const normalized = (hash >>> 0) / 4294967295;
  return (normalized - 0.5) * 2;
}

/**
 * Build shared province borders as subtle, deterministic cartographic curves.
 *
 * The geometry endpoints remain untouched so adjacent provinces stay topologically
 * aligned. Only internal shared edges are curved; coastlines remain authoritative
 * physical geometry and are never stylised by this helper.
 */
export function buildCartographicInternalBoundaryPath(provinces) {
  const edges = new Map();

  for (const entry of provinces) {
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
        } else {
          edges.set(key, { key, start, end, count: 1 });
        }
      }
    }
  }

  return [...edges.values()]
    .filter((edge) => edge.count >= 2)
    .map(({ key, start, end }) => {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const normal = [-dy / length, dx / length];
      const bow = deterministicBoundaryBow(key) * CARTOGRAPHIC_BOW;
      const oneThird = [
        start[0] + dx / 3 + normal[0] * bow,
        start[1] + dy / 3 + normal[1] * bow,
      ];
      const twoThirds = [
        start[0] + (dx * 2) / 3 + normal[0] * bow,
        start[1] + (dy * 2) / 3 + normal[1] * bow,
      ];
      return `M ${start[0]} ${start[1]} C ${oneThird[0]} ${oneThird[1]} ${twoThirds[0]} ${twoThirds[1]} ${end[0]} ${end[1]}`;
    })
    .join(" ");
}
